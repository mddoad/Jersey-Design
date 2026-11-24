import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'
import type { PatternId } from '../../types/design'

const MODEL_URL = '/models/jersey.glb'
const ROTATE_Y = 0 // set to Math.PI if the shirt faces backward
const DECAL_SIZE = 9 // world units covered by the logo / name canvases
const DECAL_PX = 1024
const NECK_BAND = 0.28 // width of the collar ring (world units)
const CUFF_BAND = 0.35 // width of each sleeve-end ring (world units)
const HIDE_MESHES: string[] = [] // lowercase part names to hide, e.g. ['logo']
const PATTERN_IDS: Record<PatternId, number> = {
  solid: 0,
  hoops: 1,
  stripes: 2,
  sash: 3,
  split: 4,
  chevron: 5,
}

/* ---------- logo / name / number layers (transparent canvases) ---------- */
function makeDecalLayer() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = DECAL_PX
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { canvas, texture }
}
type Layer = ReturnType<typeof makeDecalLayer>

function paintDecals(
  front: Layer,
  back: Layer,
  textColor: string,
  name: string,
  number: string,
  logo: HTMLImageElement | null,
) {
  const k = DECAL_PX / DECAL_SIZE // pixels per world unit
  const px = (x: number) => (x / DECAL_SIZE + 0.5) * DECAL_PX
  const py = (y: number) => (0.5 - y / DECAL_SIZE) * DECAL_PX

  const f = front.canvas.getContext('2d')!
  f.clearRect(0, 0, DECAL_PX, DECAL_PX)
  if (logo) {
    const w = 1.1 * k
    f.drawImage(logo, px(0.9), py(1.9), w, (w * logo.height) / logo.width)
  }

  const b = back.canvas.getContext('2d')!
  b.clearRect(0, 0, DECAL_PX, DECAL_PX)
  b.fillStyle = textColor
  b.textAlign = 'center'
  b.font = `bold ${0.75 * k}px system-ui, sans-serif`
  b.fillText(name.toUpperCase(), px(0), py(2.4))
  b.font = `bold ${2.6 * k}px system-ui, sans-serif`
  b.fillText(number, px(0), py(-0.2))

  front.texture.needsUpdate = true
  back.texture.needsUpdate = true
}

/* ---------- find the collar ring and the sleeve-end rings ----------
   A shirt is a surface with open holes: the neck, two sleeve ends and the hem.
   We find the open edges, group them into rings, and mark every vertex that is
   close to the neck ring or a sleeve-end ring. The shader colors those vertices. */
function markTrimBands(root: THREE.Object3D): boolean {
  root.updateMatrixWorld(true)
  type Loop = { pts: THREE.Vector3[]; segs: [THREE.Vector3, THREE.Vector3][]; c: THREE.Vector3 }
  const loops: Loop[] = []
  const meshes: THREE.Mesh[] = []

  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.visible) return
    meshes.push(mesh)
    const geo = mesh.geometry as THREE.BufferGeometry
    const pos = geo.attributes.position
    const index = geo.index

    // weld vertices that share a position (UV seams split them)
    const keyToId = new Map<string, number>()
    const ids: number[] = new Array(pos.count)
    const firstVertex: number[] = []
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const key = `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`
      let id = keyToId.get(key)
      if (id === undefined) {
        id = keyToId.size
        keyToId.set(key, id)
        firstVertex[id] = i
      }
      ids[i] = id
    }

    // an edge used by only one triangle is an open edge
    const N = keyToId.size
    const edgeCount = new Map<number, number>()
    const triCount = index ? index.count / 3 : pos.count / 3
    const at = (t: number, k: number) => ids[index ? index.getX(t * 3 + k) : t * 3 + k]
    for (let t = 0; t < triCount; t++) {
      for (let k = 0; k < 3; k++) {
        const a = at(t, k)
        const b = at(t, (k + 1) % 3)
        const key = a < b ? a * N + b : b * N + a
        edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1)
      }
    }

    // connect open-edge vertices into rings
    const parent = new Map<number, number>()
    const find = (x: number): number => {
      let r = x
      while (parent.get(r) !== r) r = parent.get(r)!
      return r
    }
    edgeCount.forEach((count, key) => {
      if (count !== 1) return
      const a = Math.floor(key / N)
      const b = key % N
      if (!parent.has(a)) parent.set(a, a)
      if (!parent.has(b)) parent.set(b, b)
      parent.set(find(a), find(b))
    })

        const world = (id: number) =>
      new THREE.Vector3().fromBufferAttribute(pos, firstVertex[id]).applyMatrix4(mesh.matrixWorld)
    const groups = new Map<number, Loop>()
    for (const id of parent.keys()) {
      const rootId = find(id)
      let loop = groups.get(rootId)
      if (!loop) {
        loop = { pts: [], segs: [], c: new THREE.Vector3() }
        groups.set(rootId, loop)
      }
      loop.pts.push(world(id))
    }
    edgeCount.forEach((count, key) => {
      if (count !== 1) return
      const a = Math.floor(key / N)
      const b = key % N
      groups.get(find(a))!.segs.push([world(a), world(b)])
    })
    groups.forEach((loop) => {
      if (loop.pts.length < 8) return
      loop.pts.forEach((p) => loop.c.add(p))
      loop.c.divideScalar(loop.pts.length)
      loops.push(loop)
    })
  })

  // neck = highest ring near the middle; sleeve ends = outermost ring on each side
  const middle = loops.filter((l) => Math.abs(l.c.x) <= 0.8)
  const neck = middle.length ? middle.reduce((a, b) => (b.c.y > a.c.y ? b : a)) : null
  const sides = loops.filter((l) => Math.abs(l.c.x) > 0.8)
  const left = sides.filter((l) => l.c.x < 0).sort((a, b) => a.c.x - b.c.x)[0]
  const right = sides.filter((l) => l.c.x > 0).sort((a, b) => b.c.x - a.c.x)[0]

  const targets: { segs: Loop['segs']; band: number; box: THREE.Box3 }[] = []
  const addTarget = (l: Loop, band: number) =>
    targets.push({
      segs: l.segs,
      band,
      box: new THREE.Box3().setFromPoints(l.pts).expandByScalar(band),
    })
  if (neck) addTarget(neck, NECK_BAND)
  for (const l of [left, right]) if (l) addTarget(l, CUFF_BAND)
  console.log('[jersey] collar ring:', !!neck, '| sleeve rings:', targets.length - (neck ? 1 : 0))
  if (!targets.length) return false

  // per-vertex value = distance to the nearest ring, divided by that ring's band width
  const w = new THREE.Vector3()
  const cp = new THREE.Vector3()
  const line = new THREE.Line3()
  meshes.forEach((mesh) => {
    const geo = mesh.geometry as THREE.BufferGeometry
    const pos = geo.attributes.position
    const arr = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      w.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      let best = 9
      for (const t of targets) {
        if (!t.box.containsPoint(w)) continue
        let d2 = Infinity
        for (const [a, b] of t.segs) {
          line.set(a, b)
          line.closestPointToPoint(w, true, cp)
          const d = w.distanceToSquared(cp)
          if (d < d2) d2 = d
        }
        best = Math.min(best, Math.sqrt(d2) / t.band)
      }
      arr[i] = best
    }
    geo.setAttribute('aTrim', new THREE.BufferAttribute(arr, 1))
  })
  return true
}

/* ---------- shader: pattern from world position, so no UV map is needed ---------- */
const FRAG_HEAD = `
varying vec3 vWPos;
varying float vTrim;
uniform float uPattern;
uniform vec3 uC1;
uniform vec3 uC2;
uniform sampler2D uDecalFront;
uniform sampler2D uDecalBack;
uniform float uDecalSize;
uniform vec3 uTrim;
uniform float uTop;
uniform float uHalfW;
uniform float uUseBands;
float band(float v) {
  float f = fract(v);
  float w = fwidth(v) * 1.2 + 0.001;
  return smoothstep(0.5 - w, 0.5 + w, f) * (1.0 - smoothstep(1.0 - w, 1.0, f));
}
`
const FRAG_COLOR = `
#include <color_fragment>
{
  float m = 0.0;
  if (abs(uPattern - 1.0) < 0.5) m = band(vWPos.y * 0.45);
  else if (abs(uPattern - 2.0) < 0.5) m = band(vWPos.x * 0.9 + 0.5);
  else if (abs(uPattern - 3.0) < 0.5) m = 1.0 - smoothstep(0.8, 0.9, abs(vWPos.x + vWPos.y) * 0.7071);
  else if (abs(uPattern - 4.0) < 0.5) m = smoothstep(-0.02, 0.02, vWPos.x);
  else if (abs(uPattern - 5.0) < 0.5) m = band((vWPos.y - abs(vWPos.x) * 0.8) * 0.45);
  diffuseColor.rgb = mix(uC1, uC2, m);

  float collar = step(uTop - 0.45, vWPos.y) * step(abs(vWPos.x), 1.25);
  float cuff = step(uHalfW - 0.5, abs(vWPos.x));
   float trimMask = uUseBands > 0.5 ? 1.0 - smoothstep(0.85, 1.0, vTrim) : max(collar, cuff);
  diffuseColor.rgb = mix(diffuseColor.rgb, uTrim, trimMask);

  vec4 df = texture2D(uDecalFront, vec2(vWPos.x, vWPos.y) / uDecalSize + 0.5);
  vec4 db = texture2D(uDecalBack, vec2(-vWPos.x, vWPos.y) / uDecalSize + 0.5);
  vec4 d = vWPos.z > 0.0 ? df : db;
  diffuseColor.rgb = mix(diffuseColor.rgb, d.rgb, d.a);
}
`

function makeMaterial(uniforms: Record<string, THREE.IUniform>) {
  const mat = new THREE.MeshStandardMaterial({
    normalMap: null,
    roughness: 0.85,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;\nattribute float aTrim;\nvarying float vTrim;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvTrim = aTrim;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_HEAD)
      .replace('#include <color_fragment>', FRAG_COLOR)
  }
  mat.customProgramCacheKey = () => 'jersey-pattern-v2'
  return mat
}

/* ---------- component ---------- */
export default function GarmentGLB() {
  const { scene } = useGLTF(MODEL_URL)
  const pattern = useDesignStore((s) => s.pattern)
  const colors = useDesignStore((s) => s.colors)
  const logo = useDesignStore((s) => s.logo)
  const name = useDesignStore((s) => s.name)
  const number = useDesignStore((s) => s.number)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  const decals = useMemo(() => ({ front: makeDecalLayer(), back: makeDecalLayer() }), [])
  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uPattern: { value: 0 },
      uC1: { value: new THREE.Color() },
      uC2: { value: new THREE.Color() },
      uDecalFront: { value: decals.front.texture },
      uDecalBack: { value: decals.back.texture },
      uDecalSize: { value: DECAL_SIZE },
      uTrim: { value: new THREE.Color() },
      uTop: { value: 4 },
      uHalfW: { value: 3 },
      uUseBands: { value: 0 },
    }),
    [decals],
  )

  const model = useMemo(() => {
    const m = scene.clone(true)
    m.rotation.y = ROTATE_Y
    m.updateMatrixWorld(true)
    // center the model and scale it to about 8 units tall
    const box = new THREE.Box3().setFromObject(m)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = 8 / size.y
    m.scale.setScalar(k)
    m.position.sub(center.multiplyScalar(k))
    m.updateMatrixWorld(true)

    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const old = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
        | THREE.MeshStandardMaterial
        | undefined
      // small transparent parts are stickers / patches: hide them
      const small = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).y < 4.8
      const sticker = !!old && (old.transparent || old.alphaTest > 0 || !!old.alphaMap) && small
      const hidden = HIDE_MESHES.some((n) => mesh.name.toLowerCase().includes(n))
      if (sticker || hidden) {
        mesh.visible = false
        return
      }
      mesh.material = makeMaterial(uniforms)
    })

    uniforms.uUseBands.value = markTrimBands(m) ? 1 : 0
    const fit = new THREE.Box3().setFromObject(m)
    uniforms.uTop.value = fit.max.y
    uniforms.uHalfW.value = Math.max(Math.abs(fit.min.x), Math.abs(fit.max.x))
    return m
  }, [scene, uniforms])

  useEffect(() => {
    if (!logo) {
      setLogoImg(null)
      return
    }
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = logo
  }, [logo])

  useEffect(() => {
    uniforms.uPattern.value = PATTERN_IDS[pattern]
    uniforms.uC1.value.set(colors.primary)
    uniforms.uC2.value.set(colors.secondary)
    uniforms.uTrim.value.set(colors.trim)
  }, [uniforms, pattern, colors.primary, colors.secondary, colors.trim])

  useEffect(() => {
    paintDecals(decals.front, decals.back, colors.text, name, number, logoImg)
  }, [decals, colors.text, name, number, logoImg])

  return <primitive object={model} />
}

useGLTF.preload(MODEL_URL)
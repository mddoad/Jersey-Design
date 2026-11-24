import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'
import type { PatternId } from '../../types/design'

const MODEL_URL = '/models/jersey.glb'
const ROTATE_Y = 0 // set to Math.PI if the shirt faces backward
const DECAL_SIZE = 9 // world units covered by the logo / name canvases
const DECAL_PX = 1024

// The parts of this jersey model, found by their material names.
const BODY_PARTS = ['T-Shirt_Outside', 'T-Shirt_Inside'] // pattern + primary / secondary colors
const TRIM_PARTS = ['Material.001', 'Material.002'] // collar, cuffs and shoulder piping
const HIDDEN_PARTS = ['Empty', 'Empty.002'] // flat crest / sponsor pictures from the original

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
    const w = 0.9 * k
    f.drawImage(logo, px(0.55), py(2.8), w, (w * logo.height) / logo.width)
  }

  const b = back.canvas.getContext('2d')!
  b.clearRect(0, 0, DECAL_PX, DECAL_PX)
  b.fillStyle = textColor
  b.textAlign = 'center'
  b.font = `bold ${0.7 * k}px system-ui, sans-serif`
  b.fillText(name.toUpperCase(), px(0), py(2.6))
  b.font = `bold ${2.6 * k}px system-ui, sans-serif`
  b.fillText(number, px(0), py(0.1))

  front.texture.needsUpdate = true
  back.texture.needsUpdate = true
}

/* ---------- body shader: pattern from world position, so no UV map is needed ---------- */
const FRAG_HEAD = `
varying vec3 vWPos;
uniform float uPattern;
uniform vec3 uC1;
uniform vec3 uC2;
uniform sampler2D uDecalFront;
uniform sampler2D uDecalBack;
uniform float uDecalSize;
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

  vec4 df = texture2D(uDecalFront, vec2(vWPos.x, vWPos.y) / uDecalSize + 0.5);
  vec4 db = texture2D(uDecalBack, vec2(-vWPos.x, vWPos.y) / uDecalSize + 0.5);
  vec4 d = vWPos.z > 0.0 ? df : db;
  diffuseColor.rgb = mix(diffuseColor.rgb, d.rgb, d.a);
}
`

function makeBodyMaterial(uniforms: Record<string, THREE.IUniform>) {
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_HEAD)
      .replace('#include <color_fragment>', FRAG_COLOR)
  }
  mat.customProgramCacheKey = () => 'jersey-pattern-v3'
  return mat
}

/* ---------- remove the two shoulder stripes (piping), keep collar ring and cuffs ----------
   In this model the collar and the shoulder stripes are one part. The collar is a ring
   around the neck, so any triangle higher than upperY and farther from the neck axis
   than the collar's radius belongs to a stripe. */
function removeShoulderPiping(mesh: THREE.Mesh, upperY: number) {
  const geo = mesh.geometry.clone() as THREE.BufferGeometry
  const pos = geo.attributes.position
  const index = geo.index
  if (!index) return
  const wp = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
    wp[i * 3] = v.x
    wp[i * 3 + 1] = v.y
    wp[i * 3 + 2] = v.z
  }
  const xs: number[] = []
  const zs: number[] = []
  for (let i = 0; i < pos.count; i++) {
    if (wp[i * 3 + 1] > upperY) {
      xs.push(wp[i * 3])
      zs.push(wp[i * 3 + 2])
    }
  }
  if (xs.length < 50) return
  const median = (list: number[]) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)]
  const cx = median(xs)
  const cz = median(zs)
  const radius = (x: number, z: number) => Math.hypot(x - cx, z - cz)
  const limit = median(xs.map((x, i) => radius(x, zs[i]))) * 1.07

  const kept: number[] = []
  const arr = index.array
  for (let t = 0; t < arr.length; t += 3) {
    const a = arr[t]
    const b = arr[t + 1]
    const c = arr[t + 2]
    const y = (wp[a * 3 + 1] + wp[b * 3 + 1] + wp[c * 3 + 1]) / 3
    const x = (wp[a * 3] + wp[b * 3] + wp[c * 3]) / 3
    const z = (wp[a * 3 + 2] + wp[b * 3 + 2] + wp[c * 3 + 2]) / 3
    const isStripe = y > upperY && radius(x, z) > limit
    if (!isStripe) kept.push(a, b, c)
  }
  geo.setIndex(kept)
  mesh.geometry = geo
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
    }),
    [decals],
  )
  // one shared material for the collar, cuffs and piping
  const trimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, side: THREE.DoubleSide }),
    [],
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

    // height above which the collar and shoulder stripes are (cuffs are below it)
    const fit = new THREE.Box3().setFromObject(m)
    const upperY = fit.min.y + 0.707 * (fit.max.y - fit.min.y)
    const body = makeBodyMaterial(uniforms)
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      const part = mat?.name ?? ''
      if (HIDDEN_PARTS.includes(part)) mesh.visible = false
      else if (TRIM_PARTS.includes(part)) {
        if (part === 'Material.001') removeShoulderPiping(mesh, upperY)
        mesh.material = trimMaterial
      }
      else if (BODY_PARTS.includes(part)) mesh.material = body
      // anything else (small inside labels) keeps its own material
    })
    return m
  }, [scene, uniforms, trimMaterial])

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
    trimMaterial.color.set(colors.trim)
  }, [uniforms, trimMaterial, pattern, colors.primary, colors.secondary, colors.trim])

  useEffect(() => {
    paintDecals(decals.front, decals.back, colors.text, name, number, logoImg)
  }, [decals, colors.text, name, number, logoImg])

  return <primitive object={model} />
}

useGLTF.preload(MODEL_URL)
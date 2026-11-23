import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { CUT_SETTINGS } from '../../data/catalog'
import { useDesignStore } from '../../store/designStore'
import { drawPattern, TEX_SIZE } from '../../lib/patternTexture'
import { createWeaveTexture } from '../../lib/weaveTexture'
import {
  buildCollarGeometry,
  buildSleeve,
  buildTorso,
  cuffTransform,
  SLEEVE,
} from '../../lib/garmentGeometry'

const HANDS: (-1 | 1)[] = [-1, 1]

/** A canvas plus the Three.js texture that mirrors it. */
function useCanvasTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = TEX_SIZE
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return { canvas, texture }
  }, [])
}

function Fabric({ map, bump }: { map: THREE.Texture; bump: THREE.Texture }) {
  return (
    <meshPhysicalMaterial
      map={map}
      bumpMap={bump}
      bumpScale={0.3}
      side={THREE.DoubleSide}
      roughness={0.85}
      sheen={0.8}
      sheenRoughness={0.45}
      sheenColor="#cccccc"
    />
  )
}

export default function Garment() {
  const pattern = useDesignStore((s) => s.pattern)
  const colors = useDesignStore((s) => s.colors)
  const logo = useDesignStore((s) => s.logo)
  const name = useDesignStore((s) => s.name)
  const number = useDesignStore((s) => s.number)
  const cut = useDesignStore((s) => s.cut)

  const front = useCanvasTexture()
  const back = useCanvasTexture()
  const weave = useMemo(() => createWeaveTexture(), [])
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  // Geometry is built once.
  const geo = useMemo(
    () => ({
      torsoFront: buildTorso('front'),
      torsoBack: buildTorso('back'),
      sleeves: HANDS.map((hand) => ({
        hand,
        front: buildSleeve(hand, 'front'),
        back: buildSleeve(hand, 'back'),
        cuff: cuffTransform(hand),
      })),
      collar: buildCollarGeometry(),
    }),
    [],
  )

  // Load the uploaded logo into an <img> so the canvas can draw it.
  useEffect(() => {
    if (!logo) {
      setLogoImg(null)
      return
    }
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = logo
  }, [logo])

  // Repaint both textures whenever the design changes.
  useEffect(() => {
    const design = { pattern, colors, name, number }
    drawPattern(front.canvas, 'front', design, logoImg)
    drawPattern(back.canvas, 'back', design, logoImg)
    front.texture.needsUpdate = true
    back.texture.needsUpdate = true
  }, [pattern, colors, name, number, logoImg, front, back])

  const size = CUT_SETTINGS[cut] ?? CUT_SETTINGS.men

  return (
    <group scale={[size.scaleX, size.scaleY, size.scaleX]}>
      <mesh geometry={geo.torsoFront}>
        <Fabric map={front.texture} bump={weave} />
      </mesh>
      <mesh geometry={geo.torsoBack}>
        <Fabric map={back.texture} bump={weave} />
      </mesh>

      {geo.sleeves.map((s) => (
        <group key={s.hand}>
          <mesh geometry={s.front}>
            <Fabric map={front.texture} bump={weave} />
          </mesh>
          <mesh geometry={s.back}>
            <Fabric map={back.texture} bump={weave} />
          </mesh>
          <mesh position={s.cuff.position} quaternion={s.cuff.quaternion}>
            <torusGeometry args={[SLEEVE.cuffRadius + 0.005, 0.065, 12, 36]} />
            <meshStandardMaterial color={colors.trim} roughness={0.8} />
          </mesh>
        </group>
      ))}

      <mesh geometry={geo.collar}>
        <meshStandardMaterial color={colors.trim} roughness={0.8} />
      </mesh>
    </group>
  )
}

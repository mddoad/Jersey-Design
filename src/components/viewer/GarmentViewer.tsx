import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Garment from './Garment'

export type View = 'front' | 'back'

/** Moves the camera to the front/back and keeps the shirt in frame on narrow screens. */
function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as { update: () => void } | null
  const size = useThree((s) => s.size)

  useEffect(() => {
    camera.position.set(0, 0, view === 'back' ? -18 : 18)
    controls?.update()
  }, [view, camera, controls])

  useEffect(() => {
    camera.zoom = Math.min(1, (size.width / size.height) * 1.15)
    camera.updateProjectionMatrix()
  }, [size, camera])

  return null
}

interface Props {
  view: View
  autoRotate: boolean
  onGl?: (gl: THREE.WebGLRenderer) => void
}

export default function GarmentViewer({ view, autoRotate, onGl }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 35 }}
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => onGl?.(gl)}
    >
      <hemisphereLight args={['#ffffff', '#8899aa', 1.6]} />
      <directionalLight position={[5, 7, 9]} intensity={2.4} />
      <directionalLight position={[-6, 3, -9]} intensity={1.2} />
      <Garment />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={9}
        maxDistance={30}
        minPolarAngle={0.6}
        maxPolarAngle={2.5}
        autoRotate={autoRotate}
        autoRotateSpeed={2.5}
      />
      <CameraRig view={view} />
    </Canvas>
  )
}

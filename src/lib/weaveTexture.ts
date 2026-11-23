import * as THREE from 'three'

/** Tiny diagonal weave used as a bump map, so the fabric is not perfectly smooth. */
export function createWeaveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 16
  const g = canvas.getContext('2d')!
  g.fillStyle = '#999'
  g.fillRect(0, 0, 16, 16)
  g.strokeStyle = '#ddd'
  g.lineWidth = 2
  for (let i = -16; i < 32; i += 4) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i + 16, 16)
    g.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(45, 45)
  return texture
}

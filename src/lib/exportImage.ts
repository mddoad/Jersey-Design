import type * as THREE from 'three'

/** Saves what the 3D canvas currently shows as a PNG file. */
export function downloadPng(gl: THREE.WebGLRenderer, filename = 'my-jersey.png') {
  const link = document.createElement('a')
  link.href = gl.domElement.toDataURL('image/png')
  link.download = filename
  link.click()
}

/** Small square JPEG (data URL) of the current view, used in the cart. */
export function captureThumbnail(gl: THREE.WebGLRenderer, size = 260): string {
  const src = gl.domElement
  const out = document.createElement('canvas')
  out.width = out.height = size
  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  const s = Math.min(src.width, src.height)
  ctx.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, size, size)
  return out.toDataURL('image/jpeg', 0.85)
}

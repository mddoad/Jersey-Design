import type { DesignState } from '../types/design'

export type Side = 'front' | 'back'
export const TEX_SIZE = 1024

/**
 * The shirt is drawn on a flat "pattern" that is 1000 x 1000 units.
 * This returns the Y position of the neckline / shoulder edge at flat X.
 * The 3D geometry uses the same function, so texture and shape always match.
 */
export function neckEdgeY(xf: number, side: Side): number {
  const dx = (xf - 500) / 120
  if (Math.abs(dx) < 1) return 100 + (side === 'back' ? 50 : 160) * (1 - dx * dx)
  return 100 + ((xf < 500 ? 380 - xf : xf - 620) * 60) / 170
}

type DrawInput = Pick<DesignState, 'pattern' | 'colors' | 'name' | 'number'>

/** Paints the front or back texture of the shirt onto a canvas. */
export function drawPattern(
  canvas: HTMLCanvasElement,
  side: Side,
  design: DrawInput,
  logo: HTMLImageElement | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const back = side === 'back'
  const { primary, secondary, trim, text } = design.colors
  const k = TEX_SIZE / 1000
  ctx.setTransform(k, 0, 0, k, 0, 0)
  ctx.clearRect(0, 0, 1000, 1000)

  // 1. Base color
  ctx.fillStyle = primary
  ctx.fillRect(0, 0, 1000, 1000)

  // 2. Pattern, drawn in the secondary color
  ctx.fillStyle = secondary
  ctx.strokeStyle = secondary
  switch (design.pattern) {
    case 'hoops':
      for (let y = 100; y < 1000; y += 160) ctx.fillRect(0, y, 1000, 80)
      break
    case 'stripes':
      for (let x = 0; x < 1000; x += 160) ctx.fillRect(x, 0, 80, 1000)
      break
    case 'split':
      ctx.fillRect(500, 0, 500, 1000)
      break
    case 'sash':
      ctx.beginPath()
      ctx.moveTo(150, 150)
      ctx.lineTo(330, 150)
      ctx.lineTo(900, 900)
      ctx.lineTo(720, 900)
      ctx.fill()
      break
    case 'chevron':
      ctx.lineWidth = 46
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(220, 300 + i * 130)
        ctx.lineTo(500, 460 + i * 130)
        ctx.lineTo(780, 300 + i * 130)
        ctx.stroke()
      }
      break
    default:
      break // 'solid': nothing to add
  }

  // 3. Collar band and cuff bands (trim color)
  ctx.strokeStyle = trim
  ctx.lineWidth = 56
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let x = 370; x <= 630; x += 10) {
    const y = neckEdgeY(x, side)
    if (x === 370) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.lineWidth = 64
  ctx.beginPath()
  ctx.moveTo(50, 330)
  ctx.lineTo(140, 400)
  ctx.moveTo(950, 330)
  ctx.lineTo(860, 400)
  ctx.stroke()

  // 4. Hem stitching
  ctx.setLineDash([9, 6])
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  for (const y of [868, 884]) {
    ctx.beginPath()
    ctx.moveTo(240, y)
    ctx.lineTo(760, y)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // 5. Logo (front) and name + number (back)
  ctx.fillStyle = text
  ctx.textAlign = 'center'
  if (!back && logo) {
    const w = 90
    ctx.drawImage(logo, 595, 255, w, (w * logo.height) / logo.width)
  }
  if (back) {
    ctx.font = 'bold 74px system-ui, sans-serif'
    ctx.fillText(design.name.toUpperCase(), 500, 300)
    ctx.font = 'bold 280px system-ui, sans-serif'
    ctx.fillText(design.number, 500, 590)
  }
}

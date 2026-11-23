import * as THREE from 'three'
import { neckEdgeY, type Side } from './patternTexture'

/**
 * Procedural jersey made from separate pieces, like a real garment:
 *   torso (front + back halves), two sleeves (front + back halves),
 *   a collar rib and two cuff rings.
 * Front and back halves meet at the seams. Each vertex gets a UV that points
 * into the flat pattern drawn by patternTexture.ts.
 */

type V3 = [number, number, number]
type Vertex = { p: V3; uv: [number, number] }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Builds a (nu x nv) grid surface from a function and orients normals outward. */
function buildGrid(
  nu: number,
  nv: number,
  fn: (a: number, b: number) => Vertex,
  center: V3,
): THREE.BufferGeometry {
  const pos: number[] = []
  const uvs: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const v = fn(i / nu, j / nv)
      pos.push(...v.p)
      uvs.push(...v.uv)
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i
      const b = a + 1
      const c = a + nu + 1
      const d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()

  // If normals point toward the center, flip the triangle winding.
  const n = geo.attributes.normal
  const p = geo.attributes.position
  let facing = 0
  for (let k = 0; k < p.count; k++) {
    facing +=
      n.getX(k) * (p.getX(k) - center[0]) +
      n.getY(k) * (p.getY(k) - center[1]) +
      n.getZ(k) * (p.getZ(k) - center[2])
  }
  if (facing < 0) {
    const arr = geo.index!.array as Uint16Array | Uint32Array
    for (let k = 0; k < arr.length; k += 3) {
      const t = arr[k + 1]
      arr[k + 1] = arr[k + 2]
      arr[k + 2] = t
    }
    geo.index!.needsUpdate = true
    geo.computeVertexNormals()
  }
  return geo
}

/** Torso: shaped body with V/round neck, slim waist, curved hem and cloth folds. */
export function buildTorso(side: Side): THREE.BufferGeometry {
  const back = side === 'back'
  const sign = back ? -1 : 1
  return buildGrid(
    72,
    60,
    (a, r) => {
      const nx = -1 + 2 * a
      const xf = 500 + nx * 260
      const hem = 900 + 35 * nx * nx // curved hem, lower at the sides
      const yf = lerp(hem, neckEdgeY(xf, side), r)
      const y = (500 - yf) * 0.01
      // width: slim waist, fuller chest, slight flare at the hem
      const waist = 0.16 * Math.exp(-(((r - 0.3) / 0.22) ** 2))
      const chest = 0.07 * Math.exp(-(((r - 0.72) / 0.2) ** 2))
      const x = nx * (2.6 + 0.1 * (1 - r) - waist + chest)
      const depth = 0.95 + 0.12 * Math.sin(Math.min(1, r * 1.1) * Math.PI * 0.8)
      const zBody = depth * Math.pow(1 - Math.pow(Math.abs(nx), 2.4), 1 / 2.4)
      const zNeck = Math.abs(x) < 1.2 ? 0.9 * Math.sqrt(1 - (x / 1.2) ** 2) : 0
      let z = lerp(zBody, zNeck, smoothstep(0.8, 1, r))
      // cloth folds: drape lines, waist wrinkles and a gentle sway
      z *=
        1 +
        0.045 * Math.sin(y * 2.4 + x * 1.7) +
        0.03 * Math.sin(y * 6.2 - x * 3.4) +
        0.025 * Math.sin(x * 7.5 + y * 1.2)
      return {
        p: [x, y, sign * z],
        uv: [(back ? 1000 - xf : xf) / 1000, 1 - yf / 1000],
      }
    },
    [0, 0, 0],
  )
}

export const SLEEVE = {
  origin: [-2.7, 2.95] as const, // where the sleeve starts (left side)
  dir: [-0.866, -0.5] as const, // direction: outward and down
  length: 1.9,
  rootRadius: 0.46,
  cuffRadius: 0.4,
}
const TOP = [SLEEVE.dir[1], -SLEEVE.dir[0]] // "up" direction across the sleeve
// Corners of the sleeve on the flat pattern (shoulder top, armpit, cuff bottom, cuff top)
const FLAT = { A: [210, 160], B: [240, 300], C: [140, 400], D: [50, 330] }

/** hand: -1 = left sleeve, +1 = right sleeve (mirrored). */
export function buildSleeve(hand: -1 | 1, side: Side): THREE.BufferGeometry {
  const back = side === 'back'
  const sign = back ? -1 : 1
  const { A, B, C, D } = FLAT
  const center: V3 = [
    hand * (SLEEVE.origin[0] + SLEEVE.dir[0] * SLEEVE.length * 0.5),
    SLEEVE.origin[1] + SLEEVE.dir[1] * SLEEVE.length * 0.5,
    0,
  ]
  return buildGrid(
    16,
    20,
    (i, c) => {
      const s = -0.2 + 1.2 * i // starts slightly inside the torso
      const phi = c * Math.PI // half circle: top -> front/back -> underside
      const sc = Math.min(1, Math.max(0, s))
      const rad =
        lerp(SLEEVE.rootRadius, SLEEVE.cuffRadius, sc) * (1 + 0.05 * Math.sin(s * 9 + c * 5))
      const cx = SLEEVE.origin[0] + SLEEVE.dir[0] * SLEEVE.length * s
      const cy = SLEEVE.origin[1] + SLEEVE.dir[1] * SLEEVE.length * s
      const px = cx + rad * Math.cos(phi) * TOP[0]
      const py = cy + rad * Math.cos(phi) * TOP[1]
      const pz = sign * rad * Math.sin(phi)
      const tx = lerp(lerp(A[0], D[0], s), lerp(B[0], C[0], s), c)
      const ty = lerp(lerp(A[1], D[1], s), lerp(B[1], C[1], s), c)
      let u = tx
      if (hand > 0) u = 1000 - u
      if (back) u = 1000 - u
      return { p: [hand * px, py, pz], uv: [u / 1000, 1 - ty / 1000] }
    },
    center,
  )
}

/** Position and rotation of the cuff ring for a sleeve. */
export function cuffTransform(hand: -1 | 1) {
  const position: V3 = [
    hand * (SLEEVE.origin[0] + SLEEVE.dir[0] * SLEEVE.length),
    SLEEVE.origin[1] + SLEEVE.dir[1] * SLEEVE.length,
    0,
  ]
  const axis = new THREE.Vector3(hand * SLEEVE.dir[0], SLEEVE.dir[1], 0).normalize()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    axis,
  )
  return { position, quaternion }
}

/** A thin tube that follows the neckline (front then back). */
export function buildCollarGeometry(): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = []
  const y = (x: number, s: Side) => (500 - neckEdgeY(500 + x * 100, s)) * 0.01
  const z = (x: number) => 0.9 * Math.sqrt(Math.max(0, 1 - (x / 1.2) ** 2))
  for (let k = 0; k <= 16; k++) {
    const x = -1.2 + (2.4 * k) / 16
    pts.push(new THREE.Vector3(x, y(x, 'front'), z(x)))
  }
  for (let k = 15; k >= 1; k--) {
    const x = -1.2 + (2.4 * k) / 16
    pts.push(new THREE.Vector3(x, y(x, 'back'), -z(x)))
  }
  const curve = new THREE.CatmullRomCurve3(pts, true)
  return new THREE.TubeGeometry(curve, 90, 0.075, 10, true)
}

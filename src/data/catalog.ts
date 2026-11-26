import type { PatternId } from '../types/design'

// Everything the wizard and editor offer lives here.
// To add a sport, cut, color or pattern, add one line - no other code changes.

export interface Option {
  id: string
  label: string
}
export interface ColorOption extends Option {
  hex: string
}

export const MIN_ORDER = 1
export const QUOTE_EMAIL = 'sales@yourcompany.com' // change this

/** Price per jersey in paisa (BDT). 1500 BDT = 150000 paisa. Adjust as needed. */
export const UNIT_PRICE_CENTS = 150000 // ৳1,500.00 per jersey
export const CURRENCY = 'bdt'

export const SPORTS: Option[] = [
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'rugby', label: 'Rugby' },
  { id: 'cricket', label: 'Cricket' },
]

export const CUTS: Option[] = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'youth', label: 'Youth' },
]

// Each cut changes the size / shape of the 3D garment.
export const CUT_SETTINGS: Record<string, { scaleX: number; scaleY: number }> = {
  men: { scaleX: 1, scaleY: 1 },
  women: { scaleX: 0.9, scaleY: 1 },
  youth: { scaleX: 0.85, scaleY: 0.85 },
}

export const COLORS: ColorOption[] = [
  { id: 'maroon', label: 'Maroon', hex: '#7a1f2b' },
  { id: 'red', label: 'Red', hex: '#c8102e' },
  { id: 'navy', label: 'Navy', hex: '#0b2a5b' },
  { id: 'royal', label: 'Royal blue', hex: '#1e5aa8' },
  { id: 'green', label: 'Green', hex: '#0f6b3a' },
  { id: 'black', label: 'Black', hex: '#111111' },
  { id: 'white', label: 'White', hex: '#f4f4f4' },
  { id: 'gold', label: 'Gold', hex: '#f2b705' },
]

export const PATTERNS: { id: PatternId; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'hoops', label: 'Hoops' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'sash', label: 'Sash' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'split', label: 'Split' },
]

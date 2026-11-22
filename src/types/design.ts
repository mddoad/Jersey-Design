export type PatternId = 'solid' | 'hoops' | 'stripes' | 'sash' | 'chevron' | 'split'

export interface DesignColors {
  primary: string
  secondary: string
  trim: string // collar and cuffs
  text: string // name, number
}

export interface DesignState {
  sport: string
  cut: string
  pattern: PatternId
  colors: DesignColors
  logo: string | null // image as a data URL
  name: string
  number: string
}

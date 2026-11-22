import { create } from 'zustand'
import type { DesignColors, DesignState } from '../types/design'

interface DesignActions {
  update: (patch: Partial<DesignState>) => void
  setColor: (key: keyof DesignColors, value: string) => void
  reset: () => void
}

export type DesignStore = DesignState & DesignActions

const initial: DesignState = {
  sport: 'football',
  cut: 'men',
  pattern: 'solid',
  colors: { primary: '#7a1f2b', secondary: '#f4f4f4', trim: '#111111', text: '#f4f4f4' },
  logo: null,
  name: 'KHAN',
  number: '10',
}

export const useDesignStore = create<DesignStore>((set) => ({
  ...initial,
  update: (patch) => set(patch),
  setColor: (key, value) => set((s) => ({ colors: { ...s.colors, [key]: value } })),
  reset: () => set(initial),
}))

/** Returns only the design data (no functions), e.g. for saving or the cart. */
export const selectDesign = (s: DesignStore): DesignState => ({
  sport: s.sport,
  cut: s.cut,
  pattern: s.pattern,
  colors: s.colors,
  logo: s.logo,
  name: s.name,
  number: s.number,
})

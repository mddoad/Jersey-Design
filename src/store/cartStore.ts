import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DesignState } from '../types/design'

export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'
export const JERSEY_SIZES: JerseySize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export interface CartItem {
  id: string
  thumbnail: string // small JPEG data URL
  design: DesignState
  size: JerseySize
  quantity: number
  addedAt: number // timestamp for ordering
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Pick<CartItem, 'thumbnail' | 'design' | 'size' | 'quantity'>) => void
  updateItem: (id: string, patch: Partial<Pick<CartItem, 'size' | 'quantity'>>) => void
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
  totalQuantity: () => number
}

// "persist" keeps the cart in localStorage, so it survives a page refresh.
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            { ...item, id: crypto.randomUUID(), addedAt: Date.now() },
          ],
        })),
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...patch } : i,
          ),
        })),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'jersey-cart' },
  ),
)

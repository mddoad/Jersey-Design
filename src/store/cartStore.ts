import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DesignState } from '../types/design'

export interface CartItem {
  id: string
  thumbnail: string // small JPEG data URL
  design: DesignState
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Pick<CartItem, 'thumbnail' | 'design'>) => void
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
}

// "persist" keeps the cart in localStorage, so it survives a page refresh.
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, id: crypto.randomUUID(), quantity: 10 }],
        })),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'jersey-cart' },
  ),
)

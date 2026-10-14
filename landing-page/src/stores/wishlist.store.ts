import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  productIds: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => {
          const exists = state.productIds.includes(productId)
          return {
            productIds: exists
              ? state.productIds.filter((id) => id !== productId)
              : [...state.productIds, productId],
          }
        }),
      has: (productId) => get().productIds.includes(productId),
    }),
    {
      name: 'maison-noir-wishlist',
      version: 1,
    }
  )
)

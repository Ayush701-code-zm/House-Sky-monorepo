import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  variantId: string
  name: string
  image: string
  productType: string
  variantLabel: string
  price: number // in paise
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isDrawerOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, quantity: number) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
          )

          if (existingIndex > -1) {
            const updatedItems = [...state.items]
            const currentItem = updatedItems[existingIndex]
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: Math.min(currentItem.quantity + newItem.quantity, 10),
            }
            return { items: updatedItems, isDrawerOpen: true }
          }

          return {
            items: [...state.items, { ...newItem, id: `${newItem.productId}-${newItem.variantId}-${Date.now()}` }],
            isDrawerOpen: true,
          }
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
            }
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, 10) }
                : i
            ),
          }
        }),

      clearCart: () => set({ items: [], isDrawerOpen: false }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'maison-noir-cart',
      version: 1,
    }
  )
)

export const selectCartSubtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)

export const selectCartItemCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0)

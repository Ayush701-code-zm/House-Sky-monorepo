import { create } from 'zustand'

interface CompareStore {
  compareIds: string[]
  toggleCompare: (propertyId: string) => void
  isComparing: (propertyId: string) => boolean
  clearCompare: () => void
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  compareIds: [],
  toggleCompare: (propertyId) =>
    set((state) => {
      const exists = state.compareIds.includes(propertyId)
      if (exists) {
        return { compareIds: state.compareIds.filter((id) => id !== propertyId) }
      }
      if (state.compareIds.length >= 3) {
        // Keep max 3 properties to compare
        return { compareIds: [...state.compareIds.slice(1), propertyId] }
      }
      return { compareIds: [...state.compareIds, propertyId] }
    }),
  isComparing: (propertyId) => get().compareIds.includes(propertyId),
  clearCompare: () => set({ compareIds: [] }),
}))

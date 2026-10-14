import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SavedStore {
  propertyIds: string[]
  toggleProperty: (propertyId: string) => void
  isSaved: (propertyId: string) => boolean
  clearAll: () => void
}

export const useSavedStore = create<SavedStore>()(
  persist(
    (set, get) => ({
      propertyIds: ['prop-1', 'prop-3'], // Pre-bookmarked sample properties for demonstration
      toggleProperty: (propertyId) =>
        set((state) => {
          const exists = state.propertyIds.includes(propertyId)
          return {
            propertyIds: exists
              ? state.propertyIds.filter((id) => id !== propertyId)
              : [...state.propertyIds, propertyId],
          }
        }),
      isSaved: (propertyId) => get().propertyIds.includes(propertyId),
      clearAll: () => set({ propertyIds: [] }),
    }),
    {
      name: 'auraveloce-saved-properties',
      version: 1,
    }
  )
)

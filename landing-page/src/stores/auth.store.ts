'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OwnerUser {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
}

interface OwnerAuthStore {
  token: string | null
  user: OwnerUser | null
  isAuthenticated: boolean
  login: (token: string, user: OwnerUser) => void
  logout: () => void
}

export const useOwnerAuth = create<OwnerAuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      }
    }),
    {
      name: 'hs-owner-auth',
      version: 1
    }
  )
)

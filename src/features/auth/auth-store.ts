import { create } from 'zustand'

import { getAuthenticatedUser, login as loginRequest } from '@/services/api/auth-service'
import { clearAuthToken, hasAuthToken } from '@/services/http/auth-storage'

import type { CredentialsDTO, UserResponseDTO } from '@/types/api'

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: UserResponseDTO | null
  isLoggingIn: boolean
  bootstrap: () => Promise<void>
  login: (credentials: CredentialsDTO) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>(
    (set, get) => ({
  status: 'bootstrapping',
  user: null,
  isLoggingIn: false,
  bootstrap: async () => {
    if (get().status !== 'bootstrapping') {
      return
    }

    if (!hasAuthToken()) {
      set({ status: 'unauthenticated', user: null })
      return
    }

    try {
      const user = await getAuthenticatedUser()
      set({ status: 'authenticated', user })
    } catch {
      clearAuthToken()
      set({ status: 'unauthenticated', user: null })
    }
  },
  login: async (credentials) => {
    set({ isLoggingIn: true })

    try {
      await loginRequest(credentials)
      const user = await getAuthenticatedUser()
      set({ user, status: 'authenticated', isLoggingIn: false })
    } catch (error) {
      clearAuthToken()
      set({ user: null, status: 'unauthenticated', isLoggingIn: false })
      throw error
    }
  },
  logout: () => {
    clearAuthToken()
    set({ status: 'unauthenticated', user: null })
  },
}))

import { apiClient } from '@/services/http/api-client'
import { setAuthToken } from '@/services/http/auth-storage'

import type { CredentialsDTO, UserResponseDTO } from '@/types/api'

export async function login(credentials: CredentialsDTO) {
  const response = await apiClient.post('/login', credentials)
  const token = response.headers.authorization as string | undefined

  if (!token) {
    throw new Error('O backend não retornou o header Authorization no login.')
  }

  setAuthToken(token)
}

export async function getAuthenticatedUser() {
  const response = await apiClient.get<UserResponseDTO>('/auth/me')
  return response.data
}

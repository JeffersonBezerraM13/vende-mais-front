import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  PageResponse,
  UserFilterParams,
  UserRequestDTO,
  UserResponseDTO,
} from '@/types/api'

export async function listUsers(params: UserFilterParams = {}) {
  const response = await apiClient.get<PageResponse<UserResponseDTO>>(
      '/users',
      {
        params: buildPaginationParams(params),
      })

  return response.data
}

export async function getUser(id: number) {
  const response = await apiClient.get<UserResponseDTO>(`/users/${id}`)
  return response.data
}

export async function createUser(payload: UserRequestDTO) {
  const response = await apiClient.post<UserResponseDTO>('/users', payload)
  return response.data
}

export async function updateUser(id: number, payload: UserRequestDTO) {
  const response = await apiClient.put<UserResponseDTO>(`/users/${id}`, payload)
  return response.data
}

export async function deleteUser(id: number) {
  await apiClient.delete(`/users/${id}`)
}

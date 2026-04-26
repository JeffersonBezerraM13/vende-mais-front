import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  PageResponse,
  PaginationParams,
  TaskRequestDTO,
  TaskResponseDTO,
} from '@/types/api'

export async function listTasks(params: PaginationParams = {}) {
  const response = await apiClient.get<PageResponse<TaskResponseDTO>>('/tasks', {
    params: buildPaginationParams(params),
  })

  return response.data
}

export async function getTask(id: number) {
  const response = await apiClient.get<TaskResponseDTO>(`/tasks/${id}`)
  return response.data
}

export async function createTask(payload: TaskRequestDTO) {
  const response = await apiClient.post<TaskResponseDTO>('/tasks', payload)
  return response.data
}

export async function updateTask(id: number, payload: TaskRequestDTO) {
  const response = await apiClient.put<TaskResponseDTO>(`/tasks/${id}`, payload)
  return response.data
}

export async function deleteTask(id: number) {
  await apiClient.delete(`/tasks/${id}`)
}

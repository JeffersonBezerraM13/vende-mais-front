import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  PageResponse,
  PaginationParams,
  StageResponseDTO,
} from '@/types/api'

export async function listStages(params: PaginationParams = {}) {
  const response = await apiClient.get<PageResponse<StageResponseDTO>>(
    '/stages',
    {
      params: buildPaginationParams(params),
    },
  )

  return response.data
}

export async function getStage(id: number) {
  const response = await apiClient.get<StageResponseDTO>(`/stages/${id}`)
  return response.data
}

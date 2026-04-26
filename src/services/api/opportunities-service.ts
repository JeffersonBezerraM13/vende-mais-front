import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  OpportunityFilterParams,
  OpportunityCloseDTO,
  OpportunityRequestDTO,
  OpportunityResponseDTO,
  PageResponse,
} from '@/types/api'

export async function listOpportunities(params: OpportunityFilterParams = {}) {
  const response = await apiClient.get<PageResponse<OpportunityResponseDTO>>(
    '/opportunities',
      {
      params: buildPaginationParams(params),
      })

  return response.data
}

export async function getOpportunity(id: number) {
  const response = await apiClient.get<OpportunityResponseDTO>(
    `/opportunities/${id}`,
  )
  return response.data
}

export async function createOpportunity(payload: OpportunityRequestDTO) {
  const response = await apiClient.post<OpportunityResponseDTO>(
    '/opportunities',
    payload,
  )
  return response.data
}

export async function updateOpportunity(
  id: number,
  payload: OpportunityRequestDTO,
) {
  const response = await apiClient.put<OpportunityResponseDTO>(
    `/opportunities/${id}`,
    payload,
  )
  return response.data
}

export async function deleteOpportunity(id: number) {
  await apiClient.delete(`/opportunities/${id}`)
}

export async function checkOpenOpportunity(leadId: number) {
  const response = await apiClient.get<boolean>('/opportunities/check-open', {
    params: { leadId },
  })
  return response.data
}

export async function closeOpportunity(id: number, payload: OpportunityCloseDTO) {
  const response = await apiClient.patch<OpportunityResponseDTO>(
    `/opportunities/${id}/close`,
    payload,
  )
  return response.data
}

import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  LeadFilterParams,
  LeadRequestDTO,
  LeadResponseDTO,
  PageResponse,
} from '@/types/api'

export async function listLeads(params: LeadFilterParams = {}) {
  const response = await apiClient.get<PageResponse<LeadResponseDTO>>(
      '/leads',
      {
        params: buildPaginationParams(params),
      })

  return response.data
}

export async function getLead(id: number) {
  const response = await apiClient.get<LeadResponseDTO>(`/leads/${id}`)
  return response.data
}

export async function createLead(payload: LeadRequestDTO) {
  const response = await apiClient.post<LeadResponseDTO>('/leads', payload)
  return response.data
}

export async function updateLead(id: number, payload: LeadRequestDTO) {
  const response = await apiClient.put<LeadResponseDTO>(`/leads/${id}`, payload)
  return response.data
}

export async function deleteLead(id: number) {
  await apiClient.delete(`/leads/${id}`)
}

import { apiClient } from '@/services/http/api-client'
import { buildPaginationParams } from '@/services/http/pagination'

import type {
  PageResponse,
  PaginationParams,
  PipelineRequestDTO,
  PipelineResponseDTO,
  StageRequestDTO,
  StageResponseDTO,
} from '@/types/api'

export async function listPipelines(params: PaginationParams = {}) {
  const response = await apiClient.get<PageResponse<PipelineResponseDTO>>(
    '/pipelines',
    {
      params: buildPaginationParams(params),
    },
  )

  return response.data
}

export async function getPipeline(id: number) {
  const response = await apiClient.get<PipelineResponseDTO>(`/pipelines/${id}`)
  return response.data
}

export async function createPipeline(payload: PipelineRequestDTO) {
  const response = await apiClient.post<PipelineResponseDTO>(
    '/pipelines',
    payload,
  )
  return response.data
}

export async function updatePipeline(id: number, payload: PipelineRequestDTO) {
  const response = await apiClient.put<PipelineResponseDTO>(
    `/pipelines/${id}`,
    payload,
  )
  return response.data
}

export async function deletePipeline(id: number) {
  await apiClient.delete(`/pipelines/${id}`)
}

export async function createStage(payload: StageRequestDTO) {
  const response = await apiClient.post<StageResponseDTO>(
    '/pipelines/stages',
    payload,
  )
  return response.data
}

export async function updateStage(stageId: number, payload: StageRequestDTO) {
  const response = await apiClient.put<StageResponseDTO>(
    `/pipelines/stages/${stageId}`,
    payload,
  )
  return response.data
}

export async function deleteStage(pipelineId: number, stageId: number) {
  await apiClient.delete(`/pipelines/${pipelineId}/stages/${stageId}`)
}

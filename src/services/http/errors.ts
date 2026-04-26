import axios from 'axios'

import type {
  StandardErrorResponse,
  ValidationErrorResponse,
} from '@/types/api'

export interface ApiErrorInfo {
  message: string
  status?: number
  fieldErrors: Record<string, string>
  isAuthError: boolean
  isForbidden: boolean
  isNotFound: boolean
  isNetworkError: boolean
}

function isValidationError(
  payload: StandardErrorResponse | ValidationErrorResponse | undefined,
): payload is ValidationErrorResponse {
  return Array.isArray((payload as ValidationErrorResponse | undefined)?.erros)
}

export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | StandardErrorResponse
      | ValidationErrorResponse
      | undefined
    const fieldErrors = isValidationError(payload)
      ? Object.fromEntries(
          payload.erros.map((item) => [item.fieldName, item.message]),
        )
      : {}

    return {
      message:
        payload?.message ||
        error.message ||
        'Nao foi possivel concluir a operacao.',
      status: error.response?.status,
      fieldErrors,
      isAuthError: error.response?.status === 401,
      isForbidden: error.response?.status === 403,
      isNotFound: error.response?.status === 404,
      isNetworkError: !error.response,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      fieldErrors: {},
      isAuthError: false,
      isForbidden: false,
      isNotFound: false,
      isNetworkError: false,
    }
  }

  return {
    message: 'Erro inesperado ao comunicar com a API.',
    fieldErrors: {},
    isAuthError: false,
    isForbidden: false,
    isNotFound: false,
    isNetworkError: false,
  }
}

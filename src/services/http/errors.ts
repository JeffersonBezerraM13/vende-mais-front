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
  isBusinessRuleViolation: boolean
  isConflict: boolean
  isForbidden: boolean
  isNotFound: boolean
  isNetworkError: boolean
}

function isValidationError(
  payload: StandardErrorResponse | ValidationErrorResponse | undefined,
): payload is ValidationErrorResponse {
  return Array.isArray((payload as ValidationErrorResponse | undefined)?.erros)
}

function getDefaultErrorMessage(status?: number) {
  if (status === 401) {
    return 'Sua sessão expirou ou é inválida. Faça login novamente.'
  }

  if (status === 403) {
    return 'Você não possui permissão para realizar esta ação.'
  }

  if (status === 404) {
    return 'O recurso solicitado não foi encontrado.'
  }

  if (status === 409) {
    return 'Não foi possível concluir a operação por conflito de dados.'
  }

  if (status === 422) {
    return 'A operação viola uma regra de negócio.'
  }

  if (status === 400) {
    return 'Os dados informados são inválidos.'
  }

  return 'Não foi possível concluir a operação.'
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
      message: payload?.message || getDefaultErrorMessage(error.response?.status),
      status: error.response?.status,
      fieldErrors,
      isAuthError: error.response?.status === 401,
      isBusinessRuleViolation: error.response?.status === 422,
      isConflict: error.response?.status === 409,
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
      isBusinessRuleViolation: false,
      isConflict: false,
      isForbidden: false,
      isNotFound: false,
      isNetworkError: false,
    }
  }

  return {
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    fieldErrors: {},
    isAuthError: false,
    isBusinessRuleViolation: false,
    isConflict: false,
    isForbidden: false,
    isNotFound: false,
    isNetworkError: false,
  }
}

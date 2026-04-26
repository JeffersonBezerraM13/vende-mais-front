import type { PageResponse, PaginationParams } from '@/types/api'

import { DEFAULT_PAGE_SIZE, LOCAL_VIEW_PAGE_SIZE } from '@/utils/constants'

type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>

function normalizeQueryParamValue(value: QueryParamValue) {
  if (value == null) {
    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : undefined
  }

  return value
}

export function buildPaginationParams<T extends PaginationParams>(params: T = {} as T) {
  const { page = 0, size = DEFAULT_PAGE_SIZE, sort, ...filters } = params

  const entries = Object.entries({
    ...filters,
    page,
    size,
    sort,
  }).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => normalizeQueryParamValue(item))
        .filter((item) => item !== undefined)

      return normalized.length ? [[key, normalized]] : []
    }

    const normalizedValue = normalizeQueryParamValue(value)

    return normalizedValue === undefined ? [] : [[key, normalizedValue]]
  })

  return Object.fromEntries(entries)
}

export async function fetchAllPages<
  T,
  TParams extends PaginationParams = PaginationParams,
>(
  fetchPage: (params: TParams) => Promise<PageResponse<T>>,
  params: Omit<TParams, 'page'> = {} as Omit<TParams, 'page'>,
) {
  const size = params.size ?? 100
  const firstPage = await fetchPage({ ...params, page: 0, size } as TParams)
  const content = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await fetchPage({ ...params, page, size } as TParams)
    content.push(...nextPage.content)
  }

  return content
}

export function createLocalPage<T>(items: T[], page: number) {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / LOCAL_VIEW_PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * LOCAL_VIEW_PAGE_SIZE
  const content = items.slice(start, start + LOCAL_VIEW_PAGE_SIZE)

  return {
    content,
    totalPages,
    totalElements,
    page: safePage,
  }
}

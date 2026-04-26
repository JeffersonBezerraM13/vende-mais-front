import type { PageResponse, PaginationParams } from '@/types/api'

import { DEFAULT_PAGE_SIZE, LOCAL_VIEW_PAGE_SIZE } from '@/utils/constants'

export function buildPaginationParams(params: PaginationParams = {}) {
  return {
    page: params.page ?? 0,
    size: params.size ?? DEFAULT_PAGE_SIZE,
    ...(params.sort ? { sort: params.sort } : {}),
  }
}

export async function fetchAllPages<T>(
  fetchPage: (params: PaginationParams) => Promise<PageResponse<T>>,
  params: Omit<PaginationParams, 'page'> = {},
) {
  const size = params.size ?? 100
  const firstPage = await fetchPage({ ...params, page: 0, size })
  const content = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await fetchPage({ ...params, page, size })
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

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function Pagination({
  onPageChange,
  page,
  totalItems,
  totalPages,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)
  const safePage = Math.min(page, safeTotalPages - 1)

  return (
    <div className="pagination">
      <p className="pagination-info">
        {totalItems} {totalItems === 1 ? 'registro' : 'registros'} • página {safePage + 1} de{' '}
        {safeTotalPages}
      </p>
      <div className="pagination-controls">
        <Button
          variant="ghost"
          size="sm"
          disabled={safePage === 0}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft size={16} />
          Anterior
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={safePage + 1 >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Próxima
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

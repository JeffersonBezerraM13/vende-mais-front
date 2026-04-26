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
  return (
    <div className="pagination">
      <p className="pagination-info">
        {totalItems} registro(s) • página {page + 1} de {totalPages}
      </p>
      <div className="pagination-controls">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          Anterior
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

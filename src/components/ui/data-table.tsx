import type { ReactNode } from 'react'

interface DataColumn<T> {
  key: string
  header: string
  className?: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  emptyState: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  emptyState,
  rowKey,
}: DataTableProps<T>) {
  if (!data.length) {
    return <>{emptyState}</>
  }

  return (
    <div className="table-card">
      <table className="crm-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

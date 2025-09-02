"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, FileX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ScrollableTableColumn<T = any> {
  key: string
  header: React.ReactNode
  width?: string
  className?: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
}

export interface ScrollableTablePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ScrollableTableProps<T = any> {
  // Data and columns
  data: T[]
  columns: ScrollableTableColumn<T>[]

  // Loading states
  loading?: boolean
  loadingRows?: number

  // Empty state
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  emptyAction?: {
    label: string
    onClick: () => void
  }

  // Pagination
  pagination?: ScrollableTablePagination
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  showPagination?: boolean
  pageSizeOptions?: number[]

  // Styling
  className?: string
  tableClassName?: string
  containerClassName?: string

  // Responsive
  responsive?: boolean
  stickyHeader?: boolean

  // Additional props
  caption?: string
  maxHeight?: string
}

export function ScrollableTable<T = any>({
  data,
  columns,
  loading = false,
  loadingRows = 8,
  emptyTitle = "No hay datos disponibles",
  emptyDescription = "No se encontraron elementos para mostrar.",
  emptyIcon,
  emptyAction,
  pagination,
  onPageChange,
  onLimitChange,
  showPagination = true,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  tableClassName,
  containerClassName,
  responsive = true,
  stickyHeader = false,
  caption,
  maxHeight,
}: ScrollableTableProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <TableSkeleton rows={loadingRows} columns={columns.length} showHeader={true} />
      </div>
    )
  }

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="mb-3 text-muted-foreground">{emptyIcon || <FileX className="h-10 w-10" />}</div>
      <h3 className="text-base font-medium mb-2">{emptyTitle}</h3>
      <p className="text-sm text-muted-foreground mb-3 max-w-sm">{emptyDescription}</p>
      {emptyAction && (
        <Button onClick={emptyAction.onClick} variant="outline" className="text-sm">
          {emptyAction.label}
        </Button>
      )}
    </div>
  )

  // Pagination component
  const PaginationControls = () => {
    if (!pagination || !showPagination) return null

    return (
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-3 py-2 border-t">
        {pagination.total > 0 ? (
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> a{" "}
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{" "}
            <span className="font-medium">{pagination.total}</span> elementos
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sin elementos</div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Items por página</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(val) => onLimitChange?.(Number(val))}
            >
              <SelectTrigger className="h-6 w-[70px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-sm">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="h-6 text-sm"
          >
            <ChevronLeft className="w-3 h-3" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
          </Button>
          <div className="flex items-center gap-1 text-sm min-w-[100px] justify-center">
            Página {pagination.page} de {Math.max(pagination.totalPages, 1)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="h-6 text-sm"
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">Siguiente</span>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn("border rounded-md overflow-hidden", containerClassName)}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {/* Scrollable container */}
        <div
          className={cn("relative", maxHeight && "overflow-y-auto", responsive && "overflow-x-auto")}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <Table className={cn("w-full", tableClassName)}>
            {caption && <caption className="text-sm text-muted-foreground mb-2 font-medium">{caption}</caption>}

            <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-background border-b")}>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn("text-sm font-semibold text-slate-700 dark:text-slate-300 !text-sm !font-semibold !tracking-normal", column.className)}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && <div className="w-3 h-3 opacity-40">{/* Placeholder for sort icon */}</div>}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0 border-0">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/20">
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn("text-sm py-4", column.className)}>
                        {column.render ? column.render(item, index) : (item as any)[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <PaginationControls />
      </div>
    </div>
  )
}

// Utility hook for managing table state
export function useScrollableTable<T = any>(initialData: T[] = []) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [pagination, setPagination] = React.useState<ScrollableTablePagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const updatePagination = React.useCallback((newPagination: Partial<ScrollableTablePagination>) => {
    setPagination((prev) => ({ ...prev, ...newPagination }))
  }, [])

  const handlePageChange = React.useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  return {
    data,
    setData,
    loading,
    setLoading,
    pagination,
    setPagination,
    updatePagination,
    handlePageChange,
  }
}

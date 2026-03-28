"use client"

import { useState, useEffect, useRef, useCallback, ReactNode, Fragment } from "react"
import {
  ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal,
  Settings2, Search, ChevronRight, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | null

export interface ColumnDef<TData> {
  key: string
  header: string
  sortable?: boolean
  defaultVisible?: boolean
  cell?: (row: TData) => ReactNode
}

export interface ActionItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
  separator?: boolean
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface DataTableProps<TData> {
  tableKey: string
  data: TData[]
  columns: ColumnDef<TData>[]
  searchPlaceholder?: string
  isLoading?: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSearchChange: (query: string) => void
  onSortChange: (column: string, direction: SortDirection) => void
  rowActions?: (row: TData) => ActionItem[]
  rowExpand?: (row: TData) => ReactNode
  onRowExpand?: (row: TData) => void
  batchActions?: (selectedIds: string[]) => ActionItem[]
  onSelectionChange?: (ids: string[]) => void
  toolbar?: ReactNode
  /** Server-loaded column visibility. Overrides localStorage when provided. */
  initialVisibleColumns?: Record<string, boolean>
  /** Called when user changes column visibility (use to persist to server). */
  onColumnsChange?: (cols: Record<string, boolean>) => void
}

export function DataTable<TData extends { id: string }>({
  tableKey,
  data,
  columns,
  searchPlaceholder = "Search...",
  isLoading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  rowActions,
  rowExpand,
  onRowExpand,
  batchActions,
  onSelectionChange,
  toolbar,
  initialVisibleColumns,
  onColumnsChange,
}: DataTableProps<TData>) {
  const storageKey = `datatable-columns-${tableKey}`

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    // Server-loaded prefs take priority, then localStorage, then defaults
    if (initialVisibleColumns && Object.keys(initialVisibleColumns).length > 0) {
      return initialVisibleColumns
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    }
    return Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible !== false]))
  })

  // When server prefs arrive after hydration, apply them
  useEffect(() => {
    if (initialVisibleColumns && Object.keys(initialVisibleColumns).length > 0) {
      setVisibleColumns(initialVisibleColumns)
    }
  }, [initialVisibleColumns])  // eslint-disable-line react-hooks/exhaustive-deps

  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [searchValue, setSearchValue] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleColumns))
  }, [visibleColumns, storageKey])

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [data])

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds))
  }, [selectedIds, onSelectionChange])

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(value)
      onPageChange(1)
    }, 300)
  }, [onSearchChange, onPageChange])

  function handleSort(key: string) {
    if (!columns.find((c) => c.key === key)?.sortable) return
    let newDir: SortDirection
    if (sortColumn !== key) newDir = "asc"
    else if (sortDirection === "asc") newDir = "desc"
    else newDir = null
    setSortColumn(newDir ? key : null)
    setSortDirection(newDir)
    onSortChange(key, newDir)
  }

  const allPageIds = data.map((r) => r.id)
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id))
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allPageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...allPageIds]))
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const visibleCols = columns.filter((c) => visibleColumns[c.key])
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  const selectedCount = selectedIds.size

  // Extra columns: checkbox + expand toggle
  const extraColCount = 1 + (rowExpand ? 1 : 0) // checkbox always, expand if provided
  const totalColCount = extraColCount + visibleCols.length + (rowActions ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>
          {toolbar}
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
                <Settings2 className="size-3.5" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-3">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--on-surface-variant)" }}>Toggle columns</p>
              <div className="flex flex-col gap-2">
                {columns.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={!!visibleColumns[col.key]}
                      onCheckedChange={(checked) => {
                        const next = { ...visibleColumns, [col.key]: !!checked }
                        setVisibleColumns(next)
                        // Debounce server save by 800ms
                        if (onColumnsChange) {
                          if (saveRef.current) clearTimeout(saveRef.current)
                          saveRef.current = setTimeout(() => onColumnsChange(next), 800)
                        }
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--on-surface)" }}>{col.header}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Batch action bar */}
      {selectedCount > 0 && batchActions && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded"
          style={{
            background: "var(--primary-container)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1.5">
              {batchActions(Array.from(selectedIds)).map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  className={cn(
                    "h-7 text-xs",
                    action.variant === "destructive"
                      ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  onClick={action.onClick}
                >
                  {action.icon && <span className="mr-1.5">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setSelectedIds(new Set())}
            title="Clear selection"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                {/* Select all checkbox */}
                <th className="pl-4 pr-2 py-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                {/* Expand toggle header */}
                {rowExpand && <th className="px-1 py-3 w-8" />}

                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold select-none",
                      col.sortable && "cursor-pointer hover:bg-black/[0.02]"
                    )}
                    style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="ml-0.5">
                          {sortColumn === col.key && sortDirection === "asc" ? (
                            <ChevronUp className="size-3" />
                          ) : sortColumn === col.key && sortDirection === "desc" ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 w-12" />}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={totalColCount} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={totalColCount} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const isSelected = selectedIds.has(row.id)
                  const isExpanded = expandedId === row.id
                  const isLast = i === data.length - 1

                  return (
                    <Fragment key={row.id}>
                      <tr
                        style={{
                          borderBottom: (!isExpanded && !isLast) ? "1px solid var(--outline-variant)" : undefined,
                          background: isSelected
                            ? "rgba(0,99,153,0.05)"
                            : i % 2 === 1 ? "rgba(0,10,30,0.015)" : undefined,
                        }}
                        className="transition-colors hover:bg-black/[0.02]"
                      >
                        {/* Row checkbox */}
                        <td className="pl-4 pr-2 py-3 w-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(row.id)}
                            aria-label="Select row"
                          />
                        </td>

                        {/* Expand toggle */}
                        {rowExpand && (
                          <td className="px-1 py-3 w-8">
                            <button
                              onClick={() => { toggleExpand(row.id); if (expandedId !== row.id) onRowExpand?.(row) }}
                              className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-black/10"
                              style={{ color: "var(--on-surface-variant)" }}
                            >
                              <ChevronRight
                                className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-90")}
                              />
                            </button>
                          </td>
                        )}

                        {visibleCols.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-sm" style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
                            {col.cell ? col.cell(row) : String((row as any)[col.key] ?? "—")}
                          </td>
                        ))}

                        {rowActions && (
                          <td className="px-2 py-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {rowActions(row).map((action, idx) => (
                                  <div key={idx}>
                                    {action.separator && idx > 0 && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onClick={action.onClick}
                                      className={cn(action.variant === "destructive" && "text-destructive focus:text-destructive")}
                                    >
                                      {action.icon && <span className="mr-2">{action.icon}</span>}
                                      {action.label}
                                    </DropdownMenuItem>
                                  </div>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>

                      {/* Expanded row */}
                      {rowExpand && isExpanded && (
                        <tr
                          style={{ borderBottom: !isLast ? "1px solid var(--outline-variant)" : undefined }}
                        >
                          <td
                            colSpan={totalColCount}
                            className="px-6 py-4"
                            style={{ background: "rgba(0,33,71,0.03)" }}
                          >
                            <div
                              className="rounded p-4"
                              style={{
                                background: "var(--surface-container-low)",
                                borderRadius: "var(--radius-md)",
                                borderLeft: "3px solid var(--secondary-light)",
                              }}
                            >
                              {rowExpand(row)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Rows per page</span>
          <Select value={String(pagination.pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1) }}>
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => pagination.page > 1 && onPageChange(pagination.page - 1)}
                  className={cn(pagination.page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i + 1
                else if (pagination.page <= 3) pageNum = i + 1
                else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = pagination.page - 2 + i
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink onClick={() => onPageChange(pageNum)} isActive={pageNum === pagination.page}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => pagination.page < totalPages && onPageChange(pagination.page + 1)}
                  className={cn(pagination.page >= totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}

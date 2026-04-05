"use client"

import { useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus, Pencil, Trash2, Menu, ExternalLink, Home, GripVertical,
  MoreHorizontal, ChevronRight, Search,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageContentBlocks } from "@/components/admin/pages/page-content-blocks"
import { cn } from "@/lib/utils"

type Page = {
  id: string
  name: string
  slug: string
  status: string
  isHomePage: boolean
  showInMenu: boolean
  centralMenu: boolean
  menuOrder: number
  sortOrder: number
  updatedAt: string
}

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    draft:     { bg: "rgba(117,117,117,0.12)",   color: "#626262" },
    published: { bg: "rgba(45,106,79,0.12)",     color: "#2D6A4F" },
  }
  const s = styles[status] ?? styles.draft
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const menuBadge = (showInMenu: boolean, menuOrder: number) => {
  if (!showInMenu) return <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>—</span>
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(21,101,192,0.12)", color: "#1565C0", borderRadius: "var(--radius-xs)" }}>
      <Menu className="size-3" />
      #{menuOrder}
    </span>
  )
}

// Grid column template for all rows
const GRID = "40px 32px 1fr 1fr 80px 80px 64px 100px 48px"

function RowContent({ row, expandedId, onToggleExpand, onEdit, onDelete }: {
  row: Page
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isExpanded = expandedId === row.id
  return (
    <>
      {/* Expand toggle */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => onToggleExpand(row.id)}
          className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-black/10"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <ChevronRight className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-90")} />
        </button>
      </div>

      {/* Name */}
      <div className="flex items-center min-w-0">
        <Link href={`/admin/pages/${row.id}`} className="inline-flex items-center gap-1.5 font-medium hover:underline truncate" style={{ color: "var(--primary)" }}>
          {row.isHomePage && <Home className="size-3.5 shrink-0" style={{ color: "var(--primary)" }} />}
          <span className="truncate">{row.name}</span>
        </Link>
      </div>

      {/* Slug */}
      <div className="flex items-center min-w-0">
        <a href={row.isHomePage ? "/" : `/${row.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline truncate">
          <code className="text-xs truncate" style={{ color: "var(--on-surface-variant)" }}>/{row.slug}</code>
          <ExternalLink className="size-3 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
        </a>
      </div>

      {/* Status */}
      <div className="flex items-center">{statusBadge(row.status)}</div>

      {/* Menu */}
      <div className="flex items-center">{menuBadge(row.showInMenu, row.menuOrder)}</div>

      {/* Header */}
      <div className="flex items-center">
        {row.centralMenu ? (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(45,106,79,0.12)", color: "#2D6A4F", borderRadius: "var(--radius-xs)" }}>
            Yes
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>—</span>
        )}
      </div>

      {/* Updated */}
      <div className="flex items-center text-sm" style={{ color: "var(--on-surface)" }}>
        {new Date(row.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(row.id)}>
              <Pencil className="size-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(row.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="size-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

function SortablePageRow({ row, isLast, expandedId, onToggleExpand, onEdit, onDelete }: {
  row: Page
  isLast: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  }

  const isExpanded = expandedId === row.id

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "grid items-center gap-0 px-1 text-sm transition-colors hover:bg-black/[0.02]",
          isDragging && "opacity-90 shadow-md rounded"
        )}
        style={{
          gridTemplateColumns: GRID,
          minHeight: 44,
          borderBottom: (!isExpanded && !isLast) ? "1px solid var(--outline-variant)" : undefined,
          background: isDragging ? "var(--surface-container-lowest)" : undefined,
        }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center">
          <button
            {...attributes}
            {...listeners}
            className="flex items-center justify-center rounded p-1 cursor-grab active:cursor-grabbing transition-colors hover:bg-black/5"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <GripVertical className="size-4" />
          </button>
        </div>

        <RowContent row={row} expandedId={expandedId} onToggleExpand={onToggleExpand} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="px-6 py-4"
          style={{
            background: "rgba(0,33,71,0.03)",
            borderBottom: !isLast ? "1px solid var(--outline-variant)" : undefined,
          }}
        >
          <div
            className="rounded p-4"
            style={{
              background: "var(--surface-container-low)",
              borderRadius: "var(--radius-md)",
              borderLeft: "3px solid var(--secondary-light)",
            }}
          >
            <PageContentBlocks pageId={row.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function StaticPageRow({ row, isLast, expandedId, onToggleExpand, onEdit, onDelete }: {
  row: Page
  isLast: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isExpanded = expandedId === row.id

  return (
    <div>
      <div
        className="grid items-center gap-0 px-1 text-sm transition-colors hover:bg-black/[0.02]"
        style={{
          gridTemplateColumns: GRID,
          minHeight: 44,
          borderBottom: (!isExpanded && !isLast) ? "1px solid var(--outline-variant)" : undefined,
        }}
      >
        {/* Drag handle placeholder */}
        <div className="flex items-center justify-center">
          <span className="flex items-center justify-center rounded p-1" style={{ color: "var(--on-surface-variant)" }}>
            <GripVertical className="size-4 opacity-30" />
          </span>
        </div>

        <RowContent row={row} expandedId={expandedId} onToggleExpand={onToggleExpand} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {isExpanded && (
        <div
          className="px-6 py-4"
          style={{
            background: "rgba(0,33,71,0.03)",
            borderBottom: !isLast ? "1px solid var(--outline-variant)" : undefined,
          }}
        >
          <div
            className="rounded p-4"
            style={{
              background: "var(--surface-container-low)",
              borderRadius: "var(--radius-md)",
              borderLeft: "3px solid var(--secondary-light)",
            }}
          >
            <PageContentBlocks pageId={row.id} />
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  initialData: { pages: Page[]; total: number }
}

export function PagesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.pages)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPageNameEl, setNewPageNameEl] = useState("")
  const [newPageNameDe, setNewPageNameDe] = useState("")
  const [newPageSlug, setNewPageSlug] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [creating, setCreating] = useState(false)
  const [translatingName, setTranslatingName] = useState(false)
  const [deletePageId, setDeletePageId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = useCallback(async (params: { page: number; pageSize: number; search: string }) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        search: params.search,
      })
      const res = await fetch(`/api/admin/pages?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.pages ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      console.error("[fetchData]", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function refresh() {
    fetchData({ page, pageSize, search })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = data.findIndex((p) => p.id === active.id)
    const newIndex = data.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(data, oldIndex, newIndex)
    // Update menuOrder optimistically for pages shown in menu
    let menuPos = 0
    const withUpdatedMenu = reordered.map((p) => ({
      ...p,
      menuOrder: p.showInMenu ? menuPos++ : p.menuOrder,
    }))
    const prevData = data
    setData(withUpdatedMenu)

    // Persist to server
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/pages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
      })
      if (!res.ok) {
        setData(prevData)
        console.error("Failed to save order")
      }
    } catch (err) {
      setData(prevData)
      console.error("[handleDragEnd]", err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleNameChange(val: string) {
    setNewPageName(val)
    if (!slugOverridden) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setNewPageSlug(slug)
    }
  }

  function handleSlugChange(val: string) {
    setNewPageSlug(val)
    setSlugOverridden(true)
  }

  async function handleTranslateName() {
    if (!newPageName) return
    setTranslatingName(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPageName, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewPageNameEl(json.translations.el || "")
        setNewPageNameDe(json.translations.de || "")
      } else {
        alert("Translation failed")
      }
    } catch (err) {
      console.error("[handleTranslateName]", err)
      alert("Error translating")
    } finally {
      setTranslatingName(false)
    }
  }

  async function handleCreate() {
    if (!newPageName || !newPageSlug) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPageName,
          slug: newPageSlug,
          translations: { en: newPageName, el: newPageNameEl, de: newPageNameDe },
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewPageOpen(false)
        setNewPageName("")
        setNewPageNameEl("")
        setNewPageNameDe("")
        setNewPageSlug("")
        setSlugOverridden(false)
        router.push(`/admin/pages/${json.page.id}`)
      } else {
        alert("Failed to create page")
      }
    } catch (err) {
      console.error("[handleCreate]", err)
      alert("Error creating page")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeletePageId(null)
        refresh()
      } else {
        alert("Failed to delete page")
      }
    } catch (err) {
      console.error("[handleDelete]", err)
      alert("Error deleting page")
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    const timeout = setTimeout(() => {
      setSearch(value)
      setPage(1)
      fetchData({ page: 1, pageSize, search: value })
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchData, pageSize])

  const headers = ["", "", "Name", "Slug", "Status", "Menu", "Header", "Updated", ""]

  const rowProps = (row: Page, i: number) => ({
    row,
    isLast: i === data.length - 1,
    expandedId,
    onToggleExpand: (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    onEdit: (id: string) => router.push(`/admin/pages/${id}`),
    onDelete: (id: string) => setDeletePageId(id),
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
            <Input
              placeholder="Search by name or slug..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>
          <Button
            size="sm"
            className="h-9 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={() => setNewPageOpen(true)}
          >
            <Plus className="size-4" />
            New Page
          </Button>
        </div>
        {isSaving && (
          <span className="text-xs animate-pulse" style={{ color: "var(--on-surface-variant)" }}>
            Saving order...
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        {/* Header row */}
        <div
          className="grid items-center gap-0 px-1 text-xs font-semibold select-none"
          style={{
            gridTemplateColumns: GRID,
            minHeight: 40,
            borderBottom: "1px solid var(--outline-variant)",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-display)",
          }}
        >
          {headers.map((h, i) => (
            <div key={i} className="px-1">{h}</div>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
            No pages found
          </div>
        ) : mounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={data.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {data.map((row, i) => (
                <SortablePageRow key={row.id} {...rowProps(row, i)} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          data.map((row, i) => (
            <StaticPageRow key={row.id} {...rowProps(row, i)} />
          ))
        )}
      </div>

      {/* Page count */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {data.length} of {total} pages
        </span>
      </div>

      {/* New Page Dialog */}
      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Create New Page</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Enter page name and slug. You can add text components after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EN *</Label>
                <Input
                  value={newPageName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="About Us"
                  autoFocus
                  className="h-7 text-xs"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</Label>
                <Input
                  value={newPageNameEl}
                  onChange={(e) => setNewPageNameEl(e.target.value)}
                  placeholder="Σχετικά με εμάς"
                  className="h-7 text-xs"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</Label>
                <Input
                  value={newPageNameDe}
                  onChange={(e) => setNewPageNameDe(e.target.value)}
                  placeholder="Über uns"
                  className="h-7 text-xs"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleTranslateName}
              disabled={translatingName || !newPageName}
              className="w-full h-7 text-xs"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              {translatingName ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug *</Label>
              <Input
                value={newPageSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="about-us"
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                setNewPageOpen(false)
                setNewPageName("")
                setNewPageNameEl("")
                setNewPageNameDe("")
                setNewPageSlug("")
                setSlugOverridden(false)
              }} disabled={creating}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={creating || !newPageName || !newPageSlug}
                className="h-7 text-xs text-white"
                style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              >
                {creating ? "Creating…" : "Create Page"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deletePageId && (
        <Dialog open={!!deletePageId} onOpenChange={(v) => !v && setDeletePageId(null)}>
          <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Page</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this page and all its text components. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletePageId(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deletePageId)}
                disabled={deleting}
                className="text-white"
                style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}
              >
                {deleting ? "Deleting…" : "Delete Page"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

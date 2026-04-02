"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, GripVertical, Globe, Search, Sparkles, Eye, EyeOff, MoreHorizontal, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Service = {
  id: string
  title: Record<string, string>
  slug: string
  status: string
  label: Record<string, string>
  header: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  defaultMedia: string | null
  defaultMediaType: string | null
  icon: string | null
  link: string | null
  showOnHomepage: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const LANGS = ["en", "el", "de"] as const

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    draft:     { bg: "rgba(117,117,117,0.12)", color: "#626262" },
    published: { bg: "rgba(45,106,79,0.12)",   color: "#2D6A4F" },
  }
  const s = styles[status] ?? styles.draft
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Accordion Service Row ──────────────────────────────────────────────────

function SortableRow({ service, expanded, onToggle, onEdit, onDelete }: {
  service: Service
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const titlePreview = service.title?.en || "Untitled"
  const descPreview = service.shortDesc?.en
    ? service.shortDesc.en.replace(/<[^>]*>/g, "").slice(0, 80) + (service.shortDesc.en.length > 80 ? "…" : "")
    : "—"

  return (
    <div ref={setNodeRef} style={style}>
      {/* Summary row */}
      <div
        className="flex items-center gap-0 transition-colors hover:bg-black/[0.02]"
        style={{ borderBottom: expanded ? "none" : "1px solid var(--outline-variant)" }}
      >
        {/* Drag handle */}
        <div className="pl-3 pr-1 py-3 w-10 flex-shrink-0">
          <button
            className="flex items-center justify-center cursor-grab active:cursor-grabbing rounded p-1 hover:bg-black/5"
            style={{ color: "var(--on-surface-variant)" }}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        </div>
        {/* Order */}
        <div className="px-2 py-3 w-10 flex-shrink-0">
          <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
            #{service.sortOrder + 1}
          </span>
        </div>
        {/* Thumbnail */}
        <div className="px-2 py-2 w-14 flex-shrink-0">
          {service.defaultMedia ? (
            service.defaultMediaType === "video" ? (
              <video src={service.defaultMedia} className="w-10 h-10 rounded object-cover" muted />
            ) : (
              <img src={service.defaultMedia} alt="" className="w-10 h-10 rounded object-cover" />
            )
          ) : (
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)" }}>
              <Sparkles className="size-4" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
            </div>
          )}
        </div>
        {/* Title */}
        <div className="flex-1 px-3 py-3 min-w-0">
          <button onClick={onToggle} className="text-left w-full">
            <span className="text-sm font-medium block truncate" style={{ color: "var(--on-surface)" }}>{titlePreview}</span>
            <span className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--on-surface-variant)" }}>{descPreview}</span>
          </button>
        </div>
        {/* Homepage */}
        <div className="px-3 py-3 w-20 flex-shrink-0 text-center">
          {service.showOnHomepage ? (
            <Eye className="size-4 mx-auto" style={{ color: "#2D6A4F" }} />
          ) : (
            <EyeOff className="size-4 mx-auto" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
          )}
        </div>
        {/* Status */}
        <div className="px-3 py-3 w-24 flex-shrink-0">{statusBadge(service.status)}</div>
        {/* Expand toggle */}
        <div className="px-2 py-3 w-10 flex-shrink-0">
          <button onClick={onToggle} className="p-1 rounded hover:bg-black/5 transition-transform" style={{ color: "var(--on-surface-variant)" }}>
            <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        {/* Actions */}
        <div className="px-2 py-2 w-12 flex-shrink-0 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded accordion detail */}
      {expanded && (
        <div
          className="px-6 pb-4 pt-2"
          style={{ borderBottom: "1px solid var(--outline-variant)", background: "var(--surface-container)" }}
        >
          <AccordionDetail service={service} />
        </div>
      )}
    </div>
  )
}

// ─── Accordion Detail Panel ─────────────────────────────────────────────────

function AccordionDetail({ service }: { service: Service }) {
  const [tab, setTab] = useState<"en" | "el" | "de">("en")

  return (
    <div className="flex flex-col gap-3">
      {/* Language tabs */}
      <div className="flex gap-1">
        {LANGS.map((lang) => (
          <button
            key={lang}
            onClick={() => setTab(lang)}
            className="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            style={{
              background: tab === lang ? "var(--primary)" : "transparent",
              color: tab === lang ? "var(--on-primary)" : "var(--on-surface-variant)",
              border: tab === lang ? "none" : "1px solid var(--outline-variant)",
            }}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FieldPreview label="Title" value={service.title?.[tab]} />
        <FieldPreview label="Label" value={service.label?.[tab]} />
        <FieldPreview label="Header" value={service.header?.[tab]} />
        <FieldPreview label="Short Description" value={service.shortDesc?.[tab]} />
        <div className="md:col-span-2">
          <FieldPreview label="Description" value={service.description?.[tab]} />
        </div>
      </div>

      {service.defaultMedia && (
        <div>
          <span className="text-[10px] uppercase tracking-wide font-medium block mb-1" style={{ color: "var(--on-surface-variant)" }}>Media</span>
          {service.defaultMediaType === "video" ? (
            <video src={service.defaultMedia} className="w-40 h-24 rounded object-cover" muted controls />
          ) : (
            <img src={service.defaultMedia} alt="" className="w-40 h-24 rounded object-cover" />
          )}
        </div>
      )}
    </div>
  )
}

function FieldPreview({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wide font-medium block mb-0.5" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
      <span className="text-xs block" style={{ color: value ? "var(--on-surface)" : "var(--on-surface-variant)" }}>
        {value ? value.replace(/<[^>]*>/g, "").slice(0, 200) : "—"}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialData: { services: Service[]; total: number }
}

export function ServicesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.services)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitleEn, setNewTitleEn] = useState("")
  const [newTitleEl, setNewTitleEl] = useState("")
  const [newTitleDe, setNewTitleDe] = useState("")
  const [translating, setTranslating] = useState(false)
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const fetchData = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "50", search: searchQuery })
      const res = await fetch(`/api/admin/services?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.services ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    setTimeout(() => fetchData(val), 300)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = data.findIndex((s) => s.id === active.id)
    const newIndex = data.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(data, oldIndex, newIndex).map((s, i) => ({ ...s, sortOrder: i }))
    setData(reordered)

    await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
    })
  }

  async function handleTranslateTitle() {
    if (!newTitleEn) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTitleEn, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewTitleEl(json.translations.el || "")
        setNewTitleDe(json.translations.de || "")
      }
    } finally {
      setTranslating(false)
    }
  }

  async function handleCreate() {
    if (!newTitleEn) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: { en: newTitleEn, el: newTitleEl, de: newTitleDe },
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/services/${json.service.id}`)
      } else {
        const json = await res.json()
        alert(json.error || "Failed to create")
      }
    } finally {
      setCreating(false)
    }
  }

  function resetCreateForm() {
    setCreateOpen(false)
    setNewTitleEn("")
    setNewTitleEl("")
    setNewTitleDe("")
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((s) => s.id !== id))
        setTotal((prev) => prev - 1)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <Button
          size="sm"
          className="h-9 gap-2 text-xs text-white"
          style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New Service
        </Button>
      </div>

      {/* List with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
          {/* Header */}
          <div className="flex items-center gap-0" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <div className="pl-3 pr-1 py-3 w-10 flex-shrink-0" />
            <div className="px-2 py-3 w-10 flex-shrink-0 text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>#</div>
            <div className="px-2 py-3 w-14 flex-shrink-0" />
            <div className="flex-1 px-3 py-3 text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Service</div>
            <div className="px-3 py-3 w-20 flex-shrink-0 text-center text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Home</div>
            <div className="px-3 py-3 w-24 flex-shrink-0 text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Status</div>
            <div className="px-2 py-3 w-10 flex-shrink-0" />
            <div className="px-2 py-3 w-12 flex-shrink-0" />
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
              No services found
            </div>
          ) : (
            <SortableContext items={data.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {data.map((service) => (
                <SortableRow
                  key={service.id}
                  service={service}
                  expanded={expandedIds.has(service.id)}
                  onToggle={() => toggleExpanded(service.id)}
                  onEdit={() => router.push(`/admin/services/${service.id}`)}
                  onDelete={() => setDeleteId(service.id)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {data.length} of {total} services
      </p>

      {/* Create Service Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Service</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new service. You can add all details after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Title (EN) *</Label>
              <Input value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} placeholder="e.g. Custom Routes" autoFocus className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            {/* Translate button */}
            <Button variant="outline" onClick={handleTranslateTitle} disabled={translating || !newTitleEn} className="w-full h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              <Globe className="size-3" />
              {translating ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</Label>
                <Input value={newTitleEl} onChange={(e) => setNewTitleEl(e.target.value)} placeholder="Ελληνικά…" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</Label>
                <Input value={newTitleDe} onChange={(e) => setNewTitleDe(e.target.value)} placeholder="Deutsch…" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newTitleEn} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating…" : "Create Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Service</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this service. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting…" : "Delete Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

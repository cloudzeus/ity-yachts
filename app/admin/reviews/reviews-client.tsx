"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Star, GripVertical, Globe, Search } from "lucide-react"
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
import { MoreHorizontal } from "lucide-react"
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

type Review = {
  id: string
  name: string
  email: string
  date: string
  content: Record<string, string>
  rating: number
  status: string
  sortOrder: number
  image: string | null
  updatedAt: string
}

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-3"
          style={{ color: i < rating ? "#F59E0B" : "var(--outline-variant)" }}
          fill={i < rating ? "#F59E0B" : "none"}
        />
      ))}
    </div>
  )
}

// ─── Sortable Row ────────────────────────────────────────────────────────────

function SortableRow({ review, onEdit, onDelete }: {
  review: Review
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
  } = useSortable({ id: review.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const contentPreview = review.content?.en
    ? review.content.en.replace(/<[^>]*>/g, "").slice(0, 80) + (review.content.en.length > 80 ? "…" : "")
    : "—"

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        borderBottom: "1px solid var(--outline-variant)",
        background: isDragging ? "var(--surface-container)" : undefined,
      }}
      className="transition-colors hover:bg-black/[0.02]"
    >
      {/* Drag handle */}
      <td className="pl-3 pr-1 py-3 w-10">
        <button
          className="flex items-center justify-center cursor-grab active:cursor-grabbing rounded p-1 hover:bg-black/5"
          style={{ color: "var(--on-surface-variant)" }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      {/* Order */}
      <td className="px-2 py-3 w-12">
        <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
          #{review.sortOrder + 1}
        </span>
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Star className="size-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} fill="#F59E0B" />
          <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>{review.name}</span>
        </div>
      </td>
      {/* Email */}
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{review.email || "—"}</span>
      </td>
      {/* Rating */}
      <td className="px-4 py-3">
        <StarRating rating={review.rating} />
      </td>
      {/* Content preview */}
      <td className="px-4 py-3 max-w-xs">
        <span className="text-xs line-clamp-1" style={{ color: "var(--on-surface-variant)" }}>{contentPreview}</span>
      </td>
      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {new Date(review.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3">{statusBadge(review.status)}</td>
      {/* Actions */}
      <td className="px-2 py-2 text-right">
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
      </td>
    </tr>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialData: { reviews: Review[]; total: number }
}

export function ReviewsClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.reviews)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newRating, setNewRating] = useState(5)
  const [newContentEn, setNewContentEn] = useState("")
  const [newContentEl, setNewContentEl] = useState("")
  const [newContentDe, setNewContentDe] = useState("")
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

  const fetchData = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "50", search: searchQuery })
      const res = await fetch(`/api/admin/reviews?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.reviews ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    // Simple debounce via setTimeout
    setTimeout(() => fetchData(val), 300)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = data.findIndex((r) => r.id === active.id)
    const newIndex = data.findIndex((r) => r.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(data, oldIndex, newIndex).map((r, i) => ({ ...r, sortOrder: i }))
    setData(reordered)

    // Persist order
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((r) => r.id) }),
    })
  }

  async function handleTranslateContent() {
    if (!newContentEn) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newContentEn, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewContentEl(json.translations.el || "")
        setNewContentDe(json.translations.de || "")
      }
    } finally {
      setTranslating(false)
    }
  }

  async function handleCreate() {
    if (!newName) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          date: newDate,
          rating: newRating,
          content: { en: newContentEn, el: newContentEl, de: newContentDe },
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/reviews/${json.review.id}`)
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
    setNewName("")
    setNewEmail("")
    setNewDate(new Date().toISOString().slice(0, 10))
    setNewRating(5)
    setNewContentEn("")
    setNewContentEl("")
    setNewContentDe("")
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((r) => r.id !== id))
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
            placeholder="Search by name or email..."
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
          New Review
        </Button>
      </div>

      {/* Table with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  <th className="pl-3 pr-1 py-3 w-10" />
                  <th className="px-2 py-3 w-12 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Content</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Status</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={data.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    {data.map((review) => (
                      <SortableRow
                        key={review.id}
                        review={review}
                        onEdit={() => router.push(`/admin/reviews/${review.id}`)}
                        onDelete={() => setDeleteId(review.id)}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DndContext>

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {data.length} of {total} reviews
      </p>

      {/* Create Review Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Review</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Add a new customer review with multilingual content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Name + Email */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" autoFocus className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" type="email" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            {/* Date + Rating */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Date</Label>
                <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Rating</Label>
                <div className="flex items-center gap-1 h-7">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setNewRating(i + 1)} className="p-0">
                      <Star className="size-5" style={{ color: i < newRating ? "#F59E0B" : "var(--outline-variant)" }} fill={i < newRating ? "#F59E0B" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content EN */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Review Content (EN) *</Label>
              <Textarea value={newContentEn} onChange={(e) => setNewContentEn(e.target.value)} placeholder="Write the review text..." className="text-xs min-h-20" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            {/* Translate button */}
            <Button variant="outline" onClick={handleTranslateContent} disabled={translating || !newContentEn} className="w-full h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              <Globe className="size-3" />
              {translating ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            {/* Content EL + DE */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</Label>
                <Textarea value={newContentEl} onChange={(e) => setNewContentEl(e.target.value)} placeholder="Ελληνικά..." className="text-xs min-h-16" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</Label>
                <Textarea value={newContentDe} onChange={(e) => setNewContentDe(e.target.value)} placeholder="Deutsch..." className="text-xs min-h-16" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating…" : "Create Review"}
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
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Review</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this review. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting…" : "Delete Review"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

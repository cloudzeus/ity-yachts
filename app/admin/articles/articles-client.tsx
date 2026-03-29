"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Plus, Pencil, Trash2, Search, Globe, MoreHorizontal, Play,
} from "lucide-react"
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

type Article = {
  id: string
  title: Record<string, string>
  slug: string
  status: string
  date: string
  category: Record<string, string>
  author: string
  shortDesc: Record<string, string>
  description: Record<string, string>
  defaultMedia: string | null
  defaultMediaType: string | null
  media: string[]
  sortOrder: number
  metaTitle: string | null
  metaDesc: string | null
  createdAt: string
  updatedAt: string
}

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(117,117,117,0.12)", color: "#626262" },
    published: { bg: "rgba(45,106,79,0.12)", color: "#2D6A4F" },
  }
  const s = styles[status] ?? styles.draft
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

interface Props {
  initialData: { articles: Article[]; total: number }
}

export function ArticlesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.articles)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitleEn, setNewTitleEn] = useState("")
  const [newTitleEl, setNewTitleEl] = useState("")
  const [newTitleDe, setNewTitleDe] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [newCategoryEn, setNewCategoryEn] = useState("")
  const [newCategoryEl, setNewCategoryEl] = useState("")
  const [newCategoryDe, setNewCategoryDe] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [translatingTitle, setTranslatingTitle] = useState(false)
  const [translatingCategory, setTranslatingCategory] = useState(false)
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "20", search: searchQuery })
      const res = await fetch(`/api/admin/articles?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.articles ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    setTimeout(() => fetchData(val), 300)
  }

  function handleTitleChange(val: string) {
    setNewTitleEn(val)
    if (!slugOverridden) {
      setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }

  async function handleTranslateTitle() {
    if (!newTitleEn) return
    setTranslatingTitle(true)
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
      setTranslatingTitle(false)
    }
  }

  async function handleTranslateCategory() {
    if (!newCategoryEn) return
    setTranslatingCategory(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newCategoryEn, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewCategoryEl(json.translations.el || "")
        setNewCategoryDe(json.translations.de || "")
      }
    } finally {
      setTranslatingCategory(false)
    }
  }

  async function handleCreate() {
    if (!newTitleEn) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: { en: newTitleEn, el: newTitleEl, de: newTitleDe },
          slug: newSlug,
          category: { en: newCategoryEn, el: newCategoryEl, de: newCategoryDe },
          author: newAuthor,
          date: newDate,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/articles/${json.article.id}`)
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
    setNewSlug("")
    setSlugOverridden(false)
    setNewCategoryEn("")
    setNewCategoryEl("")
    setNewCategoryDe("")
    setNewAuthor("")
    setNewDate(new Date().toISOString().slice(0, 10))
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((a) => a.id !== id))
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
            placeholder="Search by slug or author..."
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
          New Article
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold w-14" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Status</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    No articles found
                  </td>
                </tr>
              ) : (
                data.map((article) => {
                  const titleEn = article.title?.en || "Untitled"
                  const categoryEn = article.category?.en || "—"
                  return (
                    <tr
                      key={article.id}
                      className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                      style={{ borderBottom: "1px solid var(--outline-variant)" }}
                      onClick={() => router.push(`/admin/articles/${article.id}`)}
                    >
                      {/* Thumbnail */}
                      <td className="px-4 py-2">
                        {article.defaultMedia ? (
                          <div className="relative w-12 h-8 rounded overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
                            {article.defaultMediaType === "video" ? (
                              <div className="w-full h-full bg-black/80 flex items-center justify-center">
                                <Play className="size-3 text-white/60" />
                              </div>
                            ) : (
                              <Image src={article.defaultMedia} alt="" fill className="object-cover" sizes="48px" />
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-8 rounded flex items-center justify-center" style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)" }}>
                            <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>No img</span>
                          </div>
                        )}
                      </td>
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>{titleEn}</span>
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>/{article.slug}</div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{categoryEn}</span>
                      </td>
                      {/* Author */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{article.author || "—"}</span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                          {new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">{statusBadge(article.status)}</td>
                      {/* Actions */}
                      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => router.push(`/admin/articles/${article.id}`)}>
                              <Pencil className="size-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(article.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="size-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {data.length} of {total} articles
      </p>

      {/* Create Article Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Article</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new article with multilingual content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Title EN */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Title (EN) *</Label>
              <Input
                value={newTitleEn}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title..."
                autoFocus
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {/* Translate title */}
            <Button variant="outline" onClick={handleTranslateTitle} disabled={translatingTitle || !newTitleEn} className="w-full h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              <Globe className="size-3" />
              {translatingTitle ? "Translating..." : "Translate Title via DeepSeek"}
            </Button>

            {/* Title EL + DE */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Title EL</Label>
                <Input value={newTitleEl} onChange={(e) => setNewTitleEl(e.target.value)} placeholder="Ελληνικά..." className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Title DE</Label>
                <Input value={newTitleDe} onChange={(e) => setNewTitleDe(e.target.value)} placeholder="Deutsch..." className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug</Label>
              <Input
                value={newSlug}
                onChange={(e) => { setNewSlug(e.target.value); setSlugOverridden(true) }}
                placeholder="auto-generated-from-title"
                className="h-7 text-xs font-mono"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {/* Category EN */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Category (EN)</Label>
              <Input value={newCategoryEn} onChange={(e) => setNewCategoryEn(e.target.value)} placeholder="e.g. Sailing Tips" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            {/* Translate category */}
            <Button variant="outline" onClick={handleTranslateCategory} disabled={translatingCategory || !newCategoryEn} className="w-full h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              <Globe className="size-3" />
              {translatingCategory ? "Translating..." : "Translate Category via DeepSeek"}
            </Button>

            {/* Category EL + DE */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Category EL</Label>
                <Input value={newCategoryEl} onChange={(e) => setNewCategoryEl(e.target.value)} placeholder="Ελληνικά..." className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Category DE</Label>
                <Input value={newCategoryDe} onChange={(e) => setNewCategoryDe(e.target.value)} placeholder="Deutsch..." className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            {/* Author + Date */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Author</Label>
                <Input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Author name" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Date</Label>
                <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newTitleEn} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating..." : "Create Article"}
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
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Article</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this article. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting..." : "Delete Article"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

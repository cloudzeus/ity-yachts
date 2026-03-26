"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Languages } from "lucide-react"
import { DataTable, type ColumnDef, type SortDirection } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Page = {
  id: string
  name: string
  slug: string
  status: string
  translations?: Record<string, string>
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

const COLUMNS: ColumnDef<Page>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div className="flex flex-col gap-1">
        <span>{row.name}</span>
        {row.translations && Object.keys(row.translations).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(row.translations).map(([lang, translation]) => (
              <span
                key={lang}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(0, 99, 169, 0.1)", color: "#0063A9" }}
              >
                {lang}: {translation}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
  },
  { key: "slug", header: "Slug", sortable: true, cell: (row) => <code className="text-xs" style={{ color: "var(--on-surface-variant)" }}>/{row.slug}</code> },
  { key: "status", header: "Status", sortable: true, cell: (row) => statusBadge(row.status) },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    cell: (row) => new Date(row.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  },
]

interface Props {
  initialData: { pages: Page[]; total: number }
}

export function PagesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.pages)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPageSlug, setNewPageSlug] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [newPageTranslations, setNewPageTranslations] = useState({ el: "", en: "", de: "" })
  const [creating, setCreating] = useState(false)
  const [deletePageId, setDeletePageId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTranslationsPageId, setEditTranslationsPageId] = useState<string | null>(null)
  const [editTranslations, setEditTranslations] = useState<Record<string, string>>({})
  const [savingTranslations, setSavingTranslations] = useState(false)

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

  // Auto-generate slug from name
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

  async function handleCreate() {
    if (!newPageName || !newPageSlug) return
    if (!newPageTranslations.el || !newPageTranslations.en || !newPageTranslations.de) {
      alert("All language translations (Greek, English, German) are required")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPageName,
          slug: newPageSlug,
          translations: newPageTranslations
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewPageOpen(false)
        setNewPageName("")
        setNewPageSlug("")
        setSlugOverridden(false)
        setNewPageTranslations({ el: "", en: "", de: "" })
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

  function openEditTranslations(pageId: string) {
    const page = data.find((p) => p.id === pageId)
    if (page) {
      setEditTranslationsPageId(pageId)
      setEditTranslations(page.translations || {})
    }
  }

  async function handleSaveTranslations() {
    if (!editTranslationsPageId) return
    setSavingTranslations(true)
    try {
      const res = await fetch(`/api/admin/pages/${editTranslationsPageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: editTranslations }),
      })
      if (res.ok) {
        const updated = data.map((p) =>
          p.id === editTranslationsPageId ? { ...p, translations: editTranslations } : p
        )
        setData(updated)
        setEditTranslationsPageId(null)
        setEditTranslations({})
      } else {
        alert("Failed to save translations")
      }
    } catch (err) {
      console.error("[handleSaveTranslations]", err)
      alert("Error saving translations")
    } finally {
      setSavingTranslations(false)
    }
  }

  return (
    <>
      <DataTable
        tableKey="pages"
        data={data}
        columns={COLUMNS}
        searchPlaceholder="Search by name or slug..."
        isLoading={isLoading}
        pagination={{ page, pageSize, total }}
        onPageChange={(p) => {
          setPage(p)
          fetchData({ page: p, pageSize, search })
        }}
        onPageSizeChange={(ps) => {
          setPageSize(ps)
          setPage(1)
          fetchData({ page: 1, pageSize: ps, search })
        }}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
          fetchData({ page: 1, pageSize, search: q })
        }}
        onSortChange={() => {}}
        toolbar={
          <Button
            size="sm"
            className="h-9 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={() => setNewPageOpen(true)}
          >
            <Languages className="size-4" />
            New Page
          </Button>
        }
        rowActions={(row) => [
          {
            label: "Edit",
            icon: <Pencil className="size-3.5" />,
            onClick: () => router.push(`/admin/pages/${row.id}`),
          },
          {
            label: "Translations",
            icon: <Languages className="size-3.5" />,
            onClick: () => openEditTranslations(row.id),
          },
          {
            label: "Delete",
            icon: <Trash2 className="size-3.5" />,
            onClick: () => setDeletePageId(row.id),
            variant: "destructive",
            separator: true,
          },
        ]}
      />

      {/* New Page Dialog */}
      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Create New Page</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Add page name and translations for all languages.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Page Name</Label>
              <Input
                value={newPageName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., About Us"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Page Slug</Label>
              <Input
                value={newPageSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g., about-us"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
            <div className="border-t" style={{ borderColor: "var(--outline-variant)" }} />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Translations</p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Greek (Ελληνικά)</Label>
                  <Input
                    value={newPageTranslations.el}
                    onChange={(e) => setNewPageTranslations({ ...newPageTranslations, el: e.target.value })}
                    placeholder="Greek page name..."
                    style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>English</Label>
                  <Input
                    value={newPageTranslations.en}
                    onChange={(e) => setNewPageTranslations({ ...newPageTranslations, en: e.target.value })}
                    placeholder="English page name..."
                    style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>German (Deutsch)</Label>
                  <Input
                    value={newPageTranslations.de}
                    onChange={(e) => setNewPageTranslations({ ...newPageTranslations, de: e.target.value })}
                    placeholder="German page name..."
                    style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => {
                setNewPageOpen(false)
                setNewPageName("")
                setNewPageSlug("")
                setSlugOverridden(false)
                setNewPageTranslations({ el: "", en: "", de: "" })
              }} disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newPageName || !newPageSlug || !newPageTranslations.el || !newPageTranslations.en || !newPageTranslations.de}
                className="text-white"
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
                This will permanently delete this page. This action cannot be undone.
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

      {/* Edit Translations Dialog */}
      {editTranslationsPageId && (
        <Dialog open={!!editTranslationsPageId} onOpenChange={(v) => !v && setEditTranslationsPageId(null)}>
          <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                Edit Translations
              </DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                Edit page name translations for Greek, English, and German.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Greek (Ελληνικά)</Label>
                <Input
                  value={editTranslations["el"] || ""}
                  onChange={(e) => setEditTranslations({ ...editTranslations, el: e.target.value })}
                  placeholder="Greek translation..."
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>English</Label>
                <Input
                  value={editTranslations["en"] || ""}
                  onChange={(e) => setEditTranslations({ ...editTranslations, en: e.target.value })}
                  placeholder="English translation..."
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>German (Deutsch)</Label>
                <Input
                  value={editTranslations["de"] || ""}
                  onChange={(e) => setEditTranslations({ ...editTranslations, de: e.target.value })}
                  placeholder="German translation..."
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditTranslationsPageId(null)}
                disabled={savingTranslations}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTranslations}
                disabled={savingTranslations}
                className="text-white"
                style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              >
                {savingTranslations ? "Saving…" : "Save Translations"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

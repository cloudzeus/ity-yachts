"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, Menu, ExternalLink, Home } from "lucide-react"
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
import { PageContentBlocks } from "@/components/admin/pages/page-content-blocks"

type Page = {
  id: string
  name: string
  slug: string
  status: string
  isHomePage: boolean
  showInMenu: boolean
  menuOrder: number
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

const COLUMNS: ColumnDef<Page>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <Link href={`/admin/pages/${row.id}`} className="inline-flex items-center gap-1.5 font-medium hover:underline" style={{ color: "var(--primary)" }}>
        {row.isHomePage && <Home className="size-3.5" style={{ color: "var(--primary)" }} />}
        {row.name}
      </Link>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    sortable: true,
    cell: (row) => (
      <a href={row.isHomePage ? "/" : `/${row.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
        <code className="text-xs" style={{ color: "var(--on-surface-variant)" }}>/{row.slug}</code>
        <ExternalLink className="size-3" style={{ color: "var(--on-surface-variant)" }} />
      </a>
    ),
  },
  { key: "status", header: "Status", sortable: true, cell: (row) => statusBadge(row.status) },
  { key: "showInMenu", header: "Menu", sortable: true, cell: (row) => menuBadge(row.showInMenu, row.menuOrder) },
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
  const [newPageNameEl, setNewPageNameEl] = useState("")
  const [newPageNameDe, setNewPageNameDe] = useState("")
  const [newPageSlug, setNewPageSlug] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [creating, setCreating] = useState(false)
  const [translatingName, setTranslatingName] = useState(false)
  const [deletePageId, setDeletePageId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fetchData = async (params: { page: number; pageSize: number; search: string }) => {
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
  }

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
            <Plus className="size-4" />
            New Page
          </Button>
        }
        rowExpand={(row) => <PageContentBlocks pageId={row.id} />}
        rowActions={(row) => [
          {
            label: "Edit",
            icon: <Pencil className="size-3.5" />,
            onClick: () => router.push(`/admin/pages/${row.id}`),
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
        <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Create New Page</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Enter page name and slug. You can add text components after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Page names — all 3 languages in one row */}
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

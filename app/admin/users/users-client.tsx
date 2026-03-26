"use client"

import { useState, useCallback, useEffect } from "react"
import { UserPlus, Pencil, Trash2 } from "lucide-react"
import { DataTable, type ColumnDef, type SortDirection } from "@/components/ui/data-table"
import { UserModal, type UserData } from "@/components/admin/user-modal"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  emailVerified: string | null
  createdAt: string
}

const roleBadge = (role: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    ADMIN:    { bg: "rgba(0,99,153,0.12)",   color: "#006399" },
    MANAGER:  { bg: "rgba(0,119,182,0.12)",  color: "#0077B6" },
    EDITOR:   { bg: "rgba(88,214,241,0.14)", color: "#00262D" },
    EMPLOYEE: { bg: "rgba(45,106,79,0.12)",  color: "#2D6A4F" },
    CUSTOMER: { bg: "var(--surface-container-high)", color: "var(--on-surface-variant)" },
  }
  const s = styles[role] ?? styles.CUSTOMER
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {role}
    </span>
  )
}

const verifiedBadge = (verified: string | null) => {
  const isVerified = !!verified
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{
      background: isVerified ? "rgba(45,106,79,0.1)" : "var(--error-container)",
      color: isVerified ? "#2D6A4F" : "var(--error)",
      borderRadius: "var(--radius-xs)",
    }}>
      {isVerified ? "Verified" : "Unverified"}
    </span>
  )
}

const COLUMNS: ColumnDef<User>[] = [
  { key: "name", header: "Name", sortable: true, cell: (row) => row.name ?? <span style={{ color: "var(--on-surface-variant)" }}>—</span> },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", sortable: true, cell: (row) => roleBadge(row.role) },
  { key: "emailVerified", header: "Status", cell: (row) => verifiedBadge(row.emailVerified) },
  {
    key: "createdAt", header: "Created", sortable: true,
    cell: (row) => new Date(row.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  },
]

interface Props {
  initialData: { users: User[]; total: number }
}

export function UsersClient({ initialData }: Props) {
  const [data, setData] = useState(initialData.users)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | undefined>()
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([])
  const [savedColumns, setSavedColumns] = useState<Record<string, boolean> | undefined>(undefined)

  // Load column preferences from server on mount
  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const cols = data?.preferences?.["columns-users"]
        if (cols && typeof cols === "object") {
          setSavedColumns(cols as Record<string, boolean>)
        }
      })
      .catch(() => {})
  }, [])

  // Save column preferences to server
  const handleColumnsChange = useCallback((cols: Record<string, boolean>) => {
    fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "columns-users", value: cols }),
    }).catch(() => {})
  }, [])

  const fetchData = useCallback(async (params: { page: number; pageSize: number; search: string; sortBy: string; sortDir: string }) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        search: params.search,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      })
      const res = await fetch(`/api/admin/users?${qs}`)
      if (!res.ok) {
        console.error("[fetchData] API error:", res.status, res.statusText)
        return
      }
      const json = await res.json()
      setData(json.users ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      console.error("[fetchData] Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function refresh() {
    fetchData({ page, pageSize, search, sortBy, sortDir })
  }

  function handlePageChange(p: number) {
    setPage(p)
    fetchData({ page: p, pageSize, search, sortBy, sortDir })
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps)
    setPage(1)
    fetchData({ page: 1, pageSize: ps, search, sortBy, sortDir })
  }

  function handleSearchChange(q: string) {
    setSearch(q)
    setPage(1)
    fetchData({ page: 1, pageSize, search: q, sortBy, sortDir })
  }

  function handleSortChange(col: string, dir: SortDirection) {
    const d = dir ?? "desc"
    setSortBy(col)
    setSortDir(d)
    fetchData({ page, pageSize, search, sortBy: col, sortDir: d })
  }

  return (
    <>
      <DataTable
        tableKey="users"
        data={data}
        columns={COLUMNS}
        searchPlaceholder="Search by name, email or role..."
        isLoading={isLoading}
        pagination={{ page, pageSize, total }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onSelectionChange={setBatchSelectedIds}
        initialVisibleColumns={savedColumns}
        onColumnsChange={handleColumnsChange}
        toolbar={
          <Button
            size="sm"
            className="h-9 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={() => { setModalMode("add"); setSelectedUser(undefined); setModalOpen(true) }}
          >
            <UserPlus className="size-4" />
            Add User
          </Button>
        }
        rowActions={(row) => [
          {
            label: "Edit",
            icon: <Pencil className="size-3.5" />,
            onClick: () => { setSelectedUser(row); setModalMode("edit"); setModalOpen(true) },
          },
          {
            label: "Delete",
            icon: <Trash2 className="size-3.5" />,
            onClick: () => { setSelectedUser(row); setDeleteOpen(true) },
            variant: "destructive",
            separator: true,
          },
        ]}
        rowExpand={(row) => (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Full Name</p>
              <p className="text-sm" style={{ color: "var(--on-surface)" }}>{row.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Email</p>
              <p className="text-sm" style={{ color: "var(--on-surface)" }}>{row.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Role</p>
              {roleBadge(row.role)}
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Email Verified</p>
              {verifiedBadge(row.emailVerified)}
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Member Since</p>
              <p className="text-sm" style={{ color: "var(--on-surface)" }}>
                {new Date(row.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>User ID</p>
              <p className="text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>{row.id}</p>
            </div>
          </div>
        )}
        batchActions={(ids) => [
          {
            label: `Delete ${ids.length} users`,
            icon: <Trash2 className="size-3.5" />,
            onClick: () => { setBatchSelectedIds(ids); setBatchDeleteOpen(true) },
            variant: "destructive",
          },
        ]}
      />

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={refresh}
        mode={modalMode}
        user={selectedUser}
      />

      <DeleteUserDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={refresh}
        user={selectedUser}
      />

      {/* Batch delete */}
      {batchDeleteOpen && (
        <BatchDeleteDialog
          open={batchDeleteOpen}
          count={batchSelectedIds.length}
          onClose={() => setBatchDeleteOpen(false)}
          onDeleted={() => { setBatchDeleteOpen(false); refresh() }}
          ids={batchSelectedIds}
        />
      )}
    </>
  )
}

function BatchDeleteDialog({ open, count, onClose, onDeleted, ids }: {
  open: boolean; count: number; onClose: () => void; onDeleted: () => void; ids: string[]
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await Promise.all(ids.map((id) => fetch(`/api/admin/users/${id}`, { method: "DELETE" })))
      onDeleted()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete {count} Users</DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            This will permanently delete {count} selected users. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleDelete} disabled={loading} style={{ background: "var(--error)", color: "white", borderRadius: "var(--radius-xs)" }}>
            {loading ? "Deleting…" : `Delete ${count} Users`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

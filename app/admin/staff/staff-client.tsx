"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, UserCircle, Loader2 } from "lucide-react"
import { DataTable, type ColumnDef, type ActionItem } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type StaffMember = {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string
  mobile: string
  address: string
  city: Record<string, string>
  department: Record<string, string>
  position: Record<string, string>
  bio: Record<string, string>
  image: string | null
  latitude: number | null
  longitude: number | null
  sortOrder: number
  status: string
  createdAt: string
  updatedAt: string
}

type UserOption = {
  id: string
  name: string
  email: string
  image: string | null
}

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    active:   { bg: "rgba(45,106,79,0.12)", color: "#2D6A4F" },
    inactive: { bg: "rgba(117,117,117,0.12)", color: "#626262" },
  }
  const s = styles[status] ?? styles.active
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const COLUMNS: ColumnDef<StaffMember>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        {row.image ? (
          <img src={row.image} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <UserCircle className="size-5 flex-shrink-0" style={{ color: "var(--secondary)" }} />
        )}
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: "department",
    header: "Department",
    sortable: false,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.department?.en || "—"}</span>,
  },
  {
    key: "position",
    header: "Position",
    sortable: false,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.position?.en || "—"}</span>,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.email || "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (row) => statusBadge(row.status),
  },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    cell: (row) => {
      const d = new Date(row.updatedAt)
      return <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`}</span>
    },
  },
]

interface Props {
  initialData: { staff: StaffMember[]; total: number }
  users: UserOption[]
}

export function StaffClient({ initialData, users }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createUserId, setCreateUserId] = useState("")
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async (p: number, ps: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(ps), search: q })
      const res = await fetch(`/api/admin/staff?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData({ staff: json.staff, total: json.total })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          userId: createUserId || null,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setCreateOpen(false)
        setCreateName("")
        setCreateEmail("")
        setCreateUserId("")
        router.push(`/admin/staff/${json.member.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteTarget(null)
        fetchData(page, pageSize, search)
      }
    } finally {
      setDeleting(false)
    }
  }

  function getRowActions(row: StaffMember): ActionItem[] {
    return [
      {
        label: "Edit",
        icon: <Pencil className="size-3" />,
        onClick: () => router.push(`/admin/staff/${row.id}`),
      },
      {
        label: "Delete",
        icon: <Trash2 className="size-3" />,
        onClick: () => setDeleteTarget(row),
        variant: "destructive" as const,
      },
    ]
  }

  return (
    <>
      <DataTable<StaffMember>
        tableKey="admin-staff"
        columns={COLUMNS}
        data={data.staff}
        isLoading={loading}
        pagination={{ page, pageSize, total: data.total }}
        onPageChange={(p) => { setPage(p); fetchData(p, pageSize, search) }}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); fetchData(1, ps, search) }}
        onSearchChange={(q) => { setSearch(q); setPage(1); fetchData(1, pageSize, q) }}
        onSortChange={() => {}}
        rowActions={getRowActions}
        searchPlaceholder="Search staff…"
        toolbar={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 gap-1.5 text-xs" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
            <Plus className="size-3.5" /> New Staff Member
          </Button>
        }
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>New Staff Member</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>Add a new team member</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Name *</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Full name"
                className="h-8 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Email</Label>
              <Input
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="Email address"
                className="h-8 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Link to User Account</Label>
              <Select value={createUserId || "none"} onValueChange={(v) => {
                const uid = v === "none" ? "" : v
                setCreateUserId(uid)
                if (uid) {
                  const user = users.find((u) => u.id === uid)
                  if (user) {
                    setCreateName(user.name || createName)
                    setCreateEmail(user.email || createEmail)
                  }
                }
              }}>
                <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                  <SelectValue placeholder="No linked account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked account</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={creating || !createName.trim()} className="h-8 text-xs" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
              {creating ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Create & Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>Delete Staff Member</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-8 text-xs" style={{ borderColor: "var(--outline-variant)" }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleDelete} disabled={deleting} className="h-8 text-xs" style={{ background: "var(--error)", color: "white" }}>
              {deleting ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

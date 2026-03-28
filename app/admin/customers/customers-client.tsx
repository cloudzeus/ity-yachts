"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Search, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Customer = {
  id: string
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile: string
  nationality: string
  passportNumber: string
  passportExpiry: string | null
  dateOfBirth: string | null
  address: string
  city: string
  country: string
  postcode: string
  sailingExperience: string
  certifications: string[]
  emergencyName: string
  emergencyPhone: string
  notes: string | null
  _count: { bookings: number }
  createdAt: string
  updatedAt: string
}

const experienceBadge = (exp: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    NONE:         { bg: "rgba(117,117,117,0.12)", color: "#626262" },
    BEGINNER:     { bg: "rgba(33,150,243,0.12)",  color: "#1976D2" },
    INTERMEDIATE: { bg: "rgba(76,175,80,0.12)",   color: "#388E3C" },
    ADVANCED:     { bg: "rgba(255,152,0,0.12)",   color: "#F57C00" },
    PROFESSIONAL: { bg: "rgba(156,39,176,0.12)",  color: "#7B1FA2" },
  }
  const s = styles[exp] ?? styles.NONE
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {exp || "\u2014"}
    </span>
  )
}

interface Props {
  initialData: { customers: Customer[]; total: number }
}

export function CustomersClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.customers)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newNationality, setNewNationality] = useState("")
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "50", search: searchQuery })
      const res = await fetch(`/api/admin/customers?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.customers ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchData(val), 300)
  }

  async function handleCreate() {
    if (!newFirstName || !newLastName || !newEmail) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          phone: newPhone,
          nationality: newNationality,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/customers/${json.customer.id}`)
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
    setNewFirstName("")
    setNewLastName("")
    setNewEmail("")
    setNewPhone("")
    setNewNationality("")
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((c) => c.id !== id))
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
          New Customer
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Nationality</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Experience</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Bookings</th>
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
                    No customers found
                  </td>
                </tr>
              ) : (
                data.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                    style={{ borderBottom: "1px solid var(--outline-variant)" }}
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                        {customer.firstName} {customer.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{customer.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{customer.phone || "\u2014"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{customer.nationality || "\u2014"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {experienceBadge(customer.sailingExperience)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                        {customer._count.bookings}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer.id}`)}>
                            <Pencil className="size-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(customer.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {data.length} of {total} customers
      </p>

      {/* Create Customer Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Customer</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Add a new customer to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>First Name *</Label>
                <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="John" autoFocus className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Last Name *</Label>
                <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Doe" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Email *</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" type="email" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Phone</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+30 ..." className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Nationality</Label>
                <Input value={newNationality} onChange={(e) => setNewNationality(e.target.value)} placeholder="e.g. British" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newFirstName || !newLastName || !newEmail} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating\u2026" : "Create Customer"}
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
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Customer</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this customer. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting\u2026" : "Delete Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, MoreHorizontal } from "lucide-react"
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

type Enquiry = {
  id: string
  customerId: string | null
  assignedStaffId: string | null
  status: string
  dateFrom: string | null
  dateTo: string | null
  guests: number | null
  preferredCategory: string | null
  preferredLength: string | null
  budget: number | null
  currency: string
  baseFrom: string | null
  baseTo: string | null
  notes: string | null
  source: string
  bookingId: string | null
  createdAt: string
  updatedAt: string
  customer: { firstName: string; lastName: string; email: string } | null
  assignedStaff: { name: string } | null
}

const STATUSES = ["ALL", "NEW", "CONTACTED", "QUOTED", "CONVERTED", "LOST"] as const

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    NEW:       { bg: "rgba(33,150,243,0.12)",  color: "#1976D2" },
    CONTACTED: { bg: "rgba(255,152,0,0.12)",   color: "#F57C00" },
    QUOTED:    { bg: "rgba(156,39,176,0.12)",   color: "#7B1FA2" },
    CONVERTED: { bg: "rgba(45,106,79,0.12)",   color: "#2D6A4F" },
    LOST:      { bg: "rgba(117,117,117,0.12)",  color: "#626262" },
  }
  const s = styles[status] ?? styles.NEW
  return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>{status}</span>
}

const sourceBadge = (source: string) => {
  if (!source) return <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{"\u2014"}</span>
  return <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{source}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return "\u2014"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

function formatBudget(budget: number | null, currency: string) {
  if (budget == null) return "\u2014"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(budget)
}

interface Props {
  initialData: { enquiries: Enquiry[]; total: number }
}

export function EnquiriesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.enquiries)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newSource, setNewSource] = useState("WEBSITE")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async (searchQuery: string, status: string) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "50", search: searchQuery })
      if (status && status !== "ALL") qs.set("status", status)
      const res = await fetch(`/api/admin/enquiries?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.enquiries ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchData(val, statusFilter), 300)
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status)
    fetchData(search, status)
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const body: Record<string, unknown> = { source: newSource }
      // If inline customer fields provided, create customer first or just pass info
      // For simplicity, create enquiry with optional customer search
      if (newFirstName && newLastName && newEmail) {
        // Create customer first, then link
        const custRes = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: newFirstName, lastName: newLastName, email: newEmail }),
        })
        if (custRes.ok) {
          const custJson = await custRes.json()
          body.customerId = custJson.customer.id
        }
      }
      const res = await fetch("/api/admin/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/enquiries/${json.enquiry.id}`)
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
    setNewSource("WEBSITE")
    setNewFirstName("")
    setNewLastName("")
    setNewEmail("")
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((e) => e.id !== id))
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
            placeholder="Search by customer name or email..."
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
          New Enquiry
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            style={{
              background: statusFilter === s ? "var(--primary)" : "transparent",
              color: statusFilter === s ? "var(--on-primary)" : "var(--on-surface-variant)",
              border: statusFilter === s ? "none" : "1px solid var(--outline-variant)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Guests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Staff</th>
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
                    No enquiries found
                  </td>
                </tr>
              ) : (
                data.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                    style={{ borderBottom: "1px solid var(--outline-variant)" }}
                    onClick={() => router.push(`/admin/enquiries/${enquiry.id}`)}
                  >
                    <td className="px-4 py-3">
                      {enquiry.customer ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                            {enquiry.customer.firstName} {enquiry.customer.lastName}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                            {enquiry.customer.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{"\u2014"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {formatDate(enquiry.dateFrom)} {enquiry.dateFrom && enquiry.dateTo ? "\u2013" : ""} {formatDate(enquiry.dateTo)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {enquiry.guests ?? "\u2014"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {enquiry.preferredCategory || "\u2014"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                        {formatBudget(enquiry.budget, enquiry.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sourceBadge(enquiry.source)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {enquiry.assignedStaff?.name || "\u2014"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(enquiry.status)}
                    </td>
                    <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => router.push(`/admin/enquiries/${enquiry.id}`)}>
                            <Pencil className="size-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(enquiry.id)} className="text-destructive focus:text-destructive">
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
        Showing {data.length} of {total} enquiries
      </p>

      {/* Create Enquiry Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Enquiry</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new charter enquiry. You can add details after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Source *</Label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="h-7 text-xs rounded-md border px-2"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
              >
                <option value="WEBSITE">Website</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="REFERRAL">Referral</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="pt-2 pb-1">
              <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>Customer (optional)</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
                Leave blank to create without a customer, or enter details to create and link a new customer.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>First Name</Label>
                <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="John" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Last Name</Label>
                <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Doe" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Email</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" type="email" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating\u2026" : "Create Enquiry"}
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
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Enquiry</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this enquiry. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting\u2026" : "Delete Enquiry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

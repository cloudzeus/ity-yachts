"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Ship, Users } from "lucide-react"
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

type BookingListItem = {
  id: string
  bookingNumber: string
  customerId: string
  yachtId: number
  status: string
  dateFrom: string
  dateTo: string
  guests: number
  charterType: string
  totalPrice: number
  currency: string
  deposit: number
  createdAt: string
  customer: { firstName: string; lastName: string; email: string }
  yacht: { name: string; model: { name: string } | null }
}

type CustomerOption = { id: string; firstName: string; lastName: string; email: string }
type YachtOption = { id: number; name: string; model: { name: string } | null }

const STATUSES = ["ALL", "OPTION", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"] as const

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    OPTION:    { bg: "rgba(33,150,243,0.12)",  color: "#1976D2" },
    CONFIRMED: { bg: "rgba(255,152,0,0.12)",  color: "#F57C00" },
    PAID:      { bg: "rgba(45,106,79,0.12)",   color: "#2D6A4F" },
    COMPLETED: { bg: "rgba(76,175,80,0.12)",   color: "#388E3C" },
    CANCELLED: { bg: "rgba(244,67,54,0.12)",   color: "#D32F2F" },
  }
  const s = styles[status] ?? styles.OPTION
  return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>{status}</span>
}

const charterBadge = (type: string) => {
  const isCrewed = type === "CREWED"
  return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: isCrewed ? "rgba(156,39,176,0.12)" : "rgba(33,150,243,0.12)", color: isCrewed ? "#7B1FA2" : "#1976D2", borderRadius: "var(--radius-xs)" }}>{type}</span>
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount)
}

function formatDateRange(fromIso: string, toIso: string) {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  const fDay = from.getDate()
  const fMonth = from.toLocaleDateString("en-GB", { month: "short" })
  const tDay = to.getDate()
  const tMonth = to.toLocaleDateString("en-GB", { month: "short" })
  const tYear = to.getFullYear()
  return `${fDay} ${fMonth} \u2013 ${tDay} ${tMonth} ${tYear}`
}

interface Props {
  initialData: { bookings: BookingListItem[]; total: number }
}

export function BookingsClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.bookings)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageSize = 50

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCustomerId, setNewCustomerId] = useState("")
  const [newYachtId, setNewYachtId] = useState("")
  const [newDateFrom, setNewDateFrom] = useState("")
  const [newDateTo, setNewDateTo] = useState("")
  const [newGuests, setNewGuests] = useState("1")
  const [newCharterType, setNewCharterType] = useState("BAREBOAT")
  const [newBasePrice, setNewBasePrice] = useState("")
  const [newTotalPrice, setNewTotalPrice] = useState("")

  // Customer search for create dialog
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("")
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customerDropdownRef = useRef<HTMLDivElement>(null)

  // Yacht search for create dialog
  const [yachtSearch, setYachtSearch] = useState("")
  const [yachtOptions, setYachtOptions] = useState<YachtOption[]>([])
  const [showYachtDropdown, setShowYachtDropdown] = useState(false)
  const [selectedYachtLabel, setSelectedYachtLabel] = useState("")
  const yachtSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const yachtDropdownRef = useRef<HTMLDivElement>(null)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
      if (yachtDropdownRef.current && !yachtDropdownRef.current.contains(e.target as Node)) {
        setShowYachtDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchData = useCallback(async (searchQuery: string, status: string, pg: number) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(pg), pageSize: String(pageSize), search: searchQuery })
      if (status && status !== "ALL") qs.set("status", status)
      const res = await fetch(`/api/admin/bookings?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.bookings ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      fetchData(val, statusFilter, 1)
    }, 300)
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status)
    setPage(1)
    fetchData(search, status, 1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(search, statusFilter, newPage)
  }

  // Customer search for create dialog
  function handleCustomerSearchChange(val: string) {
    setCustomerSearch(val)
    setSelectedCustomerLabel("")
    setNewCustomerId("")
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    if (!val.trim()) {
      setCustomerOptions([])
      setShowCustomerDropdown(false)
      return
    }
    customerSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(val)}&pageSize=10`)
        if (!res.ok) return
        const json = await res.json()
        setCustomerOptions(json.customers ?? [])
        setShowCustomerDropdown(true)
      } catch { /* ignore */ }
    }, 300)
  }

  function selectCustomer(c: CustomerOption) {
    setNewCustomerId(c.id)
    setSelectedCustomerLabel(`${c.firstName} ${c.lastName}`)
    setCustomerSearch(`${c.firstName} ${c.lastName}`)
    setShowCustomerDropdown(false)
  }

  // Yacht search for create dialog
  function handleYachtSearchChange(val: string) {
    setYachtSearch(val)
    setSelectedYachtLabel("")
    setNewYachtId("")
    if (yachtSearchTimeout.current) clearTimeout(yachtSearchTimeout.current)
    if (!val.trim()) {
      setYachtOptions([])
      setShowYachtDropdown(false)
      return
    }
    yachtSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/fleet?search=${encodeURIComponent(val)}&pageSize=10`)
        if (!res.ok) return
        const json = await res.json()
        setYachtOptions(json.yachts ?? [])
        setShowYachtDropdown(true)
      } catch { /* ignore */ }
    }, 300)
  }

  function selectYacht(y: YachtOption) {
    setNewYachtId(String(y.id))
    setSelectedYachtLabel(y.name)
    setYachtSearch(y.name)
    setShowYachtDropdown(false)
  }

  function resetCreateForm() {
    setCreateOpen(false)
    setNewCustomerId("")
    setNewYachtId("")
    setNewDateFrom("")
    setNewDateTo("")
    setNewGuests("1")
    setNewCharterType("BAREBOAT")
    setNewBasePrice("")
    setNewTotalPrice("")
    setCustomerSearch("")
    setYachtSearch("")
    setSelectedCustomerLabel("")
    setSelectedYachtLabel("")
    setCustomerOptions([])
    setYachtOptions([])
  }

  async function handleCreate() {
    if (!newCustomerId || !newYachtId || !newDateFrom || !newDateTo || !newBasePrice || !newTotalPrice) {
      alert("Please fill in all required fields.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newCustomerId,
          yachtId: parseInt(newYachtId),
          dateFrom: newDateFrom,
          dateTo: newDateTo,
          guests: parseInt(newGuests),
          charterType: newCharterType,
          basePrice: parseFloat(newBasePrice),
          totalPrice: parseFloat(newTotalPrice),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/bookings/${json.booking.id}`)
      } else {
        const json = await res.json()
        alert(json.error || "Failed to create booking")
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((b) => b.id !== id))
        setTotal((prev) => prev - 1)
      }
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
          <Input
            placeholder="Search by booking # or customer..."
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
          New Booking
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
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Booking #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Yacht</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Guests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Total Price</th>
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
                    No bookings found
                  </td>
                </tr>
              ) : (
                data.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                    style={{ borderBottom: "1px solid var(--outline-variant)" }}
                    onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                        {booking.bookingNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                          {booking.customer.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                          {booking.yacht.name}
                        </span>
                        {booking.yacht.model && (
                          <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                            {booking.yacht.model.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {formatDateRange(booking.dateFrom, booking.dateTo)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        <Users className="size-3" />
                        {booking.guests}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {charterBadge(booking.charterType)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                        {formatPrice(booking.totalPrice, booking.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(booking.status)}
                    </td>
                    <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => router.push(`/admin/bookings/${booking.id}`)}>
                            <Pencil className="size-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(booking.id)} className="text-destructive focus:text-destructive">
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          Showing {data.length} of {total} bookings
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs px-2" style={{ color: "var(--on-surface-variant)" }}>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Booking</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new charter booking. You can add extras, services, and payments after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Customer search */}
            <div className="flex flex-col gap-1 relative" ref={customerDropdownRef}>
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Customer *</Label>
              <div className="relative">
                <Users className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "var(--on-surface-variant)" }} />
                <Input
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => { if (customerOptions.length > 0) setShowCustomerDropdown(true) }}
                  placeholder="Search customers..."
                  className="h-7 text-xs pl-7"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              {selectedCustomerLabel && (
                <p className="text-[11px]" style={{ color: "var(--primary)" }}>Selected: {selectedCustomerLabel}</p>
              )}
              {showCustomerDropdown && customerOptions.length > 0 && (
                <div
                  className="absolute top-[calc(100%+2px)] left-0 right-0 z-50 max-h-40 overflow-y-auto border rounded-md shadow-md"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                >
                  {customerOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-black/[0.04] transition-colors"
                      style={{ color: "var(--on-surface)" }}
                      onClick={() => selectCustomer(c)}
                    >
                      <span className="font-medium">{c.firstName} {c.lastName}</span>
                      <span className="ml-2" style={{ color: "var(--on-surface-variant)" }}>{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Yacht search */}
            <div className="flex flex-col gap-1 relative" ref={yachtDropdownRef}>
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Yacht *</Label>
              <div className="relative">
                <Ship className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "var(--on-surface-variant)" }} />
                <Input
                  value={yachtSearch}
                  onChange={(e) => handleYachtSearchChange(e.target.value)}
                  onFocus={() => { if (yachtOptions.length > 0) setShowYachtDropdown(true) }}
                  placeholder="Search yachts..."
                  className="h-7 text-xs pl-7"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              {selectedYachtLabel && (
                <p className="text-[11px]" style={{ color: "var(--primary)" }}>Selected: {selectedYachtLabel}</p>
              )}
              {showYachtDropdown && yachtOptions.length > 0 && (
                <div
                  className="absolute top-[calc(100%+2px)] left-0 right-0 z-50 max-h-40 overflow-y-auto border rounded-md shadow-md"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                >
                  {yachtOptions.map((y) => (
                    <button
                      key={y.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-black/[0.04] transition-colors"
                      style={{ color: "var(--on-surface)" }}
                      onClick={() => selectYacht(y)}
                    >
                      <span className="font-medium">{y.name}</span>
                      {y.model && <span className="ml-2" style={{ color: "var(--on-surface-variant)" }}>{y.model.name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Date From *</Label>
                <Input type="date" value={newDateFrom} onChange={(e) => setNewDateFrom(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Date To *</Label>
                <Input type="date" value={newDateTo} onChange={(e) => setNewDateTo(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            {/* Guests & Charter type */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Guests</Label>
                <Input type="number" min="1" value={newGuests} onChange={(e) => setNewGuests(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Charter Type</Label>
                <select
                  value={newCharterType}
                  onChange={(e) => setNewCharterType(e.target.value)}
                  className="h-7 text-xs rounded-md border px-2"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
                >
                  <option value="BAREBOAT">Bareboat</option>
                  <option value="CREWED">Crewed</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Base Price *</Label>
                <Input type="number" step="0.01" min="0" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} placeholder="0.00" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Total Price *</Label>
                <Input type="number" step="0.01" min="0" value={newTotalPrice} onChange={(e) => setNewTotalPrice(e.target.value)} placeholder="0.00" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating\u2026" : "Create Booking"}
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
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Booking</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this booking and all associated data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting\u2026" : "Delete Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

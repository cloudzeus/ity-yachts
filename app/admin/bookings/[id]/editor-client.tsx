"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  Plus,
  Trash2,
  Upload,
  FileText,
  Download,
  Clock,
  CreditCard,
  Package,
  Wrench,
  History,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface BookingYacht {
  id: number
  name: string
  model: { id: number; name: string } | null
  category: { id: number; name: any } | null
  builder: { id: number; name: string } | null
}

interface BookingExtra {
  id: string
  equipmentId: number
  equipmentName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
}

interface BookingService {
  id: string
  serviceId: number
  serviceName: string
  unitPrice: number
  totalPrice: number
  currency: string
  obligatory: boolean
}

interface BookingPayment {
  id: string
  type: string
  amount: number
  currency: string
  method: string
  status: string
  reference: string
  paidAt: string | null
  notes: string | null
  createdAt: string
}

interface BookingStatusHistoryEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  changedBy: string | null
  reason: string | null
  createdAt: string
}

interface BookingDocument {
  id: string
  name: string
  type: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

interface BookingData {
  id: string
  bookingNumber: string
  nausysReservationId: number | null
  customerId: string
  customer: BookingCustomer
  yachtId: number
  yacht: BookingYacht
  status: string
  dateFrom: string | null
  dateTo: string | null
  baseFromId: number | null
  baseToId: number | null
  guests: number
  charterType: string
  basePrice: number
  discountAmount: number
  discountPercent: number
  extrasTotal: number
  servicesTotal: number
  totalPrice: number
  currency: string
  commission: number
  deposit: number
  depositDueDate: string | null
  balanceDueDate: string | null
  optionExpiresAt: string | null
  internalNotes: string | null
  clientNotes: string | null
  extras: BookingExtra[]
  services: BookingService[]
  payments: BookingPayment[]
  statusHistory: BookingStatusHistoryEntry[]
  documents: BookingDocument[]
  createdAt: string | null
  updatedAt: string | null
}

interface BookingEditorClientProps {
  booking: BookingData
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="p-4" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function FieldWithInfo({ label, tooltip, children }: { label: string; tooltip: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3 cursor-help" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }} />
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs max-w-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
      {children}
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function toInputDate(iso: string | null): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "OPTION": return { bg: "rgba(117,117,117,0.1)", text: "#626262" }
    case "CONFIRMED": return { bg: "rgba(30,136,229,0.1)", text: "#1E88E5" }
    case "PAID": return { bg: "rgba(45,106,79,0.1)", text: "#2D6A4F" }
    case "COMPLETED": return { bg: "rgba(45,106,79,0.15)", text: "#1B5E20" }
    case "CANCELLED": return { bg: "rgba(211,47,47,0.1)", text: "#D32F2F" }
    default: return { bg: "rgba(117,117,117,0.1)", text: "#626262" }
  }
}

function paymentStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "PENDING": return { bg: "rgba(30,136,229,0.1)", text: "#1E88E5" }
    case "COMPLETED": return { bg: "rgba(45,106,79,0.1)", text: "#2D6A4F" }
    case "FAILED": return { bg: "rgba(211,47,47,0.1)", text: "#D32F2F" }
    case "REFUNDED": return { bg: "rgba(245,124,0,0.1)", text: "#F57C00" }
    default: return { bg: "rgba(117,117,117,0.1)", text: "#626262" }
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BookingEditorClient({ booking: initialBooking }: BookingEditorClientProps) {
  const router = useRouter()

  // Details state
  const [booking, setBooking] = useState(initialBooking)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tab state
  const TABS = ["Details", "Extras", "Services", "Payments", "Documents", "History"] as const
  type Tab = typeof TABS[number]
  const [activeTab, setActiveTab] = useState<Tab>("Details")

  // Extras state
  const [extras, setExtras] = useState(initialBooking.extras)
  const [showAddExtra, setShowAddExtra] = useState(false)
  const [newExtra, setNewExtra] = useState({ equipmentName: "", quantity: 1, unitPrice: 0 })
  const [addingExtra, setAddingExtra] = useState(false)

  // Services state
  const [services, setServices] = useState(initialBooking.services)
  const [showAddService, setShowAddService] = useState(false)
  const [newService, setNewService] = useState({ serviceName: "", unitPrice: 0, obligatory: false })
  const [addingService, setAddingService] = useState(false)

  // Payments state
  const [payments, setPayments] = useState(initialBooking.payments)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ type: "DEPOSIT", amount: 0, currency: "EUR", method: "BANK_TRANSFER", reference: "", paidAt: "", notes: "" })
  const [addingPayment, setAddingPayment] = useState(false)

  // Documents state
  const [documents, setDocuments] = useState(initialBooking.documents)
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocType, setNewDocType] = useState("OTHER")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // History state (read-only)
  const [statusHistory] = useState(initialBooking.statusHistory)

  // ---------------------------------------------------------------------------
  // Auto-save (Details tab only)
  // ---------------------------------------------------------------------------

  const autoSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: booking.status,
          dateFrom: booking.dateFrom,
          dateTo: booking.dateTo,
          guests: booking.guests,
          charterType: booking.charterType,
          baseFromId: booking.baseFromId,
          baseToId: booking.baseToId,
          basePrice: booking.basePrice,
          discountPercent: booking.discountPercent,
          discountAmount: booking.discountAmount,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          commission: booking.commission,
          deposit: booking.deposit,
          depositDueDate: booking.depositDueDate,
          balanceDueDate: booking.balanceDueDate,
          optionExpiresAt: booking.optionExpiresAt,
          internalNotes: booking.internalNotes,
          clientNotes: booking.clientNotes,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLastSaved(new Date())
        if (updated.extrasTotal !== undefined) {
          setBooking((prev) => ({ ...prev, extrasTotal: updated.extrasTotal, servicesTotal: updated.servicesTotal }))
        }
      }
    } catch (err) {
      console.error("[autoSave]", err)
    } finally {
      setSaving(false)
    }
  }, [booking])

  // Debounced auto-save when details change
  useEffect(() => {
    if (activeTab !== "Details") return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      autoSave()
    }, 1500)
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [
    booking.status, booking.dateFrom, booking.dateTo, booking.guests, booking.charterType,
    booking.baseFromId, booking.baseToId, booking.basePrice, booking.discountPercent,
    booking.discountAmount, booking.totalPrice, booking.currency, booking.commission,
    booking.deposit, booking.depositDueDate, booking.balanceDueDate, booking.optionExpiresAt,
    booking.internalNotes, booking.clientNotes, activeTab, autoSave,
  ])

  // ---------------------------------------------------------------------------
  // Extras actions
  // ---------------------------------------------------------------------------

  async function addExtra() {
    setAddingExtra(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExtra),
      })
      if (res.ok) {
        const added = await res.json()
        setExtras((prev) => [...prev, added])
        setShowAddExtra(false)
        setNewExtra({ equipmentName: "", quantity: 1, unitPrice: 0 })
      }
    } catch (err) {
      console.error("[addExtra]", err)
    } finally {
      setAddingExtra(false)
    }
  }

  async function removeExtra(extraId: string) {
    try {
      await fetch(`/api/admin/bookings/${booking.id}/extras`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraId }),
      })
      setExtras((prev) => prev.filter((e) => e.id !== extraId))
    } catch (err) {
      console.error("[removeExtra]", err)
    }
  }

  // ---------------------------------------------------------------------------
  // Services actions
  // ---------------------------------------------------------------------------

  async function addService() {
    setAddingService(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      })
      if (res.ok) {
        const added = await res.json()
        setServices((prev) => [...prev, added])
        setShowAddService(false)
        setNewService({ serviceName: "", unitPrice: 0, obligatory: false })
      }
    } catch (err) {
      console.error("[addService]", err)
    } finally {
      setAddingService(false)
    }
  }

  async function removeService(serviceId: string) {
    try {
      await fetch(`/api/admin/bookings/${booking.id}/services`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      })
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
    } catch (err) {
      console.error("[removeService]", err)
    }
  }

  // ---------------------------------------------------------------------------
  // Payments actions
  // ---------------------------------------------------------------------------

  async function addPayment() {
    setAddingPayment(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPayment,
          paidAt: newPayment.paidAt || null,
        }),
      })
      if (res.ok) {
        const added = await res.json()
        setPayments((prev) => [added, ...prev])
        setShowAddPayment(false)
        setNewPayment({ type: "DEPOSIT", amount: 0, currency: "EUR", method: "BANK_TRANSFER", reference: "", paidAt: "", notes: "" })
      }
    } catch (err) {
      console.error("[addPayment]", err)
    } finally {
      setAddingPayment(false)
    }
  }

  async function removePayment(paymentId: string) {
    try {
      await fetch(`/api/admin/bookings/${booking.id}/payments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch (err) {
      console.error("[removePayment]", err)
    }
  }

  // ---------------------------------------------------------------------------
  // Documents actions
  // ---------------------------------------------------------------------------

  async function uploadDocument() {
    if (!docFile || !newDocName) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append("file", docFile)
      formData.append("folder", "bookings")
      const uploadRes = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) return
      const uploaded = await uploadRes.json()

      const res = await fetch(`/api/admin/bookings/${booking.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName,
          type: newDocType,
          url: uploaded.url,
          mimeType: docFile.type,
          size: docFile.size,
        }),
      })
      if (res.ok) {
        const added = await res.json()
        setDocuments((prev) => [...prev, added])
        setShowAddDocument(false)
        setNewDocName("")
        setNewDocType("OTHER")
        setDocFile(null)
      }
    } catch (err) {
      console.error("[uploadDocument]", err)
    } finally {
      setUploadingDoc(false)
    }
  }

  async function removeDocument(docId: string) {
    try {
      await fetch(`/api/admin/bookings/${booking.id}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      console.error("[removeDocument]", err)
    }
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const extrasTotal = extras.reduce((sum, e) => sum + e.totalPrice, 0)
  const servicesTotal = services.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalPaid = payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0)
  const totalRemaining = booking.totalPrice - totalPaid

  const sc = statusColor(booking.status)

  const inputStyle = { background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-4 border-b"
          style={{ borderColor: "var(--outline-variant)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href="/admin/bookings">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Bookings</span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>/</span>
            <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{booking.bookingNumber}</span>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: sc.bg, color: sc.text }}
            >
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Saved</span>}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => autoSave()}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 text-xs font-medium transition-colors relative"
                style={{
                  color: activeTab === tab ? "var(--primary)" : "var(--on-surface-variant)",
                  ...(activeTab === tab && { borderBottom: "2px solid var(--primary)" }),
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--surface-container-lowest)" }}>
          {activeTab === "Details" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Main column (2/3) */}
              <div className="col-span-2 flex flex-col gap-4">
                {/* Charter Details */}
                <SectionCard title="Charter Details">
                  <div className="grid grid-cols-2 gap-3">
                    <FieldWithInfo label="Date From" tooltip="Charter start date. Check-in time is defined by the base">
                      <Input
                        type="date"
                        value={toInputDate(booking.dateFrom)}
                        onChange={(e) => setBooking({ ...booking, dateFrom: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Date To" tooltip="Charter end date. Check-out time is defined by the base">
                      <Input
                        type="date"
                        value={toInputDate(booking.dateTo)}
                        onChange={(e) => setBooking({ ...booking, dateTo: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Guests" tooltip="Total guests on board, must not exceed yacht's maxPersons">
                      <Input
                        type="number"
                        value={booking.guests}
                        onChange={(e) => setBooking({ ...booking, guests: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Charter Type" tooltip="BAREBOAT requires valid sailing certifications. CREWED includes professional crew">
                      <Select value={booking.charterType} onValueChange={(v) => setBooking({ ...booking, charterType: v })}>
                        <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BAREBOAT">Bareboat</SelectItem>
                          <SelectItem value="CREWED">Crewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWithInfo>
                    <FieldLabel label="Base From ID">
                      <Input
                        type="number"
                        value={booking.baseFromId ?? ""}
                        onChange={(e) => setBooking({ ...booking, baseFromId: e.target.value ? parseInt(e.target.value) : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Base To ID">
                      <Input
                        type="number"
                        value={booking.baseToId ?? ""}
                        onChange={(e) => setBooking({ ...booking, baseToId: e.target.value ? parseInt(e.target.value) : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                  </div>
                </SectionCard>

                {/* Pricing */}
                <SectionCard title="Pricing">
                  <div className="grid grid-cols-3 gap-3">
                    <FieldWithInfo label="Base Price" tooltip="Yacht charter price for the period before discounts">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.basePrice}
                        onChange={(e) => setBooking({ ...booking, basePrice: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Discount %" tooltip="Discount percentage applied to base price">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.discountPercent}
                        onChange={(e) => setBooking({ ...booking, discountPercent: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Discount Amount" tooltip="Fixed discount amount. Applied after percentage discount">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.discountAmount}
                        onChange={(e) => setBooking({ ...booking, discountAmount: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldLabel label="Extras Total">
                      <Input
                        type="number"
                        value={extrasTotal}
                        readOnly
                        className="h-8 text-xs"
                        style={{ ...inputStyle, opacity: 0.7 }}
                      />
                    </FieldLabel>
                    <FieldLabel label="Services Total">
                      <Input
                        type="number"
                        value={servicesTotal}
                        readOnly
                        className="h-8 text-xs"
                        style={{ ...inputStyle, opacity: 0.7 }}
                      />
                    </FieldLabel>
                    <FieldLabel label="Total Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.totalPrice}
                        onChange={(e) => setBooking({ ...booking, totalPrice: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Currency">
                      <Select value={booking.currency} onValueChange={(v) => setBooking({ ...booking, currency: v })}>
                        <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldLabel>
                    <FieldWithInfo label="Commission" tooltip="Agency commission amount for this booking">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.commission}
                        onChange={(e) => setBooking({ ...booking, commission: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Deposit" tooltip="Required deposit amount, typically 50% of total">
                      <Input
                        type="number"
                        step="0.01"
                        value={booking.deposit}
                        onChange={(e) => setBooking({ ...booking, deposit: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                  </div>
                </SectionCard>
              </div>

              {/* Sidebar (1/3) */}
              <div className="flex flex-col gap-4">
                {/* Status */}
                <SectionCard title="Status">
                  <Select value={booking.status} onValueChange={(v) => setBooking({ ...booking, status: v })}>
                    <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: statusColor(booking.status).text }} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {["OPTION", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"].map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full" style={{ background: statusColor(s).text }} />
                            {s}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SectionCard>

                {/* Customer */}
                <SectionCard title="Customer">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/customers/${booking.customer.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                      {booking.customer.firstName} {booking.customer.lastName}
                    </Link>
                    <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{booking.customer.email}</span>
                  </div>
                </SectionCard>

                {/* Yacht */}
                <SectionCard title="Yacht">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/fleet/${booking.yacht.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                      {booking.yacht.name}
                    </Link>
                    {booking.yacht.model && (
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{booking.yacht.model.name}</span>
                    )}
                  </div>
                </SectionCard>

                {/* Key Dates */}
                <SectionCard title="Key Dates">
                  <div className="flex flex-col gap-3">
                    <FieldWithInfo label="Deposit Due" tooltip="Deposit must be received by this date to secure the booking">
                      <Input
                        type="date"
                        value={toInputDate(booking.depositDueDate)}
                        onChange={(e) => setBooking({ ...booking, depositDueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Balance Due" tooltip="Remaining balance due date, typically 6-8 weeks before charter">
                      <Input
                        type="date"
                        value={toInputDate(booking.balanceDueDate)}
                        onChange={(e) => setBooking({ ...booking, balanceDueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                    <FieldWithInfo label="Option Expires" tooltip="Date when the option hold expires and yacht is released">
                      <Input
                        type="date"
                        value={toInputDate(booking.optionExpiresAt)}
                        onChange={(e) => setBooking({ ...booking, optionExpiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldWithInfo>
                  </div>
                </SectionCard>

                {/* Notes */}
                <SectionCard title="Notes">
                  <div className="flex flex-col gap-3">
                    <FieldLabel label="Internal Notes">
                      <Textarea
                        value={booking.internalNotes ?? ""}
                        onChange={(e) => setBooking({ ...booking, internalNotes: e.target.value })}
                        placeholder="Internal notes (not visible to customer)"
                        rows={3}
                        className="text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Client Notes">
                      <Textarea
                        value={booking.clientNotes ?? ""}
                        onChange={(e) => setBooking({ ...booking, clientNotes: e.target.value })}
                        placeholder="Notes visible to the customer"
                        rows={3}
                        className="text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                  </div>
                </SectionCard>

                {/* Details */}
                <SectionCard title="Details">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Created</span>
                      <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatDateTime(booking.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Updated</span>
                      <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatDateTime(booking.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>ID</span>
                      <span className="text-xs font-mono" style={{ color: "var(--on-surface)" }}>{booking.id}</span>
                    </div>
                    <FieldWithInfo label="NAUSYS Reservation ID" tooltip="Linked NAUSYS reservation ID for sync. Set automatically when booking is pushed to NAUSYS">
                      <span className="text-xs font-mono" style={{ color: "var(--on-surface)" }}>
                        {booking.nausysReservationId ?? "-"}
                      </span>
                    </FieldWithInfo>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Extras Tab */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "Extras" && (
            <div className="flex flex-col gap-4">
              <SectionCard
                title="Booking Extras"
                action={
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddExtra(true)}>
                    <Plus className="size-3" />
                    Add Extra
                  </Button>
                }
              >
                {extras.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>No extras added</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Equipment Name</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Qty</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Unit Price</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Total</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {extras.map((extra) => (
                          <tr key={extra.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                            <td className="py-2 px-2" style={{ color: "var(--on-surface)" }}>
                              <div className="flex items-center gap-2">
                                <Package className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                                {extra.equipmentName}
                              </div>
                            </td>
                            <td className="text-right py-2 px-2" style={{ color: "var(--on-surface)" }}>{extra.quantity}</td>
                            <td className="text-right py-2 px-2" style={{ color: "var(--on-surface)" }}>{extra.unitPrice.toFixed(2)} {extra.currency}</td>
                            <td className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface)" }}>{extra.totalPrice.toFixed(2)} {extra.currency}</td>
                            <td className="text-right py-2 px-2">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeExtra(extra.id)}>
                                <Trash2 className="size-3" style={{ color: "#D32F2F" }} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {extras.length > 0 && (
                  <div className="flex justify-end pt-3 mt-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>
                      Extras Total: {extrasTotal.toFixed(2)} {booking.currency}
                    </span>
                  </div>
                )}
              </SectionCard>

              {/* Add Extra Dialog */}
              <Dialog open={showAddExtra} onOpenChange={setShowAddExtra}>
                <DialogContent style={{ background: "var(--surface-container-lowest)" }}>
                  <DialogHeader>
                    <DialogTitle className="text-sm">Add Extra</DialogTitle>
                    <DialogDescription className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Add extra equipment to this booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <FieldLabel label="Equipment Name">
                      <Input
                        value={newExtra.equipmentName}
                        onChange={(e) => setNewExtra({ ...newExtra, equipmentName: e.target.value })}
                        placeholder="e.g. Outboard motor"
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldLabel label="Quantity">
                        <Input
                          type="number"
                          value={newExtra.quantity}
                          onChange={(e) => setNewExtra({ ...newExtra, quantity: parseInt(e.target.value) || 1 })}
                          className="h-8 text-xs"
                          style={inputStyle}
                        />
                      </FieldLabel>
                      <FieldLabel label="Unit Price">
                        <Input
                          type="number"
                          step="0.01"
                          value={newExtra.unitPrice}
                          onChange={(e) => setNewExtra({ ...newExtra, unitPrice: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs"
                          style={inputStyle}
                        />
                      </FieldLabel>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAddExtra(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs text-white"
                      style={{ background: "var(--gradient-ocean)" }}
                      onClick={addExtra}
                      disabled={addingExtra || !newExtra.equipmentName}
                    >
                      {addingExtra ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Services Tab */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "Services" && (
            <div className="flex flex-col gap-4">
              <SectionCard
                title="Booking Services"
                action={
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddService(true)}>
                    <Plus className="size-3" />
                    Add Service
                  </Button>
                }
              >
                {services.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>No services added</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Service Name</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Price</th>
                          <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Obligatory</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((svc) => (
                          <tr key={svc.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                            <td className="py-2 px-2" style={{ color: "var(--on-surface)" }}>
                              <div className="flex items-center gap-2">
                                <Wrench className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                                {svc.serviceName}
                              </div>
                            </td>
                            <td className="text-right py-2 px-2" style={{ color: "var(--on-surface)" }}>{svc.totalPrice.toFixed(2)} {svc.currency}</td>
                            <td className="text-center py-2 px-2">
                              {svc.obligatory ? (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,124,0,0.1)", color: "#F57C00" }}>Required</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(117,117,117,0.1)", color: "#626262" }}>Optional</span>
                              )}
                            </td>
                            <td className="text-right py-2 px-2">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeService(svc.id)}>
                                <Trash2 className="size-3" style={{ color: "#D32F2F" }} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {services.length > 0 && (
                  <div className="flex justify-end pt-3 mt-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>
                      Services Total: {servicesTotal.toFixed(2)} {booking.currency}
                    </span>
                  </div>
                )}
              </SectionCard>

              {/* Add Service Dialog */}
              <Dialog open={showAddService} onOpenChange={setShowAddService}>
                <DialogContent style={{ background: "var(--surface-container-lowest)" }}>
                  <DialogHeader>
                    <DialogTitle className="text-sm">Add Service</DialogTitle>
                    <DialogDescription className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Add a service to this booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <FieldLabel label="Service Name">
                      <Input
                        value={newService.serviceName}
                        onChange={(e) => setNewService({ ...newService, serviceName: e.target.value })}
                        placeholder="e.g. Skipper service"
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={newService.unitPrice}
                        onChange={(e) => setNewService({ ...newService, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={newService.obligatory}
                        onCheckedChange={(checked) => setNewService({ ...newService, obligatory: checked === true })}
                      />
                      <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Obligatory service</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAddService(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs text-white"
                      style={{ background: "var(--gradient-ocean)" }}
                      onClick={addService}
                      disabled={addingService || !newService.serviceName}
                    >
                      {addingService ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Payments Tab */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "Payments" && (
            <div className="flex flex-col gap-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--on-surface-variant)" }}>Total Price</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{booking.totalPrice.toFixed(2)} {booking.currency}</p>
                </div>
                <div className="p-3 rounded" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--on-surface-variant)" }}>Total Paid</p>
                  <p className="text-sm font-semibold" style={{ color: "#2D6A4F" }}>{totalPaid.toFixed(2)} {booking.currency}</p>
                </div>
                <div className="p-3 rounded" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--on-surface-variant)" }}>Remaining</p>
                  <p className="text-sm font-semibold" style={{ color: totalRemaining > 0 ? "#D32F2F" : "#2D6A4F" }}>{totalRemaining.toFixed(2)} {booking.currency}</p>
                </div>
              </div>

              <SectionCard
                title="Payment Records"
                action={
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddPayment(true)}>
                    <Plus className="size-3" />
                    Record Payment
                  </Button>
                }
              >
                {payments.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>No payments recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Type</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Amount</th>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Method</th>
                          <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Status</th>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Reference</th>
                          <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}>Date</th>
                          <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface-variant)" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => {
                          const psc = paymentStatusColor(payment.status)
                          return (
                            <tr key={payment.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                              <td className="py-2 px-2" style={{ color: "var(--on-surface)" }}>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                                  {payment.type}
                                </div>
                              </td>
                              <td className="text-right py-2 px-2 font-medium" style={{ color: "var(--on-surface)" }}>{payment.amount.toFixed(2)} {payment.currency}</td>
                              <td className="py-2 px-2" style={{ color: "var(--on-surface)" }}>{payment.method.replace(/_/g, " ")}</td>
                              <td className="text-center py-2 px-2">
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: psc.bg, color: psc.text }}>{payment.status}</span>
                              </td>
                              <td className="py-2 px-2 font-mono" style={{ color: "var(--on-surface)" }}>{payment.reference || "-"}</td>
                              <td className="py-2 px-2" style={{ color: "var(--on-surface)" }}>{formatDate(payment.paidAt || payment.createdAt)}</td>
                              <td className="text-right py-2 px-2">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removePayment(payment.id)}>
                                  <Trash2 className="size-3" style={{ color: "#D32F2F" }} />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {/* Add Payment Dialog */}
              <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                <DialogContent style={{ background: "var(--surface-container-lowest)" }}>
                  <DialogHeader>
                    <DialogTitle className="text-sm">Record Payment</DialogTitle>
                    <DialogDescription className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Record a new payment for this booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldLabel label="Type">
                        <Select value={newPayment.type} onValueChange={(v) => setNewPayment({ ...newPayment, type: v })}>
                          <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEPOSIT">Deposit</SelectItem>
                            <SelectItem value="INSTALLMENT">Installment</SelectItem>
                            <SelectItem value="BALANCE">Balance</SelectItem>
                            <SelectItem value="REFUND">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldLabel>
                      <FieldLabel label="Amount">
                        <Input
                          type="number"
                          step="0.01"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs"
                          style={inputStyle}
                        />
                      </FieldLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldLabel label="Currency">
                        <Select value={newPayment.currency} onValueChange={(v) => setNewPayment({ ...newPayment, currency: v })}>
                          <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldLabel>
                      <FieldLabel label="Method">
                        <Select value={newPayment.method} onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}>
                          <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="PAYPAL">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldLabel>
                    </div>
                    <FieldLabel label="Reference">
                      <Input
                        value={newPayment.reference}
                        onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                        placeholder="Transaction ID / Bank reference"
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Paid At">
                      <Input
                        type="date"
                        value={newPayment.paidAt}
                        onChange={(e) => setNewPayment({ ...newPayment, paidAt: e.target.value })}
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Notes">
                      <Textarea
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                        placeholder="Payment notes"
                        rows={2}
                        className="text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAddPayment(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs text-white"
                      style={{ background: "var(--gradient-ocean)" }}
                      onClick={addPayment}
                      disabled={addingPayment || newPayment.amount <= 0}
                    >
                      {addingPayment ? <Loader2 className="size-3 animate-spin" /> : <CreditCard className="size-3" />}
                      Record
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Documents Tab */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "Documents" && (
            <div className="flex flex-col gap-4">
              <SectionCard
                title="Documents"
                action={
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddDocument(true)}>
                    <Upload className="size-3" />
                    Upload Document
                  </Button>
                }
              >
                {documents.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>No documents uploaded</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded"
                        style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="size-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-medium truncate" style={{ color: "var(--on-surface)" }}>{doc.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(30,136,229,0.1)", color: "#1E88E5" }}>
                                {doc.type || "OTHER"}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                                {formatDate(doc.createdAt)}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                                {(doc.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Download className="size-3" style={{ color: "var(--primary)" }} />
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeDocument(doc.id)}>
                            <Trash2 className="size-3" style={{ color: "#D32F2F" }} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Upload Document Dialog */}
              <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
                <DialogContent style={{ background: "var(--surface-container-lowest)" }}>
                  <DialogHeader>
                    <DialogTitle className="text-sm">Upload Document</DialogTitle>
                    <DialogDescription className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Upload a document for this booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <FieldLabel label="Document Name">
                      <Input
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="e.g. Charter Agreement"
                        className="h-8 text-xs"
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label="Document Type">
                      <Select value={newDocType} onValueChange={(v) => setNewDocType(v)}>
                        <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHARTER_AGREEMENT">Charter Agreement</SelectItem>
                          <SelectItem value="INVOICE">Invoice</SelectItem>
                          <SelectItem value="CREW_LIST">Crew List</SelectItem>
                          <SelectItem value="RECEIPT">Receipt</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldLabel>
                    <FieldLabel label="File">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                          className="h-8 text-xs flex-1"
                          style={inputStyle}
                        />
                      </div>
                    </FieldLabel>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAddDocument(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs text-white"
                      style={{ background: "var(--gradient-ocean)" }}
                      onClick={uploadDocument}
                      disabled={uploadingDoc || !docFile || !newDocName}
                    >
                      {uploadingDoc ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                      Upload
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* History Tab */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "History" && (
            <div className="flex flex-col gap-4">
              <SectionCard title="Status History">
                {statusHistory.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>No status changes recorded</p>
                ) : (
                  <div className="relative pl-6">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[9px] top-2 bottom-2 w-px"
                      style={{ background: "var(--outline-variant)" }}
                    />
                    <div className="flex flex-col gap-4">
                      {statusHistory.map((entry, idx) => {
                        const toColor = statusColor(entry.toStatus)
                        return (
                          <div key={entry.id} className="relative flex gap-3">
                            {/* Dot */}
                            <div
                              className="absolute -left-6 top-1 size-[10px] rounded-full border-2 z-10"
                              style={{
                                borderColor: toColor.text,
                                background: idx === 0 ? toColor.text : "var(--surface-container-lowest)",
                              }}
                            />
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center gap-2">
                                {entry.fromStatus && (
                                  <>
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ background: statusColor(entry.fromStatus).bg, color: statusColor(entry.fromStatus).text }}
                                    >
                                      {entry.fromStatus}
                                    </span>
                                    <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>→</span>
                                  </>
                                )}
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                                  style={{ background: toColor.bg, color: toColor.text }}
                                >
                                  {entry.toStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                                <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                                  {formatDateTime(entry.createdAt)}
                                </span>
                                {entry.changedBy && (
                                  <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                                    by {entry.changedBy}
                                  </span>
                                )}
                              </div>
                              {entry.reason && (
                                <p className="text-xs mt-1 p-2 rounded" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)" }}>
                                  {entry.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

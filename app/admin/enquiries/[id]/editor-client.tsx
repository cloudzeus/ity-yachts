"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Info, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

// ─── Types ───────────────────────────────────────────────────

type EnquiryData = {
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
  customer: { id: string; firstName: string; lastName: string; email: string } | null
  assignedStaff: { id: string; name: string } | null
}

type StaffMember = {
  id: string
  name: string
}

interface Props {
  enquiry: EnquiryData
}

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "LOST"] as const

const STATUS_COLORS: Record<string, string> = {
  NEW:       "#1976D2",
  CONTACTED: "#F57C00",
  QUOTED:    "#7B1FA2",
  CONVERTED: "#2D6A4F",
  LOST:      "#626262",
}

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

// ─── Editor ──────────────────────────────────────────────────

export function EnquiryEditorClient({ enquiry }: Props) {
  const router = useRouter()

  // Form state
  const [status, setStatus] = useState(enquiry.status || "NEW")
  const [dateFrom, setDateFrom] = useState(enquiry.dateFrom ? enquiry.dateFrom.slice(0, 10) : "")
  const [dateTo, setDateTo] = useState(enquiry.dateTo ? enquiry.dateTo.slice(0, 10) : "")
  const [guests, setGuests] = useState(enquiry.guests?.toString() ?? "")
  const [preferredCategory, setPreferredCategory] = useState(enquiry.preferredCategory ?? "")
  const [preferredLength, setPreferredLength] = useState(enquiry.preferredLength ?? "")
  const [baseFrom, setBaseFrom] = useState(enquiry.baseFrom ?? "")
  const [baseTo, setBaseTo] = useState(enquiry.baseTo ?? "")
  const [budget, setBudget] = useState(enquiry.budget?.toString() ?? "")
  const [currency, setCurrency] = useState(enquiry.currency || "EUR")
  const [source, setSource] = useState(enquiry.source || "")
  const [assignedStaffId, setAssignedStaffId] = useState(enquiry.assignedStaffId ?? "")
  const [notes, setNotes] = useState(enquiry.notes ?? "")

  // Staff list
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffLoaded, setStaffLoaded] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch staff on mount
  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/admin/staff")
        if (res.ok) {
          const json = await res.json()
          setStaffList(json.staff ?? [])
        }
      } finally {
        setStaffLoaded(true)
      }
    }
    loadStaff()
  }, [])

  const formState = {
    status,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    guests: guests || null,
    preferredCategory: preferredCategory || null,
    preferredLength: preferredLength || null,
    baseFrom: baseFrom || null,
    baseTo: baseTo || null,
    budget: budget || null,
    currency,
    source,
    assignedStaffId: assignedStaffId || null,
    notes: notes || null,
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState }),
      })
      if (res.ok) {
        setLastSaved(new Date())
      }
    } finally {
      setSaving(false)
    }
  }, [formState, enquiry.id])

  // Auto-save with debounce
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save()
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    status, dateFrom, dateTo, guests, preferredCategory, preferredLength,
    baseFrom, baseTo, budget, currency, source, assignedStaffId, notes,
  ])

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/enquiries")} className="h-8 gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                Enquiry
              </h1>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-7 w-36 text-xs" style={{ borderColor: STATUS_COLORS[status] ?? "var(--outline-variant)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: STATUS_COLORS[status] ?? "#626262" }} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                        {s}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lastSaved && (
              <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                Last saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1.5 text-xs" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content - 2/3 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Charter Requirements */}
            <SectionCard title="Charter Requirements">
              <div className="grid grid-cols-2 gap-3">
                <FieldWithInfo label="Date From" tooltip="Preferred charter start date requested by the customer">
                  <Input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} type="date" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
                <FieldWithInfo label="Date To" tooltip="Preferred charter end date requested by the customer">
                  <Input value={dateTo} onChange={(e) => setDateTo(e.target.value)} type="date" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
                <FieldWithInfo label="Guests" tooltip="Total number of guests including the lead booker">
                  <Input value={guests} onChange={(e) => setGuests(e.target.value)} type="number" min="1" placeholder="e.g. 6" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
                <FieldWithInfo label="Preferred Category" tooltip="Type of yacht the customer is interested in chartering">
                  <Select value={preferredCategory} onValueChange={setPreferredCategory}>
                    <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sailing">Sailing</SelectItem>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Catamaran">Catamaran</SelectItem>
                      <SelectItem value="Gulet">Gulet</SelectItem>
                      <SelectItem value="Power Catamaran">Power Catamaran</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithInfo>
                <FieldLabel label="Preferred Length">
                  <Select value={preferredLength} onValueChange={setPreferredLength}>
                    <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under 35ft">Under 35ft</SelectItem>
                      <SelectItem value="35-40ft">35-40ft</SelectItem>
                      <SelectItem value="40-45ft">40-45ft</SelectItem>
                      <SelectItem value="45-50ft">45-50ft</SelectItem>
                      <SelectItem value="50-60ft">50-60ft</SelectItem>
                      <SelectItem value="Over 60ft">Over 60ft</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldLabel>
                <FieldWithInfo label="Base From" tooltip="Preferred embarkation marina or port">
                  <Input value={baseFrom} onChange={(e) => setBaseFrom(e.target.value)} placeholder="e.g. Athens" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
                <FieldWithInfo label="Base To" tooltip="Preferred disembarkation marina or port. Same as departure for round trips">
                  <Input value={baseTo} onChange={(e) => setBaseTo(e.target.value)} placeholder="e.g. Mykonos" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
              </div>
            </SectionCard>

            {/* Budget */}
            <SectionCard title="Budget">
              <div className="grid grid-cols-2 gap-3">
                <FieldWithInfo label="Budget" tooltip="Customer's stated budget for the charter period, excluding extras">
                  <Input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0" step="100" placeholder="e.g. 5000" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </FieldWithInfo>
                <FieldLabel label="Currency">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldLabel>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="flex flex-col gap-4">
            {/* Status */}
            <SectionCard title="Status">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: STATUS_COLORS[status] ?? "#626262" }} />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8 text-xs flex-1" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SectionCard>

            {/* Customer */}
            <SectionCard title="Customer">
              {enquiry.customer ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <User className="size-4" style={{ color: "var(--on-surface-variant)" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                        {enquiry.customer.firstName} {enquiry.customer.lastName}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                        {enquiry.customer.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/customers/${enquiry.customer.id}`}
                    className="text-xs underline"
                    style={{ color: "var(--primary)" }}
                  >
                    View customer
                  </Link>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  No customer linked to this enquiry.
                </p>
              )}
            </SectionCard>

            {/* Assigned Staff */}
            <SectionCard title="Assigned Staff">
              <Select value={assignedStaffId || "__none__"} onValueChange={(v) => setAssignedStaffId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                  <SelectValue placeholder={staffLoaded ? "Unassigned" : "Loading..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SectionCard>

            {/* Source */}
            <SectionCard title="Source">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this enquiry..."
                className="text-xs min-h-32"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </SectionCard>

            {/* Details */}
            <SectionCard title="Details">
              <div className="flex flex-col gap-1.5 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                <p>Created: {new Date(enquiry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p>Updated: {new Date(enquiry.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p className="font-mono text-[10px] mt-1" style={{ opacity: 0.5 }}>ID: {enquiry.id}</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

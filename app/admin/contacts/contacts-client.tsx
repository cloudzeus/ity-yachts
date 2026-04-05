"use client"

import { useState, useCallback, useRef } from "react"
import { Search, RefreshCw, Trash2, MoreHorizontal, Building2, User, ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Contact = {
  id: number
  contactType: string
  title: string
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  mobile: string
  fax: string
  address: string
  city: string
  country: string
  postcode: string
  nationality: string
  passportNumber: string
  dateOfBirth: string | null
  language: string
  taxNumber: string
  remarks: string | null
  createdAt: string
  updatedAt: string
}

const CONTACT_TYPES = ["CLIENT", "AGENT", "SKIPPER", "CREW", "OTHER"]

const contactTypeBadge = (type: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    CLIENT:  { bg: "rgba(33,150,243,0.12)",  color: "#1976D2" },
    AGENT:   { bg: "rgba(156,39,176,0.12)",  color: "#7B1FA2" },
    SKIPPER: { bg: "rgba(255,152,0,0.12)",   color: "#F57C00" },
    CREW:    { bg: "rgba(76,175,80,0.12)",   color: "#388E3C" },
    OTHER:   { bg: "rgba(117,117,117,0.12)", color: "#626262" },
  }
  const s = styles[type] ?? styles.OTHER
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {type || "—"}
    </span>
  )
}

const emptyForm = {
  contactType: "CLIENT",
  title: "",
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  mobile: "",
  fax: "",
  address: "",
  city: "",
  country: "",
  postcode: "",
  nationality: "",
  passportNumber: "",
  dateOfBirth: "",
  language: "",
  taxNumber: "",
  remarks: "",
}

interface Props {
  initialData: {
    contacts: Contact[]
    total: number
    typeCounts: Record<string, number>
  }
}

export function ContactsClient({ initialData }: Props) {
  const [data, setData] = useState(initialData.contacts)
  const [total, setTotal] = useState(initialData.total)
  const [typeCounts, setTypeCounts] = useState(initialData.typeCounts)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)

  // Create/Edit
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageSize = 50

  const fetchData = useCallback(async (searchQuery: string, type: string, p: number) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize), search: searchQuery, contactType: type })
      const res = await fetch(`/api/admin/contacts?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.contacts ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchData(val, filterType, 1), 300)
  }

  function handleFilterType(type: string) {
    setFilterType(type)
    setPage(1)
    fetchData(search, type, 1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(search, filterType, newPage)
  }

  async function handleSyncNausys() {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/contacts/sync-nausys", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error || "Sync failed")
        return
      }
      alert(`Synced ${json.total} contacts from NAUSYS (${json.created} created, ${json.updated} updated)`)
      fetchData(search, filterType, page)
    } catch {
      alert("Failed to connect to NAUSYS")
    } finally {
      setSyncing(false)
    }
  }

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditId(contact.id)
    setForm({
      contactType: contact.contactType || "CLIENT",
      title: contact.title,
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      fax: contact.fax,
      address: contact.address,
      city: contact.city,
      country: contact.country,
      postcode: contact.postcode,
      nationality: contact.nationality,
      passportNumber: contact.passportNumber,
      dateOfBirth: contact.dateOfBirth ? contact.dateOfBirth.split("T")[0] : "",
      language: contact.language,
      taxNumber: contact.taxNumber,
      remarks: contact.remarks || "",
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    if (!form.firstName || !form.lastName) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/contacts", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { id: editId, ...form } : form),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error || "Failed to save")
        return
      }
      closeForm()
      fetchData(search, filterType, page)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setDeleteId(null)
        setData((prev) => prev.filter((c) => c.id !== id))
        setTotal((prev) => prev - 1)
      }
    } finally {
      setDeleting(false)
    }
  }

  function updateForm(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const totalPages = Math.ceil(total / pageSize)
  const typeFilters = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])

  return (
    <>
      {/* Type filter pills */}
      {typeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterType("")}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            style={{
              background: filterType === "" ? "var(--primary)" : "var(--surface-container)",
              color: filterType === "" ? "white" : "var(--on-surface-variant)",
              borderRadius: "var(--radius-full, 9999px)",
            }}
          >
            All ({initialData.total})
          </button>
          {typeFilters.map(([type, count]) => (
            <button
              key={type}
              onClick={() => handleFilterType(type)}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
              style={{
                background: filterType === type ? "var(--primary)" : "var(--surface-container)",
                color: filterType === type ? "white" : "var(--on-surface-variant)",
                borderRadius: "var(--radius-full, 9999px)",
              }}
            >
              {type} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
          <Input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-2 text-xs"
            style={{ borderColor: "var(--outline-variant)", borderRadius: "var(--radius-xs)" }}
            onClick={handleSyncNausys}
            disabled={syncing}
          >
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync NAUSYS"}
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={openCreate}
          >
            <Plus className="size-4" />
            New Contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Country</th>
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
                    {total === 0 && !search && !filterType
                      ? "No contacts yet. Add one manually or sync from NAUSYS."
                      : "No contacts found"}
                  </td>
                </tr>
              ) : (
                data.map((contact) => (
                  <tr
                    key={contact.id}
                    className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                    style={{ borderBottom: "1px solid var(--outline-variant)" }}
                    onClick={() => setDetailContact(contact)}
                  >
                    <td className="px-4 py-3">
                      {contactTypeBadge(contact.contactType)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                        {contact.title ? `${contact.title} ` : ""}
                        {contact.firstName} {contact.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {contact.company || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {contact.email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {contact.phone || contact.mobile || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {contact.country || "—"}
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
                          <DropdownMenuItem onClick={() => setDetailContact(contact)}>
                            <User className="size-3.5 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(contact)}>
                            <Pencil className="size-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(contact.id)} className="text-destructive focus:text-destructive">
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
          {total > 0 ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} contacts` : "0 contacts"}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => handlePageChange(page - 1)} style={{ borderColor: "var(--outline-variant)" }}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs px-2" style={{ color: "var(--on-surface-variant)" }}>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} style={{ borderColor: "var(--outline-variant)" }}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) closeForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {editId ? "Edit Contact" : "New Contact"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              {editId ? "Update contact details." : "Add a new contact to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Contact Type *</Label>
              <select
                value={form.contactType}
                onChange={(e) => updateForm("contactType", e.target.value)}
                className="h-8 rounded border px-2 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
              >
                {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Name row */}
            <div className="flex gap-2">
              <FormField label="Title" value={form.title} onChange={(v) => updateForm("title", v)} placeholder="Mr/Mrs" />
              <FormField label="First Name *" value={form.firstName} onChange={(v) => updateForm("firstName", v)} placeholder="John" />
              <FormField label="Last Name *" value={form.lastName} onChange={(v) => updateForm("lastName", v)} placeholder="Doe" />
            </div>
            <FormField label="Company" value={form.company} onChange={(v) => updateForm("company", v)} placeholder="Company name" />
            {/* Contact row */}
            <div className="flex gap-2">
              <FormField label="Email" value={form.email} onChange={(v) => updateForm("email", v)} placeholder="john@example.com" type="email" />
              <FormField label="Phone" value={form.phone} onChange={(v) => updateForm("phone", v)} placeholder="+30 ..." />
            </div>
            <div className="flex gap-2">
              <FormField label="Mobile" value={form.mobile} onChange={(v) => updateForm("mobile", v)} placeholder="+30 ..." />
              <FormField label="Fax" value={form.fax} onChange={(v) => updateForm("fax", v)} placeholder="Fax" />
            </div>
            {/* Address */}
            <FormField label="Address" value={form.address} onChange={(v) => updateForm("address", v)} placeholder="Street address" />
            <div className="flex gap-2">
              <FormField label="City" value={form.city} onChange={(v) => updateForm("city", v)} placeholder="City" />
              <FormField label="Postcode" value={form.postcode} onChange={(v) => updateForm("postcode", v)} placeholder="12345" />
              <FormField label="Country" value={form.country} onChange={(v) => updateForm("country", v)} placeholder="Greece" />
            </div>
            <div className="flex gap-2">
              <FormField label="Nationality" value={form.nationality} onChange={(v) => updateForm("nationality", v)} placeholder="Greek" />
              <FormField label="Language" value={form.language} onChange={(v) => updateForm("language", v)} placeholder="en" />
            </div>
            <div className="flex gap-2">
              <FormField label="Passport Number" value={form.passportNumber} onChange={(v) => updateForm("passportNumber", v)} placeholder="AB1234567" />
              <FormField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => updateForm("dateOfBirth", v)} type="date" />
            </div>
            <FormField label="Tax Number" value={form.taxNumber} onChange={(v) => updateForm("taxNumber", v)} placeholder="Tax / VAT number" />
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Remarks</Label>
              <textarea
                value={form.remarks}
                onChange={(e) => updateForm("remarks", e.target.value)}
                rows={2}
                className="rounded border px-2 py-1.5 text-xs resize-none"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={closeForm} disabled={saving}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !form.firstName || !form.lastName}
                className="h-7 text-xs text-white"
                style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              >
                {saving ? "Saving…" : editId ? "Update Contact" : "Create Contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {detailContact && (
        <Dialog open={!!detailContact} onOpenChange={(v) => !v && setDetailContact(null)}>
          <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                {detailContact.title ? `${detailContact.title} ` : ""}
                {detailContact.firstName} {detailContact.lastName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
                Contact #{detailContact.id} · {contactTypeBadge(detailContact.contactType)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {detailContact.company && (
                <DetailField label="Company" value={detailContact.company} icon={<Building2 className="size-3.5" />} span={2} />
              )}
              <DetailField label="Email" value={detailContact.email} />
              <DetailField label="Phone" value={detailContact.phone} />
              <DetailField label="Mobile" value={detailContact.mobile} />
              <DetailField label="Fax" value={detailContact.fax} />
              <DetailField label="Address" value={[detailContact.address, detailContact.city, detailContact.postcode, detailContact.country].filter(Boolean).join(", ")} span={2} />
              <DetailField label="Nationality" value={detailContact.nationality} />
              <DetailField label="Language" value={detailContact.language} />
              <DetailField label="Passport" value={detailContact.passportNumber} />
              <DetailField label="Date of Birth" value={detailContact.dateOfBirth ? new Date(detailContact.dateOfBirth).toLocaleDateString() : ""} />
              <DetailField label="Tax Number" value={detailContact.taxNumber} />
              {detailContact.remarks && (
                <DetailField label="Remarks" value={detailContact.remarks} span={2} />
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => { setDetailContact(null); openEdit(detailContact) }}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <Dialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Contact</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this contact.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
    </div>
  )
}

function DetailField({ label, value, icon, span }: { label: string; value: string; icon?: React.ReactNode; span?: number }) {
  if (!value) return null
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--on-surface-variant)" }}>{label}</p>
      <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--on-surface)" }}>
        {icon}
        {value}
      </p>
    </div>
  )
}

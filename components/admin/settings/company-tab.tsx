"use client"

import { useState } from "react"
import { Plus, X, Building2, Phone, Mail, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

interface CompanyData {
  name: string
  address: string
  phones: string[]
  gemi: string
  vat: string
  bookingEmail: string
  companyEmail: string
  logoUrl: string
  logoPath: string
}

const defaults: CompanyData = {
  name: "", address: "", phones: [""], gemi: "", vat: "",
  bookingEmail: "", companyEmail: "", logoUrl: "", logoPath: "",
}

function SettingSection({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
          <Icon className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>{title}</p>
          {description && <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function CompanyTab({ initialData }: { initialData?: Partial<CompanyData> }) {
  const [data, setData] = useState<CompanyData>({ ...defaults, ...initialData })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [logoPickerOpen, setLogoPickerOpen] = useState(false)

  function set(field: keyof CompanyData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function setPhone(idx: number, value: string) {
    setData((prev) => {
      const phones = [...prev.phones]
      phones[idx] = value
      return { ...prev, phones }
    })
  }

  function handleLogoSelect(media: PickedMedia | PickedMedia[]) {
    const m = Array.isArray(media) ? media[0] : media
    setData((prev) => ({ ...prev, logoUrl: m.url, logoPath: m.path }))
  }

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "company", value: data }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Identity */}
      <SettingSection icon={Building2} title="Company Identity" description="Basic information about your company">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Company Name</Label>
            <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="IYC Yachts" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>VAT Number</Label>
            <Input value={data.vat} onChange={(e) => set("vat", e.target.value)} placeholder="EL123456789" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>GEMI Number</Label>
            <Input value={data.gemi} onChange={(e) => set("gemi", e.target.value)} placeholder="000000000" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Address</Label>
            <Textarea value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, City, Postal Code, Country" rows={2} />
          </div>
        </div>
      </SettingSection>

      {/* Logo */}
      <SettingSection icon={ImageIcon} title="Company Logo" description="Displayed in emails, documents and the website header">
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-md flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-xs)" }}>
            {data.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
              : <ImageIcon className="size-6 opacity-20" style={{ color: "var(--on-surface-variant)" }} />}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setLogoPickerOpen(true)}>
              <ImageIcon className="size-3.5" /> {data.logoUrl ? "Change Logo" : "Select Logo"}
            </Button>
            {data.logoUrl && (
              <Button variant="outline" size="sm" className="text-xs h-8" style={{ color: "var(--error)" }}
                onClick={() => setData((p) => ({ ...p, logoUrl: "", logoPath: "" }))}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </SettingSection>

      {/* Contact */}
      <SettingSection icon={Mail} title="Contact" description="Email addresses and phone numbers">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Company Email</Label>
              <Input type="email" value={data.companyEmail} onChange={(e) => set("companyEmail", e.target.value)} placeholder="info@company.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Booking Email</Label>
              <Input type="email" value={data.bookingEmail} onChange={(e) => set("bookingEmail", e.target.value)} placeholder="bookings@company.com" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Phone Numbers</Label>
            {data.phones.map((phone, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "var(--on-surface-variant)" }} />
                  <Input value={phone} onChange={(e) => setPhone(idx, e.target.value)} placeholder="+30 210 0000000" className="pl-8" />
                </div>
                <Button variant="outline" size="sm" className="shrink-0 px-2 h-8" onClick={() => setData((p) => ({ ...p, phones: p.phones.filter((_, i) => i !== idx) }))} disabled={data.phones.length === 1}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 w-fit" onClick={() => setData((p) => ({ ...p, phones: [...p.phones, ""] }))}>
              <Plus className="size-3.5" /> Add Phone
            </Button>
          </div>
        </div>
      </SettingSection>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {status === "success" && <span className="text-xs font-medium text-green-600">✓ Saved successfully</span>}
        {status === "error" && <span className="text-xs font-medium" style={{ color: "var(--error)" }}>Failed to save</span>}
      </div>

      <MediaPicker open={logoPickerOpen} onClose={() => setLogoPickerOpen(false)} onSelect={handleLogoSelect} accept="image" />
    </div>
  )
}

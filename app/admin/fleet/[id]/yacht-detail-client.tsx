"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, Users, Globe,
  Ship, Image, DollarSign, Wrench, Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageLightbox } from "@/components/admin/fleet/image-lightbox"
import AvailabilityCalendar from "@/components/admin/fleet/availability-calendar"
import { Label } from "@/components/ui/label"

// ─── Types ───────────────────────────────────────────────────

type IntlName = Record<string, string>
const LANGS = [
  { code: "en", label: "English" },
  { code: "el", label: "Greek" },
  { code: "de", label: "German" },
] as const
type LangCode = (typeof LANGS)[number]["code"]

function lang(obj: IntlName | null | undefined, fallback = "—"): string {
  if (!obj) return fallback
  return obj.en || obj.el || obj.de || fallback
}

// ─── Reusable form components ────────────────────────────────

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      className="p-4"
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </Label>
      {children}
    </div>
  )
}

const inputStyle = { background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }

function SelectInput({ value, onChange, options, placeholder }: {
  value: string | number | null | undefined
  onChange: (v: string) => void
  options: { value: string | number; label: string }[]
  placeholder?: string
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-2 text-xs rounded-md border w-full"
      style={inputStyle}
    >
      <option value="">{placeholder ?? "— Select —"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SmallInput({ value, onChange, type = "text", placeholder }: {
  value: string | number | null | undefined
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <Input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 text-xs"
      style={inputStyle}
    />
  )
}

// ─── Tab definitions ─────────────────────────────────────────

const TABS = [
  { key: "identity", label: "Identity", icon: Ship },
  { key: "media", label: "Media", icon: Image },
  { key: "pricing", label: "Pricing & Periods", icon: DollarSign },
  { key: "equipment", label: "Equipment & More", icon: Wrench },
] as const
type TabKey = (typeof TABS)[number]["key"]

// ─── Main Component ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function YachtDetailClient({ yacht: initial, lookups }: { yacht: any; lookups: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [yacht, setYacht] = useState(initial)
  const [activeLang, setActiveLang] = useState<LangCode>("en")
  const [activeTab, setActiveTab] = useState<TabKey>("identity")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [translatingAll, setTranslatingAll] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)

  // ─── Translate All via DeepSeek ──────────────────────────

  const handleTranslateAll = useCallback(async () => {
    const highlights = yacht.highlightsTranslations?.en
    const notes = yacht.noteTranslations?.en
    if (!highlights && !notes) {
      alert("Enter English text for highlights or notes first")
      return
    }
    setTranslatingAll(true)
    try {
      const translateField = async (text: string) => {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, languages: ["el", "de"] }),
        })
        if (!res.ok) throw new Error("Translation failed")
        const json = await res.json()
        return json.translations as { el: string; de: string }
      }

      if (highlights) {
        const t = await translateField(highlights)
        set("highlightsTranslations", {
          ...yacht.highlightsTranslations,
          el: t.el,
          de: t.de,
        })
      }
      if (notes) {
        const t = await translateField(notes)
        set("noteTranslations", {
          ...yacht.noteTranslations,
          el: t.el,
          de: t.de,
        })
      }
    } catch {
      alert("Translation failed. Check DeepSeek API key in settings.")
    } finally {
      setTranslatingAll(false)
    }
  }, [yacht])

  // ─── Field updaters ──────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (field: string, value: any) => setYacht((y: any) => ({ ...y, [field]: value }))
  const setNum = (field: string, v: string) => set(field, v === "" ? null : Number(v))
  const setStr = (field: string, v: string) => set(field, v || null)
  const setInt = (field: string, v: string) => set(field, v === "" ? null : parseInt(v))

  // ─── Save yacht fields ──────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/admin/fleet/${yacht.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: yacht.name,
          modelId: yacht.modelId, baseId: yacht.baseId,
          sailTypeId: yacht.sailTypeId, genoaTypeId: yacht.genoaTypeId,
          steeringTypeId: yacht.steeringTypeId, engineBuilderId: yacht.engineBuilderId,
          loa: yacht.loa, beam: yacht.beam, draft: yacht.draft,
          buildYear: yacht.buildYear, renewed: yacht.renewed, launchedYear: yacht.launchedYear,
          hullColor: yacht.hullColor, mastLength: yacht.mastLength,
          registrationNumber: yacht.registrationNumber,
          cabins: yacht.cabins, cabinsCrew: yacht.cabinsCrew,
          berthsCabin: yacht.berthsCabin, berthsSalon: yacht.berthsSalon,
          berthsCrew: yacht.berthsCrew, berthsTotal: yacht.berthsTotal,
          maxPersons: yacht.maxPersons, recommendedPersons: yacht.recommendedPersons,
          wc: yacht.wc, wcCrew: yacht.wcCrew, showers: yacht.showers, showersCrew: yacht.showersCrew,
          engines: yacht.engines, enginePower: yacht.enginePower,
          engineBuildYear: yacht.engineBuildYear, engineRenewedYear: yacht.engineRenewedYear,
          fuelType: yacht.fuelType, fuelConsumption: yacht.fuelConsumption,
          fuelTank: yacht.fuelTank, waterTank: yacht.waterTank,
          propulsionType: yacht.propulsionType, numberOfRudderBlades: yacht.numberOfRudderBlades,
          maxSpeed: yacht.maxSpeed, cruisingSpeed: yacht.cruisingSpeed,
          charterType: yacht.charterType, crewedCharterType: yacht.crewedCharterType,
          checkInTime: yacht.checkInTime, checkOutTime: yacht.checkOutTime,
          deposit: yacht.deposit, depositWhenInsured: yacht.depositWhenInsured,
          depositCurrency: yacht.depositCurrency, commission: yacht.commission,
          maxDiscount: yacht.maxDiscount, isPremium: yacht.isPremium,
          highlightsTranslations: yacht.highlightsTranslations,
          noteTranslations: yacht.noteTranslations,
          mainPictureUrl: yacht.mainPictureUrl, youtubeVideos: yacht.youtubeVideos,
          vimeoVideos: yacht.vimeoVideos, linkFor360tour: yacht.linkFor360tour,
          websiteImages: yacht.websiteImages,
        }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }, [yacht, router])

  // ─── Add/remove helpers ─────────────────────────────────

  const addEquipment = async (equipmentId: number) => {
    const res = await fetch(`/api/admin/fleet/${yacht.id}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId, quantity: 1 }),
    })
    if (res.ok) router.refresh()
  }

  const removeEquipment = async (itemId: string) => {
    await fetch(`/api/admin/fleet/${yacht.id}/equipment?itemId=${itemId}`, { method: "DELETE" })
    setYacht((y: typeof yacht) => ({ ...y, equipment: y.equipment.filter((e: { id: string }) => e.id !== itemId) }))
  }

  const addService = async (serviceId: number) => {
    const res = await fetch(`/api/admin/fleet/${yacht.id}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId }),
    })
    if (res.ok) router.refresh()
  }

  const removeService = async (itemId: string) => {
    await fetch(`/api/admin/fleet/${yacht.id}/services?itemId=${itemId}`, { method: "DELETE" })
    setYacht((y: typeof yacht) => ({ ...y, services: y.services.filter((s: { id: string }) => s.id !== itemId) }))
  }

  const [newCabin, setNewCabin] = useState({ cabinName: "", cabinType: "", cabinPosition: "" })
  const addCabin = async () => {
    if (!newCabin.cabinName) return
    const res = await fetch(`/api/admin/fleet/${yacht.id}/cabins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCabin),
    })
    if (res.ok) { setNewCabin({ cabinName: "", cabinType: "", cabinPosition: "" }); router.refresh() }
  }
  const removeCabin = async (itemId: string) => {
    await fetch(`/api/admin/fleet/${yacht.id}/cabins?itemId=${itemId}`, { method: "DELETE" })
    setYacht((y: typeof yacht) => ({ ...y, cabinDefinitions: y.cabinDefinitions.filter((c: { id: string }) => c.id !== itemId) }))
  }

  const [newCheckin, setNewCheckin] = useState({ dateFrom: "", dateTo: "", minReservationDuration: 7, checkInSaturday: true, checkOutSaturday: true })
  const addCheckin = async () => {
    if (!newCheckin.dateFrom || !newCheckin.dateTo) return
    const res = await fetch(`/api/admin/fleet/${yacht.id}/checkin-periods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCheckin),
    })
    if (res.ok) { setNewCheckin({ dateFrom: "", dateTo: "", minReservationDuration: 7, checkInSaturday: true, checkOutSaturday: true }); router.refresh() }
  }
  const removeCheckin = async (itemId: string) => {
    await fetch(`/api/admin/fleet/${yacht.id}/checkin-periods?itemId=${itemId}`, { method: "DELETE" })
    setYacht((y: typeof yacht) => ({ ...y, checkInPeriods: y.checkInPeriods.filter((p: { id: string }) => p.id !== itemId) }))
  }

  const [newCrew, setNewCrew] = useState({ name: "", surname: "", crewRole: "", livingPlace: "" })
  const addCrew = async () => {
    if (!newCrew.name) return
    const res = await fetch(`/api/admin/fleet/${yacht.id}/crew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCrew),
    })
    if (res.ok) { setNewCrew({ name: "", surname: "", crewRole: "", livingPlace: "" }); router.refresh() }
  }
  const removeCrew = async (itemId: string) => {
    await fetch(`/api/admin/fleet/${yacht.id}/crew?itemId=${itemId}`, { method: "DELETE" })
    setYacht((y: typeof yacht) => ({ ...y, crewMembers: y.crewMembers.filter((m: { id: string }) => m.id !== itemId) }))
  }

  // ─── Equipment IDs already on yacht ─────────────────────
  const existingEquipIds = new Set(yacht.equipment.map((e: { equipmentId: number }) => e.equipmentId))
  const existingServiceIds = new Set(yacht.services.map((s: { serviceId: number }) => s.serviceId))

  // ─── Render ─────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/fleet" className="flex items-center justify-center size-8 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--on-surface-variant)" }}>
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            {yacht.name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {yacht.model?.builder?.name} {yacht.model?.name}
            {yacht.buildYear ? ` — Built ${yacht.buildYear}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs text-white"
          style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save Changes
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              <Icon className="size-3.5" />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════════════ TAB: Identity ═══════════════ */}
      {activeTab === "identity" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {/* Core identity */}
            <SectionCard title="Identity">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Yacht Name">
                    <SmallInput value={yacht.name} onChange={(v) => set("name", v)} />
                  </Field>
                </div>
                <Field label="Model">
                  <SelectInput
                    value={yacht.modelId}
                    onChange={(v) => setInt("modelId", v)}
                    options={lookups.models.map((m: { id: number; name: string; builder?: { name: string } }) => ({
                      value: m.id, label: `${m.builder?.name ?? ""} ${m.name}`.trim(),
                    }))}
                    placeholder="Select model..."
                  />
                </Field>
                <Field label="Home Base">
                  <SelectInput
                    value={yacht.baseId}
                    onChange={(v) => setInt("baseId", v)}
                    options={lookups.bases.map((b: { id: number; location?: { name: IntlName } }) => ({
                      value: b.id, label: `#${b.id} — ${lang(b.location?.name)}`,
                    }))}
                    placeholder="Select base..."
                  />
                </Field>
                <Field label="Charter Type">
                  <SelectInput value={yacht.charterType} onChange={(v) => setStr("charterType", v)} options={[
                    { value: "BAREBOAT", label: "Bareboat" }, { value: "CREWED", label: "Crewed" },
                  ]} />
                </Field>
                <Field label="Crewed Charter Type">
                  <SelectInput value={yacht.crewedCharterType} onChange={(v) => setStr("crewedCharterType", v)} options={[
                    { value: "SKIPPER", label: "Skipper" }, { value: "SKIPPER_HOSTESS", label: "Skipper + Hostess" }, { value: "ALL_INCLUSIVE", label: "All Inclusive" },
                  ]} />
                </Field>
              </div>
            </SectionCard>

            {/* Vessel Specs */}
            <SectionCard title="Vessel Specifications">
              <div className="grid grid-cols-3 gap-3">
                <Field label="LOA (m)"><SmallInput type="number" value={yacht.loa} onChange={(v) => setNum("loa", v)} /></Field>
                <Field label="Beam (m)"><SmallInput type="number" value={yacht.beam} onChange={(v) => setNum("beam", v)} /></Field>
                <Field label="Draft (m)"><SmallInput type="number" value={yacht.draft} onChange={(v) => setNum("draft", v)} /></Field>
                <Field label="Build Year"><SmallInput type="number" value={yacht.buildYear} onChange={(v) => setInt("buildYear", v)} /></Field>
                <Field label="Renewed"><SmallInput type="number" value={yacht.renewed} onChange={(v) => setInt("renewed", v)} /></Field>
                <Field label="Mast (m)"><SmallInput type="number" value={yacht.mastLength} onChange={(v) => setNum("mastLength", v)} /></Field>
                <Field label="Hull Color">
                  <SelectInput value={yacht.hullColor} onChange={(v) => setStr("hullColor", v)} options={
                    ["WHITE","BLUE","GREY","RED","BLACK","GOLD","YELLOW","ORANGE","DARK_COFFEE","BEIGE"].map((c) => ({ value: c, label: c }))
                  } />
                </Field>
                <Field label="Registration #"><SmallInput value={yacht.registrationNumber} onChange={(v) => setStr("registrationNumber", v)} /></Field>
              </div>
            </SectionCard>

            {/* Sails & Steering */}
            <SectionCard title="Sails & Steering">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Main Sail Type">
                  <SelectInput value={yacht.sailTypeId} onChange={(v) => setInt("sailTypeId", v)}
                    options={lookups.sailTypes.map((t: { id: number; name: IntlName }) => ({ value: t.id, label: lang(t.name) }))}
                    placeholder="Select sail type..." />
                </Field>
                <Field label="Sail Renewed"><SmallInput type="number" value={yacht.sailRenewed} onChange={(v) => setInt("sailRenewed", v)} /></Field>
                <Field label="Genoa Type">
                  <SelectInput value={yacht.genoaTypeId} onChange={(v) => setInt("genoaTypeId", v)}
                    options={lookups.sailTypes.map((t: { id: number; name: IntlName }) => ({ value: t.id, label: lang(t.name) }))}
                    placeholder="Select genoa type..." />
                </Field>
                <Field label="Genoa Renewed"><SmallInput type="number" value={yacht.genoaRenewed} onChange={(v) => setInt("genoaRenewed", v)} /></Field>
                <Field label="Steering Type">
                  <SelectInput value={yacht.steeringTypeId} onChange={(v) => setInt("steeringTypeId", v)}
                    options={lookups.steeringTypes.map((t: { id: number; name: IntlName }) => ({ value: t.id, label: lang(t.name) }))}
                    placeholder="Select steering type..." />
                </Field>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            {/* Accommodation */}
            <SectionCard title="Accommodation">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Cabins"><SmallInput type="number" value={yacht.cabins} onChange={(v) => setInt("cabins", v)} /></Field>
                <Field label="Crew Cabins"><SmallInput type="number" value={yacht.cabinsCrew} onChange={(v) => setInt("cabinsCrew", v)} /></Field>
                <Field label="Berths (cabin)"><SmallInput type="number" value={yacht.berthsCabin} onChange={(v) => setInt("berthsCabin", v)} /></Field>
                <Field label="Berths (salon)"><SmallInput type="number" value={yacht.berthsSalon} onChange={(v) => setInt("berthsSalon", v)} /></Field>
                <Field label="Berths (total)"><SmallInput type="number" value={yacht.berthsTotal} onChange={(v) => setInt("berthsTotal", v)} /></Field>
                <Field label="Max Persons"><SmallInput type="number" value={yacht.maxPersons} onChange={(v) => setInt("maxPersons", v)} /></Field>
                <Field label="Recommended"><SmallInput type="number" value={yacht.recommendedPersons} onChange={(v) => setInt("recommendedPersons", v)} /></Field>
                <Field label="WC"><SmallInput type="number" value={yacht.wc} onChange={(v) => setInt("wc", v)} /></Field>
                <Field label="Showers"><SmallInput type="number" value={yacht.showers} onChange={(v) => setInt("showers", v)} /></Field>
              </div>
            </SectionCard>

            {/* Engine & Propulsion */}
            <SectionCard title="Engine & Propulsion">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Engines"><SmallInput type="number" value={yacht.engines} onChange={(v) => setInt("engines", v)} /></Field>
                <Field label="Power (HP)"><SmallInput type="number" value={yacht.enginePower} onChange={(v) => setNum("enginePower", v)} /></Field>
                <Field label="Engine Builder">
                  <SelectInput value={yacht.engineBuilderId} onChange={(v) => setInt("engineBuilderId", v)}
                    options={lookups.engineBuilders.map((b: { id: number; name: string }) => ({ value: b.id, label: b.name }))}
                    placeholder="Select builder..." />
                </Field>
                <Field label="Engine Year"><SmallInput type="number" value={yacht.engineBuildYear} onChange={(v) => setInt("engineBuildYear", v)} /></Field>
                <Field label="Fuel Type">
                  <SelectInput value={yacht.fuelType} onChange={(v) => setStr("fuelType", v)} options={[
                    { value: "DIESEL", label: "Diesel" }, { value: "HYBRID", label: "Hybrid" }, { value: "PETROL", label: "Petrol" },
                  ]} />
                </Field>
                <Field label="Fuel Tank (L)"><SmallInput type="number" value={yacht.fuelTank} onChange={(v) => setInt("fuelTank", v)} /></Field>
                <Field label="Water Tank (L)"><SmallInput type="number" value={yacht.waterTank} onChange={(v) => setInt("waterTank", v)} /></Field>
                <Field label="Propulsion">
                  <SelectInput value={yacht.propulsionType} onChange={(v) => setStr("propulsionType", v)} options={
                    ["SAILDRIVE","SHAFT","ZDRIVE","IPS","OUTBOARD","SURFACE","JET"].map((t) => ({ value: t, label: t }))
                  } />
                </Field>
                <Field label="Rudder Blades"><SmallInput type="number" value={yacht.numberOfRudderBlades} onChange={(v) => setInt("numberOfRudderBlades", v)} /></Field>
                <Field label="Max Speed (kn)"><SmallInput type="number" value={yacht.maxSpeed} onChange={(v) => setInt("maxSpeed", v)} /></Field>
                <Field label="Cruise Speed (kn)"><SmallInput type="number" value={yacht.cruisingSpeed} onChange={(v) => setInt("cruisingSpeed", v)} /></Field>
                <Field label="Consumption (L/h)"><SmallInput type="number" value={yacht.fuelConsumption} onChange={(v) => setInt("fuelConsumption", v)} /></Field>
              </div>
            </SectionCard>

            {/* Translations */}
            <SectionCard title="Description & Translations" action={
              <button
                onClick={handleTranslateAll}
                disabled={translatingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                style={{
                  background: "rgba(21,101,192,0.08)",
                  color: "var(--primary)",
                  border: "1px solid rgba(21,101,192,0.2)",
                }}
                title="Translate all English text to Greek + German via DeepSeek"
              >
                {translatingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Languages className="size-3.5" />
                )}
                {translatingAll ? "Translating..." : "Translate All"}
              </button>
            }>
              <div className="flex gap-1 mb-3">
                {LANGS.map((l) => (
                  <button key={l.code} onClick={() => setActiveLang(l.code)}
                    className="px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ borderRadius: "var(--radius-xs)", background: activeLang === l.code ? "var(--primary)" : "transparent", color: activeLang === l.code ? "#fff" : "var(--on-surface-variant)" }}>
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Field label={`Highlights (${activeLang.toUpperCase()})`}>
                  <Textarea rows={3} className="text-xs" style={inputStyle}
                    value={yacht.highlightsTranslations?.[activeLang] ?? ""}
                    onChange={(e) => set("highlightsTranslations", { ...yacht.highlightsTranslations, [activeLang]: e.target.value })} />
                </Field>
                <Field label={`Notes (${activeLang.toUpperCase()})`}>
                  <Textarea rows={3} className="text-xs" style={inputStyle}
                    value={yacht.noteTranslations?.[activeLang] ?? ""}
                    onChange={(e) => set("noteTranslations", { ...yacht.noteTranslations, [activeLang]: e.target.value })} />
                </Field>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: Media ═══════════════ */}
      {activeTab === "media" && (
        <div className="flex flex-col gap-4">
          {/* NAUSYS Images */}
          <SectionCard title="NAUSYS Images">
            {(() => {
              const allImages = [yacht.mainPictureUrl, ...(yacht.picturesUrl ?? [])].filter(Boolean) as string[]
              const lightboxImages = allImages.map((url, i) => ({ url, isMain: i === 0, sortOrder: i }))
              return allImages.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {allImages.map((url: string, i: number) => (
                      <button
                        key={i}
                        className="relative group cursor-pointer"
                        onClick={() => setLightboxIndex(i)}
                      >
                        <div
                          className="h-36 w-full bg-cover bg-center rounded-lg transition-opacity group-hover:opacity-80"
                          style={{ backgroundImage: `url(${url})`, borderRadius: "var(--radius-md)" }}
                        />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white rounded"
                            style={{ background: "var(--primary)" }}>
                            Main
                          </span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-medium px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.6)" }}>
                            Click to enlarge
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {lightboxIndex !== null && (
                    <ImageLightbox
                      images={lightboxImages}
                      initialIndex={lightboxIndex}
                      onClose={() => setLightboxIndex(null)}
                    />
                  )}
                </>
              ) : (
                <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>
                  No images synced from NAUSYS.
                </p>
              )
            })()}
          </SectionCard>

          {/* Custom website images — Bunny CDN upload */}
          <SectionCard
            title="Website Images (CDN)"
            action={
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files
                    if (!files?.length) return
                    setMediaUploading(true)
                    const slug = (yacht.name || "yacht").toLowerCase().replace(/[^a-z0-9]+/g, "-")
                    const folder = `yachts/${yacht.id}-${slug}`
                    const newImages = [...(yacht.websiteImages || [])]

                    for (const file of Array.from(files)) {
                      const form = new FormData()
                      form.append("file", file)
                      form.append("folder", folder)
                      try {
                        const res = await fetch("/api/admin/media/upload", { method: "POST", body: form })
                        const data = await res.json()
                        if (data.success && data.file?.url) {
                          newImages.push({ url: data.file.url, caption: file.name.replace(/\.[^.]+$/, "") })
                        }
                      } catch (err) {
                        console.error("Upload failed:", err)
                      }
                    }
                    setYacht((y: typeof yacht) => ({ ...y, websiteImages: newImages }))
                    setMediaUploading(false)
                    e.target.value = ""
                  }}
                />
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold rounded-md cursor-pointer transition hover:opacity-80"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
                  {mediaUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  {mediaUploading ? "Uploading..." : "Upload Images / Videos"}
                </span>
              </label>
            }
          >
            {(() => {
              const wsImages = (yacht.websiteImages || []) as Array<{ url: string; caption?: string }>
              return wsImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {wsImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <div
                        className="h-36 w-full bg-cover bg-center rounded-lg"
                        style={{ backgroundImage: `url(${img.url})`, borderRadius: "var(--radius-md)" }}
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white rounded"
                          style={{ background: "var(--primary)" }}>
                          Featured
                        </span>
                      )}
                      <button
                        onClick={() => {
                          const updated = [...wsImages]
                          updated.splice(i, 1)
                          setYacht((y: typeof yacht) => ({ ...y, websiteImages: updated }))
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {img.caption && (
                        <p className="text-[9px] text-center mt-1 truncate" style={{ color: "var(--on-surface-variant)" }}>
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs py-4 text-center" style={{ color: "var(--on-surface-variant)" }}>
                  No custom images yet. Upload images to display on the public yacht page. Auto-converted to WebP.
                </p>
              )
            })()}
          </SectionCard>

          {/* Videos & Tours */}
          <SectionCard title="Videos & Virtual Tours">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Field label="Main Picture URL"><SmallInput value={yacht.mainPictureUrl} onChange={(v) => setStr("mainPictureUrl", v)} /></Field>
                <Field label="YouTube Videos"><SmallInput value={yacht.youtubeVideos} onChange={(v) => setStr("youtubeVideos", v)} placeholder="YouTube URL" /></Field>
                <Field label="Vimeo Videos"><SmallInput value={yacht.vimeoVideos} onChange={(v) => setStr("vimeoVideos", v)} placeholder="Vimeo URL" /></Field>
                <Field label="360° Tour Link"><SmallInput value={yacht.linkFor360tour} onChange={(v) => setStr("linkFor360tour", v)} placeholder="https://..." /></Field>
              </div>
              <div className="flex flex-col gap-2">
                {yacht.youtubeVideos && (
                  <div className="rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(yacht.youtubeVideos)}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══════════════ TAB: Pricing & Periods ═══════════════ */}
      {activeTab === "pricing" && (
        <div className="flex flex-col gap-4">
          {/* Availability Calendar */}
          <AvailabilityCalendar
            checkInPeriods={yacht.checkInPeriods ?? []}
            prices={yacht.prices ?? []}
            bookings={yacht.bookings ?? []}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {/* Charter Pricing */}
            <SectionCard title="Charter & Pricing">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in Time"><SmallInput value={yacht.checkInTime} onChange={(v) => setStr("checkInTime", v)} placeholder="17:00" /></Field>
                <Field label="Check-out Time"><SmallInput value={yacht.checkOutTime} onChange={(v) => setStr("checkOutTime", v)} placeholder="09:00" /></Field>
                <Field label="Deposit"><SmallInput type="number" value={yacht.deposit} onChange={(v) => setNum("deposit", v)} /></Field>
                <Field label="Deposit (insured)"><SmallInput type="number" value={yacht.depositWhenInsured} onChange={(v) => setNum("depositWhenInsured", v)} /></Field>
                <Field label="Currency">
                  <SelectInput value={yacht.depositCurrency} onChange={(v) => setStr("depositCurrency", v)} options={[
                    { value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }, { value: "GBP", label: "GBP" },
                  ]} />
                </Field>
                <Field label="Commission %"><SmallInput type="number" value={yacht.commission} onChange={(v) => setNum("commission", v)} /></Field>
                <Field label="Max Discount %"><SmallInput type="number" value={yacht.maxDiscount} onChange={(v) => setNum("maxDiscount", v)} /></Field>
                <Field label="Premium">
                  <label className="flex items-center gap-2 h-8">
                    <input type="checkbox" checked={yacht.isPremium} onChange={(e) => set("isPremium", e.target.checked)} className="rounded" />
                    <span className="text-xs" style={{ color: "var(--on-surface)" }}>Premium yacht</span>
                  </label>
                </Field>
              </div>
            </SectionCard>

            {/* Pricing periods */}
            <SectionCard title={`Pricing Periods (${yacht.prices.length})`}>
              {yacht.prices.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>No pricing data synced yet.</p>
              ) : (
                <div className="flex flex-col gap-0.5 max-h-80 overflow-y-auto">
                  {yacht.prices.map((p: { id: string; dateFrom: string; dateTo: string; price: number; currency: string; priceType: string }) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <span style={{ color: "var(--on-surface-variant)" }} suppressHydrationWarning>
                        {new Date(p.dateFrom).toLocaleDateString()} — {new Date(p.dateTo).toLocaleDateString()}
                      </span>
                      <span className="font-medium" style={{ color: "var(--on-surface)" }}>
                        {p.price.toLocaleString()} {p.currency}/{p.priceType === "WEEKLY" ? "wk" : "day"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            {/* Check-in periods */}
            <SectionCard
              title={`Check-in Periods (${yacht.checkInPeriods.length})`}
              action={
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" style={{ borderColor: "var(--outline-variant)" }} onClick={addCheckin}>
                  <Plus className="size-3" /> Add
                </Button>
              }
            >
              <div className="grid grid-cols-3 gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <SmallInput type="date" value={newCheckin.dateFrom} onChange={(v) => setNewCheckin({ ...newCheckin, dateFrom: v })} placeholder="From" />
                <SmallInput type="date" value={newCheckin.dateTo} onChange={(v) => setNewCheckin({ ...newCheckin, dateTo: v })} placeholder="To" />
                <SmallInput type="number" value={newCheckin.minReservationDuration} onChange={(v) => setNewCheckin({ ...newCheckin, minReservationDuration: parseInt(v) || 7 })} placeholder="Min days" />
              </div>
              <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                {yacht.checkInPeriods.map((p: { id: string; dateFrom: string; dateTo: string; minReservationDuration: number }) => (
                  <div key={p.id} className="flex items-center justify-between py-1 text-xs group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <span style={{ color: "var(--on-surface)" }} suppressHydrationWarning>
                      {new Date(p.dateFrom).toLocaleDateString()} — {new Date(p.dateTo).toLocaleDateString()} (min {p.minReservationDuration}d)
                    </span>
                    <button onClick={() => removeCheckin(p.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity" style={{ color: "var(--on-surface-variant)" }}>
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Seasons for this yacht */}
            <SectionCard title={`Seasons (${yacht.seasons?.length ?? 0})`}>
              {(yacht.seasons?.length ?? 0) === 0 ? (
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>No season data synced.</p>
              ) : (
                <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                  {yacht.seasons.map((s: { id: string; seasonId: number; season?: { season: string; dateFrom: string; dateTo: string } }) => (
                    <div key={s.id} className="flex items-center justify-between py-1 text-xs" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <span style={{ color: "var(--on-surface)" }}>{s.season?.season ?? `Season #${s.seasonId}`}</span>
                      {s.season && (
                        <span style={{ color: "var(--on-surface-variant)" }} suppressHydrationWarning>
                          {new Date(s.season.dateFrom).toLocaleDateString()} — {new Date(s.season.dateTo).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: Equipment & More ═══════════════ */}
      {activeTab === "equipment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {/* Equipment picker */}
            <SectionCard
              title={`Equipment (${yacht.equipment.length})`}
              action={
                <SelectInput
                  value=""
                  onChange={(v) => { if (v) addEquipment(parseInt(v)) }}
                  options={lookups.allEquipment
                    .filter((e: { id: number }) => !existingEquipIds.has(e.id))
                    .map((e: { id: number; name: IntlName; category?: { name: IntlName } }) => ({
                      value: e.id, label: `${lang(e.category?.name, "")} — ${lang(e.name)}`.replace(/^— /, ""),
                    }))}
                  placeholder="+ Add equipment..."
                />
              }
            >
              <div className="flex flex-col gap-0.5 max-h-96 overflow-y-auto">
                {yacht.equipment.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "var(--on-surface-variant)" }}>No equipment added.</p>
                ) : (
                  yacht.equipment.map((e: { id: string; quantity: number; highlight: boolean; equipment: { name: IntlName; category?: { name: IntlName } | null } }) => (
                    <div key={e.id} className="flex items-center justify-between py-1 text-xs group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <div>
                        <span style={{ color: e.highlight ? "var(--primary)" : "var(--on-surface)" }}>{lang(e.equipment.name)}</span>
                        {e.quantity > 1 && <span className="ml-1" style={{ color: "var(--on-surface-variant)" }}>x{e.quantity}</span>}
                        <span className="ml-2 text-[10px]" style={{ color: "var(--outline-variant)" }}>{lang(e.equipment.category?.name, "")}</span>
                      </div>
                      <button onClick={() => removeEquipment(e.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity" style={{ color: "var(--on-surface-variant)" }}>
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* Services picker */}
            <SectionCard
              title={`Services (${yacht.services.length})`}
              action={
                <SelectInput
                  value=""
                  onChange={(v) => { if (v) addService(parseInt(v)) }}
                  options={lookups.allServices
                    .filter((s: { id: number }) => !existingServiceIds.has(s.id))
                    .map((s: { id: number; name: IntlName }) => ({ value: s.id, label: lang(s.name) }))}
                  placeholder="+ Add service..."
                />
              }
            >
              <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
                {yacht.services.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "var(--on-surface-variant)" }}>No services added.</p>
                ) : (
                  yacht.services.map((s: { id: string; service: { name: IntlName }; price: string | null; currency: string; obligatory: boolean }) => (
                    <div key={s.id} className="flex items-center justify-between py-1 text-xs group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <div>
                        <span style={{ color: "var(--on-surface)" }}>{lang(s.service.name)}</span>
                        {s.obligatory && <span className="ml-1 text-[10px] font-medium" style={{ color: "#D32F2F" }}>Required</span>}
                        {s.price && <span className="ml-2" style={{ color: "var(--on-surface-variant)" }}>{s.price} {s.currency}</span>}
                      </div>
                      <button onClick={() => removeService(s.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity" style={{ color: "var(--on-surface-variant)" }}>
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            {/* Cabin definitions */}
            <SectionCard
              title={`Cabin Definitions (${yacht.cabinDefinitions.length})`}
              action={
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" style={{ borderColor: "var(--outline-variant)" }} onClick={addCabin}>
                  <Plus className="size-3" /> Add
                </Button>
              }
            >
              <div className="grid grid-cols-3 gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <SmallInput value={newCabin.cabinName} onChange={(v) => setNewCabin({ ...newCabin, cabinName: v })} placeholder="Cabin name" />
                <SelectInput value={newCabin.cabinType} onChange={(v) => setNewCabin({ ...newCabin, cabinType: v })} options={[
                  { value: "SINGLE", label: "Single" }, { value: "DOUBLE", label: "Double" }, { value: "SPLIT", label: "Split" },
                  { value: "BUNK", label: "Bunk" }, { value: "DOUBLE_PLUS_SINGLE", label: "Double+Single" },
                ]} placeholder="Type..." />
                <SelectInput value={newCabin.cabinPosition} onChange={(v) => setNewCabin({ ...newCabin, cabinPosition: v })} options={[
                  { value: "FRONT", label: "Front" }, { value: "REAR", label: "Rear" },
                ]} placeholder="Position..." />
              </div>
              <div className="flex flex-col gap-0.5">
                {yacht.cabinDefinitions.map((c: { id: string; cabinName: string | null; cabinType: string | null; cabinPosition: string | null }) => (
                  <div key={c.id} className="flex items-center justify-between py-1 text-xs group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <span style={{ color: "var(--on-surface)" }}>
                      {c.cabinName || "Cabin"} — {c.cabinType}{c.cabinPosition ? ` (${c.cabinPosition})` : ""}
                    </span>
                    <button onClick={() => removeCabin(c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity" style={{ color: "var(--on-surface-variant)" }}>
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Crew members */}
            <SectionCard
              title={`Crew (${yacht.crewMembers.length})`}
              action={
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" style={{ borderColor: "var(--outline-variant)" }} onClick={addCrew}>
                  <Plus className="size-3" /> Add
                </Button>
              }
            >
              <div className="grid grid-cols-2 gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <SmallInput value={newCrew.name} onChange={(v) => setNewCrew({ ...newCrew, name: v })} placeholder="First name" />
                <SmallInput value={newCrew.surname} onChange={(v) => setNewCrew({ ...newCrew, surname: v })} placeholder="Last name" />
                <SmallInput value={newCrew.crewRole} onChange={(v) => setNewCrew({ ...newCrew, crewRole: v })} placeholder="Role (Skipper, etc.)" />
                <SmallInput value={newCrew.livingPlace} onChange={(v) => setNewCrew({ ...newCrew, livingPlace: v })} placeholder="Location" />
              </div>
              <div className="flex flex-col gap-0.5">
                {yacht.crewMembers.map((m: { id: string; name: string; surname: string; crewRole: string | null; photoUrl: string | null }) => (
                  <div key={m.id} className="flex items-center gap-2 py-1 text-xs group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    {m.photoUrl ? (
                      <div className="size-6 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${m.photoUrl})` }} />
                    ) : (
                      <div className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--surface-container)" }}>
                        <Users className="size-3" style={{ color: "var(--outline-variant)" }} />
                      </div>
                    )}
                    <div className="flex-1">
                      <span style={{ color: "var(--on-surface)" }}>{m.name} {m.surname}</span>
                      {m.crewRole && <span className="ml-1" style={{ color: "var(--on-surface-variant)" }}>— {m.crewRole}</span>}
                    </div>
                    <button onClick={() => removeCrew(m.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity" style={{ color: "var(--on-surface-variant)" }}>
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? ""
}

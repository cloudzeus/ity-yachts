"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Save, Check, Loader2, X, Sparkles, Languages, ExternalLink, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ── Types ───────────────────────────────────────────────────────

type TableKey =
  | "categories"
  | "yachtBuilders"
  | "engineBuilders"
  | "sailTypes"
  | "steeringTypes"
  | "equipmentCategories"
  | "equipment"
  | "services"

type TranslatedName = { en: string; el: string; de: string }

type BaseItem = {
  id: number
  name: string | TranslatedName
  icon?: string | null
  logoUrl?: string | null
  categoryId?: number | null
  category?: { id: number; name: TranslatedName } | null
  depositInsurance?: boolean
}

type TabDef = {
  key: TableKey
  label: string
  isJsonName: boolean
  hasIcon?: boolean
  hasLogo?: boolean
  hasCategoryId?: boolean
  hasDepositInsurance?: boolean
}

const TABS: TabDef[] = [
  { key: "categories", label: "Categories", isJsonName: true, hasIcon: true },
  { key: "yachtBuilders", label: "Yacht Builders", isJsonName: false, hasLogo: true },
  { key: "engineBuilders", label: "Engine Builders", isJsonName: false, hasLogo: true },
  { key: "sailTypes", label: "Sail Types", isJsonName: true },
  { key: "steeringTypes", label: "Steering Types", isJsonName: true },
  { key: "equipmentCategories", label: "Equip. Categories", isJsonName: true },
  { key: "equipment", label: "Equipment", isJsonName: true, hasCategoryId: true },
  { key: "services", label: "Services", isJsonName: true, hasDepositInsurance: true },
]

const LANG_TABS: { key: "en" | "el" | "de"; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "el", label: "EL" },
  { key: "de", label: "DE" },
]

// ── Common icon names for the picker ────────────────────────────

const POPULAR_ICONS = [
  "FaSailboat", "FaShip", "FaAnchor", "FaWater", "FaWind",
  "FaCompass", "FaFish", "FaStar", "FaBolt", "FaGear",
  "FaMotorcycle", "FaLifeRing", "FaMap", "FaFlag", "FaCircle",
  "FaSun", "FaMountain", "FaWaveSquare", "FaRocket", "FaCrown",
  "FaHeart", "FaShield", "FaGlobe", "FaFeather", "FaDiamond",
]

const inputStyle = {
  background: "var(--surface-container-lowest)",
  borderColor: "var(--outline-variant)",
}

// ── Component ───────────────────────────────────────────────────

interface Props {
  counts: Record<TableKey, number>
}

export function TablesClient({ counts }: Props) {
  const [activeTab, setActiveTab] = useState<TableKey>("categories")
  const [items, setItems] = useState<BaseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [activeLang, setActiveLang] = useState<"en" | "el" | "de">("en")
  const [iconSearch, setIconSearch] = useState("")
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [aiSuggestingIcon, setAiSuggestingIcon] = useState(false)
  const [aiSuggestedIcons, setAiSuggestedIcons] = useState<string[]>([])
  const [aiSuggestingLogo, setAiSuggestingLogo] = useState<number | null>(null)
  const [logoInfo, setLogoInfo] = useState<Record<number, any>>({})
  const [translating, setTranslating] = useState(false)

  const tabDef = TABS.find((t) => t.key === activeTab)!

  const fetchItems = useCallback(async (table: TableKey) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fleet/tables?table=${table}`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.items ?? [])
      }
    } catch (err) {
      console.error("[fetchItems]", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setEditingId(null)
    setEditData({})
    setSearch("")
    setAiSuggestedIcons([])
    setLogoInfo({})
    fetchItems(activeTab)
  }, [activeTab, fetchItems])

  // Start editing a row
  function startEdit(item: BaseItem) {
    setEditingId(item.id)
    setEditData({
      name: typeof item.name === "object" ? { ...item.name } : item.name,
      icon: item.icon ?? "",
      logoUrl: item.logoUrl ?? "",
      depositInsurance: item.depositInsurance ?? false,
    })
    setShowIconPicker(false)
    setAiSuggestedIcons([])
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData({})
    setShowIconPicker(false)
    setAiSuggestedIcons([])
  }

  // Save an item
  async function handleSave(id: number) {
    setSaving(id)
    try {
      const payload: Record<string, any> = { name: editData.name }
      if (tabDef.hasIcon) payload.icon = editData.icon || null
      if (tabDef.hasLogo) payload.logoUrl = editData.logoUrl || null
      if (tabDef.hasDepositInsurance) payload.depositInsurance = editData.depositInsurance

      const res = await fetch("/api/admin/fleet/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: activeTab, id, data: payload }),
      })

      if (res.ok) {
        const json = await res.json()
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...json.item } : it)))
        setSavedId(id)
        setEditingId(null)
        setEditData({})
        setTimeout(() => setSavedId(null), 1500)
      } else {
        const err = await res.json()
        alert(err.error || "Save failed")
      }
    } catch (err) {
      console.error("[handleSave]", err)
      alert("Error saving")
    } finally {
      setSaving(null)
    }
  }

  // AI: suggest icons for a category
  async function suggestIcons(name: string) {
    setAiSuggestingIcon(true)
    setAiSuggestedIcons([])
    try {
      const res = await fetch("/api/admin/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "icon", name }),
      })
      if (res.ok) {
        const json = await res.json()
        setAiSuggestedIcons(json.icons ?? [])
      } else {
        const err = await res.json()
        alert(err.error || "AI suggestion failed")
      }
    } catch {
      alert("AI suggestion failed")
    } finally {
      setAiSuggestingIcon(false)
    }
  }

  // AI: find logo info for a builder
  async function suggestLogo(id: number, name: string) {
    setAiSuggestingLogo(id)
    try {
      const res = await fetch("/api/admin/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "logo", name }),
      })
      if (res.ok) {
        const json = await res.json()
        setLogoInfo((prev) => ({ ...prev, [id]: json.info }))
      } else {
        const err = await res.json()
        alert(err.error || "AI suggestion failed")
      }
    } catch {
      alert("AI suggestion failed")
    } finally {
      setAiSuggestingLogo(null)
    }
  }

  // DeepSeek translate: translate EN text to EL + DE
  async function translateName(itemId: number) {
    const name = editData.name as TranslatedName
    if (!name?.en) {
      alert("Enter the English name first")
      return
    }
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: name.en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setEditData((prev) => ({
          ...prev,
          name: {
            ...(prev.name as TranslatedName),
            el: json.translations.el ?? (prev.name as TranslatedName).el,
            de: json.translations.de ?? (prev.name as TranslatedName).de,
          },
        }))
      } else {
        alert("Translation failed")
      }
    } catch {
      alert("Translation failed")
    } finally {
      setTranslating(false)
    }
  }

  // Filter items by search
  const filtered = items.filter((item) => {
    if (!search) return true
    const q = search.toLowerCase()
    if (typeof item.name === "string") return item.name.toLowerCase().includes(q)
    const n = item.name as TranslatedName
    return n.en?.toLowerCase().includes(q) || n.el?.toLowerCase().includes(q) || n.de?.toLowerCase().includes(q)
  })

  // Filtered icons for picker
  const allIcons = aiSuggestedIcons.length > 0
    ? [...new Set([...aiSuggestedIcons, ...POPULAR_ICONS])]
    : POPULAR_ICONS
  const filteredIcons = iconSearch
    ? allIcons.filter((ic) => ic.toLowerCase().includes(iconSearch.toLowerCase()))
    : allIcons

  // ── Helpers ─────────────────────────────────────────────────

  function getDisplayName(item: BaseItem): string {
    if (typeof item.name === "string") return item.name
    const n = item.name as TranslatedName
    return n.en || n.el || n.de || `#${item.id}`
  }

  function renderNameCell(item: BaseItem) {
    if (typeof item.name === "string") {
      return <span className="text-xs" style={{ color: "var(--on-surface)" }}>{item.name}</span>
    }
    const n = item.name as TranslatedName
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{n.en || "—"}</span>
        {(n.el || n.de) && (
          <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
            {n.el && `EL: ${n.el}`}{n.el && n.de ? " · " : ""}{n.de && `DE: ${n.de}`}
          </span>
        )}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
              <span
                className="inline-flex items-center justify-center px-1.5 py-0 text-[10px] font-semibold rounded-full"
                style={{
                  background: isActive ? "rgba(21,101,192,0.12)" : "rgba(0,0,0,0.06)",
                  color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                  minWidth: 20,
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5"
          style={{ color: "var(--on-surface-variant)" }}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tabDef.label.toLowerCase()}...`}
          className="pl-8 h-8 text-xs"
          style={inputStyle}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface-container-lowest)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-ambient)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {search ? "No items match your search" : "No items found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  <th
                    className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                    style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                  >
                    ID
                  </th>
                  <th
                    className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                    style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                  >
                    Name
                  </th>
                  {tabDef.hasIcon && (
                    <th
                      className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                      style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                    >
                      Icon
                    </th>
                  )}
                  {tabDef.hasLogo && (
                    <th
                      className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                      style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                    >
                      Logo
                    </th>
                  )}
                  {tabDef.hasCategoryId && (
                    <th
                      className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                      style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                    >
                      Category
                    </th>
                  )}
                  {tabDef.hasDepositInsurance && (
                    <th
                      className="text-left text-[10px] uppercase font-semibold px-4 py-2.5"
                      style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}
                    >
                      Deposit Ins.
                    </th>
                  )}
                  <th
                    className="text-right text-[10px] uppercase font-semibold px-4 py-2.5"
                    style={{ color: "var(--on-surface-variant)", letterSpacing: "0.05em", width: 100 }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isEditing = editingId === item.id
                  const isSaving = saving === item.id
                  const justSaved = savedId === item.id
                  const itemLogoInfo = logoInfo[item.id]

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid var(--outline-variant)" }}
                      className="group"
                    >
                      {/* ID */}
                      <td className="px-4 py-2.5 align-top">
                        <span className="text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>
                          {item.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-2.5 align-top" style={{ minWidth: 280 }}>
                        {isEditing ? (
                          tabDef.isJsonName ? (
                            <div className="flex flex-col gap-2">
                              {/* Language tabs + translate button */}
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {LANG_TABS.map((lt) => (
                                    <button
                                      key={lt.key}
                                      onClick={() => setActiveLang(lt.key)}
                                      className="px-2 py-0.5 text-[10px] font-semibold rounded"
                                      style={{
                                        background: activeLang === lt.key ? "var(--primary)" : "transparent",
                                        color: activeLang === lt.key ? "white" : "var(--on-surface-variant)",
                                        border: activeLang === lt.key ? "none" : "1px solid var(--outline-variant)",
                                      }}
                                    >
                                      {lt.label}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => translateName(item.id)}
                                  disabled={translating}
                                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors"
                                  style={{
                                    background: "rgba(21,101,192,0.08)",
                                    color: "var(--primary)",
                                    border: "1px solid rgba(21,101,192,0.2)",
                                  }}
                                  title="Translate EN to EL + DE via DeepSeek"
                                >
                                  {translating ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Languages className="size-3" />
                                  )}
                                  Translate
                                </button>
                              </div>
                              <Input
                                value={(editData.name as TranslatedName)?.[activeLang] ?? ""}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    name: { ...(prev.name as TranslatedName), [activeLang]: e.target.value },
                                  }))
                                }
                                className="h-8 text-xs"
                                style={inputStyle}
                                placeholder={`Name (${activeLang.toUpperCase()})`}
                              />
                            </div>
                          ) : (
                            <Input
                              value={editData.name as string}
                              onChange={(e) =>
                                setEditData((prev) => ({ ...prev, name: e.target.value }))
                              }
                              className="h-8 text-xs"
                              style={inputStyle}
                              placeholder="Name"
                            />
                          )
                        ) : (
                          renderNameCell(item)
                        )}
                      </td>

                      {/* Icon (categories only) */}
                      {tabDef.hasIcon && (
                        <td className="px-4 py-2.5 align-top" style={{ minWidth: 200 }}>
                          {isEditing ? (
                            <div className="relative">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editData.icon ?? ""}
                                  onChange={(e) =>
                                    setEditData((prev) => ({ ...prev, icon: e.target.value }))
                                  }
                                  onFocus={() => setShowIconPicker(true)}
                                  className="h-8 text-xs"
                                  style={inputStyle}
                                  placeholder="e.g. FaSailboat"
                                />
                                <button
                                  onClick={() => suggestIcons(getDisplayName(item))}
                                  disabled={aiSuggestingIcon}
                                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded shrink-0 transition-colors"
                                  style={{
                                    background: "rgba(156,39,176,0.08)",
                                    color: "#9C27B0",
                                    border: "1px solid rgba(156,39,176,0.2)",
                                  }}
                                  title="Ask DeepSeek to suggest icons"
                                >
                                  {aiSuggestingIcon ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="size-3" />
                                  )}
                                  AI
                                </button>
                                {editData.icon && (
                                  <button
                                    onClick={() => setEditData((prev) => ({ ...prev, icon: "" }))}
                                    className="text-xs shrink-0"
                                    style={{ color: "var(--on-surface-variant)" }}
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                )}
                              </div>
                              {/* AI suggested icons banner */}
                              {aiSuggestedIcons.length > 0 && (
                                <div
                                  className="mt-1.5 p-1.5 rounded flex flex-wrap gap-1"
                                  style={{
                                    background: "rgba(156,39,176,0.06)",
                                    border: "1px solid rgba(156,39,176,0.15)",
                                  }}
                                >
                                  <span className="text-[9px] w-full mb-0.5 flex items-center gap-1" style={{ color: "#9C27B0" }}>
                                    <Sparkles className="size-2.5" /> AI Suggestions
                                  </span>
                                  {aiSuggestedIcons.map((ic) => (
                                    <button
                                      key={ic}
                                      onClick={() => {
                                        setEditData((prev) => ({ ...prev, icon: ic }))
                                      }}
                                      className="px-2 py-0.5 text-[10px] rounded border hover:opacity-80 transition-opacity"
                                      style={{
                                        background: editData.icon === ic ? "rgba(156,39,176,0.15)" : "white",
                                        borderColor: editData.icon === ic ? "#9C27B0" : "var(--outline-variant)",
                                        color: editData.icon === ic ? "#9C27B0" : "var(--on-surface)",
                                      }}
                                    >
                                      {ic}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showIconPicker && (
                                <div
                                  className="absolute z-20 top-10 left-0 p-2 rounded-md border flex flex-col gap-2"
                                  style={{
                                    background: "var(--surface-container-lowest)",
                                    borderColor: "var(--outline-variant)",
                                    boxShadow: "var(--shadow-ambient)",
                                    width: 240,
                                    maxHeight: 200,
                                  }}
                                >
                                  <Input
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    className="h-7 text-xs"
                                    style={inputStyle}
                                    placeholder="Search icons..."
                                    autoFocus
                                  />
                                  <div className="flex flex-wrap gap-1 overflow-y-auto" style={{ maxHeight: 140 }}>
                                    {filteredIcons.map((ic) => (
                                      <button
                                        key={ic}
                                        onClick={() => {
                                          setEditData((prev) => ({ ...prev, icon: ic }))
                                          setShowIconPicker(false)
                                          setIconSearch("")
                                        }}
                                        className="px-2 py-1 text-[10px] rounded border hover:opacity-80 transition-opacity"
                                        style={{
                                          background:
                                            editData.icon === ic
                                              ? "rgba(21,101,192,0.12)"
                                              : "var(--surface-container-lowest)",
                                          borderColor: editData.icon === ic ? "var(--primary)" : "var(--outline-variant)",
                                          color: editData.icon === ic ? "var(--primary)" : "var(--on-surface)",
                                        }}
                                      >
                                        {ic}
                                      </button>
                                    ))}
                                    {filteredIcons.length === 0 && (
                                      <span className="text-[10px] py-2 px-1" style={{ color: "var(--on-surface-variant)" }}>
                                        No matches. Type an icon name manually.
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => { setShowIconPicker(false); setIconSearch("") }}
                                    className="text-[10px] self-end"
                                    style={{ color: "var(--on-surface-variant)" }}
                                  >
                                    Close
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-mono" style={{ color: item.icon ? "var(--on-surface)" : "var(--on-surface-variant)" }}>
                              {item.icon || "—"}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Logo (builders only) */}
                      {tabDef.hasLogo && (
                        <td className="px-4 py-2.5 align-top" style={{ minWidth: 260 }}>
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editData.logoUrl ?? ""}
                                  onChange={(e) =>
                                    setEditData((prev) => ({ ...prev, logoUrl: e.target.value }))
                                  }
                                  className="h-8 text-xs"
                                  style={inputStyle}
                                  placeholder="Logo URL (SVG/PNG)"
                                />
                                <button
                                  onClick={() => suggestLogo(item.id, getDisplayName(item))}
                                  disabled={aiSuggestingLogo === item.id}
                                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded shrink-0 transition-colors"
                                  style={{
                                    background: "rgba(156,39,176,0.08)",
                                    color: "#9C27B0",
                                    border: "1px solid rgba(156,39,176,0.2)",
                                  }}
                                  title="Ask DeepSeek to find logo info"
                                >
                                  {aiSuggestingLogo === item.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="size-3" />
                                  )}
                                  Find Logo
                                </button>
                              </div>
                              {/* Logo preview */}
                              {editData.logoUrl && (
                                <div
                                  className="h-10 w-24 rounded border flex items-center justify-center p-1"
                                  style={{ borderColor: "var(--outline-variant)", background: "white" }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={editData.logoUrl}
                                    alt="Logo preview"
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                  />
                                </div>
                              )}
                              {/* AI logo info */}
                              {itemLogoInfo && (
                                <div
                                  className="p-2 rounded text-[10px] flex flex-col gap-1"
                                  style={{
                                    background: "rgba(156,39,176,0.06)",
                                    border: "1px solid rgba(156,39,176,0.15)",
                                    color: "var(--on-surface)",
                                  }}
                                >
                                  <span className="flex items-center gap-1 font-semibold" style={{ color: "#9C27B0" }}>
                                    <Sparkles className="size-2.5" /> AI Logo Research
                                  </span>
                                  <span><strong>Official name:</strong> {itemLogoInfo.officialName}</span>
                                  {itemLogoInfo.website && (
                                    <span className="flex items-center gap-1">
                                      <strong>Website:</strong>
                                      <a
                                        href={itemLogoInfo.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline flex items-center gap-0.5"
                                        style={{ color: "var(--primary)" }}
                                      >
                                        {itemLogoInfo.website} <ExternalLink className="size-2.5" />
                                      </a>
                                    </span>
                                  )}
                                  <span><strong>Search:</strong> {itemLogoInfo.logoSearchQuery}</span>
                                  {itemLogoInfo.notes && <span><strong>Notes:</strong> {itemLogoInfo.notes}</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            item.logoUrl ? (
                              <div
                                className="h-8 w-20 rounded border flex items-center justify-center p-0.5"
                                style={{ borderColor: "var(--outline-variant)", background: "white" }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.logoUrl}
                                  alt="Logo"
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).replaceWith(
                                      Object.assign(document.createElement("span"), {
                                        className: "text-[10px]",
                                        textContent: "—",
                                        style: { color: "var(--on-surface-variant)" } as any,
                                      })
                                    )
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>—</span>
                            )
                          )}
                        </td>
                      )}

                      {/* Category (equipment only) */}
                      {tabDef.hasCategoryId && (
                        <td className="px-4 py-2.5 align-top">
                          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                            {item.category
                              ? (typeof item.category.name === "object"
                                  ? (item.category.name as TranslatedName).en
                                  : item.category.name) || `#${item.categoryId}`
                              : "—"}
                          </span>
                        </td>
                      )}

                      {/* Deposit Insurance (services only) */}
                      {tabDef.hasDepositInsurance && (
                        <td className="px-4 py-2.5 align-top">
                          {isEditing ? (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editData.depositInsurance ?? false}
                                onChange={(e) =>
                                  setEditData((prev) => ({ ...prev, depositInsurance: e.target.checked }))
                                }
                                className="size-3.5 rounded"
                              />
                              <span className="text-xs" style={{ color: "var(--on-surface)" }}>Yes</span>
                            </label>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full"
                              style={{
                                background: item.depositInsurance ? "rgba(45,106,79,0.12)" : "rgba(0,0,0,0.06)",
                                color: item.depositInsurance ? "#2D6A4F" : "var(--on-surface-variant)",
                              }}
                            >
                              {item.depositInsurance ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-2.5 align-top text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(item.id)}
                              disabled={isSaving}
                              className="h-7 px-3 text-xs"
                              style={{ background: "var(--primary)", color: "white" }}
                            >
                              {isSaving ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <>
                                  <Save className="size-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        ) : justSaved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#2D6A4F" }}>
                            <Check className="size-3" />
                            Saved
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(item)}
                            className="h-7 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--primary)" }}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
          Showing {filtered.length} of {items.length} {tabDef.label.toLowerCase()}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  )
}

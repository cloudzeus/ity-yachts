"use client"

import { useState } from "react"
import { Search, Package, Sailboat, Wrench, Tags } from "lucide-react"
import { Input } from "@/components/ui/input"

type IntlName = Record<string, string>

type CatalogueData = {
  categories: { id: number; name: IntlName }[]
  builders: { id: number; name: string }[]
  engineBuilders: { id: number; name: string }[]
  models: {
    id: number; name: string; loa: number | null; beam: number | null
    draft: number | null; cabins: number | null; wc: number | null
    displacement: number | null; virtualLength: number | null
    category: { id: number; name: IntlName } | null
    builder: { id: number; name: string } | null
  }[]
  sailTypes: { id: number; name: IntlName }[]
  steeringTypes: { id: number; name: IntlName }[]
  equipmentCategories: { id: number; name: IntlName }[]
  equipment: { id: number; name: IntlName; category: { id: number; name: IntlName } | null }[]
  services: { id: number; name: IntlName; depositInsurance: boolean }[]
  priceMeasures: { id: number; name: IntlName }[]
  discountItems: { id: number; name: IntlName }[]
}

const TABS = [
  { key: "types", label: "Yacht Types", icon: Sailboat },
  { key: "sails", label: "Sail & Steering", icon: Sailboat },
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "services", label: "Services & Pricing", icon: Tags },
] as const

type TabKey = (typeof TABS)[number]["key"]

function lang(obj: IntlName | null | undefined, fallback = "—"): string {
  if (!obj) return fallback
  return obj.en || obj.el || obj.de || fallback
}

function TableCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
          {title}
        </h3>
        <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          {count} items
        </span>
      </div>
      {children}
    </div>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-xs" style={{ color: "var(--on-surface)" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CatalogueClient({ data }: { data: CatalogueData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("types")
  const [search, setSearch] = useState("")

  const s = search.toLowerCase()

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderRadius: "var(--radius-xs)",
                background: activeTab === tab.key ? "var(--primary)" : "transparent",
                color: activeTab === tab.key ? "#fff" : "var(--on-surface-variant)",
              }}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}

        <div className="relative ml-auto max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
          <Input
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
      </div>

      {/* Yacht Types */}
      {activeTab === "types" && (
        <div className="flex flex-col gap-4">
          <TableCard title="Yacht Categories" count={data.categories.length}>
            <SimpleTable
              headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
              rows={data.categories
                .filter((c) => !s || lang(c.name).toLowerCase().includes(s))
                .map((c) => [c.id, c.name.en ?? "—", c.name.el ?? "—", c.name.de ?? "—"])}
            />
          </TableCard>

          <TableCard title="Yacht Builders" count={data.builders.length}>
            <SimpleTable
              headers={["ID", "Name"]}
              rows={data.builders
                .filter((b) => !s || b.name.toLowerCase().includes(s))
                .map((b) => [b.id, b.name])}
            />
          </TableCard>

          <TableCard title="Engine Builders" count={data.engineBuilders.length}>
            <SimpleTable
              headers={["ID", "Name"]}
              rows={data.engineBuilders
                .filter((b) => !s || b.name.toLowerCase().includes(s))
                .map((b) => [b.id, b.name])}
            />
          </TableCard>

          <TableCard title="Yacht Models" count={data.models.length}>
            <SimpleTable
              headers={["ID", "Name", "Builder", "Category", "LOA", "Beam", "Draft", "Cabins", "WC"]}
              rows={data.models
                .filter((m) => !s || m.name.toLowerCase().includes(s) || m.builder?.name.toLowerCase().includes(s))
                .map((m) => [
                  m.id,
                  m.name,
                  m.builder?.name ?? "—",
                  lang(m.category?.name as IntlName),
                  m.loa ? `${m.loa}m` : "—",
                  m.beam ? `${m.beam}m` : "—",
                  m.draft ? `${m.draft}m` : "—",
                  m.cabins ?? "—",
                  m.wc ?? "—",
                ])}
            />
          </TableCard>
        </div>
      )}

      {/* Sail & Steering */}
      {activeTab === "sails" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TableCard title="Sail Types" count={data.sailTypes.length}>
            <SimpleTable
              headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
              rows={data.sailTypes
                .filter((t) => !s || lang(t.name).toLowerCase().includes(s))
                .map((t) => [t.id, t.name.en ?? "—", t.name.el ?? "—", t.name.de ?? "—"])}
            />
          </TableCard>

          <TableCard title="Steering Types" count={data.steeringTypes.length}>
            <SimpleTable
              headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
              rows={data.steeringTypes
                .filter((t) => !s || lang(t.name).toLowerCase().includes(s))
                .map((t) => [t.id, t.name.en ?? "—", t.name.el ?? "—", t.name.de ?? "—"])}
            />
          </TableCard>
        </div>
      )}

      {/* Equipment */}
      {activeTab === "equipment" && (
        <div className="flex flex-col gap-4">
          <TableCard title="Equipment Categories" count={data.equipmentCategories.length}>
            <SimpleTable
              headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
              rows={data.equipmentCategories
                .filter((c) => !s || lang(c.name).toLowerCase().includes(s))
                .map((c) => [c.id, c.name.en ?? "—", c.name.el ?? "—", c.name.de ?? "—"])}
            />
          </TableCard>

          {/* Group equipment by category */}
          {data.equipmentCategories
            .filter((cat) => {
              const items = data.equipment.filter((e) => e.category?.id === cat.id)
              if (s) return items.some((e) => lang(e.name).toLowerCase().includes(s))
              return items.length > 0
            })
            .map((cat) => {
              const items = data.equipment
                .filter((e) => e.category?.id === cat.id)
                .filter((e) => !s || lang(e.name).toLowerCase().includes(s))
              return (
                <TableCard key={cat.id} title={lang(cat.name)} count={items.length}>
                  <SimpleTable
                    headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
                    rows={items.map((e) => [e.id, e.name.en ?? "—", e.name.el ?? "—", e.name.de ?? "—"])}
                  />
                </TableCard>
              )
            })}

          {/* Uncategorized equipment */}
          {(() => {
            const uncategorized = data.equipment
              .filter((e) => !e.category)
              .filter((e) => !s || lang(e.name).toLowerCase().includes(s))
            if (uncategorized.length === 0) return null
            return (
              <TableCard title="Uncategorized" count={uncategorized.length}>
                <SimpleTable
                  headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
                  rows={uncategorized.map((e) => [e.id, e.name.en ?? "—", e.name.el ?? "—", e.name.de ?? "—"])}
                />
              </TableCard>
            )
          })()}
        </div>
      )}

      {/* Services & Pricing */}
      {activeTab === "services" && (
        <div className="flex flex-col gap-4">
          <TableCard title="Services" count={data.services.length}>
            <SimpleTable
              headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)", "Deposit Insurance"]}
              rows={data.services
                .filter((sv) => !s || lang(sv.name).toLowerCase().includes(s))
                .map((sv) => [
                  sv.id,
                  sv.name.en ?? "—",
                  sv.name.el ?? "—",
                  sv.name.de ?? "—",
                  sv.depositInsurance ? "Yes" : "No",
                ])}
            />
          </TableCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TableCard title="Price Measures" count={data.priceMeasures.length}>
              <SimpleTable
                headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
                rows={data.priceMeasures
                  .filter((pm) => !s || lang(pm.name).toLowerCase().includes(s))
                  .map((pm) => [pm.id, pm.name.en ?? "—", pm.name.el ?? "—", pm.name.de ?? "—"])}
              />
            </TableCard>

            <TableCard title="Discount Items" count={data.discountItems.length}>
              <SimpleTable
                headers={["ID", "Name (EN)", "Name (EL)", "Name (DE)"]}
                rows={data.discountItems
                  .filter((d) => !s || lang(d.name).toLowerCase().includes(s))
                  .map((d) => [d.id, d.name.en ?? "—", d.name.el ?? "—", d.name.de ?? "—"])}
              />
            </TableCard>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Search, Calendar, DollarSign, Ship } from "lucide-react"
import { Input } from "@/components/ui/input"

type Price = {
  id: string
  nausysId: number | null
  yachtId: number
  yacht: { id: number; name: string }
  dateFrom: string
  dateTo: string
  price: number
  currency: string
  priceType: string
  locationsId: number[]
}

type Season = {
  id: number
  season: string
  dateFrom: string
  dateTo: string
}

type Props = {
  initialData: {
    prices: Price[]
    seasons: Season[]
    yachts: { id: number; name: string }[]
  }
}

export function PricingClient({ initialData }: Props) {
  const [filterYacht, setFilterYacht] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  const filtered = initialData.prices.filter((p) => {
    if (filterYacht && p.yachtId !== filterYacht) return false
    if (search && !p.yacht.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group prices by yacht
  const grouped = filtered.reduce<Record<number, { name: string; prices: Price[] }>>((acc, p) => {
    if (!acc[p.yachtId]) acc[p.yachtId] = { name: p.yacht.name, prices: [] }
    acc[p.yachtId].prices.push(p)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4"
            style={{ color: "var(--on-surface-variant)" }}
          />
          <Input
            placeholder="Search yachts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <select
          value={filterYacht ?? ""}
          onChange={(e) => setFilterYacht(e.target.value ? parseInt(e.target.value) : null)}
          className="h-9 px-3 text-xs rounded-md border"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          <option value="">All yachts</option>
          {initialData.yachts.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
      </div>

      {/* Seasons overview */}
      {initialData.seasons.length > 0 && (
        <div
          className="p-4"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
          >
            Seasons
          </h2>
          <div className="flex flex-wrap gap-2">
            {initialData.seasons.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 text-xs"
                style={{
                  background: "var(--surface-container)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--on-surface)",
                }}
              >
                <Calendar className="size-3" style={{ color: "var(--primary)" }} />
                <span className="font-medium">{s.season}</span>
                <span style={{ color: "var(--on-surface-variant)" }}>
                  {new Date(s.dateFrom).toLocaleDateString()} — {new Date(s.dateTo).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price tables by yacht */}
      {Object.keys(grouped).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <DollarSign className="size-10" style={{ color: "var(--outline-variant)" }} />
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            No pricing data yet. Sync from NAUSYS to import price lists.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([yachtId, { name, prices }]) => (
            <div
              key={yachtId}
              className="overflow-hidden"
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-ambient)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--outline-variant)" }}
              >
                <Ship className="size-4" style={{ color: "var(--primary)" }} />
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
                >
                  {name}
                </h3>
                <span className="text-[11px] ml-auto" style={{ color: "var(--on-surface-variant)" }}>
                  {prices.length} periods
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Period From</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Period To</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Price</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Currency</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                        <td className="px-4 py-2 text-xs" style={{ color: "var(--on-surface)" }}>
                          {new Date(p.dateFrom).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-xs" style={{ color: "var(--on-surface)" }}>
                          {new Date(p.dateTo).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-medium" style={{ color: "var(--on-surface)" }}>
                          {p.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                          {p.currency}
                        </td>
                        <td className="px-4 py-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                          {p.priceType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {filtered.length} pricing periods
      </p>
    </div>
  )
}

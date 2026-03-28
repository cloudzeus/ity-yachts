"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, RefreshCw, Eye, Ship, Anchor, Fuel, Bed,
  ChevronRight, Calendar, DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type YachtModel = {
  id: number
  name: string
  category?: { id: number; name: Record<string, string> } | null
  builder?: { id: number; name: string } | null
}

type CharterBase = {
  id: number
  location?: { id: number; name: Record<string, string> } | null
}

type Yacht = {
  id: number
  name: string
  modelId: number | null
  model: YachtModel | null
  base: CharterBase | null
  charterType: string | null
  buildYear: number | null
  cabins: number | null
  berthsTotal: number | null
  maxPersons: number | null
  loa: number | null
  beam: number | null
  engines: number | null
  enginePower: number | null
  fuelType: string | null
  mainPictureUrl: string | null
  isPremium: boolean
  deposit: number | null
  depositCurrency: string | null
  commission: number | null
  _count: { equipment: number; cabinDefinitions: number; prices: number }
  createdAt: string
  updatedAt: string
}

type SyncLog = {
  id: string
  syncType: string
  status: string
  itemCount: number
  startedAt: string
  completedAt: string | null
}

type Props = {
  initialData: {
    yachts: Yacht[]
    total: number
    lastSync: SyncLog | null
  }
}

export function FleetClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.yachts)
  const [total] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [syncing, setSyncing] = useState(false)

  const filtered = search
    ? data.filter(
        (y) =>
          y.name.toLowerCase().includes(search.toLowerCase()) ||
          y.model?.name?.toLowerCase().includes(search.toLowerCase()) ||
          y.model?.builder?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await fetch("/api/admin/fleet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "FULL" }),
      })
      router.refresh()
    } finally {
      setSyncing(false)
    }
  }, [router])

  const lang = (obj: Record<string, string> | null | undefined, fallback = "—") =>
    obj?.en || obj?.el || obj?.de || fallback

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
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 text-xs"
          style={{ borderColor: "var(--outline-variant)" }}
          disabled={syncing}
          onClick={handleSync}
        >
          <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync NAUSYS"}
        </Button>
      </div>

      {/* Sync info */}
      {initialData.lastSync && (
        <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          Last sync: {new Date(initialData.lastSync.startedAt).toLocaleString()} —{" "}
          <span
            style={{
              color:
                initialData.lastSync.status === "completed"
                  ? "#2D6A4F"
                  : initialData.lastSync.status === "failed"
                  ? "#D32F2F"
                  : "var(--on-surface-variant)",
            }}
          >
            {initialData.lastSync.status}
          </span>
        </p>
      )}

      {/* Fleet grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <Ship className="size-10" style={{ color: "var(--outline-variant)" }} />
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {total === 0
              ? "No yachts yet. Click \"Sync NAUSYS\" to import your fleet."
              : "No yachts match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((yacht) => (
            <button
              key={yacht.id}
              onClick={() => router.push(`/admin/fleet/${yacht.id}`)}
              className="flex flex-col text-left transition-shadow hover:shadow-md"
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-ambient)",
                overflow: "hidden",
              }}
            >
              {/* Image */}
              <div
                className="relative h-40 w-full bg-cover bg-center"
                style={{
                  backgroundImage: yacht.mainPictureUrl
                    ? `url(${yacht.mainPictureUrl}?w=600)`
                    : undefined,
                  background: yacht.mainPictureUrl
                    ? undefined
                    : "var(--surface-container)",
                }}
              >
                {!yacht.mainPictureUrl && (
                  <div className="flex items-center justify-center h-full">
                    <Ship className="size-10" style={{ color: "var(--outline-variant)" }} />
                  </div>
                )}
                {yacht.isPremium && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                    style={{
                      background: "var(--gradient-ocean)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    Premium
                  </span>
                )}
                {yacht.charterType && (
                  <span
                    className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(0,0,0,0.55)",
                      color: "#fff",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    {yacht.charterType}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-sm font-semibold leading-tight"
                      style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
                    >
                      {yacht.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                      {yacht.model?.builder?.name} {yacht.model?.name}
                      {yacht.buildYear ? ` (${yacht.buildYear})` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 mt-0.5 shrink-0" style={{ color: "var(--outline-variant)" }} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {yacht.cabins != null && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <Bed className="size-3.5" />
                      <span>{yacht.cabins} cab</span>
                    </div>
                  )}
                  {yacht.maxPersons != null && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <span>{yacht.maxPersons} pax</span>
                    </div>
                  )}
                  {yacht.loa != null && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <Anchor className="size-3.5" />
                      <span>{yacht.loa}m</span>
                    </div>
                  )}
                  {yacht.enginePower != null && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <Fuel className="size-3.5" />
                      <span>{yacht.enginePower}hp</span>
                    </div>
                  )}
                </div>

                {/* Location & pricing info */}
                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                  <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                    {lang(yacht.base?.location?.name as Record<string, string>, "No base")}
                  </p>
                  <div className="flex items-center gap-2">
                    {yacht._count.prices > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px]" style={{ color: "#2D6A4F" }}>
                        <DollarSign className="size-3" />
                        {yacht._count.prices} periods
                      </span>
                    )}
                    {yacht._count.equipment > 0 && (
                      <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                        {yacht._count.equipment} equip
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {filtered.length} of {total} yachts
      </p>
    </div>
  )
}

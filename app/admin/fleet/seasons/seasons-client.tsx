"use client"

import { useState } from "react"
import { Calendar, Ship, ChevronDown, ChevronRight, Star } from "lucide-react"

type Season = {
  id: number
  season: string
  companyId: number | null
  dateFrom: string
  dateTo: string
  defaultSeason: boolean
  locationsId: number[]
  yachtCount: number
}

type YachtSeason = {
  seasonId: number
  yachtId: number
  yachtName: string
}

type Props = {
  data: {
    seasons: Season[]
    yachtSeasons: YachtSeason[]
    totalYachts: number
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function durationDays(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// Color palette for season bars
const SEASON_COLORS = [
  "#1B4965", "#5FA8D3", "#62B6CB", "#BEE9E8",
  "#CAE9FF", "#D4A373", "#FAEDCD", "#E9EDC9",
  "#CCD5AE", "#FEFAE0",
]

export function SeasonsClient({ data }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (data.seasons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3"
        style={{
          background: "var(--surface-container-lowest)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <Calendar className="size-10" style={{ color: "var(--outline-variant)" }} />
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          No seasons defined yet. Sync from NAUSYS to import season data.
        </p>
      </div>
    )
  }

  // Find the full year range across all seasons
  const allDates = data.seasons.flatMap((s) => [new Date(s.dateFrom), new Date(s.dateTo)])
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const totalRange = maxDate.getTime() - minDate.getTime()

  return (
    <div className="flex flex-col gap-4">
      {/* Timeline visualization */}
      <div
        className="p-4"
        style={{
          background: "var(--surface-container-lowest)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
          Season Timeline
        </h2>

        {/* Month labels */}
        <div className="relative h-6 mb-1">
          {(() => {
            const months: { label: string; left: number }[] = []
            const d = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
            while (d <= maxDate) {
              const pos = ((d.getTime() - minDate.getTime()) / totalRange) * 100
              months.push({
                label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
                left: pos,
              })
              d.setMonth(d.getMonth() + 1)
            }
            return months.map((m, i) => (
              <span
                key={i}
                className="absolute text-[10px]"
                style={{ left: `${Math.min(m.left, 95)}%`, color: "var(--on-surface-variant)" }}
              >
                {m.label}
              </span>
            ))
          })()}
        </div>

        {/* Season bars */}
        <div className="flex flex-col gap-1.5">
          {data.seasons.map((season, i) => {
            const left = ((new Date(season.dateFrom).getTime() - minDate.getTime()) / totalRange) * 100
            const width = ((new Date(season.dateTo).getTime() - new Date(season.dateFrom).getTime()) / totalRange) * 100
            const color = SEASON_COLORS[i % SEASON_COLORS.length]
            return (
              <div key={season.id} className="relative h-7">
                <div
                  className="absolute h-full flex items-center px-2 text-[10px] font-medium truncate cursor-pointer"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 2)}%`,
                    background: color,
                    borderRadius: "var(--radius-xs)",
                    color: i < 4 ? "#fff" : "#1a1a1a",
                  }}
                  onClick={() => setExpandedId(expandedId === season.id ? null : season.id)}
                  title={`${season.season}: ${formatDate(season.dateFrom)} — ${formatDate(season.dateTo)}`}
                >
                  {season.season}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Season cards */}
      <div className="flex flex-col gap-3">
        {data.seasons.map((season, i) => {
          const isExpanded = expandedId === season.id
          const yachtsInSeason = data.yachtSeasons.filter((ys) => ys.seasonId === season.id)
          const days = durationDays(season.dateFrom, season.dateTo)

          return (
            <div
              key={season.id}
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-ambient)",
                overflow: "hidden",
                borderLeft: `4px solid ${SEASON_COLORS[i % SEASON_COLORS.length]}`,
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : season.id)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
              >
                {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                      {season.season}
                    </span>
                    {season.defaultSeason && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5" style={{ background: "rgba(245,158,11,0.12)", color: "#D97706", borderRadius: "var(--radius-xs)" }}>
                        <Star className="size-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                    {formatDate(season.dateFrom)} — {formatDate(season.dateTo)} ({days} days)
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--on-surface-variant)" }}>
                  <Ship className="size-3.5" />
                  {season.yachtCount} yacht{season.yachtCount !== 1 ? "s" : ""}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 text-xs">
                    <div style={{ color: "var(--on-surface-variant)" }}>
                      Season ID: <span className="font-mono font-medium" style={{ color: "var(--on-surface)" }}>{season.id}</span>
                    </div>
                    {season.companyId && (
                      <div style={{ color: "var(--on-surface-variant)" }}>
                        Company ID: <span className="font-mono font-medium" style={{ color: "var(--on-surface)" }}>{season.companyId}</span>
                      </div>
                    )}
                    {season.locationsId.length > 0 && (
                      <div style={{ color: "var(--on-surface-variant)" }}>
                        Locations: <span className="font-medium" style={{ color: "var(--on-surface)" }}>{season.locationsId.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {yachtsInSeason.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                        Yachts in this season
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {yachtsInSeason.map((ys) => (
                          <span
                            key={ys.yachtId}
                            className="px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: "var(--surface-container)", borderRadius: "var(--radius-xs)", color: "var(--on-surface)" }}
                          >
                            {ys.yachtName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

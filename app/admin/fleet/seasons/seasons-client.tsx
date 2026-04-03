"use client"

import { useState, useEffect } from "react"
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function days(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
}

const COLORS = [
  "#1B4965", "#5FA8D3", "#62B6CB", "#0E7C7B", "#17A398",
  "#D4A373", "#2A6F97", "#468FAF", "#61A5C2", "#89C2D9",
]

export function SeasonsClient({ data }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [nowTs, setNowTs] = useState<number | null>(null)

  // Only compute "now" on client to avoid hydration mismatch
  useEffect(() => { setNowTs(Date.now()) }, [])

  function getStatus(from: string, to: string) {
    if (nowTs === null) return "unknown"
    const f = new Date(from).getTime()
    const t = new Date(to).getTime()
    if (nowTs >= f && nowTs <= t) return "active"
    if (f > nowTs) return "upcoming"
    return "past"
  }

  // Before client mount, show all. After mount, filter.
  const visible = nowTs === null
    ? data.seasons
    : showPast
      ? data.seasons
      : data.seasons.filter((s) => getStatus(s.dateFrom, s.dateTo) !== "past")

  const activeFutureCount = nowTs === null
    ? data.seasons.length
    : data.seasons.filter((s) => getStatus(s.dateFrom, s.dateTo) !== "past").length

  if (data.seasons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3"
        style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}
      >
        <Calendar className="size-10" style={{ color: "var(--outline-variant)" }} />
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          No seasons defined yet. Sync from NAUSYS to import season data.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPast(false)}
          className="px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: !showPast ? "var(--primary)" : "var(--surface-container)",
            color: !showPast ? "#fff" : "var(--on-surface-variant)",
            borderRadius: "var(--radius-xs)",
          }}
        >
          Active & Upcoming ({activeFutureCount})
        </button>
        <button
          onClick={() => setShowPast(true)}
          className="px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: showPast ? "var(--primary)" : "var(--surface-container)",
            color: showPast ? "#fff" : "var(--on-surface-variant)",
            borderRadius: "var(--radius-xs)",
          }}
        >
          All Seasons ({data.seasons.length})
        </button>
      </div>

      {/* Table */}
      <div
        style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Season</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>From</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>To</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Days</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Yachts</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}>Status</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {visible.map((season) => {
              const s = getStatus(season.dateFrom, season.dateTo)
              const isExpanded = expandedId === season.id
              const yachtsInSeason = data.yachtSeasons.filter((ys) => ys.seasonId === season.id)
              const colorIdx = data.seasons.indexOf(season) % COLORS.length

              return (
                <tr
                  key={season.id}
                  className={`cursor-pointer transition-colors hover:bg-black/[0.02] ${isExpanded ? "bg-black/[0.02]" : ""}`}
                  style={{ borderBottom: "1px solid var(--outline-variant)" }}
                  onClick={() => setExpandedId(isExpanded ? null : season.id)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 shrink-0 rounded-sm" style={{ background: COLORS[colorIdx] }} />
                      <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                        {season.season}
                      </span>
                      {season.defaultSeason && (
                        <Star className="size-3 shrink-0" style={{ color: "#D97706" }} fill="#D97706" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs" style={{ color: "var(--on-surface)" }}>{fmtDate(season.dateFrom)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs" style={{ color: "var(--on-surface)" }}>{fmtDate(season.dateTo)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                      {days(season.dateFrom, season.dateTo)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                      <Ship className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                      {season.yachtCount}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {s === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5" style={{ background: "rgba(16,185,129,0.12)", color: "#059669", borderRadius: "var(--radius-xs)" }}>
                        <span className="size-1.5 rounded-full" style={{ background: "#059669" }} />
                        Active
                      </span>
                    ) : s === "upcoming" ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB", borderRadius: "var(--radius-xs)" }}>
                        Upcoming
                      </span>
                    ) : s === "past" ? (
                      <span className="text-[10px] font-medium px-2 py-0.5" style={{ background: "rgba(117,117,117,0.08)", color: "#9CA3AF", borderRadius: "var(--radius-xs)" }}>
                        Past
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {isExpanded
                      ? <ChevronDown className="size-4 inline-block" style={{ color: "var(--on-surface-variant)" }} />
                      : <ChevronRight className="size-4 inline-block" style={{ color: "var(--on-surface-variant)" }} />
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded detail */}
      {expandedId && (() => {
        const season = data.seasons.find((s) => s.id === expandedId)
        if (!season) return null
        const yachtsInSeason = data.yachtSeasons.filter((ys) => ys.seasonId === expandedId)
        const colorIdx = data.seasons.indexOf(season) % COLORS.length

        return (
          <div
            className="p-4"
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-ambient)",
              borderLeft: `4px solid ${COLORS[colorIdx]}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                {season.season}
              </h3>
              <button
                onClick={() => setExpandedId(null)}
                className="text-xs px-2 py-1 hover:bg-black/[0.04] transition-colors"
                style={{ color: "var(--on-surface-variant)", borderRadius: "var(--radius-xs)" }}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "var(--on-surface-variant)" }}>Period</span>
                <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{fmtDate(season.dateFrom)} — {fmtDate(season.dateTo)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "var(--on-surface-variant)" }}>Duration</span>
                <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{days(season.dateFrom, season.dateTo)} days</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "var(--on-surface-variant)" }}>Season ID</span>
                <span className="text-xs font-mono font-medium" style={{ color: "var(--on-surface)" }}>{season.id}</span>
              </div>
              {season.companyId && (
                <div>
                  <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "var(--on-surface-variant)" }}>Company ID</span>
                  <span className="text-xs font-mono font-medium" style={{ color: "var(--on-surface)" }}>{season.companyId}</span>
                </div>
              )}
            </div>

            {yachtsInSeason.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wide font-semibold block mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  Yachts ({yachtsInSeason.length})
                </span>
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
        )
      })()}

      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        Showing {visible.length} of {data.seasons.length} seasons
      </p>
    </div>
  )
}

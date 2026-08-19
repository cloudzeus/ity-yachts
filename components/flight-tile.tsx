"use client"

import { useEffect, useState } from "react"
import Link from "@/components/locale-link"
import { ArrowUpRight } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { FlightBoard, type BoardRow } from "@/components/flight-board"

/**
 * The split-flap, shrunk to a card.
 *
 * The full board on /getting-here carries four lines and a header. Here it
 * keeps two — where the flight comes from, and when it lands — because the
 * tile is not the answer, it is the reason to go and read the answer. It sits
 * in a grid beside the weather panel and the service cards and has to hold
 * their proportions, not its own.
 *
 * Data comes from our own table through /api/flights/board, fetched the way
 * the weather panel next to it fetches its own. Nothing here touches the
 * AviationStack quota; the daily job spends that.
 *
 * Renders nothing at all until there are flights. A departure board with no
 * departures reads as broken rather than as empty.
 */
export function FlightTile({ className = "" }: { className?: string }) {
  const { t } = useTranslations()
  const [rows, setRows] = useState<BoardRow[]>([])

  useEffect(() => {
    let alive = true
    fetch("/api/flights/board")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setRows(d.rows ?? [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!rows.length) return null

  return (
    <Link
      href="/getting-here"
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-7 transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none ${className}`}
      style={{
        background: "linear-gradient(158deg, var(--iyc-ionian-800), var(--iyc-ionian-900))",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <span
            className="block text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--iyc-sun-500)" }}
          >
            {t("home.flights.eyebrow", "Getting here")}
          </span>
          <h3
            className="mt-2 text-xl font-semibold leading-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("home.flights.title", "Direct to Preveza")}
          </h3>
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
          style={{ color: "rgba(255,255,255,0.55)" }}
        />
      </div>

      {/* Two lines and no frame: the board is the texture of this card, not a
          panel sitting inside it. */}
      <FlightBoard
        rows={rows}
        lines={["from", "when"]}
        width={14}
        compact
        intervalMs={3600}
        className="w-full"
      />

      <p className="mt-5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.66)" }}>
        {t(
          "home.flights.body",
          "Most of Europe flies here directly in summer. Twenty minutes from the airport to our pontoon."
        )}
      </p>
    </Link>
  )
}

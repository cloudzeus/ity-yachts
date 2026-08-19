"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A split-flap board, of the kind that used to clatter above an airport
 * concourse.
 *
 * It cycles through the real flights into Preveza. The point is not decoration
 * — it is that a reader watching it for ten seconds understands, without being
 * told, that a great many places fly here directly.
 *
 * Built from scratch rather than pulled in: the effect is one timer and a
 * character index, and a dependency for that would weigh more than the code.
 *
 * The flap is honest about what it is. Each cell steps through the alphabet
 * from where it stands to where it is going, and columns start a beat apart,
 * so the change ripples left to right the way the mechanical ones did — rather
 * than every letter landing at once, which reads as a fade and not a flap.
 */

/** The order matters: cells travel through it, so it is the physical drum. */
const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-·"

/** How long one flap takes, and how far apart the columns start. */
const FLAP_MS = 45
const COLUMN_STAGGER_MS = 28

export interface BoardRow {
  /** Left column — where the flight comes from. */
  from: string
  /** Middle — who flies it. */
  airline: string
  /** The date it next flies, e.g. "SAT 05 SEP 2026". */
  date: string
  /** Right — departure and arrival times, already formatted. */
  when: string
  /** Flight number, shown small; not flapped. */
  code?: string
}

export function FlightBoard({
  rows,
  intervalMs = 4200,
  className,
}: {
  rows: BoardRow[]
  intervalMs?: number
  className?: string
}) {
  const [index, setIndex] = useState(0)

  /* Nothing to show, and no board either — an empty split-flap frame looks
     broken rather than empty. */
  useEffect(() => {
    if (rows.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % rows.length), intervalMs)
    return () => clearInterval(id)
  }, [rows.length, intervalMs])

  if (!rows.length) return null
  const row = rows[index % rows.length]

  return (
    <div
      className={className}
      role="marquee"
      aria-live="polite"
      aria-label={`${row.from} — ${row.airline} — ${row.date} ${row.when}`}
      style={{
        /* The brand's own deep sea and raised inverse, not a generic board
           black — this sits on the same pages as everything else. */
        background:
          "linear-gradient(180deg, var(--surface-inverse-raised) 0%, var(--surface-inverse) 100%)",
        border: "1px solid color-mix(in srgb, var(--iyc-sand-50) 10%, transparent)",
        borderRadius: "var(--iyc-radius-md)",
        padding: "1.25rem 1.25rem 1rem",
        boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--iyc-sand-50) 6%, transparent)",
      }}
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.25em]"
          style={{ color: "color-mix(in srgb, var(--iyc-sand-50) 45%, transparent)" }}
        >
          Preveza · Arrivals
        </span>
        {row.code && (
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] tabular-nums"
            style={{ color: "color-mix(in srgb, var(--iyc-sand-50) 45%, transparent)" }}
          >
            {row.code}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Flaps text={row.from} width={18} tone="bright" />
        <Flaps text={row.airline} width={18} tone="dim" />
        <Flaps text={row.date} width={18} tone="dim" />
        <Flaps text={row.when} width={18} tone="accent" />
      </div>
    </div>
  )
}

/* Brand tokens: sand for the type, Ionian sunset for the times. */
const TONES = {
  bright: "var(--iyc-sand-50)",
  dim: "color-mix(in srgb, var(--iyc-sand-50) 62%, transparent)",
  accent: "var(--iyc-sun-500)",
} as const

function Flaps({
  text,
  width,
  tone,
}: {
  text: string
  width: number
  tone: keyof typeof TONES
}) {
  /* The drum has no umlauts. Düsseldorf arrived as "D SSELDORF" because ü is
     not on it, so accents are folded to their base letter and ß spelled out
     before anything is measured. */
  const target = text
    .replace(/ß/gi, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .slice(0, width)
    .padEnd(width, " ")
  return (
    <div className="flex gap-[2px] overflow-hidden">
      {Array.from({ length: width }, (_, i) => (
        <Cell key={i} target={target[i]} delay={i * COLUMN_STAGGER_MS} color={TONES[tone]} />
      ))}
    </div>
  )
}

function Cell({ target, delay, color }: { target: string; delay: number; color: string }) {
  const [shown, setShown] = useState(" ")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wanted = CHARS.includes(target) ? target : " "
    if (wanted === shown) return

    /* Somebody who has asked for less motion gets the answer, not the
       machinery. */
    const still =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (still) {
      setShown(wanted)
      return
    }

    let cancelled = false
    const step = () => {
      if (cancelled) return
      setShown((current) => {
        if (current === wanted) return current
        const next = CHARS[(CHARS.indexOf(current) + 1) % CHARS.length]
        timer.current = setTimeout(step, FLAP_MS)
        return next
      })
    }
    timer.current = setTimeout(step, delay)

    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
    // `shown` is deliberately not a dependency: it changes on every flap and
    // would restart the animation it is driving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay])

  return (
    <span
      aria-hidden="true"
      className="relative flex items-center justify-center font-mono text-sm md:text-base tabular-nums select-none"
      style={{
        width: "1.05em",
        height: "1.6em",
        color,
        borderRadius: "2px",
        /* The seam across the middle is what makes it read as a flap rather
           than a tile. Both halves are mixed from the brand's deep sea so the
           board belongs to the palette instead of sitting on top of it. */
        backgroundImage:
          "linear-gradient(180deg," +
          " color-mix(in srgb, var(--iyc-ionian-800) 55%, var(--iyc-ionian-900)) 0%," +
          " color-mix(in srgb, var(--iyc-ionian-800) 55%, var(--iyc-ionian-900)) 49.5%," +
          " rgba(0,0,0,0.45) 50%," +
          " var(--iyc-ionian-900) 50.5%," +
          " var(--iyc-ionian-900) 100%)",
      }}
    >
      {shown}
    </span>
  )
}

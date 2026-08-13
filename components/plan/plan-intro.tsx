"use client"

import { useTranslations } from "@/lib/use-translations"

interface MottoRow {
  heading: unknown
  subheading: unknown
  subtext: unknown
}

/**
 * The hero copy above the conversation, fed by the motto so it stays editable
 * in /admin/mottos rather than living in this file.
 */
export function PlanIntro({ motto }: { motto: MottoRow | null }) {
  const { t, tUpper, locale } = useTranslations()

  const r = (v: unknown, fallback: string) => {
    const o = (typeof v === "string" ? safeParse(v) : v) as Record<string, string> | null
    return o?.[locale]?.trim() || o?.en?.trim() || fallback
  }

  return (
    <>
      <span
        className="mb-5 inline-block rounded-[var(--iyc-radius-sm)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.88)" }}
      >
        {tUpper("plan.eyebrow", "No obligation")}
      </span>

      <h1
        className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] text-white"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
      >
        {r(motto?.heading, t("plan.title", "Let us plan it with you"))}
      </h1>

      <p className="mt-5 max-w-[48ch] text-[1.0625rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
        {r(motto?.subheading, t("plan.lead", "A few questions — when, who is coming, how you like to sail. Then we answer personally with the boat that fits."))}
      </p>
    </>
  )
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

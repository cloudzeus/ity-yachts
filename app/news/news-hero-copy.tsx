"use client"

import { useTranslations } from "@/lib/use-translations"

interface MottoRow { heading: unknown; subheading: unknown }

/** Hero copy, fed by the motto so it stays editable in /admin/mottos. */
export function NewsHeroCopy({ motto }: { motto: MottoRow | null }) {
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
        {tUpper("news.eyebrow", "From the logbook")}
      </span>

      <h1
        className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] text-white"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
      >
        {r(motto?.heading, t("news.title", "Latest news"))}
      </h1>

      <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
        {r(motto?.subheading, t("news.lead", "Winds, anchorages, boats and what a week aboard is actually like — written by the people who sail here."))}
      </p>
    </>
  )
}

function safeParse(s: string) {
  try { return JSON.parse(s) } catch { return null }
}

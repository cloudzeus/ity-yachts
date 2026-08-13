"use client"

import { useTranslations } from "@/lib/use-translations"
import type { Category } from "@/lib/consent"
import { useConsent } from "./consent-provider"

/**
 * Holds back an embed until its category is allowed.
 *
 * A Google Map is a third party that sets its own cookies the moment it loads,
 * so it cannot render before consent. Rather than showing nothing, this puts a
 * placeholder in its place with two ways forward: load it once, or turn the
 * category on for good.
 *
 * "Load once" deliberately does not write consent — a single look at a map is
 * not agreement to every map on the site.
 */
export function ConsentGate({
  category,
  title,
  children,
  minHeight = 320,
}: {
  category: Category
  /** What is being held back, in the reader's words. */
  title?: string
  children: React.ReactNode
  minHeight?: number
}) {
  const { t } = useTranslations()
  const { allows, ready, save, consent, openPreferences } = useConsent()

  // Nothing until the stored choice is read, or the placeholder flashes.
  if (!ready) return <div style={{ minHeight }} />

  if (allows(category)) return <>{children}</>

  const label = title || t("consent.gate.mapTitle", "Map")

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-10 text-center"
      style={{ minHeight, background: "var(--surface-sunken)", border: "1px dashed var(--border-hairline)" }}
    >
      <div>
        <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
          {t("consent.gate.title", "{item} is switched off").replace("{item}", label)}
        </p>
        <p className="mx-auto max-w-[46ch] text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("consent.gate.body", "Loading it lets Google set cookies in your browser, so we do not do it without asking.")}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => save({ ...(consent ?? { necessary: true, analytics: false, marketing: false, maps: false }), necessary: true, [category]: true })}
          className="rounded-[var(--iyc-radius-sm)] px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
        >
          {t("consent.gate.allow", "Allow and load")}
        </button>
        <button
          onClick={openPreferences}
          className="rounded-[var(--iyc-radius-sm)] px-4 py-2.5 text-sm underline underline-offset-2"
          style={{ color: "var(--text-muted)" }}
        >
          {t("consent.gate.settings", "Cookie settings")}
        </button>
      </div>
    </div>
  )
}

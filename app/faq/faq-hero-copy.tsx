"use client"

import { useTranslations } from "@/lib/use-translations"

/**
 * Hero copy for the answers page.
 *
 * The page itself is a server component, so this exists for the same reason
 * `NewsHeroCopy` does: the two lines have to read in the visitor's language,
 * and the translation hook only runs on the client.
 */
export function FaqHeroCopy() {
  const { t } = useTranslations()

  return (
    <>
      <h1
        className="text-[clamp(2.1rem,4.4vw,3.25rem)] font-light leading-[1.08] text-white"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
      >
        {t("faq.hero.heading", "Chartering in Lefkada, answered")}
      </h1>
      <p className="mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
        {t(
          "faq.hero.sub",
          "What people ask us before they book — licences, getting here, when to sail, and what a week actually costs."
        )}
      </p>
    </>
  )
}

"use client"

import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

/**
 * The page's own question, answered in one paragraph, near the top.
 *
 * These pages open with a motto and a search form and never say plainly what
 * the business is or what the page contains — a reader works it out from the
 * cards below, and an answer engine has nothing short enough to quote. This is
 * that missing paragraph: roughly fifty words, self-contained, factual.
 *
 * Deliberately not a boxed "Quick answer" widget. A standfirst is what an
 * editor would have written here anyway, and it reads as design rather than as
 * something bolted on for a crawler.
 */
export function AnswerBlock({
  eyebrowKey,
  eyebrowFallback,
  bodyKey,
  bodyFallback,
}: {
  eyebrowKey: string
  eyebrowFallback: string
  bodyKey: string
  bodyFallback: string
}) {
  const { t } = useTranslations()

  return (
    <section style={{ background: "var(--surface-page)" }}>
      <div className="mx-auto w-full max-w-[760px] px-6 py-16 md:py-20">
        <p
          className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "var(--iyc-ionian-600)" }}
        >
          {removeGreekTonos(t(eyebrowKey, eyebrowFallback))}
        </p>
        <p
          className="text-[1.15rem] leading-[1.75] md:text-[1.25rem]"
          style={{ color: "var(--text-body)", textWrap: "pretty" }}
        >
          {t(bodyKey, bodyFallback)}
        </p>
      </div>
    </section>
  )
}

"use client"

import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

/**
 * The page's own question, answered in one paragraph, near the top.
 *
 * Typeset as a standfirst, not as body copy. The first version set fifty words
 * of body text in a 760px column while every section around it ran a 1280px
 * container on wider gutters — so it aligned with nothing above or below it
 * and read as a paste, not as part of the page. It now borrows the section
 * idiom exactly: the caller passes its own page's container, the label uses
 * the brand eyebrow, and the sentence itself is set in the display face at a
 * weight below the headings so it leads into them instead of competing.
 */
export function AnswerBlock({
  eyebrowKey,
  eyebrowFallback,
  bodyKey,
  bodyFallback,
  /* The container of the section this sits above. Alignment is the whole
     point — a different width here is immediately visible as a broken edge. */
  container = "mx-auto w-full max-w-[1280px] px-6 md:px-10",
  spacing = "pt-20 pb-10 md:pt-24 md:pb-12",
  background = "var(--surface-page)",
}: {
  eyebrowKey: string
  eyebrowFallback: string
  bodyKey: string
  bodyFallback: string
  container?: string
  spacing?: string
  background?: string
}) {
  const { t, tUpper } = useTranslations()

  return (
    <section className="relative w-full" style={{ background }}>
      <div className={`${container} ${spacing}`}>
        <div className="max-w-3xl">
          <span className="label-sm mb-4 block" style={{ color: "var(--iyc-taupe-500)" }}>
            {removeGreekTonos(tUpper(eyebrowKey, eyebrowFallback))}
          </span>
          <p
            className="text-[clamp(1.15rem,2.05vw,1.6rem)] font-light"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-heading)",
              lineHeight: 1.5,
              letterSpacing: "0.01em",
              textWrap: "pretty",
            }}
          >
            {t(bodyKey, bodyFallback)}
          </p>
        </div>
      </div>
    </section>
  )
}

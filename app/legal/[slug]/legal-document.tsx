"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { openConsentPreferences } from "@/components/consent/consent-provider"
import type { LegalPage } from "./page"

/**
 * A legal document.
 *
 * Set narrow and quiet on the page ground rather than under a photograph: this
 * is the page somebody reads when they want to know what happens to their
 * data, and it should look like a document, not like marketing.
 */
export function LegalDocument({
  page,
  others,
}: {
  page: LegalPage
  others: { slug: string; title: Record<string, string> }[]
}) {
  const { t, locale } = useTranslations()
  const r = (v: Record<string, string> | undefined, fallback = "") =>
    v?.[locale]?.trim() || v?.en?.trim() || fallback

  const title = r(page.title, page.slug)
  const body = r(page.content)

  /* A policy that exists only in English is worse read in English than not
     read at all, so say so rather than silently serving the wrong language. */
  const translated = Boolean(page.content?.[locale]?.trim())

  return (
    <>
      <article className="mx-auto w-full max-w-[760px] px-6 pb-20 pt-32 md:pt-40">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "var(--iyc-ionian-600)" }}
        >
          {t("legal.eyebrow", "Legal")}
        </p>

        <h1
          className="mb-8 text-[clamp(1.9rem,3.6vw,2.8rem)] font-light leading-[1.1]"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
        >
          {title}
        </h1>

        {!translated && (
          <p
            className="mb-8 rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{ background: "var(--surface-sunken)", color: "var(--text-muted)" }}
          >
            {t("legal.notTranslated", "This document has not been translated yet, so it is shown in English.")}
          </p>
        )}

        <div
          className="iyc-prose iyc-prose--plain text-[1.02rem] leading-[1.8]"
          style={{ color: "var(--text-body)" }}
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {/* Withdrawing consent has to be reachable from the policy that
            explains it, not only from the footer. */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border-hairline)" }}>
          <button
            onClick={openConsentPreferences}
            className="rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold"
            style={{ border: "1px solid var(--border-hairline)", color: "var(--text-body)", fontFamily: "var(--font-display)" }}
          >
            {t("consent.settings", "Cookie settings")}
          </button>
        </div>

        {others.length > 0 && (
          <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/legal/${o.slug}`}
                className="text-sm underline underline-offset-2"
                style={{ color: "var(--text-link)" }}
              >
                {r(o.title, o.slug)}
              </Link>
            ))}
          </nav>
        )}
      </article>
    </>
  )
}

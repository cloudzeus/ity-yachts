"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import type { FaqEntry } from "@/lib/faqs"

/**
 * The questions people ask before booking, on the page.
 *
 * Answers are open, not folded into an accordion. A collapsed answer is still
 * in the HTML, but the point of this section is that a reader — and a model
 * summarising the page — meets the answer directly, and a question you have to
 * click is one more thing between them and it.
 *
 * The headings are real questions in the reader's own words, because that is
 * what a search or a chatbot prompt looks like.
 */
export function FaqSection({ faqs }: { faqs: FaqEntry[] }) {
  const { t, tUpper, locale } = useTranslations()
  if (!faqs.length) return null

  const r = (v: Record<string, string>) => v?.[locale]?.trim() || v?.en?.trim() || ""

  return (
    <section className="relative w-full" style={{ background: "var(--surface-sunken)" }}>
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20 md:px-10 md:py-24">
        <div className="mb-12 max-w-[46rem]">
          <span className="label-sm mb-3 block" style={{ color: "var(--iyc-taupe-500)" }}>
            {tUpper("home.faq.eyebrow", "Before you book")}
          </span>
          <h2 className="section-heading" style={{ color: "var(--text-heading)" }}>
            <span className="font-light">{t("home.faq.headingLead", "Questions we")}</span>{" "}
            <span className="font-extrabold" style={{ color: "var(--iyc-ionian-600)" }}>
              {t("home.faq.headingAccent", "are asked")}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.id}>
              {/* A real H3 carrying a real question: this is the string a
                  search or a chatbot prompt is shaped like. */}
              <h3
                className="mb-3 text-[1.15rem] leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
              >
                {r(faq.question)}
              </h3>
              <p className="max-w-[62ch] text-[1rem] leading-[1.75]" style={{ color: "var(--text-body)" }}>
                {r(faq.answer)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
          >
            {removeGreekTonos(t("home.faq.viewAll", "All the practical questions"))}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

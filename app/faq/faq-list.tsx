"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import { TOPIC_LABELS } from "@/lib/faq-topics"
import type { FaqEntry } from "@/lib/faqs"

/**
 * Every question, grouped by topic.
 *
 * Answers are open rather than in an accordion. Collapsed text is still in the
 * HTML and Google reads it, but this page exists to be the thing that answers
 * a question — putting a click in front of the answer works against that, and
 * several answer engines weight visible text over hidden.
 */
export function FaqList({ faqs }: { faqs: FaqEntry[] }) {
  const { locale } = useTranslations()
  const r = (v: Record<string, string> | undefined) => v?.[locale]?.trim() || v?.en?.trim() || ""

  // Grouped in the order the topics first appear, so the sort order still leads.
  const groups: { topic: string; items: FaqEntry[] }[] = []
  for (const faq of faqs) {
    const found = groups.find((g) => g.topic === faq.topic)
    if (found) found.items.push(faq)
    else groups.push({ topic: faq.topic, items: [faq] })
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24">
      {groups.map((group) => (
        <section key={group.topic} className="mb-14 last:mb-0">
          <h2
            className="mb-8 pb-3 text-[0.78rem] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--iyc-ionian-600)", borderBottom: "1px solid var(--border-hairline)" }}
          >
            {removeGreekTonos(r(TOPIC_LABELS[group.topic]) || group.topic)}
          </h2>

          <div className="flex flex-col gap-9">
            {group.items.map((faq) => (
              <div key={faq.id}>
                <h3
                  className="mb-3 text-[1.2rem] leading-snug"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
                >
                  {r(faq.question)}
                </h3>
                <p className="text-[1.02rem] leading-[1.8]" style={{ color: "var(--text-body)" }}>
                  {r(faq.answer)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div
        className="mt-16 rounded-2xl p-7 text-center"
        style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}
      >
        <p className="mb-5 text-[1.05rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
          Something we have not answered here? Write to us — it reaches the people who run the base,
          not a call centre.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-7 py-3.5 text-sm font-semibold"
          style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
        >
          Ask us
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}

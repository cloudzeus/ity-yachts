"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "@/lib/use-translations"
import { NewsCard } from "@/components/news/news-card"
import type { NewsCard as Card } from "@/lib/news"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/** Per-column drift, so the row shears slightly as it passes. */
const DRIFT = ["0.16", "0.26", "0.20"]

/**
 * The three most recent pieces, on the homepage.
 *
 * Renders nothing at all when there is nothing published — an empty "Latest
 * news" heading over a blank row is worse than no section.
 */
export function NewsSection({ articles }: { articles: Card[] }) {
  const { t, tUpper } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".news-card",
        { opacity: 0, y: 44 },
        {
          opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: ".news-grid", start: "top 85%" },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [articles])

  if (!articles.length) return null

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: "var(--surface-sunken)" }}
    >
      <div
        data-parallax="0.4"
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 h-[520px] w-[520px] rounded-full"
        style={{ background: "var(--iyc-sand-200)", filter: "blur(120px)", opacity: 0.55, transform: "translate(28%, -25%)" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-20 md:py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[860px]">
            <span className="label-sm mb-3 block" style={{ color: "var(--iyc-taupe-500)" }}>
              {tUpper("home.news.eyebrow", "From the logbook")}
            </span>
            <h2 className="section-heading" style={{ color: "var(--text-heading)" }}>
              <span className="font-light">{t("home.news.headingLead", "Latest")}</span>{" "}
              <span className="font-extrabold" style={{ color: "var(--iyc-ionian-600)" }}>
                {t("home.news.headingAccent", "news")}
              </span>
            </h2>
          </div>

          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
          >
            {t("home.news.viewAll", "All articles")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="news-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <div key={a.id} className="h-full" data-parallax={DRIFT[i % 3]}>
              <div className="news-card h-full" style={{ opacity: 0 }}>
                <NewsCard article={a} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

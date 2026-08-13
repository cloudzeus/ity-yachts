"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { icons } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const HERO =
  "https://iycweb.b-cdn.net/general/1786513674556-sailor-on-a-yacht-navigating-open-waters-2026-03-20-04-55-26-utc.webp"

interface Service {
  id: string
  slug: string
  title: Record<string, string>
  label: Record<string, string>
  shortDesc: Record<string, string>
  media: string | null
  mediaType: string | null
  icon: string | null
  link: string | null
}

type I18n = Record<string, string> | undefined

/**
 * Summaries are written in the admin's rich editor now, so they arrive as
 * HTML. A one-line summary wants text, not a paragraph inside a paragraph —
 * and the older records are plain, which this leaves untouched.
 */
const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

/** Per-row drift, so the column shears very slightly as it passes. */
const DRIFT = ["0.14", "0.18", "0.12", "0.2", "0.15", "0.17", "0.13"]

export function ServicesClient({
  services, hero, cta,
}: {
  services: Service[]
  hero: { badge?: I18n; title?: I18n; titleAccent?: I18n; subtitle?: I18n } | null
  cta: {
    title?: I18n; description?: I18n
    primaryBtn?: I18n; primaryLink?: string
    secondaryBtn?: I18n; secondaryLink?: string
  } | null
}) {
  const { t, locale } = useTranslations()
  const rootRef = useRef<HTMLDivElement>(null)

  const r = (v: I18n, fallback = "") => v?.[locale]?.trim() || v?.en?.trim() || fallback

  /**
   * Stored page-builder copy first, but only if it exists in the reader's
   * language. Falling back to a stored English string would print English into
   * a Greek page; the translation key is trilingual, so it is the better
   * second choice.
   */
  const pick = (stored: I18n, key: string, fallback: string) =>
    stored?.[locale]?.trim() || t(key, fallback)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".svc-rise").forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 34 },
          {
            opacity: 1, y: 0, duration: 0.75, ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 90%" },
          }
        )
      })
    }, el)
    return () => ctx.revert()
  }, [locale, services.length])

  return (
    <div ref={rootRef}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 520 }}>
        <Image src={HERO} alt="" fill priority sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,13,25,.62) 0%, rgba(4,13,25,.32) 40%, rgba(4,13,25,.55) 74%, var(--surface-page) 100%)",
          }}
        />
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center px-6 pb-36 pt-36 text-center md:pb-44 md:pt-44">
          <span
            className="mb-6 inline-block rounded-[var(--iyc-radius-sm)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.88)" }}
          >
            {removeGreekTonos(pick(hero?.badge, "services.badge", "Our services"))}
          </span>

          <h1
            className="text-[clamp(2.3rem,4.8vw,3.75rem)] font-light leading-[1.08] text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
          >
            {pick(hero?.title, "services.title", "Luxury charter")}{" "}
            <span className="font-extrabold">
              {pick(hero?.titleAccent, "services.titleAccent", "services")}
            </span>
          </h1>

          <p
            className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            {pick(
              hero?.subtitle,
              "services.subtitle",
              "Everything you need for an unforgettable voyage — from bareboat to fully crewed, shaped around your own trip."
            )}
          </p>
        </div>
      </section>

      {/* ── The index ────────────────────────────────────────────────────
          Seven services is too many to scroll blind, so the page opens with
          its own contents — numbered, and each one jumps to its section. */}
      {services.length > 1 && (
        <section className="relative w-full">
          {/* The same container as the rows below — a narrower one here left
              the two blocks with different left and right edges. */}
          <div className="mx-auto max-w-[1280px] px-6 pt-6 md:px-10">
            <div className="svc-rise grid grid-cols-1 gap-x-10 gap-y-px sm:grid-cols-2">
              {services.map((s, i) => (
                <Link
                  key={s.id}
                  href={`#${s.slug}`}
                  className="group flex items-baseline gap-4 py-4 transition-colors"
                  style={{ borderBottom: "1px solid var(--border-hairline)" }}
                >
                  <span
                    className="w-7 flex-shrink-0 text-[0.72rem] font-semibold tabular-nums"
                    style={{ color: "var(--iyc-ionian-500)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="min-w-0 flex-1 text-[1.02rem] leading-snug transition-colors group-hover:opacity-70"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                  >
                    {r(s.title)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 transition-transform group-hover:translate-y-0.5"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    ↓
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── The services ─────────────────────────────────────────────────── */}
      {services.map((s, i) => (
        <ServiceRow
          key={s.id}
          service={s}
          index={i}
          side={i % 2 === 0 ? "right" : "left"}
          tone={i % 2 === 0 ? "page" : "sunken"}
          drift={DRIFT[i % DRIFT.length]}
          r={r}
          readMore={t("services.readMore", "Read more")}
        />
      ))}

      {/* ── Closing ──────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(158deg, var(--iyc-ionian-800), var(--iyc-ionian-900))" }}>
        <div className="mx-auto max-w-[680px] px-6 py-20 text-center md:py-24">
          <h2
            className="svc-rise mb-5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-light leading-[1.12] text-white"
            style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
          >
            {pick(cta?.title, "services.cta.title", "Tell us what the week should feel like")}
          </h2>
          <p className="svc-rise mx-auto mb-9 max-w-[48ch] text-[1.02rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.84)" }}>
            {pick(
              cta?.description,
              "services.cta.body",
              "Write to us, or answer a few questions and we will put a plan together for you."
            )}
          </p>
          <div className="svc-rise flex flex-wrap items-center justify-center gap-3">
            <Link
              href={cta?.primaryLink || "/contact"}
              className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-8 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
            >
              {pick(cta?.primaryBtn, "services.cta.primary", "Talk to us")}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={cta?.secondaryLink || "/fleet"}
              className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-8 py-4 text-sm font-semibold transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.30)",
                color: "#ffffff",
                fontFamily: "var(--font-display)",
              }}
            >
              {pick(cta?.secondaryBtn, "services.cta.secondary", "See the fleet")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function ServiceIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon size={size} strokeWidth={1.6} />
}

function ServiceRow({
  service, index, side, tone, drift, r, readMore,
}: {
  service: Service
  index: number
  side: "left" | "right"
  tone: "page" | "sunken"
  drift: string
  r: (v: I18n, fallback?: string) => string
  readMore: string
}) {
  const title = r(service.title)
  const label = r(service.label)
  const summary = plain(r(service.shortDesc))
  const href = service.link || `/services/${service.slug}`

  const media = service.media ? (
    <div
      data-parallax={drift}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-[5/4]"
      style={{ background: "var(--surface-sunken)", boxShadow: "var(--shadow-md)" }}
    >
      {service.mediaType === "video" ? (
        // next/image cannot decode video.
        <video src={service.media} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Image src={service.media} alt="" fill sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
      )}
    </div>
  ) : null

  return (
    <section
      id={service.slug}
      className="relative w-full overflow-hidden scroll-mt-24"
      style={{ background: tone === "sunken" ? "var(--surface-sunken)" : "var(--surface-page)" }}
    >
      <div className="svc-rise mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-2 lg:gap-16">
        <div className={side === "left" ? "lg:order-1" : "lg:order-2"}>{media}</div>

        <div className={side === "left" ? "lg:order-2" : "lg:order-1"}>
          <div className="max-w-[36rem]">
            {/* The number ties the row back to the index at the top. */}
            <div className="mb-5 flex items-center gap-3">
              <span
                className="text-[0.72rem] font-semibold tabular-nums"
                style={{ color: "var(--iyc-ionian-500)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-8" style={{ background: "var(--border-hairline)" }} />
              {service.icon && (
                <span
                  className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ background: "var(--iyc-ionian-50)", color: "var(--iyc-ionian-600)" }}
                >
                  <ServiceIcon name={service.icon} />
                </span>
              )}
              {label && (
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--iyc-taupe-500, var(--text-subtle))" }}
                >
                  {removeGreekTonos(label)}
                </span>
              )}
            </div>

            <h2
              className="mb-4 text-[clamp(1.5rem,2.5vw,2.05rem)] font-light leading-[1.18]"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
            >
              {title}
            </h2>

            {summary && (
              <p className="text-[1.01rem] leading-[1.75]" style={{ color: "var(--text-body)" }}>
                {summary}
              </p>
            )}

            <Link
              href={href}
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
            >
              {readMore}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

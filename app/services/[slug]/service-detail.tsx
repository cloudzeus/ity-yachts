"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "@/components/locale-link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { icons } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type I18n = Record<string, string>

interface Service {
  slug: string
  title: I18n
  label: I18n
  header: I18n
  shortDesc: I18n
  description: I18n
  media: string | null
  mediaType: string | null
  icon: string | null
  certification: { logo?: string; name?: I18n; body?: I18n } | null
}

interface Card {
  id: string
  slug: string
  title: I18n
  label: I18n
  shortDesc: I18n
  media: string | null
  mediaType: string | null
  icon: string | null
}

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

/**
 * Bodies arrive in two shapes: HTML from the rich editor, and older plain text
 * whose paragraphs are blank lines. Rendered as HTML, that plain text collapses
 * into one unbroken block — 2,500 characters with nowhere for the eye to rest.
 * So give it its paragraphs back before it reaches the page.
 */
function toParagraphs(value: string): string {
  const text = value.trim()
  if (!text) return ""
  if (/<(p|h2|h3|ul|ol|blockquote|div)\b/i.test(text)) return text
  return text
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n+/g, " ")}</p>`)
    .join("")
}

function ServiceIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon size={size} strokeWidth={1.6} />
}

export function ServiceDetail({
  service, position, prev, next, others,
}: {
  service: Service
  position: { index: number; total: number }
  prev: Card | null
  next: Card | null
  others: Card[]
}) {
  const { t, locale } = useTranslations()
  const r = (v: I18n | undefined, fallback = "") => v?.[locale]?.trim() || v?.en?.trim() || fallback

  const rootRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)

  const title = r(service.title)
  const label = r(service.label)
  const standfirst = plain(r(service.shortDesc))
  const kicker = r(service.header)
  const body = toParagraphs(r(service.description))
  const num = String(position.index).padStart(2, "0")

  const cert = service.certification
  const certName = r(cert?.name)
  const certBody = r(cert?.body)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      if (!reduced) {
        /* The hero photograph settles as the page loads, then drifts slower
           than the scroll — the frame stays put, the picture inside moves. */
        if (mediaRef.current) {
          gsap.fromTo(
            mediaRef.current,
            { scale: 1.12 },
            { scale: 1, duration: 1.6, ease: "power2.out" }
          )
          gsap.to(mediaRef.current, {
            yPercent: 14,
            ease: "none",
            scrollTrigger: { trigger: ".svc-hero", start: "top top", end: "bottom top", scrub: true },
          })
        }

        // The masthead arrives a line at a time.
        gsap.fromTo(
          ".svc-hero-line",
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.09, ease: "power3.out", delay: 0.12 }
        )

        // Paragraphs lift in as they are reached, not all at once.
        gsap.utils.toArray<HTMLElement>(".svc-prose > *").forEach((node) => {
          gsap.fromTo(
            node,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
              scrollTrigger: { trigger: node, start: "top 92%" } }
          )
        })

        gsap.utils.toArray<HTMLElement>(".svc-rise").forEach((node) => {
          gsap.fromTo(
            node,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
              scrollTrigger: { trigger: node, start: "top 90%" } }
          )
        })
      }
    }, root)

    return () => ctx.revert()
  }, [locale, service.slug])

  return (
    <div ref={rootRef}>
      {/* ── Hero ─────────────────────────────────────────────────────────
          Anchored bottom-left against the container, not centred: the index
          page is the centred one, and a reader should feel the difference
          between the list and a single entry. */}
      <section className="svc-hero relative w-full overflow-hidden" style={{ minHeight: "min(78vh, 680px)" }}>
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          {service.media &&
            (service.mediaType === "video" ? (
              <video src={service.media} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <Image src={service.media} alt="" fill priority sizes="100vw" className="object-cover" />
            ))}
        </div>

        {/* Two scrims: one lifting off the foot for the text, one closing on
            the page colour so the photograph does not end on a hard edge. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(4,13,25,.90) 0%, rgba(4,13,25,.55) 34%, rgba(4,13,25,.12) 66%, rgba(4,13,25,.42) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(to bottom, rgba(4,13,25,0), var(--surface-page))" }}
        />

        <div className="relative mx-auto flex h-full min-h-[inherit] max-w-[1280px] flex-col justify-end px-6 pb-28 pt-40 md:px-10">
          <div className="max-w-[46rem]">
            {/* Where this sits in the set. */}
            <div className="svc-hero-line mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.72)" }}>
              <Link href="/services" className="transition-opacity hover:opacity-70">
                {removeGreekTonos(t("services.detail.back", "All services"))}
              </Link>
              <span className="h-px w-6" style={{ background: "rgba(255,255,255,0.35)" }} />
              <span className="tabular-nums">
                {num}
                <span style={{ opacity: 0.5 }}> / {String(position.total).padStart(2, "0")}</span>
              </span>
            </div>

            {label && (
              <span
                className="svc-hero-line mb-5 inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.90)" }}
              >
                {service.icon && <ServiceIcon name={service.icon} size={14} />}
                {removeGreekTonos(label)}
              </span>
            )}

            <h1
              className="svc-hero-line text-[clamp(2.4rem,5.2vw,4.25rem)] font-light leading-[1.02] text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.005em", textWrap: "balance" }}
            >
              {title}
            </h1>

            {standfirst && (
              <p
                className="svc-hero-line mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed md:text-[1.15rem]"
                style={{ color: "rgba(255,255,255,0.90)" }}
              >
                {standfirst}
              </p>
            )}
          </div>
        </div>
      </section>

      <Breadcrumbs gutter="px-6 md:px-10" maxWidth={1280} spacing="pt-10 pb-0 md:pt-12" items={[{ label: t("nav.services", "Services"), href: "/services" }, { label: title }]} />

      {/* ── Body + the rail ──────────────────────────────────────────────── */}
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-x-16 px-6 pb-8 pt-14 md:px-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:pt-20">
        <article className="min-w-0">
          {kicker && kicker !== title && (
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-10" style={{ background: "var(--iyc-ionian-500)" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--iyc-ionian-600)" }}
              >
                {removeGreekTonos(kicker)}
              </span>
            </div>
          )}

          {body ? (
            /* A measure around 68 characters and 1.85 leading: this runs to
               two and a half thousand characters with no headings in it, and
               the line length is the only thing holding the reader. */
            <div
              /* No drop cap: that belongs to an article, and a service page
                 already opens on a photograph and a standfirst. */
              className="svc-prose iyc-prose iyc-prose--plain max-w-[68ch] text-[1.09rem] leading-[1.85]"
              style={{ color: "var(--text-body)" }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="max-w-[62ch] text-[1.25rem] font-light leading-[1.7]" style={{ color: "var(--text-body)", fontFamily: "var(--font-display)" }}>
              {standfirst}
            </p>
          )}

          {/* The accrediting body, when there is one. Set on tinted stock and
              given the logo its own white field — a mark belongs on the
              background its owner designed it for. */}
          {cert && (
            <div
              className="svc-rise mt-12 flex max-w-[68ch] flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-7"
              style={{ background: "var(--iyc-ionian-50)", border: "1px solid var(--iyc-ionian-100)" }}
            >
              {cert.logo && (
                <div
                  className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-xl"
                  style={{ background: "#ffffff", border: "1px solid var(--border-hairline)" }}
                >
                  <Image
                    src={cert.logo}
                    alt={certName}
                    fill
                    sizes="144px"
                    className="object-contain p-3"
                  />
                </div>
              )}
              <div className="min-w-0">
                <div
                  className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--iyc-ionian-600)" }}
                >
                  {removeGreekTonos(t("services.detail.certified", "Certification"))}
                </div>
                {certName && (
                  <div
                    className="mb-2 text-[1.1rem] leading-snug"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                  >
                    {certName}
                  </div>
                )}
                {certBody && (
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                    {certBody}
                  </p>
                )}
              </div>
            </div>
          )}
        </article>

        {/* The rail. Sticky on desktop so the way to ask is never scrolled
            past; below the text on a phone, where a sticky column would eat
            the screen. */}
        <aside className="mt-14 lg:mt-0">
          <div className="lg:sticky lg:top-32">
            <div
              className="svc-rise rounded-3xl p-6"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-hairline)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {service.icon && (
                <span
                  className="mb-4 grid h-11 w-11 place-items-center rounded-full"
                  style={{ background: "var(--iyc-ionian-50)", color: "var(--iyc-ionian-600)" }}
                >
                  <ServiceIcon name={service.icon} size={20} />
                </span>
              )}
              <h2
                className="mb-2 text-[1.15rem] leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
              >
                {t("services.detail.ctaTitle", "Want this on your charter?")}
              </h2>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("services.detail.ctaBody", "Tell us what you have in mind and we will arrange it before you arrive.")}
              </p>

              <Link
                href="/contact"
                className="mb-2.5 flex items-center justify-center gap-2 rounded-[var(--iyc-radius-sm)] px-5 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
                style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
              >
                {t("services.detail.enquire", "Ask us about this")}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/fleet"
                className="flex items-center justify-center rounded-[var(--iyc-radius-sm)] px-5 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-body)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {t("services.detail.fleet", "Browse the fleet")}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* ── The one before, the one after ────────────────────────────────── */}
      {(prev || next) && (
        <nav className="mx-auto w-full max-w-[1280px] px-6 pb-4 pt-12 md:px-10">
          <div
            className="svc-rise grid grid-cols-1 gap-px sm:grid-cols-2"
            style={{ borderTop: "1px solid var(--border-hairline)" }}
          >
            <StepLink service={prev} direction="prev" r={r} label={t("services.detail.previous", "Previous")} />
            <StepLink service={next} direction="next" r={r} label={t("services.detail.next", "Next")} />
          </div>
        </nav>
      )}

      {/* ── Other services ───────────────────────────────────────────────── */}
      {others.length > 0 && (
        <section style={{ background: "var(--surface-sunken)" }}>
          <div className="mx-auto w-full max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
            <h2
              className="svc-rise mb-10 text-[clamp(1.5rem,2.6vw,2rem)] font-light"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
            >
              {t("services.detail.other", "Other services")}
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.id}
                  href={`/services/${o.slug}`}
                  className="svc-rise group flex flex-col overflow-hidden rounded-3xl transition-transform"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-hairline)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                    {o.media &&
                      (o.mediaType === "video" ? (
                        <video src={o.media} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <Image
                          src={o.media}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ))}
                    {r(o.label) && (
                      <span
                        className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: "var(--iyc-ionian-700)", color: "#ffffff" }}
                      >
                        {removeGreekTonos(r(o.label))}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3
                      className="mb-3 text-lg leading-snug"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                    >
                      {r(o.title)}
                    </h3>
                    {plain(r(o.shortDesc)) && (
                      <p className="mb-5 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {plain(r(o.shortDesc))}
                      </p>
                    )}
                    <span
                      className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
                    >
                      {t("services.readMore", "Read more")}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/** One step through the set, forward or back. */
function StepLink({
  service, direction, label, r,
}: {
  service: Card | null
  direction: "prev" | "next"
  label: string
  r: (v: I18n | undefined, fallback?: string) => string
}) {
  const isNext = direction === "next"

  if (!service) {
    // Hold the cell so a single neighbour does not slide across the row.
    return <div className="hidden sm:block" style={{ borderBottom: "1px solid var(--border-hairline)" }} />
  }

  return (
    <Link
      href={`/services/${service.slug}`}
      className={`group flex flex-col gap-1.5 py-6 transition-opacity hover:opacity-70 ${isNext ? "sm:items-end sm:text-right" : ""}`}
      style={{ borderBottom: "1px solid var(--border-hairline)" }}
    >
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--text-subtle)" }}>
        {!isNext && <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">←</span>}
        {removeGreekTonos(label)}
        {isNext && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
      </span>
      <span
        className="text-[1.15rem] leading-snug"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
      >
        {r(service.title)}
      </span>
    </Link>
  )
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { icons } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

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
}

interface OtherService {
  id: string
  slug: string
  title: I18n
  label: I18n
  shortDesc: I18n
  media: string | null
  mediaType: string | null
  icon: string | null
}

/** Summaries come out of the rich editor as HTML; a clamped line wants text. */
const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

function ServiceIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon size={size} strokeWidth={1.6} />
}

export function ServiceDetail({ service, others }: { service: Service; others: OtherService[] }) {
  const { t, locale } = useTranslations()
  const r = (v: I18n | undefined, fallback = "") => v?.[locale]?.trim() || v?.en?.trim() || fallback

  const title = r(service.title)
  const label = r(service.label)
  const standfirst = r(service.header) || plain(r(service.shortDesc))
  const body = r(service.description)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 480 }}>
        {service.media &&
          (service.mediaType === "video" ? (
            <video src={service.media} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image src={service.media} alt="" fill priority sizes="100vw" className="object-cover" />
          ))}
        <div
          className="absolute inset-0"
          style={{
            background: service.media
              ? "linear-gradient(to bottom, rgba(4,13,25,.60) 0%, rgba(4,13,25,.32) 40%, rgba(4,13,25,.58) 74%, var(--surface-page) 100%)"
              : "linear-gradient(158deg, var(--iyc-ionian-700), var(--iyc-ionian-900))",
          }}
        />

        <div className="relative mx-auto flex max-w-[860px] flex-col items-center px-6 pb-32 pt-32 text-center md:pb-36 md:pt-40">
          {label && (
            <span
              className="mb-6 inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.88)" }}
            >
              {service.icon && <ServiceIcon name={service.icon} size={14} />}
              {/* Greek capitals carry no accent. */}
              {removeGreekTonos(label)}
            </span>
          )}

          <h1
            className="text-[clamp(2.2rem,4.6vw,3.5rem)] font-light leading-[1.08] text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
          >
            {title}
          </h1>

          {standfirst && standfirst !== title && (
            <p className="mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
              {standfirst}
            </p>
          )}
        </div>
      </section>

      {/* ── The service itself ───────────────────────────────────────────── */}
      <article className="relative mx-auto w-full max-w-[760px] px-6 pb-16">
        <Link
          href="/services"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
        >
          <span aria-hidden="true">←</span>
          {t("services.detail.back", "All services")}
        </Link>

        {body ? (
          <div
            className="iyc-prose iyc-prose--plain text-[1.05rem] leading-[1.8]"
            style={{ color: "var(--text-body)" }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="text-[1.08rem] leading-[1.8]" style={{ color: "var(--text-body)" }}>
            {plain(r(service.shortDesc))}
          </p>
        )}
      </article>

      {/* ── Ask us ───────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(158deg, var(--iyc-ionian-800), var(--iyc-ionian-900))" }}>
        <div className="mx-auto max-w-[680px] px-6 py-16 text-center md:py-20">
          <h2
            className="mb-4 text-[clamp(1.6rem,3vw,2.2rem)] font-light leading-[1.14] text-white"
            style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
          >
            {t("services.detail.ctaTitle", "Want this on your charter?")}
          </h2>
          <p className="mx-auto mb-8 max-w-[46ch] text-[1.01rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.84)" }}>
            {t("services.detail.ctaBody", "Tell us what you have in mind and we will arrange it before you arrive.")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-8 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
            >
              {t("services.detail.enquire", "Ask us about this")}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/fleet"
              className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-8 py-4 text-sm font-semibold"
              style={{ border: "1px solid rgba(255,255,255,0.30)", color: "#ffffff", fontFamily: "var(--font-display)" }}
            >
              {t("services.detail.fleet", "Browse the fleet")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Other services ───────────────────────────────────────────────── */}
      {others.length > 0 && (
        <section style={{ background: "var(--surface-sunken)" }}>
          <div className="mx-auto w-full max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
            <h2
              className="mb-10 text-[clamp(1.5rem,2.6vw,2rem)] font-light"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
            >
              {t("services.detail.other", "Other services")}
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.id}
                  href={`/services/${o.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl"
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
    </>
  )
}

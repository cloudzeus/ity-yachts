import { db } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocaleText } from "@/components/locale-text"
import { icons } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Charter Services — IYC Yachts",
  description: "Premium yacht charter services tailored to every voyage — from bareboat to fully crewed luxury.",
}

function ServiceIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon className={className} style={style} />
}

export default async function ServicesPage() {
  const [services, svcsComponent] = await Promise.all([
    db.service.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
    }),
    db.pageComponent.findFirst({
      where: { page: { slug: "services" }, type: "services-content", status: "active" },
      select: { props: true },
    }),
  ])

  const heroProps = svcsComponent?.props as Record<string, unknown> | null
  const hero = (heroProps?.hero ?? null) as {
    badge?: Record<string, string>
    title?: Record<string, string>
    titleAccent?: Record<string, string>
    subtitle?: Record<string, string>
  } | null
  const cta = (heroProps?.cta ?? null) as {
    title?: Record<string, string>
    description?: Record<string, string>
    primaryBtn?: Record<string, string>
    primaryLink?: string
    secondaryBtn?: Record<string, string>
    secondaryLink?: string
  } | null

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div style={{ background: "#070c26" }}>
        <SiteHeader />

        <section className="relative overflow-hidden pt-36 pb-32 px-6">
          {/* Background radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 15% 60%, rgba(0,119,182,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Decorative diagonal lines */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 0px, transparent 50%)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="max-w-3xl">
              {/* Badge */}
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#83776d]/30 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
                {hero?.badge ? (
                  <LocaleText translations={hero.badge} fallback="Our Services" uppercase />
                ) : (
                  <LocaleText tKey="services.badge" fallback="Our Services" uppercase />
                )}
              </span>

              {/* Title */}
              <h1
                className="text-5xl md:text-6xl lg:text-[80px] font-bold text-white leading-[0.92] tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {hero?.title ? (
                  <LocaleText translations={hero.title} fallback="Premium Charter" />
                ) : (
                  <LocaleText tKey="services.title" fallback="Premium Charter" />
                )}
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #0077B6 0%, #83776d 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {hero?.titleAccent ? (
                    <LocaleText translations={hero.titleAccent} fallback="Services" />
                  ) : (
                    <LocaleText tKey="services.titleAccent" fallback="Services" />
                  )}
                </span>
              </h1>

              {/* Divider + subtitle */}
              <div className="mt-8 flex items-start gap-5">
                <div
                  className="mt-2 h-20 w-px shrink-0"
                  style={{ background: "linear-gradient(to bottom, #0077B6, transparent)" }}
                />
                <p className="text-lg text-white/50 leading-relaxed max-w-lg">
                  {hero?.subtitle ? (
                    <LocaleText
                      translations={hero.subtitle}
                      fallback="Everything you need for an unforgettable voyage — from bareboat to fully crewed luxury, tailored to your journey."
                    />
                  ) : (
                    <LocaleText
                      tKey="services.subtitle"
                      fallback="Everything you need for an unforgettable voyage — from bareboat to fully crewed luxury, tailored to your journey."
                    />
                  )}
                </p>
              </div>

              {/* Service count pill */}
              {services.length > 0 && (
                <div className="mt-10 flex items-center gap-3">
                  <span
                    className="flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium"
                    style={{ background: "rgba(0,119,182,0.15)", color: "#0077B6", border: "1px solid rgba(0,119,182,0.25)" }}
                  >
                    <span
                      className="flex size-5 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "#0077B6" }}
                    >
                      {services.length}
                    </span>
                    services available
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Diagonal clip transition */}
        <div
          className="h-20 w-full"
          style={{
            background: "#f5f0ea",
            clipPath: "polygon(0 100%, 100% 0%, 100% 100%)",
            marginTop: "-1px",
          }}
        />
      </div>

      {/* ── Services List ──────────────────────────────────────── */}
      <section style={{ background: "#f5f0ea" }}>
        <div className="max-w-6xl mx-auto px-6 pb-24">
          {services.length === 0 ? (
            <p className="py-32 text-center text-lg" style={{ color: "#84776e" }}>
              No services published yet. Check back soon.
            </p>
          ) : (
            <div>
              {services.map((service, index) => {
                const title = service.title as Record<string, string>
                const header = service.header as Record<string, string>
                const shortDesc = service.shortDesc as Record<string, string>
                const label = service.label as Record<string, string>
                const isEven = index % 2 === 1
                const num = String(index + 1).padStart(2, "0")

                return (
                  <div key={service.id}>
                    {index > 0 && (
                      <div
                        className="mx-auto max-w-5xl"
                        style={{ height: "1px", background: "rgba(7,12,38,0.1)" }}
                      />
                    )}

                    <Link
                      href={`/services/${service.slug}`}
                      className="group block py-16 lg:py-20 cursor-pointer"
                    >
                      <div
                        className={`flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center ${
                          isEven ? "" : ""
                        }`}
                      >
                        {/* ── Text block ── */}
                        <div
                          className={`lg:col-span-6 ${isEven ? "lg:order-2" : "lg:order-1"}`}
                        >
                          {/* Decorative number watermark */}
                          <div className="relative mb-4 flex items-center gap-4">
                            <span
                              className="text-8xl font-bold leading-none select-none transition-colors duration-300 group-hover:text-[#0077B6]"
                              style={{
                                fontFamily: "var(--font-display)",
                                color: "rgba(7,12,38,0.07)",
                                WebkitTextStroke: "1px rgba(7,12,38,0.12)",
                                WebkitTextFillColor: "rgba(7,12,38,0.03)",
                                lineHeight: 1,
                              }}
                            >
                              {num}
                            </span>

                            {/* Icon badge */}
                            {service.icon && (
                              <div
                                className="absolute left-14 flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                                style={{
                                  background: "linear-gradient(135deg, #006399, #002147)",
                                  boxShadow: "0 4px 20px rgba(0,99,153,0.3)",
                                }}
                              >
                                <ServiceIcon
                                  name={service.icon}
                                  className="size-6 text-white"
                                />
                              </div>
                            )}
                          </div>

                          {/* Label */}
                          {label?.en && (
                            <span
                              className="mb-3 block text-xs font-bold uppercase tracking-widest"
                              style={{ color: "#0077B6" }}
                            >
                              <LocaleText translations={label} fallback="" />
                            </span>
                          )}

                          {/* Title */}
                          <h2
                            className="mb-3 text-4xl font-bold leading-tight tracking-tight transition-colors duration-200 group-hover:text-[#006399] lg:text-[42px]"
                            style={{ fontFamily: "var(--font-display)", color: "#070c26" }}
                          >
                            <LocaleText translations={title} fallback="Service" />
                          </h2>

                          {/* Header line */}
                          {header?.en && (
                            <p
                              className="mb-4 text-lg font-medium leading-snug"
                              style={{ color: "#84776e" }}
                            >
                              <LocaleText translations={header} />
                            </p>
                          )}

                          {/* Short description */}
                          {shortDesc?.en && (
                            <p
                              className="text-base leading-relaxed line-clamp-3"
                              style={{ color: "#43474E" }}
                            >
                              <LocaleText translations={shortDesc} />
                            </p>
                          )}

                          {/* CTA arrow */}
                          <div
                            className="mt-6 flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3"
                            style={{ color: "#006399" }}
                          >
                            <span>Explore service</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-transform duration-200 group-hover:translate-x-1"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {/* ── Image block ── */}
                        <div
                          className={`relative lg:col-span-5 ${isEven ? "lg:order-1" : "lg:order-2"}`}
                          style={{ minHeight: 300 }}
                        >
                          <div
                            className="relative overflow-hidden rounded-2xl"
                            style={{
                              height: 320,
                              transform: isEven ? "rotate(-1.5deg)" : "rotate(1.5deg)",
                              boxShadow: "0 20px 60px rgba(7,12,38,0.15)",
                              transition: "transform 0.4s ease",
                            }}
                          >
                            {service.defaultMedia ? (
                              <>
                                {service.defaultMediaType === "video" ? (
                                  <video
                                    src={service.defaultMedia}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                  />
                                ) : (
                                  <Image
                                    src={service.defaultMedia}
                                    alt={(title as Record<string, string>).en || "Service"}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 45vw"
                                  />
                                )}
                                {/* Subtle navy overlay on hover */}
                                <div
                                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-30"
                                  style={{ background: "linear-gradient(135deg, #070c26, #006399)" }}
                                />
                              </>
                            ) : (
                              <div
                                className="flex h-full w-full items-center justify-center"
                                style={{
                                  background:
                                    "linear-gradient(135deg, rgba(0,99,153,0.08) 0%, rgba(7,12,38,0.12) 100%)",
                                  border: "1px solid rgba(7,12,38,0.08)",
                                }}
                              >
                                {service.icon && (
                                  <ServiceIcon
                                    name={service.icon}
                                    className="size-24 opacity-10"
                                    style={{ color: "#070c26" }}
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Decorative dot grid behind image */}
                          <div
                            className="pointer-events-none absolute -z-10"
                            style={{
                              width: 120,
                              height: 120,
                              backgroundImage:
                                "radial-gradient(circle, rgba(0,119,182,0.25) 1.5px, transparent 1.5px)",
                              backgroundSize: "14px 14px",
                              bottom: isEven ? "auto" : -20,
                              right: isEven ? "auto" : -20,
                              top: isEven ? -20 : "auto",
                              left: isEven ? -20 : "auto",
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Band ────────────────────────────────────────────── */}
      {(cta?.title || true) && (
        <section
          className="relative overflow-hidden py-24 px-6"
          style={{ background: "#070c26" }}
        >
          {/* Background wave */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,119,182,0.1) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-4xl mx-auto text-center">
            <span
              className="mb-4 inline-block rounded-full border border-[#83776d]/25 px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#83776d" }}
            >
              Ready to sail?
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {cta?.title ? (
                <LocaleText translations={cta.title} fallback="Plan Your Perfect Charter" />
              ) : (
                "Plan Your Perfect Charter"
              )}
            </h2>
            {cta?.description && (
              <p className="text-white/55 text-lg mb-8 max-w-xl mx-auto">
                <LocaleText translations={cta.description} fallback="" />
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={cta?.primaryLink ?? "/fleet"}
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-ocean)" }}
              >
                {cta?.primaryBtn ? (
                  <LocaleText translations={cta.primaryBtn} fallback="Browse Our Fleet" />
                ) : (
                  "Browse Our Fleet"
                )}
              </Link>
              <Link
                href={cta?.secondaryLink ?? "/contact"}
                className="inline-flex items-center gap-2 rounded-lg border px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:text-white hover:border-white/60"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                {cta?.secondaryBtn ? (
                  <LocaleText translations={cta.secondaryBtn} fallback="Contact Us" />
                ) : (
                  "Contact Us"
                )}
              </Link>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  )
}

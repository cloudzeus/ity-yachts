import { db } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocaleText } from "@/components/locale-text"
import { icons, ArrowLeft, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

function ServiceIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon className={className} style={style} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await db.service.findUnique({
    where: { slug },
    select: { title: true, shortDesc: true },
  })
  if (!service) return {}
  const t = service.title as Record<string, string>
  const d = service.shortDesc as Record<string, string>
  return {
    title: `${t.en ?? "Service"} — IYC Yachts`,
    description: d.en ?? undefined,
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params

  const [service, allServices] = await Promise.all([
    db.service.findUnique({ where: { slug } }),
    db.service.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, title: true, label: true, icon: true, defaultMedia: true, defaultMediaType: true },
    }),
  ])

  if (!service) notFound()

  const title = service.title as Record<string, string>
  const label = service.label as Record<string, string>
  const header = service.header as Record<string, string>
  const description = service.description as Record<string, string>
  const shortDesc = service.shortDesc as Record<string, string>

  // Adjacent services for navigation
  const currentIndex = allServices.findIndex((s) => s.slug === slug)
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : null
  const nextService = currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : null

  // Other services to show at the bottom
  const otherServices = allServices
    .filter((s) => s.slug !== slug)
    .slice(0, 3)

  return (
    <main>
      {/* ── Full-screen Hero ────────────────────────────────────── */}
      <div className="relative" style={{ minHeight: "92vh", background: "#070c26" }}>
        <SiteHeader />

        {/* Background media */}
        {service.defaultMedia && (
          <div className="absolute inset-0 overflow-hidden">
            {service.defaultMediaType === "video" ? (
              <video
                src={service.defaultMedia}
                className="h-full w-full object-cover"
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
                priority
                className="object-cover"
                sizes="100vw"
              />
            )}
            {/* Gradient overlay: dark top for header, dramatic bottom for text */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(7,12,38,0.75) 0%, rgba(7,12,38,0.2) 35%, rgba(7,12,38,0.6) 65%, rgba(7,12,38,0.95) 100%)",
              }}
            />
            {/* Side vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(7,12,38,0.4) 0%, transparent 40%, transparent 60%, rgba(7,12,38,0.4) 100%)",
              }}
            />
          </div>
        )}

        {/* No media: decorative background */}
        {!service.defaultMedia && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 30% 50%, rgba(0,99,153,0.18) 0%, transparent 70%)",
              }}
            />
            {/* Diagonal stripe pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 0px, transparent 50%)",
                backgroundSize: "32px 32px",
              }}
            />
            {/* Giant icon watermark */}
            {service.icon && (
              <div className="absolute right-24 top-1/2 -translate-y-1/2 opacity-5">
                <ServiceIcon name={service.icon} className="size-96 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Content at bottom of hero */}
        <div className="relative flex h-full flex-col justify-end pb-16 pt-48 px-6" style={{ minHeight: "92vh" }}>
          <div className="max-w-6xl mx-auto w-full">
            {/* Breadcrumb */}
            <Link
              href="/services"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
            >
              <ArrowLeft className="size-4" />
              All Services
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                {/* Label badge */}
                {label?.en && (
                  <span
                    className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                    style={{ borderColor: "rgba(0,119,182,0.4)", color: "#0077B6", background: "rgba(0,119,182,0.1)" }}
                  >
                    {service.icon && <ServiceIcon name={service.icon} className="size-3.5" />}
                    <LocaleText translations={label} fallback="" />
                  </span>
                )}

                {/* Title */}
                <h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.9] tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <LocaleText translations={title} fallback="Service" />
                </h1>

                {/* Header subline */}
                {header?.en && (
                  <p
                    className="mt-5 text-xl text-white/60 max-w-2xl leading-relaxed"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <LocaleText translations={header} />
                  </p>
                )}
              </div>

              {/* Quick info card (top-right in hero) */}
              <div className="lg:col-span-4">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: "rgba(7,12,38,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {service.icon && (
                    <div
                      className="mb-4 flex size-14 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, #006399, #002147)" }}
                    >
                      <ServiceIcon name={service.icon} className="size-7 text-white" />
                    </div>
                  )}
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-5">
                    {shortDesc?.en ? (
                      <LocaleText translations={shortDesc} />
                    ) : (
                      <LocaleText translations={description} fallback="" />
                    )}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/contact"
                      className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "var(--gradient-ocean)" }}
                    >
                      Enquire About This Service
                    </Link>
                    <Link
                      href="/fleet"
                      className="flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium text-white/70 transition-colors hover:text-white hover:border-white/40"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Browse Our Fleet
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom diagonal into white */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 w-full"
          style={{
            background: "#fff",
            clipPath: "polygon(0 100%, 100% 0%, 100% 100%)",
          }}
        />
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <section style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* Description */}
            <div className="lg:col-span-8">
              {/* Decorative eyebrow */}
              <div className="mb-8 flex items-center gap-4">
                <div
                  className="h-px w-12"
                  style={{ background: "linear-gradient(to right, #0077B6, transparent)" }}
                />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0077B6" }}>
                  About This Service
                </span>
              </div>

              {/* Full description */}
              {description?.en ? (
                <div
                  className="prose prose-lg max-w-none"
                  style={{
                    color: "#1a1a2e",
                    lineHeight: 1.8,
                  }}
                >
                  <LocaleText translations={description} />
                </div>
              ) : shortDesc?.en ? (
                <p className="text-xl leading-relaxed" style={{ color: "#43474E", lineHeight: 1.8 }}>
                  <LocaleText translations={shortDesc} />
                </p>
              ) : (
                <p className="text-lg" style={{ color: "#84776e" }}>
                  More details coming soon.
                </p>
              )}
            </div>

            {/* Sticky sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 flex flex-col gap-5">
                {/* Service info card */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "#f5f0ea",
                    border: "1px solid rgba(7,12,38,0.08)",
                  }}
                >
                  <div className="mb-4 flex items-start gap-3">
                    {service.icon && (
                      <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, #006399, #002147)" }}
                      >
                        <ServiceIcon name={service.icon} className="size-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#84776e" }}>
                        {label?.en ? <LocaleText translations={label} fallback="" /> : "Service"}
                      </p>
                      <h3 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-display)", color: "#070c26" }}>
                        <LocaleText translations={title} fallback="Service" />
                      </h3>
                    </div>
                  </div>

                  <div className="h-px my-4" style={{ background: "rgba(7,12,38,0.08)" }} />

                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#43474E" }}>
                    Ready to experience this service on your next charter? Our team is happy to tailor it to your needs.
                  </p>

                  <Link
                    href="/contact"
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #006399, #002147)" }}
                  >
                    Request This Service
                  </Link>
                </div>

                {/* Navigation between services */}
                {(prevService || nextService) && (
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-2"
                    style={{ border: "1px solid rgba(7,12,38,0.08)", background: "#fff" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#84776e" }}>
                      Other Services
                    </p>
                    {prevService && (
                      <Link
                        href={`/services/${prevService.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f5f0ea] group"
                      >
                        <ArrowLeft className="size-4 shrink-0" style={{ color: "#84776e" }} />
                        <span className="text-sm font-medium truncate group-hover:text-[#006399]" style={{ color: "#070c26" }}>
                          <LocaleText translations={prevService.title as Record<string, string>} fallback="Previous" />
                        </span>
                      </Link>
                    )}
                    {nextService && (
                      <Link
                        href={`/services/${nextService.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f5f0ea] group"
                      >
                        <span className="text-sm font-medium flex-1 truncate group-hover:text-[#006399] text-right" style={{ color: "#070c26" }}>
                          <LocaleText translations={nextService.title as Record<string, string>} fallback="Next" />
                        </span>
                        <ArrowRight className="size-4 shrink-0" style={{ color: "#84776e" }} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Other Services ──────────────────────────────────────── */}
      {otherServices.length > 0 && (
        <section style={{ background: "#f5f0ea" }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#0077B6" }}>
                  Explore More
                </p>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#070c26" }}>
                  Other Services
                </h2>
              </div>
              <Link
                href="/services"
                className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#006399]"
                style={{ color: "#0077B6" }}
              >
                View All
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherServices.map((s) => {
                const sTitle = s.title as Record<string, string>
                const sLabel = s.label as Record<string, string>
                return (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(7,12,38,0.08)",
                      boxShadow: "0 2px 16px rgba(7,12,38,0.06)",
                      transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    {/* Media */}
                    {s.defaultMedia ? (
                      <div className="relative h-44 overflow-hidden">
                        {s.defaultMediaType === "video" ? (
                          <video
                            src={s.defaultMedia}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <Image
                            src={s.defaultMedia}
                            alt={sTitle.en || "Service"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="33vw"
                          />
                        )}
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                          style={{ background: "linear-gradient(135deg, #006399, #070c26)" }}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-44 items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(0,99,153,0.06), rgba(7,12,38,0.08))" }}
                      >
                        {s.icon && (
                          <ServiceIcon name={s.icon} className="size-12 opacity-20" style={{ color: "#070c26" }} />
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      {/* Icon + Label */}
                      <div className="mb-3 flex items-center gap-2">
                        {s.icon && (
                          <div
                            className="flex size-8 items-center justify-center rounded-lg"
                            style={{ background: "rgba(0,99,153,0.1)" }}
                          >
                            <ServiceIcon name={s.icon} className="size-4" style={{ color: "#006399" }} />
                          </div>
                        )}
                        {sLabel?.en && (
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0077B6" }}>
                            <LocaleText translations={sLabel} fallback="" />
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-lg font-bold leading-snug group-hover:text-[#006399] transition-colors"
                        style={{ fontFamily: "var(--font-display)", color: "#070c26" }}
                      >
                        <LocaleText translations={sTitle} fallback="Service" />
                      </h3>

                      <div
                        className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2.5"
                        style={{ color: "#006399" }}
                      >
                        Explore
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/components/locale-text"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface WeatherData {
  temp_c: number
  condition: string
  high_c: number
  low_c: number
  wind_kph: number
  humidity: number
  wave_height_m: number | null
}

interface ServiceItem {
  id: string
  title: Record<string, string>
  label: Record<string, string>
  shortDesc: Record<string, string>
  defaultMedia: string | null
  defaultMediaType: string | null
  link: string | null
  icon: string | null
  sortOrder: number
}

function kphToKnots(kph: number) {
  return Math.round(kph * 0.539957)
}

export function ServicesSection() {
  const { t, tUpper } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWeather(d))
      .catch(() => {})

    fetch("/api/services?homepage=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.services && setServices(d.services))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Small delay so DOM has rendered dynamic cards
    const timeout = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo(".svc-badge", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } })
        gsap.fromTo(".svc-title-word", { opacity: 0, y: 50, rotateX: 15 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } })
        gsap.fromTo(".svc-subtitle", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.3, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } })
        gsap.fromTo(".svc-card", { opacity: 0, y: 60, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".svc-grid", start: "top 85%" } })
      }, el)
      return () => ctx.revert()
    }, 50)

    return () => clearTimeout(timeout)
  }, [services])

  // Build combined card list: Weather(0), IYC Info(1), then all dynamic services
  // Layout pattern per row of 4: first row has weather+IYC+first service (6-col wide)
  // Then rows of 4 services at 3-col each, with every 5th row item spanning 6-col

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: "#070c26" }}
    >
      {/* Background SVG */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="https://iycweb.b-cdn.net/1774937080534-bg.svg"
          alt=""
          fill
          className="object-cover opacity-15"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070c26]/60 to-[#070c26]" />
      </div>

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "#84776e", filter: "blur(150px)", opacity: 0.1, transform: "translate(33%, -33%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "#070c26", filter: "blur(100px)", opacity: 0.9, transform: "translate(-25%, 25%)" }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 md:py-32">
        {/* Header */}
        <div className="flex flex-col mb-16 relative">
          <div className="absolute -top-12 -left-4 opacity-10 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
          </div>

          <div className="max-w-3xl">
            <div className="svc-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(132,119,110,0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>
                {tUpper("home.services.badge", "Curated Experiences")}
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-5 tracking-wide" style={{ fontFamily: "var(--font-display)", color: "#ffffff", perspective: "600px" }}>
              <span className="svc-title-word inline-block font-light" style={{ opacity: 0 }}>Elevate</span>{" "}
              <span className="svc-title-word inline-block font-light" style={{ opacity: 0 }}>Your</span>{" "}
              <span className="svc-title-word inline-block font-extrabold" style={{ opacity: 0, color: "#84776e" }}>Voyage</span>
            </h2>

            <p className="svc-subtitle text-sm md:text-base leading-relaxed max-w-[620px]" style={{ fontFamily: "var(--font-body)", color: "#8a9ab3", opacity: 0 }}>
              {t("home.services.description", "Beyond exceptional vessels, we curate every detail of your journey. From masterfully crafted itineraries to world-class dining, experience true mythic luxury.")}
            </p>
          </div>
        </div>

        {/* Row 1: Weather + IYC Info + first service (large) */}
        <div className="svc-grid grid grid-cols-1 md:grid-cols-12 gap-6 relative">
          {/* Weather Card */}
          <div
            className="svc-card md:col-span-6 lg:col-span-3 relative h-[420px] rounded-3xl overflow-hidden p-8 flex flex-col"
            style={{
              opacity: 0,
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(132,119,110,0.3)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "#84776e" }}>{tUpper("home.services.lefkadaMarina", "Lefkada Marina")}</span>
                </div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              </div>
              <div className="text-center mb-6">
                <span className="text-7xl font-extralight text-white tracking-tighter">{weather ? `${weather.temp_c}°` : "—"}</span>
                <div className="mt-2">
                  <span className="text-white/80 text-sm">{weather?.condition ?? "Loading..."}</span>
                  <span className="text-xs ml-2" style={{ color: "#84776e" }}>{weather ? `H:${weather.high_c}° L:${weather.low_c}°` : ""}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 py-6" style={{ borderTop: "1px solid rgba(132,119,110,0.2)", borderBottom: "1px solid rgba(132,119,110,0.2)" }}>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>
                  <span className="text-white text-sm font-medium">{weather ? `${kphToKnots(weather.wind_kph)} kt` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>{tUpper("home.services.wind", "Wind")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                  <span className="text-white text-sm font-medium">{weather ? `${weather.humidity}%` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>{tUpper("home.services.humidity", "Humidity")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M2 6s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /><path d="M2 12s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /></svg>
                  <span className="text-white text-sm font-medium">{weather?.wave_height_m != null ? `${weather.wave_height_m}m` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>{tUpper("home.services.waves", "Waves")}</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(132,119,110,0.6)" }}>{tUpper("home.services.perfectConditions", "Perfect Sailing Conditions")}</span>
              </div>
            </div>
          </div>

          {/* IYC Info Card — #84776e background */}
          <div
            className="svc-card md:col-span-6 lg:col-span-3 relative h-[420px] rounded-3xl overflow-hidden p-8 flex flex-col items-center justify-center text-center"
            style={{
              opacity: 0,
              background: "#84776e",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div className="w-36 h-14 relative mb-6">
              <Image
                src="https://iycweb.b-cdn.net/IYC_LOGO_TRANS_BLUE.svg"
                alt="IYC Logo"
                fill
                className="object-contain brightness-0 invert"
                unoptimized
              />
            </div>
            <h4 className="text-xl mb-4 uppercase tracking-wide font-light" style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}>
              {tUpper("home.services.theOdyssey", "The Odyssey")}
            </h4>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
              {t("home.services.odysseyDescription", "Since 2015, we've been crafting mythic voyages through the Ionian Isles. Every journey honors the spirit of exploration.")}
            </p>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="text-2xl font-light text-white">500+</span>
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.6)" }}>{tUpper("home.services.voyages", "Voyages")}</span>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.25)" }} />
              <div className="text-center">
                <span className="text-2xl font-light text-white">18+</span>
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.6)" }}>{tUpper("home.services.yachts", "Yachts")}</span>
              </div>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-1/3 -right-20 opacity-20 pointer-events-none z-0">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#84776e" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" stroke="#84776e" strokeWidth="0.5" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#84776e" strokeWidth="0.5" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#84776e" strokeWidth="0.5" />
            </svg>
          </div>

          {/* First service — large card spanning 6 cols */}
          {services[0] && (
            <ServiceCard
              service={services[0]}
              className="svc-card md:col-span-12 lg:col-span-6 h-[420px]"
              horizontal
              titleSize="text-3xl"
            />
          )}
        </div>

        {/* Remaining services in rows */}
        {services.length > 1 && (
          <ServiceRows services={services.slice(1)} />
        )}
      </div>
    </section>
  )
}

// ─── Service Rows: groups of 4, alternating 3+3+3+3 and 5+7 patterns ────────

function ServiceRows({ services }: { services: ServiceItem[] }) {
  const rows: ServiceItem[][] = []
  let i = 0
  let rowIndex = 0
  while (i < services.length) {
    if (rowIndex % 2 === 0) {
      // Row of 4 equal cards
      rows.push(services.slice(i, i + 4))
      i += 4
    } else {
      // Row of 2 cards (5-col + 7-col)
      rows.push(services.slice(i, i + 2))
      i += 2
    }
    rowIndex++
  }

  return (
    <>
      {rows.map((row, ri) => {
        const isWideRow = ri % 2 === 1
        return (
          <div key={ri} className="svc-grid grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
            {row.map((service, ci) => {
              let colClass: string
              if (isWideRow) {
                colClass = ci === 0 ? "md:col-span-6 lg:col-span-5" : "md:col-span-6 lg:col-span-7"
              } else {
                colClass = "md:col-span-6 lg:col-span-3"
              }
              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  className={`svc-card ${colClass} h-[420px]`}
                  horizontal={isWideRow}
                  titleSize={isWideRow ? "text-3xl" : "text-2xl"}
                />
              )
            })}
          </div>
        )
      })}
    </>
  )
}

// ─── Service Card: renders image card or text-only card ─────────────────────

function ServiceCard({
  className = "",
  service,
  horizontal = false,
  titleSize = "text-2xl",
}: {
  className?: string
  service: ServiceItem
  horizontal?: boolean
  titleSize?: string
}) {
  const { locale } = useTranslations()
  const title = removeGreekTonos(service.title?.[locale] || service.title?.en || "Service")
  const labelText = removeGreekTonos(service.label?.[locale] || service.label?.en || "")
  const desc = service.shortDesc?.[locale] || service.shortDesc?.en || ""
  const media = service.defaultMedia
  const mediaType = service.defaultMediaType
  const href = service.link || "#"

  // Text-only card (no media)
  if (!media) {
    return (
      <a
        href={href}
        className={`group relative rounded-3xl overflow-hidden block ${className}`}
        style={{
          opacity: 0,
          background: "linear-gradient(to top right, #f9fafb, #ffffff)",
          border: "1px solid rgba(132,119,110,0.3)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"
          ;(e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(132,119,110,0.4)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
          ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
        }}
      >
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="mb-auto flex justify-end">
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: "rgba(132,119,110,0.1)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <div>
            {labelText && (
              <span className="text-xs font-semibold tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                {labelText}
              </span>
            )}
            <h3 className={`${titleSize} mb-3 uppercase tracking-wide font-light`} style={{ color: "#070c26", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
              {title}
            </h3>
            {desc && (
              <p className="text-sm font-light leading-relaxed" style={{ color: "#4b5563" }}>
                {desc}
              </p>
            )}
          </div>
        </div>
      </a>
    )
  }

  // Image/video card
  return (
    <a
      href={href}
      className={`group relative rounded-3xl overflow-hidden block ${className}`}
      style={{
        opacity: 0,
        border: "1px solid rgba(132,119,110,0.3)",
        background: "#070c26",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(132,119,110,0.4)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
      }}
    >
      {mediaType === "video" ? (
        <video
          src={media}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.08]"
          style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
          muted autoPlay loop playsInline
        />
      ) : (
        <Image
          src={media}
          alt={title}
          fill
          className="object-cover transition-transform duration-[800ms] group-hover:scale-[1.08]"
          style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )}
      {/* Glass gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,12,38,0) 0%, rgba(7,12,38,0.8) 60%, rgba(7,12,38,0.98) 100%)" }} />

      <div className={`absolute inset-0 p-8 flex flex-col justify-end ${horizontal ? "md:flex-row md:items-end md:justify-between" : ""}`}>
        {horizontal ? (
          <>
            <div className="flex-1 md:pr-12">
              {labelText && (
                <span className="text-xs font-medium tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                  {labelText}
                </span>
              )}
              <h3 className={`${titleSize} mb-3 uppercase tracking-wide font-light`} style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", color: "#ffffff" }}>
                {title}
              </h3>
              {desc && (
                <p className="text-sm font-light max-w-lg leading-relaxed" style={{ color: "#d1d5db" }}>
                  {desc}
                </p>
              )}
            </div>
            <div className="mt-6 md:mt-0 flex-shrink-0">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#84776e] group-hover:text-[#070c26]"
                style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(132,119,110,0.2)", color: "#84776e" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-auto flex justify-end">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#84776e] group-hover:text-[#070c26]"
                style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(132,119,110,0.2)", color: "#84776e" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div>
              {labelText && (
                <span className="text-xs font-medium tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                  {labelText}
                </span>
              )}
              <h3 className={`${titleSize} mb-3 uppercase tracking-wide font-light`} style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", color: "#ffffff" }}>
                {title}
              </h3>
              {desc && (
                <p className="text-sm font-light leading-relaxed" style={{ color: "#d1d5db" }}>
                  {desc}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </a>
  )
}

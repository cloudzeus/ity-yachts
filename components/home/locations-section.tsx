"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, Globe, Activity, ChevronsUpDown, Anchor, Shield, Compass } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/components/locale-text"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface Location {
  id: string
  name: string
  slug: string
  image: string
  mediaType?: string
  shortDesc: string
  yachtCount?: number
  latitude?: number | null
  longitude?: number | null
  prefecture?: string
}

type FilterType = "all" | "legendary" | "hidden"

function formatCoord(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null
  const latDir = lat >= 0 ? "N" : "S"
  const lngDir = lng >= 0 ? "E" : "W"
  const latDeg = Math.floor(Math.abs(lat))
  const latMin = Math.round((Math.abs(lat) - latDeg) * 60)
  const lngDeg = Math.floor(Math.abs(lng))
  const lngMin = Math.round((Math.abs(lng) - lngDeg) * 60)
  return `${latDeg}°${latMin.toString().padStart(2, "0")}'${latDir} ${lngDeg}°${lngMin.toString().padStart(2, "0")}'${lngDir}`
}

export function LocationsSection({ destinations }: { destinations: Location[] }) {
  const { t } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const featured = destinations.slice(0, 3)
  const primary = featured[0]
  const secondary = featured[1]
  const tertiary = featured[2]

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      // Badge
      gsap.fromTo(
        ".loc-badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Title words
      gsap.fromTo(
        ".loc-title-word",
        { opacity: 0, y: 50, rotateX: 15 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Subtitle
      gsap.fromTo(
        ".loc-subtitle",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.4, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Filter pills
      gsap.fromTo(
        ".loc-filters",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.5, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Cards stagger
      gsap.fromTo(
        ".loc-card",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".loc-grid", start: "top 85%" } }
      )
      // CTA
      gsap.fromTo(
        ".loc-cta",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: "power3.out", scrollTrigger: { trigger: ".loc-cta", start: "top 90%" } }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  if (featured.length < 3) return null

  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    {
      key: "all",
      label: t("home.locations.filterAll", "All Routes"),
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      key: "legendary",
      label: t("home.locations.filterLegendary", "Legendary Isles"),
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      key: "hidden",
      label: t("home.locations.filterHidden", "Hidden Bays"),
      icon: <ChevronsUpDown className="w-3.5 h-3.5" />,
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 overflow-hidden"
      style={{ background: "#070c26" }}
    >
      {/* Greek pattern background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34v-58.34h58.34l.83-.83H0v60h60V0h-5.373zM16.5 16.5h27v27h-27v-27zm24 24v-21h-21v21h21z' fill='%2384776e' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background image - top right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0"
        style={{
          backgroundImage: "url(https://iycweb.b-cdn.net/1774930106193-bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.1,
          transform: "translate(33%, -33%)",
          maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
        }}
      />
      {/* Ambient glow - bottom left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "#070c26",
          filter: "blur(100px)",
          opacity: 0.9,
          transform: "translate(-25%, 25%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
        {/* Header row - left text, right filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 relative">
          {/* Decorative compass */}
          <div className="absolute -top-12 -left-4 opacity-10 pointer-events-none">
            <Compass className="w-[120px] h-[120px]" style={{ color: "#84776e" }} strokeWidth={0.5} />
          </div>

          <div className="max-w-3xl">
            <div className="loc-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(132,119,110,0.15)" }}>
                <Compass className="w-5 h-5" style={{ color: "#84776e" }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>
                {removeGreekTonos(t("home.locations.badge", "The Mythic Ionian"))}
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-6xl mb-5 tracking-wide"
              style={{ fontFamily: "var(--font-display)", color: "#ffffff", perspective: "600px" }}
            >
              <span className="loc-title-word inline-block font-light" style={{ opacity: 0 }}>Navigate</span>{" "}
              <span className="loc-title-word inline-block font-light" style={{ opacity: 0 }}>Your</span>{" "}
              <span className="loc-title-word inline-block font-extrabold" style={{ opacity: 0, color: "#84776e" }}>Odyssey</span>
            </h2>

            <p
              className="loc-subtitle text-[#8a9ab3] text-sm md:text-base leading-relaxed max-w-[620px]"
              style={{ fontFamily: "var(--font-body)", opacity: 0 }}
            >
              {t("home.locations.description", "Trace the wake of ancient heroes. Discover secluded sanctuaries, monumental cliffs, and sapphire waters aboard our premium fleet where legendary myth meets modern luxury.")}
            </p>
          </div>

          {/* Filter pills */}
          <div
            className="loc-filters flex flex-wrap gap-2 p-1.5 rounded-full z-10"
            style={{
              opacity: 0,
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(132,119,110,0.2)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            }}
          >
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    activeFilter === filter.key ? "#84776e" : "rgba(132,119,110,0.2)",
                  color:
                    activeFilter === filter.key ? "#ffffff" : "#84776e",
                  border:
                    activeFilter === filter.key
                      ? "none"
                      : "1px solid rgba(132,119,110,0.3)",
                }}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        <div className="loc-grid grid grid-cols-1 md:grid-cols-12 gap-6 relative">
          {/* Decorative concentric circles */}
          <div className="absolute -top-20 right-1/4 opacity-20 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#84776e" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" stroke="#84776e" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" stroke="#84776e" strokeWidth="0.5" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#84776e" strokeWidth="0.5" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#84776e" strokeWidth="0.5" />
              <line x1="18" y1="18" x2="82" y2="82" stroke="#84776e" strokeWidth="0.5" />
              <line x1="82" y1="18" x2="18" y2="82" stroke="#84776e" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Primary card - tall left */}
          <div className="loc-card md:col-span-5" style={{ opacity: 0 }}>
            <PrimaryCard location={primary} />
          </div>

          {/* Right column - 2 stacked horizontal cards */}
          <div className="md:col-span-7 grid grid-rows-2 gap-6 h-auto md:h-[500px] relative">
            {/* Decorative triangle */}
            <div className="absolute -bottom-10 -right-10 opacity-15 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                <path d="M50 10 L90 90 L10 90 Z" stroke="#84776e" strokeWidth="0.5" fill="none" />
                <path d="M50 25 L75 75 L25 75 Z" stroke="#84776e" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="55" r="15" stroke="#84776e" strokeWidth="0.5" />
              </svg>
            </div>

            <div className="loc-card" style={{ opacity: 0 }}>
              <HorizontalCard location={secondary} icon={<Anchor className="w-5 h-5" />} />
            </div>
            <div className="loc-card" style={{ opacity: 0 }}>
              <HorizontalCard location={tertiary} icon={<Shield className="w-5 h-5" />} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="loc-cta mt-16 text-center" style={{ opacity: 0 }}>
          <Link
            href="/locations"
            className="group inline-flex items-center gap-3 text-lg px-6 py-3 rounded-full transition-all duration-300 border hover:bg-[rgba(132,119,110,0.1)]"
            style={{
              color: "#84776e",
              borderColor: "rgba(132,119,110,0.5)",
            }}
          >
            <span className="border-b border-transparent group-hover:border-[#84776e] pb-1 transition-all">
              {t("home.locations.cta", "Unveil All Destinations")}
            </span>
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Primary Card (tall, left column) ---------- */
function PrimaryCard({ location }: { location: Location }) {
  const { t } = useTranslations()
  const coords = formatCoord(location.latitude, location.longitude)

  return (
    <Link
      href={`/locations/${location.slug}`}
      className="group relative h-[500px] rounded-3xl overflow-hidden block transition-all duration-[400ms]"
      style={{
        border: "1px solid rgba(132,119,110,0.3)",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(132,119,110,0.4)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
      }}
    >
      <LocationMedia location={location} sizes="(max-width: 768px) 100vw, 42vw" />

      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,12,38,0) 0%, rgba(7,12,38,0.8) 50%, rgba(7,12,38,0.95) 100%)",
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        {/* Top row: badge + arrow */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase"
            style={{ background: "#84776e", color: "#ffffff" }}
          >
            {removeGreekTonos(location.prefecture || "Ionian Sea")}
          </span>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#84776e] group-hover:text-[#070c26]"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(132,119,110,0.2)",
              color: "#ffffff",
            }}
          >
            <ArrowRight className="w-[18px] h-[18px]" />
          </div>
        </div>

        <h3
          className="text-3xl mb-3 tracking-wide"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300, color: "#ffffff" }}
        >
          {location.name}
        </h3>

        {coords && (
          <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "#84776e" }}>
            <Compass className="w-3.5 h-3.5" />
            <span>{coords}</span>
          </div>
        )}

        {/* Hover glass panel */}
        <div
          className="rounded-2xl p-5 mt-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(132,119,110,0.2)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
          }}
        >
          <p className="text-sm text-gray-300 font-light mb-4" style={{ fontFamily: "var(--font-body)" }}>
            {location.shortDesc}
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#84776e" }}>
            {coords && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {coords}
              </span>
            )}
            {coords && <span>•</span>}
            <span>{t("home.locations.deepDraft", "DEEP DRAFT")}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ---------- Horizontal Card (right column, stacked) ---------- */
function HorizontalCard({ location, icon }: { location: Location; icon: React.ReactNode }) {
  const coords = formatCoord(location.latitude, location.longitude)
  return (
    <Link
      href={`/locations/${location.slug}`}
      className="group relative rounded-3xl overflow-hidden block h-full transition-all duration-[400ms]"
      style={{
        border: "1px solid rgba(132,119,110,0.3)",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(132,119,110,0.4)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
      }}
    >
      <LocationMedia location={location} sizes="(max-width: 768px) 100vw, 58vw" />

      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,12,38,0) 0%, rgba(7,12,38,0.8) 50%, rgba(7,12,38,0.95) 100%)",
        }}
      />

      {/* Content - horizontal on md+ */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end md:flex-row md:items-end md:justify-between">
        <div className="flex-1 md:pr-8">
          <span
            className="text-xs font-medium tracking-wider uppercase mb-2 block"
            style={{ color: "#84776e" }}
          >
            {removeGreekTonos(location.prefecture || "Ionian Sea")}
          </span>
          <h3
            className="text-2xl mb-2 tracking-wide"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, color: "#ffffff" }}
          >
            {location.name}
          </h3>
          {coords && (
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "#84776e" }}>
              <Compass className="w-3.5 h-3.5" />
              <span>{coords}</span>
            </div>
          )}
          <p
            className="text-sm text-gray-400 font-light max-w-md line-clamp-2 md:line-clamp-none"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {location.shortDesc}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(132,119,110,0.2)",
              color: "#84776e",
            }}
          >
            {icon}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ---------- Media background (image or video) ---------- */
function LocationMedia({ location, sizes }: { location: Location; sizes: string }) {
  const isVideo = location.mediaType === "video" || location.image?.match(/\.(mp4|webm|mov)$/i)

  if (!location.image) {
    return <div className="absolute inset-0 bg-gradient-to-br from-[#070c26] to-[#84776e]/20" />
  }

  if (isVideo) {
    return (
      <video
        src={location.image}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.08]"
        style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
      />
    )
  }

  return (
    <Image
      src={location.image}
      alt={location.name}
      fill
      className="object-cover transition-transform duration-[800ms] group-hover:scale-[1.08]"
      style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
      sizes={sizes}
    />
  )
}

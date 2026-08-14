"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "@/components/locale-link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, Globe, Activity, ChevronsUpDown, Anchor, Shield, Compass } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { LazyVideo } from "@/components/lazy-video"
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
      style={{ background: "var(--surface-page)" }}
    >
      {/* Nautical chart contours — the design's topographic vector, replacing
          the old repeating square grid. */}
      <div
        aria-hidden="true"
        data-parallax="0.30"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(/brand/topographic.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.6,
          // Fade the chart out at both seams so the textured band dissolves
          // into the flat sections above and below instead of butting against
          // them with a visible edge.
          maskImage: "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
        }}
      />

      {/* Background image - top right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0"
        style={{
          opacity: 0.1,
          transform: "translate(33%, -33%)",
          maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
        }}
      >
        <Image
          src="https://iycweb.b-cdn.net/1774930106193-bg.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="600px"
          className="object-cover"
        />
      </div>
      {/* Ambient glow - bottom left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "var(--iyc-sand-200)",
          filter: "blur(100px)",
          opacity: 0.7,
          transform: "translate(-25%, 25%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
        {/* Header row - left text, right filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 relative">
          {/* Decorative compass */}
          <div className="absolute -top-12 -left-4 opacity-10 pointer-events-none">
            <Compass className="w-[120px] h-[120px]" style={{ color: "var(--text-subtle)" }} strokeWidth={0.5} />
          </div>

          <div className="max-w-3xl">
            <div className="loc-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(132,119,110,0.15)" }}>
                <Compass className="w-5 h-5" style={{ color: "var(--text-subtle)" }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                {removeGreekTonos(t("home.locations.badge", "The Mythic Ionian"))}
              </span>
            </div>

            <h2
              className="section-heading mb-5"
              style={{ color: "var(--text-heading)", perspective: "600px" }}
            >
              <span className="font-light">{t("home.locations.headingLead", "Navigate Your")}</span>{" "}
              <span className="font-extrabold" style={{ color: "var(--iyc-ionian-600)" }}>
                {t("home.locations.headingAccent", "Odyssey")}
              </span>
            </h2>

            
              {t("home.locations.description", "Trace the wake of ancient heroes. Discover secluded sanctuaries, monumental cliffs, and sapphire waters aboard our premium fleet where legendary myth meets modern luxury.")}
            
          </div>

          {/* Filter pills */}
          <div
            className="loc-filters flex flex-wrap gap-2 p-1.5 rounded-full z-10"
            style={{
              opacity: 0,
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--border-hairline)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    activeFilter === filter.key ? "#84776e" : "var(--border-hairline)",
                  color:
                    activeFilter === filter.key ? "#ffffff" : "#84776e",
                  border:
                    activeFilter === filter.key
                      ? "none"
                      : "1px solid var(--border-default)",
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
              color: "var(--text-link)",
              borderColor: "var(--border-default)",
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
        border: "1px solid var(--border-default)",
        transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(var(--lift-hover))"
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          "var(--shadow-md)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"
      }}
    >
      <LocationMedia location={location} sizes="(max-width: 768px) 100vw, 42vw" />

      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "var(--scrim-card)",
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        {/* Top row: badge + arrow */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase"
            style={{ background: "var(--action-accent)", color: "var(--text-on-accent)" }}
          >
            {removeGreekTonos(location.prefecture || "Ionian Sea")}
          </span>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[var(--iyc-taupe-500)] group-hover:text-[var(--text-heading)]"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-heading)",
            }}
          >
            <ArrowRight className="w-[18px] h-[18px]" />
          </div>
        </div>

        <h3
          className="text-3xl mb-3 tracking-wide"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300, color: "var(--text-heading)" }}
        >
          {location.name}
        </h3>

        {coords && (
          <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "var(--text-subtle)" }}>
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
            border: "1px solid var(--border-hairline)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm text-[var(--text-muted)] font-light mb-4" style={{ fontFamily: "var(--font-body)" }}>
            {location.shortDesc}
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-subtle)" }}>
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
        border: "1px solid var(--border-default)",
        transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(var(--lift-hover))"
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          "var(--shadow-md)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"
      }}
    >
      <LocationMedia location={location} sizes="(max-width: 768px) 100vw, 58vw" />

      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "var(--scrim-card)",
        }}
      />

      {/* Content - horizontal on md+ */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end md:flex-row md:items-end md:justify-between">
        <div className="flex-1 md:pr-8">
          <span
            className="text-xs font-medium tracking-wider uppercase mb-2 block"
            style={{ color: "var(--text-subtle)" }}
          >
            {removeGreekTonos(location.prefecture || "Ionian Sea")}
          </span>
          <h3
            className="text-2xl mb-2 tracking-wide"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, color: "var(--text-heading)" }}
          >
            {location.name}
          </h3>
          {coords && (
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "var(--text-subtle)" }}>
              <Compass className="w-3.5 h-3.5" />
              <span>{coords}</span>
            </div>
          )}
          <p
            className="text-sm text-[var(--text-subtle)] font-light max-w-md line-clamp-2 md:line-clamp-none"
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
              border: "1px solid var(--border-hairline)",
              color: "var(--text-subtle)",
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
    return <div className="absolute inset-0 bg-gradient-to-br from-[#05111F] to-[#84776e]/20" />
  }

  if (isVideo) {
    /* Off screen this costs nothing: autoPlay would otherwise pull the whole
       file down, and these location clips run to tens of megabytes. */
    return (
      <LazyVideo
        src={location.image}
        className="absolute inset-0 w-full h-full transition-transform duration-[800ms] group-hover:scale-[1.08]"
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

"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MapPin, ArrowRight, Navigation } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type TranslatedField = Record<string, string> | null | undefined

interface LocationItem {
  id: string
  name: string
  nameTranslations?: TranslatedField
  slug: string
  image: string | null
  imageType: string | null
  shortDesc: string | TranslatedField
  prefecture: string | TranslatedField
  city: string
  latitude: number | null
  longitude: number | null
}

/* ─── Coordinates ─────────────────────────────────────────────────────── */

function formatCoord(val: number, isLat: boolean) {
  const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W"
  const abs = Math.abs(val)
  const deg = Math.floor(abs)
  const min = ((abs - deg) * 60).toFixed(1)
  return `${deg}°${min}'${dir}`
}

function resolveField(field: string | TranslatedField, locale: string): string {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[locale] || field.en || ""
}

/* ─── Grid ─────────────────────────────────────────────────────────────
   One card, one rhythm. The previous layout used two divergent card
   components on a 12/7/5 span pattern, so every row had a different height
   and a different visual language. A single portrait card on an even grid
   lets the photography carry the page.                                    */

export function LocationsGrid({ locations }: { locations: LocationItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslations()

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    // Cards render with opacity:0 for the stagger. If we skip the animation we
    // must still show them, or reduced-motion users get an empty grid.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll<HTMLElement>(".loc-card").forEach((c) => (c.style.opacity = "1"))
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".loc-card",
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.04, // 40ms — reads as a sequence, not a queue
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [locations])

  if (locations.length === 0) {
    return (
      <p className="py-20 text-center text-lg text-[var(--text-muted)]">
        {t("locations.noDestinations", "No destinations available yet. Check back soon.")}
      </p>
    )
  }

  // The grid adapts to the count. Three columns holding two cards leaves a
  // dead third; one portrait card alone reads as an orphan. Fewer cards get
  // fewer, wider columns and a landscape crop.
  const n = locations.length
  const cols =
    n === 1
      ? "grid-cols-1"
      : n === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : n === 4
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  const ratio = n === 1 ? "aspect-[21/9]" : n <= 2 ? "aspect-[3/2]" : n === 4 ? "aspect-[16/10]" : "aspect-[4/5]"

  return (
    <div ref={gridRef} className={`mt-10 grid gap-6 ${cols}`}>
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} ratio={ratio} />
      ))}
    </div>
  )
}

/* ─── Card ─────────────────────────────────────────────────────────────── */

function LocationCard({ location, ratio }: { location: LocationItem; ratio: string }) {
  const { locale, t } = useTranslations()
  const cardRef = useRef<HTMLAnchorElement>(null)
  const coordRef = useRef<HTMLSpanElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const name = resolveField(location.nameTranslations, locale) || location.name
  const desc = resolveField(location.shortDesc, locale)
  const region = resolveField(location.prefecture, locale) || "Ionian Sea"

  const baseLat = location.latitude
  const baseLon = location.longitude
  const hasCoords = baseLat != null && baseLon != null
  const isVideo =
    location.imageType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(location.image ?? "")

  // The coordinate readout tracks the pointer, like a cursor position on a
  // chart. Written straight to the DOM on an animation frame — putting this
  // through React state would re-render the card on every mouse move.
  useEffect(() => {
    const card = cardRef.current
    const out = coordRef.current
    if (!card || !out || !hasCoords) return
    if (window.matchMedia("(pointer: coarse)").matches) return

    let frame: number | null = null
    let nx = 0.5
    let ny = 0.5

    const paint = () => {
      frame = null
      // ±0.04° across the card — enough to feel live, still the real place
      const lat = (baseLat as number) + (0.5 - ny) * 0.08
      const lon = (baseLon as number) + (nx - 0.5) * 0.08
      out.textContent = `${formatCoord(lat, true)}  ${formatCoord(lon, false)}`
      if (imageRef.current) {
        imageRef.current.style.transform =
          `scale(1.06) translate3d(${(nx - 0.5) * -14}px, ${(ny - 0.5) * -14}px, 0)`
      }
    }

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect()
      nx = (e.clientX - r.left) / r.width
      ny = (e.clientY - r.top) / r.height
      if (frame === null) frame = requestAnimationFrame(paint)
    }

    const onLeave = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      out.textContent = `${formatCoord(baseLat as number, true)}  ${formatCoord(baseLon as number, false)}`
      if (imageRef.current) imageRef.current.style.transform = ""
    }

    card.addEventListener("mousemove", onMove)
    card.addEventListener("mouseleave", onLeave)
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      card.removeEventListener("mousemove", onMove)
      card.removeEventListener("mouseleave", onLeave)
    }
  }, [baseLat, baseLon, hasCoords])

  return (
    <Link
      ref={cardRef}
      href={`/locations/${location.slug}`}
      className="loc-card iyc-card group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-card"
      style={{ opacity: 0 }}
    >
      {/* Photograph */}
      <div className={`relative w-full overflow-hidden ${ratio}`}>
        {location.image ? (
          <div
            ref={imageRef}
            className="absolute inset-0 transition-transform duration-[1100ms]"
            style={{ transitionTimingFunction: "var(--ease-drift)" }}
          >
            {isVideo ? (
              // Several destinations ship an .mp4 as their default media —
              // next/image cannot decode those, it renders an empty box.
              <video
                src={location.image}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                aria-label={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={location.image}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--gradient-ocean)" }} />
        )}

        {/* The card scrim used everywhere else: photograph settling into limestone */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: "62%", background: "var(--scrim-card)" }}
        />

        {/* Region badge */}
        <span className="absolute left-4 top-4 z-10 rounded-full bg-[var(--action-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-on-accent)]">
          {removeGreekTonos(region)}
        </span>

        {/* Live coordinate readout */}
        {hasCoords && (
          <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[rgba(4,13,25,0.72)] px-2.5 py-1 backdrop-blur-md">
            <Navigation className="h-3 w-3 text-[var(--iyc-ionian-300)]" />
            <span
              ref={coordRef}
              className="iyc-mono text-[10px] text-white/85"
              style={{ fontSize: "10px" }}
            >
              {formatCoord(baseLat as number, true)}&nbsp;&nbsp;
              {formatCoord(baseLon as number, false)}
            </span>
          </span>
        )}

        {/* Caption, on the limestone foot */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          {location.city && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[var(--text-subtle)]">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                {removeGreekTonos(location.city)}
              </span>
            </div>
          )}
          <h2
            className="text-2xl font-bold text-[var(--text-heading)] transition-colors duration-300 group-hover:text-[var(--text-link)]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {name}
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 pt-4">
        {desc && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
            {desc}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-link)] transition-all group-hover:gap-3">
          {t("locations.explore", "Explore destination")}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      {/* Hairline sweep on hover, as on the rest of the system */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-[var(--iyc-ionian-500)] to-transparent transition-transform duration-[320ms] group-hover:scale-x-100" />
    </Link>
  )
}

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Anchor,
  Navigation,
  Maximize2,
  Calendar,
  CalendarDays,
  Route,
  Ship,
  Camera,
  ArrowRight,
  Wind,
  Waves,
  Send,
  CheckCircle2,
  User,
  Mail,
} from "lucide-react"
import { ItineraryStoryMap, type StoryPoint } from "./itinerary-story-map"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import { ItineraryDayChart } from "@/components/itinerary-day-chart"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─── Types ────────────────────────────────────────────────────────────── */

type LegData = {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  latitude: number | null
  longitude: number | null
  images: string[]
  sortOrder: number
}

type DayData = {
  id: string
  dayNumber: number
  description: Record<string, string>
  legs: LegData[]
}

type ItineraryData = {
  name: Record<string, string>
  shortDesc: Record<string, string>
  startFrom: string
  startLatitude: number | null
  startLongitude: number | null
  totalDays: number
  totalMiles: number
  defaultMedia: string | null
  defaultMediaType: string | null
  places: Array<{ name: string; latitude: number; longitude: number }>
  days: DayData[]
}

/* ─── Flatten legs into sequential stops ───────────────────────────────── */

type Stop = {
  dayNumber: number
  leg: LegData
  dayDesc: string
  flatIndex: number
}

function buildStops(days: DayData[], locale: string): Stop[] {
  const out: Stop[] = []
  let idx = 0
  for (const d of days) {
    for (const leg of d.legs) {
      if (leg.latitude && leg.longitude) {
        const desc = d.description as Record<string, string>
        out.push({ dayNumber: d.dayNumber, leg, dayDesc: desc?.[locale] || desc?.en || "", flatIndex: idx })
        idx++
      }
    }
  }
  return out
}

function groupByDay(stops: Stop[]): Map<number, Stop[]> {
  const map = new Map<number, Stop[]>()
  for (const s of stops) {
    if (!map.has(s.dayNumber)) map.set(s.dayNumber, [])
    map.get(s.dayNumber)!.push(s)
  }
  return map
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function getAvailableMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return months
}

/* ─── Lightbox ─────────────────────────────────────────────────────────── */

function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const isVideo = (src: string) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src)

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" })
    gsap.fromTo(contentRef.current, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.1 })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      if (e.key === "ArrowRight") nav(1)
      if (e.key === "ArrowLeft") nav(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [images.length])

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" })
    gsap.to(contentRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.25, ease: "power2.in", onComplete: onClose })
  }

  const nav = (dir: number) => {
    const next = idx + dir
    if (next < 0 || next >= images.length) return
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0, x: dir * -30, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          setIdx(next)
          gsap.fromTo(contentRef.current, { opacity: 0, x: dir * 30 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" })
        },
      })
    } else setIdx(next)
  }

  const src = images[idx]
  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={handleClose}>
      <button onClick={handleClose} className="absolute top-6 right-6 z-10 size-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200">
        <X className="size-5" />
      </button>
      <div ref={contentRef} className="relative" onClick={(e) => e.stopPropagation()}>
        {isVideo(src) ? (
          <video src={src} controls autoPlay playsInline className="rounded-md" style={{ maxWidth: "90vw", maxHeight: "85vh" }} />
        ) : (
          <Image src={src} alt="" width={1600} height={1200} className="rounded-md" style={{ maxWidth: "90vw", maxHeight: "85vh", display: "block", width: "auto", height: "auto" }} />
        )}
        {images.length > 1 && (
          <>
            {idx > 0 && (
              <button onClick={() => nav(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all duration-200">
                <ChevronLeft className="size-5" />
              </button>
            )}
            {idx < images.length - 1 && (
              <button onClick={() => nav(1)} className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all duration-200">
                <ChevronRight className="size-5" />
              </button>
            )}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
              {images.map((_, i) => (
                <button key={i} onClick={() => { if (i !== idx) nav(i - idx) }} className="rounded-full transition-all duration-300" style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════════════ */

export function ItineraryDetailClient({ itinerary, mapsKey }: { itinerary: ItineraryData; mapsKey: string | null }) {
  const { locale, t, tUpper } = useTranslations()
  const name = itinerary.name as Record<string, string>
  const shortDesc = itinerary.shortDesc as Record<string, string>
  const places = itinerary.places as Array<{ name: string; latitude: number; longitude: number }>
  const stops = buildStops(itinerary.days, locale)
  const dayGroups = groupByDay(stops)

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [cardsFixed, setCardsFixed] = useState(true)

  // Enquiry modal state
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" })
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [enquiryGuestCount, setEnquiryGuestCount] = useState(2)
  const availableMonths = getAvailableMonths()

  // Refs
  const mapSectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const isFirst = useRef(true)
  const legRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // Map points
  const mapPoints: StoryPoint[] = stops.map((s, i) => ({
    lat: s.leg.latitude!,
    lng: s.leg.longitude!,
    label: (s.leg.name as Record<string, string>)?.[locale] || (s.leg.name as Record<string, string>)?.en || `Stop ${i + 1}`,
    dayNumber: s.dayNumber,
    index: i,
    type: "leg" as const,
    images: (s.leg.images as string[]) || [],
  }))

  // ── Cards visible while ANY part of map section is in viewport ──────
  useEffect(() => {
    const el = mapSectionRef.current
    if (!el) return

    // Use IntersectionObserver — more reliable than ScrollTrigger for this
    // Cards stay visible as long as map section intersects viewport at all
    const observer = new IntersectionObserver(
      ([entry]) => {
        setCardsFixed(entry.isIntersecting)
      },
      {
        // Shrink the root's bottom edge to 45% of the viewport. The cards are
        // centred at 50vh, so they fade out just as the map's lower edge rises
        // past them — before they can sit over the section below. Extending the
        // root instead (the previous +250px) kept them alive well into the
        // stats ribbon, where they overlapped unrelated content.
        rootMargin: "0px 0px -55% 0px",
        threshold: 0,
      }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Animate stop change ────────────────────────────────────────────
  const goTo = useCallback(
    (next: number) => {
      if (next === active || next < 0 || next >= stops.length) return
      const detail = detailRef.current
      if (detail) {
        const tl = gsap.timeline()
        tl.to(detail, { opacity: 0, x: -12, duration: 0.2, ease: "power2.in" })
        tl.call(() => setActive(next))
        tl.fromTo(detail, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, "+=0.03")
      } else {
        setActive(next)
      }
    },
    [active, stops.length]
  )

  // ── Initial entrance ───────────────────────────────────────────────
  useEffect(() => {
    if (!isFirst.current) return
    isFirst.current = false
    if (headerRef.current) gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.5 })
  }, [])

  // ── Scroll active leg to center in timeline ────────────────────────
  useEffect(() => {
    const scrollEl = timelineScrollRef.current
    const activeEl = legRefs.current.get(active)
    if (!scrollEl || !activeEl) return
    const scrollTop = activeEl.offsetTop - scrollEl.clientHeight / 2 + activeEl.clientHeight / 2
    scrollEl.scrollTo({ top: scrollTop, behavior: "smooth" })
  }, [active])

  // ── Image stagger on stop change ───────────────────────────────────
  useEffect(() => {
    if (!detailRef.current) return
    const imgs = detailRef.current.querySelectorAll("[data-img]")
    if (imgs.length === 0) return
    gsap.fromTo(imgs, { opacity: 0, y: 14, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: "power2.out", delay: 0.1 })
  }, [active])

  // ── Portal mount state for fixed cards ──────────────────────────────
  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => { setPortalReady(true) }, [])

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const handleSubmitEnquiry = async () => {
    if (!enquiryForm.firstName || !enquiryForm.email) return
    setEnquirySubmitting(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: enquiryForm.firstName,
          lastName: enquiryForm.lastName,
          email: enquiryForm.email,
          phone: enquiryForm.phone,
          notes: enquiryForm.notes,
          yachtName: name[locale] || "Itinerary Enquiry",
          type: "enquiry",
          checkIn: today,
          checkOut: today,
          preferredMonths: selectedMonths,
          guests: enquiryGuestCount,
        }),
      })
      setEnquirySuccess(true)
    } catch {
      // silently handle
    } finally {
      setEnquirySubmitting(false)
    }
  }

  const cur = stops[active]
  if (!cur && stops.length === 0) return null
  const stop = cur || stops[0]
  const legName = (stop.leg.name as Record<string, string>)?.[locale] || (stop.leg.name as Record<string, string>)?.en || ""
  const legDesc = (stop.leg.description as Record<string, string>)?.[locale] || (stop.leg.description as Record<string, string>)?.en || ""
  const legImgs = stop.leg.images as string[]

  // Card positioning: fixed when map is in view, smoothly hidden when not
  /* Itineraries may carry an .mp4 as their default media; next/image cannot
     decode video and renders an empty box. */
  const isVideoMedia = (u: string | null, t: string | null) =>
    !!u && (t === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(u))

  const cardStyle: React.CSSProperties = cardsFixed
    ? { position: "fixed", opacity: 1, pointerEvents: "auto", transition: "opacity 0.3s ease" }
    : { position: "fixed", opacity: 0, pointerEvents: "none", transition: "opacity 0.3s ease" }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Dark interactive map at 16:11
          ═══════════════════════════════════════════════════════════════ */}
      {/* Full-bleed: the 56px top padding left a navy strip above the map that
          read as a border, and the -4px height was compensating for it. The
          header floats over the map on its own scrim, as on every other hero. */}
      <section ref={mapSectionRef} className="relative w-full" style={{ background: "var(--iyc-ionian-900)", height: "100dvh" }}>
        {/* Map fills viewport below header */}
        <div className="relative w-full h-full">
          <ItineraryStoryMap
            points={mapPoints}
            activeIndex={active}
            onPointClick={(i) => goTo(i)}
            onImageClick={(images, index) => setLightbox({ images, index })}
            className="absolute inset-0 w-full h-full"
            mapsKey={mapsKey}
          />

          {/* Bottom gradient for title readability */}
          <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none z-[2]" style={{ background: "var(--scrim-photo)" }} />

          {/* ─── Title overlay at bottom of map ──────────────────────── */}
          <div ref={headerRef} className="absolute bottom-0 left-0 right-0 z-[3] pointer-events-none">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-6 md:pb-8 pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="size-3.5 text-[var(--iyc-ionian-300)]" />
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--iyc-ionian-300)]/70">{tUpper("itinerary.heroLabel", "Sailing Itinerary")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "#FFFFFF" }}>
                {name[locale] || t("itinerary.untitled", "Untitled")}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
                {itinerary.startFrom && <span className="flex items-center gap-1.5"><Anchor className="size-3.5" /> {t("itinerary.from", "From")} {itinerary.startFrom}</span>}
                {itinerary.totalDays > 0 && <span className="flex items-center gap-1.5"><Navigation className="size-3.5" /> {itinerary.totalDays} {t("itinerary.days", "Days")}</span>}
                {itinerary.totalMiles > 0 && <span>{itinerary.totalMiles} NM</span>}
              </div>
              {places.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {places.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: "rgba(95,174,223,0.05)", color: "rgba(95,174,223,0.5)", border: "1px solid rgba(95,174,223,0.08)" }}>
                      <MapPin className="size-2.5" /> {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Mobile: horizontal stop pills ──────────────────────── */}
          {stops.length > 0 && (
            <div className="absolute bottom-36 left-0 right-0 md:hidden z-10 px-4">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {stops.map((s, i) => {
                  const sName = (s.leg.name as Record<string, string>)?.[locale] || (s.leg.name as Record<string, string>)?.en || `${i + 1}`
                  const isCur = i === active
                  return (
                    <button key={s.leg.id} onClick={() => goTo(i)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shrink-0 transition-all duration-300" style={{ background: isCur ? "rgba(95,174,223,0.12)" : "rgba(4,13,25,0.75)", border: isCur ? "1px solid rgba(95,174,223,0.2)" : "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                      <div className="flex items-center justify-center size-4 rounded-full text-[7px] font-bold" style={{ background: isCur ? "linear-gradient(135deg, var(--iyc-ionian-300), var(--iyc-ionian-600))" : "rgba(255,255,255,0.06)", color: isCur ? "white" : "rgba(255,255,255,0.25)" }}>{i + 1}</div>
                      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: isCur ? "white" : "rgba(255,255,255,0.3)" }}>{sName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FIXED OVERLAY CARDS — portaled to body to escape clipPath
          ═══════════════════════════════════════════════════════════════ */}

      {portalReady && stops.length > 0 && createPortal(
        <>
          {/* ─── LEFT: Timeline ───────────────────────────────────────── */}
          <div
            className="hidden lg:block z-[20] left-4 lg:left-8 w-[308px] xl:w-[332px]"
            style={{
              ...cardStyle,
              top: "50vh",
              transform: "translateY(-50%)",
              height: "45%",
            }}
          >
            <div
              ref={timelineScrollRef}
              className="w-full h-full overflow-y-auto px-5 py-4 timeline-scroll"
              style={{
                background: "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0.4))",
                backdropFilter: "blur(24px)",
                borderRadius: 20,
                boxShadow: "0 12px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {Array.from(dayGroups.entries()).map(([dayNum, dayStops]) => (
                <div key={dayNum} className="mb-0.5">
                  <div className="flex items-center gap-2 mb-0.5 py-1.5">
                    <div className="flex items-center justify-center size-6 rounded-full text-[9px] font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))" }}>{dayNum}</div>
                    <span className="text-[9px] font-bold tracking-[0.1em] uppercase" style={{ color: "var(--iyc-ionian-300)" }}>{tUpper("itinerary.day", "Day")} {dayNum}</span>
                    <div className="h-px flex-1 bg-black/[0.06]" />
                  </div>
                  <div className="relative ml-[10px] border-l border-black/[0.08] pl-3.5">
                    {dayStops.map((s) => {
                      const sName = (s.leg.name as Record<string, string>)?.[locale] || (s.leg.name as Record<string, string>)?.en || `${t("itinerary.stop", "Stop")} ${s.flatIndex + 1}`
                      const isActive = s.flatIndex === active
                      const hasImages = (s.leg.images as string[]).length > 0
                      return (
                        <button
                          key={s.leg.id}
                          ref={(el) => { if (el) legRefs.current.set(s.flatIndex, el) }}
                          onClick={() => goTo(s.flatIndex)}
                          className="relative flex items-start gap-2 w-full text-left py-1.5 group transition-all duration-300"
                        >
                          <div className="absolute -left-[18px] top-[9px] rounded-full transition-all duration-500" style={{ width: isActive ? 7 : 4, height: isActive ? 7 : 4, marginTop: isActive ? -1.5 : 0, background: isActive ? "var(--iyc-ionian-600)" : "rgba(0,0,0,0.12)", boxShadow: isActive ? "0 0 6px rgba(0,85,169,0.4)" : "none" }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold leading-snug truncate transition-colors duration-300" style={{ color: isActive ? "var(--text-heading)" : "rgba(0,0,0,0.35)", fontFamily: "var(--font-display)" }}>{sName}</p>
                            {isActive && hasImages && (
                              <span className="text-[8px] font-medium mt-0.5 block" style={{ color: "var(--iyc-ionian-300)" }}>{(s.leg.images as string[]).length} {(s.leg.images as string[]).length > 1 ? t("itinerary.photos", "photos") : t("itinerary.photo", "photo")}</span>
                            )}
                          </div>
                          {isActive && <div className="absolute -left-[19px] top-0 bottom-0 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, var(--iyc-ionian-600), var(--iyc-ionian-800))" }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT: Detail card ───────────────────────────────────── */}
          <div
            ref={detailRef}
            className="hidden md:block z-[20] right-4 md:right-6 lg:right-10 w-[280px] md:w-[320px] lg:w-[360px] overflow-hidden"
            style={{
              ...cardStyle,
              top: "50vh",
              transform: "translateY(-50%)",
              background: "linear-gradient(135deg, var(--iyc-ionian-800), var(--iyc-ionian-600))",
              backdropFilter: "blur(24px)",
              borderRadius: 20,
              boxShadow: "0 12px 48px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div className="p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold tracking-[0.1em] uppercase" style={{ color: "rgba(95,174,223,0.7)" }}>{tUpper("itinerary.day", "Day")} {stop.dayNumber}</span>
                <div className="size-1 rounded-full bg-white/15" />
                <span className="text-[9px] text-white/30 tabular-nums">{active + 1} {t("itinerary.of", "of")} {stops.length}</span>
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em", color: "#ffffff" }}>{legName || `${t("itinerary.stop", "Stop")} ${active + 1}`}</h3>
              {(legDesc || stop.dayDesc) && <p className="text-[12px] leading-[1.7] text-white/50 mb-3">{legDesc || stop.dayDesc}</p>}

              {legImgs.length > 0 && (
                <div className="group/gallery cursor-pointer" onClick={() => setLightbox({ images: legImgs, index: 0 })}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "linear-gradient(135deg, rgba(0,85,169,0.3), rgba(95,174,223,0.15))", color: "var(--iyc-ionian-300)" }}>
                      {legImgs.length} {legImgs.length > 1 ? t("itinerary.photos", "Photos") : t("itinerary.photo", "Photo")}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center -space-x-3 group-hover/gallery:-space-x-1 transition-all duration-500 ease-out">
                      {legImgs.slice(0, 5).map((url, i) => (
                        <div
                          key={i}
                          data-img
                          className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110 group-hover/gallery:border-white"
                          style={{ zIndex: 5 - i, transitionDelay: `${i * 40}ms` }}
                        >
                          <Image src={url} alt={`${legName} ${i + 1}`} width={1200} height={800} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {legImgs.length > 5 && (
                      <div
                        className="relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-xs font-semibold shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110 group-hover/gallery:bg-white/30 -ml-3 group-hover/gallery:-ml-1"
                        style={{ zIndex: 0, transitionDelay: "200ms" }}
                      >
                        +{legImgs.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button onClick={() => goTo(active - 1)} disabled={active === 0} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 disabled:opacity-20 hover:bg-white/[0.06]" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                  <ChevronLeft className="size-3" /> {t("itinerary.prev", "Prev")}
                </button>
                <button onClick={() => goTo(active + 1)} disabled={active === stops.length - 1} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 disabled:opacity-20 hover:bg-white/[0.08]" style={{ border: "1px solid rgba(95,174,223,0.2)", color: "rgba(95,174,223,0.7)" }}>
                  {t("itinerary.next", "Next")} <ChevronRight className="size-3" />
                </button>
                <div className="flex-1" />
                <div className="flex gap-0.5 items-center">
                  {stops.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} className="rounded-full transition-all duration-400" style={{ width: i === active ? 14 : 4, height: 4, background: i === active ? "linear-gradient(90deg, var(--iyc-ionian-300), var(--iyc-ionian-600))" : "rgba(255,255,255,0.1)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BELOW MAP — Premium Editorial Itinerary Content
          ═══════════════════════════════════════════════════════════════ */}

      {/* ── SECTION 1: Stats ribbon with coordinate HUD ───────────── */}
      <section className="relative overflow-hidden" style={{ background: "var(--surface-page)" }}>
        {/* Dot grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(11,96,153,0.07) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        {/* Top accent */}
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, var(--iyc-ionian-600), var(--iyc-ionian-300), var(--iyc-ionian-600), transparent)" }} />

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Coordinate header bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-[var(--iyc-ionian-300)] pulse-ring" />
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {t("itinerary.origin", "ORIGIN")} {itinerary.startLatitude && itinerary.startLongitude ? `${Math.abs(itinerary.startLatitude).toFixed(4)}°${itinerary.startLatitude >= 0 ? "N" : "S"} ${Math.abs(itinerary.startLongitude).toFixed(4)}°${itinerary.startLongitude >= 0 ? "E" : "W"}` : itinerary.startFrom || "—"}
              </span>
            </div>
            <svg className="hidden md:block flex-1 mx-4 h-[2px]" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(95,174,223,0.12)" strokeWidth="2" strokeDasharray="6 4" className="dash-move" />
            </svg>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {stops.length > 0 && stops[stops.length - 1].leg.latitude ? `${Math.abs(stops[stops.length - 1].leg.latitude!).toFixed(4)}°N ${Math.abs(stops[stops.length - 1].leg.longitude!).toFixed(4)}°E` : t("itinerary.dest", "DEST")}
              </span>
              <div className="size-1.5 rounded-full bg-[var(--iyc-ionian-300)] pulse-ring" style={{ animationDelay: "1.5s" }} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
            {[
              { icon: Calendar, label: tUpper("itinerary.stat.duration", "Duration"), value: `${itinerary.totalDays}`, unit: t("itinerary.days", "Days"), color: "var(--iyc-ionian-300)" },
              { icon: Route, label: tUpper("itinerary.stat.distance", "Distance"), value: `${itinerary.totalMiles}`, unit: "NM", color: "var(--iyc-ionian-500)" },
              { icon: Anchor, label: tUpper("itinerary.stat.departure", "Departure"), value: itinerary.startFrom || "—", unit: "", color: "var(--iyc-ionian-600)" },
              { icon: MapPin, label: tUpper("itinerary.stat.stops", "Stops"), value: `${stops.length}`, unit: t("itinerary.stat.locations", "Locations"), color: "var(--iyc-ionian-300)" },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative p-5 rounded-xl transition-all duration-500 hover:-translate-y-0.5"
                style={{ background: "transparent", border: "1px solid rgba(95,174,223,0.05)" }}
              >
                <div className="absolute top-2.5 right-2.5 size-1 rounded-full blink-dot" style={{ background: stat.color, animationDelay: `${i * 0.6}s` }} />
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${stat.color}08, transparent 70%)` }} />
                <stat.icon className="size-5 mb-3" style={{ color: stat.color }} />
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-2xl md:text-3xl font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</span>
                  {stat.unit && <span className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>{stat.unit}</span>}
                </div>
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ color: "var(--iyc-ionian-600)" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(95,174,223,0.08), transparent)" }} />
      </section>

      {/* ── SECTION 2: About — warm cream with floating decorations ─ */}
      {shortDesc[locale] && (
        <section className="relative py-24 md:py-32 overflow-hidden" style={{ background: "var(--iyc-sand-50)" }}>
          {/* Large watermark number */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ fontSize: "28rem", fontFamily: "var(--font-display)", fontWeight: 800, color: "rgba(46,44,40,0.02)", lineHeight: 1 }}>
            {itinerary.totalDays}
          </div>
          {/* Floating decorative elements */}
          <div className="absolute top-16 right-[12%] pointer-events-none float-slow" style={{ opacity: 0.05 }}>
            <Compass className="size-28" style={{ color: "var(--iyc-ionian-800)" }} />
          </div>
          <div className="absolute bottom-20 left-[6%] pointer-events-none float-slower" style={{ opacity: 0.04 }}>
            <Anchor className="size-20" style={{ color: "var(--iyc-ionian-300)" }} />
          </div>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-[280px] h-[1px]" style={{ background: "linear-gradient(90deg, var(--iyc-ionian-600), transparent)" }} />

          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: editorial text */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="size-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))" }}>
                    <Wind className="size-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "var(--iyc-ionian-300)" }}>{tUpper("itinerary.theVoyage", "The Voyage")}</span>
                  <svg className="w-16 h-[2px]" preserveAspectRatio="none">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--iyc-ionian-600)" strokeWidth="2" strokeDasharray="4 3" strokeOpacity="0.25" className="dash-move" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] mb-8" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>
                  {name[locale] || t("itinerary.untitledRoute", "Untitled Route")}
                </h2>
                <p className="text-base md:text-[17px] leading-[1.9] mb-8" style={{ color: "var(--iyc-ink-700)", maxWidth: "32em" }}>{shortDesc[locale]}</p>

                {/* Coordinate badges */}
                <div className="flex flex-wrap items-center gap-2.5 mb-8">
                  {itinerary.startFrom && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(46,44,40,0.04)", border: "1px solid rgba(46,44,40,0.06)" }}>
                      <Anchor className="size-3 shrink-0" style={{ color: "var(--iyc-ionian-300)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--text-heading)" }}>{t("itinerary.from", "From")} {itinerary.startFrom}</span>
                    </div>
                  )}
                  {itinerary.totalMiles > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(46,44,40,0.04)", border: "1px solid rgba(46,44,40,0.06)" }}>
                      <Waves className="size-3 shrink-0" style={{ color: "var(--iyc-ionian-300)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--text-heading)" }}>{itinerary.totalMiles} NM</span>
                    </div>
                  )}
                  {itinerary.startLatitude && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(46,44,40,0.04)", border: "1px solid rgba(46,44,40,0.06)" }}>
                      <Navigation className="size-3 shrink-0" style={{ color: "var(--iyc-ionian-300)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{Math.abs(itinerary.startLatitude).toFixed(4)}°N</span>
                    </div>
                  )}
                </div>

                {/* Route progress dots */}
                <div className="flex items-center gap-1.5">
                  {stops.slice(0, 10).map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full" style={{ background: i === 0 ? "var(--iyc-ionian-600)" : i === Math.min(stops.length - 1, 9) ? "var(--iyc-ionian-300)" : "rgba(0,85,169,0.15)" }} />
                      {i < Math.min(stops.length - 1, 9) && (
                        <svg className="w-3 h-[2px]" preserveAspectRatio="none">
                          <line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(0,85,169,0.12)" strokeWidth="2" strokeDasharray="2 2" />
                        </svg>
                      )}
                    </div>
                  ))}
                  {stops.length > 10 && <span className="text-[9px] font-medium ml-1" style={{ color: "rgba(0,85,169,0.3)" }}>+{stops.length - 10}</span>}
                </div>
              </div>
              {/* Right: featured image or place mosaic */}
              <div className="relative">
                {itinerary.defaultMedia ? (
                  <div className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ boxShadow: "0 24px 64px rgba(46,44,40,0.15)" }} onClick={() => setLightbox({ images: [itinerary.defaultMedia!], index: 0 })}>
                    <div className="aspect-[4/5]">
                      {isVideoMedia(itinerary.defaultMedia, itinerary.defaultMediaType) ? (
                        <video src={itinerary.defaultMedia} muted autoPlay loop playsInline preload="metadata"
                          aria-label={name[locale] || ""}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      ) : (
                        <Image src={itinerary.defaultMedia} alt={name[locale] || ""} width={1600} height={900} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <div className="absolute inset-0" style={{ background: "var(--scrim-photo)" }} />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>{itinerary.totalDays}-{tUpper("itinerary.dayVoyage", "Day Voyage")}</span>
                      <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>{itinerary.startFrom || t("itinerary.mediterranean", "Mediterranean")}</p>
                    </div>
                    <div className="absolute top-4 right-4 size-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                      <Maximize2 className="size-4 text-white" />
                    </div>
                  </div>
                ) : (
                  /* Fallback: decorative compass visual */
                  <div className="aspect-[4/5] rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-800), var(--iyc-ionian-600))", boxShadow: "0 24px 64px rgba(46,44,40,0.15)" }}>
                    <Compass className="size-24 text-white/15" />
                  </div>
                )}
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 md:-left-6 px-5 py-3 rounded-xl" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))", boxShadow: "0 8px 32px rgba(4,13,25,0.25)" }}>
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{stops.length}</span>
                  <span className="text-[10px] font-semibold tracking-[0.06em] uppercase block" style={{ color: "rgba(255,255,255,0.7)" }}>{tUpper("itinerary.stat.stops", "Stops")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 3: Day-by-day — alternating light/dark per day ──── */}
      <section>
        {itinerary.days.map((day, dayIdx) => {
          const dayDesc = (day.description as Record<string, string>)?.[locale] || (day.description as Record<string, string>)?.en || ""
          const allLegs = day.legs
          // The first stop number of this day, so the list numbers agree with
          // the numbered pins on the map above.
          const legOffset = itinerary.days
            .slice(0, dayIdx)
            .reduce((n, d) => n + d.legs.length, 0)
          /* Days alternated navy and white, which turned the timeline into a
             zebra of dark blocks. The kit keeps sections light and lets the
             photography carry the contrast, so the rhythm is now two limestone
             tones and every day reads in ink. */
          const isDark = false
          const bandTone = dayIdx % 2 === 0 ? "var(--surface-page)" : "var(--surface-card)"
          const allDayImages = allLegs.flatMap((l) => (l.images as string[]) || [])
          const heroImg = allDayImages[0] || null

          return (
            <div key={day.id} className="relative" style={{ background: bandTone }}>
              {/* Accent line between days */}
              {dayIdx > 0 && (
                <div className="h-px" style={{ background: isDark ? "rgba(95,174,223,0.08)" : "rgba(46,44,40,0.06)" }} />
              )}

              {/* Day hero strip — full-bleed image on one side */}
              <div className="max-w-[1400px] mx-auto">
                <div className={`grid lg:grid-cols-2 min-h-[400px] ${dayIdx % 2 === 1 ? "direction-rtl" : ""}`}>
                  {/* Image column */}
                  {heroImg ? (
                    <div
                      className={`relative overflow-hidden cursor-pointer group ${dayIdx % 2 === 1 ? "lg:order-2" : ""}`}
                      style={{ minHeight: 360 }}
                      onClick={() => setLightbox({ images: allDayImages, index: 0 })}
                    >
                      <Image src={heroImg} alt={`${t("itinerary.day", "Day")} ${day.dayNumber}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0" style={{ background: isDark ? "linear-gradient(to right, rgba(4,13,25,0.7), transparent 60%)" : "linear-gradient(to right, rgba(255,255,255,0.5), transparent 60%)" }} />
                      {/* Day number overlay */}
                      <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="size-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))", boxShadow: "0 4px 24px rgba(0,85,169,0.4)" }}>
                          {day.dayNumber}
                        </div>
                      </div>
                      {allDayImages.length > 1 && (
                        <div className="absolute bottom-4 right-4 group/dayg flex items-center gap-2 cursor-pointer">
                          <div className="flex items-center -space-x-2.5 group-hover/dayg:-space-x-0.5 transition-all duration-500 ease-out">
                            {allDayImages.slice(0, 4).map((url, ii) => (
                              <div
                                key={ii}
                                className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 shadow-lg transition-all duration-500 ease-out group-hover/dayg:scale-110 group-hover/dayg:border-white"
                                style={{ zIndex: 4 - ii, transitionDelay: `${ii * 40}ms` }}
                              >
                                <Image src={url} alt="" width={1200} height={800} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          {allDayImages.length > 4 && (
                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-[10px] font-semibold shadow-lg -ml-5 group-hover/dayg:-ml-3 transition-all duration-500" style={{ zIndex: 0 }}>
                              +{allDayImages.length - 4}
                            </div>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
                            {allDayImages.length} {t("itinerary.photos", "Photos")}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No photograph for this day — draw its track instead. The
                       old fallback was a circled day number, identical on every
                       dayless day; the fixes we already hold make each one a
                       different shape. */
                    <div
                      className={`relative flex items-center justify-center ${dayIdx % 2 === 1 ? "lg:order-2" : ""}`}
                      style={{ minHeight: 360, background: "var(--surface-page)" }}
                    >
                      <ItineraryDayChart
                        dayNumber={day.dayNumber}
                        className="h-full w-full max-h-[380px]"
                        points={allLegs
                          .filter((l) => l.latitude != null && l.longitude != null)
                          .map((l) => ({
                            lat: l.latitude as number,
                            lon: l.longitude as number,
                            label:
                              (l.name as Record<string, string>)?.[locale] ||
                              (l.name as Record<string, string>)?.en ||
                              "",
                          }))}
                      />

                      <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div
                          className="flex size-14 items-center justify-center rounded-full text-lg font-bold text-white"
                          style={{
                            background: "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))",
                            boxShadow: "0 4px 24px rgba(11,96,153,0.32)",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {day.dayNumber}
                        </div>
                        <span
                          className="text-[11px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: "var(--iyc-ionian-600)" }}
                        >
                          {removeGreekTonos(tUpper("itinerary.day", "Day"))} {day.dayNumber}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content column */}
                  <div className={`flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 lg:py-16 ${dayIdx % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: isDark ? "var(--iyc-ionian-300)" : "var(--iyc-ionian-600)" }}>{tUpper("itinerary.day", "Day")} {day.dayNumber}</span>
                      <div className="w-8 h-[1.5px]" style={{ background: isDark ? "linear-gradient(90deg, var(--iyc-ionian-300), transparent)" : "linear-gradient(90deg, var(--iyc-ionian-600), transparent)" }} />
                    </div>
                    {dayDesc && (
                      <p className="text-sm leading-[1.8] mb-8 max-w-lg" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>{dayDesc}</p>
                    )}

                    {/* Legs as editorial cards */}
                    <div className="flex flex-col gap-6">
                      {allLegs.map((leg, legIdx) => {
                        const lName = (leg.name as Record<string, string>)?.[locale] || (leg.name as Record<string, string>)?.en || ""
                        const lDesc = (leg.description as Record<string, string>)?.[locale] || (leg.description as Record<string, string>)?.en || ""
                        const lImgs = leg.images as string[]

                        return (
                          <div key={leg.id} className="relative flex gap-4">
                            {/* Numbered marker and the run of line beneath it.
                                A 2px hairline with a 8px dot gave every stop the
                                same weight and no tie to the map; the number is
                                the same one the pin carries. */}
                            <div className="relative flex w-8 shrink-0 flex-col items-center">
                              <div
                                className="iyc-mono flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                                style={{
                                  background: "var(--iyc-ionian-600)",
                                  color: "#fff",
                                  boxShadow: "0 2px 10px rgba(11,96,153,0.28)",
                                }}
                              >
                                {legOffset + legIdx + 1}
                              </div>
                              {legIdx < allLegs.length - 1 && (
                                <div
                                  className="mt-1 w-[2px] flex-1 rounded-full"
                                  style={{
                                    background:
                                      "linear-gradient(to bottom, var(--iyc-ionian-300), transparent)",
                                  }}
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1 pb-2">
                            {/* Position as an eyebrow. Every leg carries a
                                fix; printing it gives the entry texture even
                                when no photograph exists — which is most of
                                them — and it is what a crew actually plots. */}
                            {leg.latitude != null && leg.longitude != null && (
                              <span
                                className="iyc-mono mb-1 block text-[10px] tracking-wider"
                                style={{ color: "var(--text-subtle)" }}
                              >
                                {Math.abs(leg.latitude).toFixed(4)}°{leg.latitude >= 0 ? "N" : "S"}
                                {"  "}
                                {Math.abs(leg.longitude).toFixed(4)}°{leg.longitude >= 0 ? "E" : "W"}
                              </span>
                            )}
                            {lName && (
                              <h4 className="mb-1.5 text-base font-bold md:text-lg" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em", color: "var(--iyc-ionian-800)" }}>{lName}</h4>
                            )}
                            {lDesc && (
                              <p className="mb-3 max-w-md text-[13px] leading-[1.75]" style={{ color: "var(--text-muted)" }}>{lDesc}</p>
                            )}

                            {/* Animated avatar thumbnails */}
                            {lImgs.length > 0 && (
                              <div className="group/gallery flex items-center gap-3 mt-2 cursor-pointer" onClick={() => setLightbox({ images: lImgs, index: 0 })}>
                                <div className="flex items-center -space-x-3 group-hover/gallery:-space-x-1 transition-all duration-500 ease-out">
                                  {lImgs.slice(0, 5).map((url, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110"
                                      style={{
                                        zIndex: 5 - imgIdx,
                                        transitionDelay: `${imgIdx * 40}ms`,
                                        border: isDark ? "2px solid rgba(255,255,255,0.8)" : "2px solid white",
                                      }}
                                    >
                                      <Image src={url} alt="" width={1200} height={800} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                                {lImgs.length > 5 && (
                                  <div
                                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110 -ml-6 group-hover/gallery:-ml-4"
                                    style={{
                                      zIndex: 0,
                                      transitionDelay: "200ms",
                                      background: isDark ? "rgba(255,255,255,0.15)" : "rgba(46,44,40,0.08)",
                                      border: isDark ? "2px solid rgba(255,255,255,0.4)" : "2px solid rgba(46,44,40,0.12)",
                                      color: isDark ? "white" : "var(--iyc-ionian-800)",
                                      backdropFilter: "blur(8px)",
                                    }}
                                  >
                                    +{lImgs.length - 5}
                                  </div>
                                )}
                                <span className="text-[10px] font-medium ml-1" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(4,13,25,0.4)" }}>
                                  {lImgs.length} {lImgs.length > 1 ? t("itinerary.photos", "photos") : t("itinerary.photo", "photo")}
                                </span>
                              </div>
                            )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── SECTION 4: Destinations — premium dark navy ────────────── */}
      {places.length > 0 && (
        <section className="relative py-24 md:py-32 overflow-hidden" style={{ background: "var(--surface-page)" }}>
          {/* Chart engraving, the treatment the homepage uses on its light
              sections: masked at both ends so it never meets an edge, and
              washed back so the cards stay the subject. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "url(/brand/topographic.svg)",
              backgroundSize: "1400px auto",
              backgroundPosition: "center",
              opacity: 0.3,
              maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }}
          />

          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-14">
              {/* Amber, not pale blue: this eyebrow was --iyc-ionian-300, which
                  is a colour for dark grounds and washes out on limestone. */}
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "var(--action-accent)" }}>{tUpper("itinerary.portsOfCall", "Ports of Call")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>
                {t("itinerary.destinationsHeading", "Destinations Along the Way")}
              </h2>
              <div className="w-16 h-[2px] mx-auto rounded-full" style={{ background: "linear-gradient(90deg, var(--iyc-ionian-600), var(--iyc-ionian-300))" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {places.map((place, i) => (
                <div
                  key={i}
                  className="group relative p-6 rounded-xl cursor-pointer transition-all duration-400 hover:-translate-y-1"
                  style={{ background: "transparent", border: "1px solid var(--border-hairline)", backdropFilter: "blur(8px)" }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(0,85,169,0.08), rgba(95,174,223,0.04))" }} />
                  <div className="relative flex items-center gap-3">
                    <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(0,85,169,0.2), rgba(95,174,223,0.1))", border: "1px solid rgba(95,174,223,0.08)" }}>
                      <MapPin className="size-4" style={{ color: "var(--iyc-ionian-300)" }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--text-heading)] block" style={{ fontFamily: "var(--font-display)" }}>{place.name}</span>
                      <span className="text-[10px] font-medium" style={{ color: "var(--text-subtle)" }}>
                        {place.latitude.toFixed(2)}°N, {place.longitude.toFixed(2)}°E
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 5: closing ask ──────────────────────────────────────
          Rebuilt. The old block centred generic copy in white space with a
          compass-and-dots cluster built for a dark ground, and made "Browse
          our fleet" the primary action — on an itinerary page the money action
          is enquiring about this route. It also set near-black type on a blue
          gradient. Now: one accent action, the alternative subordinate as a
          link, and the right half recaps the voyage the reader just finished
          so the ask stands on something rather than floating. */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28 lg:px-12" style={{ background: "var(--surface-page)" }}>
        <div className="mx-auto max-w-[1180px]">
          <div
            className="grid overflow-hidden md:grid-cols-[1.15fr_1fr]"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--iyc-radius-lg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* The ask */}
            <div className="flex flex-col justify-center p-9 md:p-12">
              <span
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--action-accent)" }}
              >
                {removeGreekTonos(tUpper("itinerary.cta.eyebrow", "Ready when you are"))}
              </span>
              <h2
                className="mb-4 text-3xl font-bold md:text-4xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}
              >
                {t("itinerary.cta.heading", "Sail this route — or one we shape around you.")}
              </h2>
              <p className="mb-8 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("itinerary.cta.body", "Tell us your dates and who is coming. We answer personally, usually the same day.")}
              </p>

              {/* One accent action; the alternative is a link, not a rival. */}
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                <button
                  onClick={() => { setEnquirySuccess(false); setEnquiryOpen(true) }}
                  className="group inline-flex cursor-pointer items-center gap-2.5 px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.985]"
                  style={{
                    background: "var(--action-accent)",
                    color: "var(--text-on-accent)",
                    borderRadius: "var(--iyc-radius-sm)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {t("itinerary.cta.enquireNow", "Enquire about this itinerary")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <Link
                  href="/fleet"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
                  style={{ color: "var(--text-link)" }}
                >
                  <Ship className="size-4" />
                  {t("itinerary.cta.browseFleet", "Browse our fleet")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* The voyage, recapped. Numbers over the itinerary's own picture
                where it has one; a limestone panel where it does not. */}
            <div className="relative min-h-[260px] p-9 md:p-10">
              {itinerary.defaultMedia ? (
                <>
                  {isVideoMedia(itinerary.defaultMedia, itinerary.defaultMediaType) ? (
                    <video src={itinerary.defaultMedia} muted autoPlay loop playsInline preload="metadata"
                      aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Image src={itinerary.defaultMedia} alt="" fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" />
                  )}
                  {/* Dark at both ends, not just the foot. --scrim-photo is
                      built for a caption sitting at the bottom of a picture;
                      here the figures sit at the top, exactly where it fades
                      out, and they were washing into the water. */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(4,13,25,.78) 0%, rgba(4,13,25,.42) 42%, rgba(4,13,25,.86) 100%)",
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0" style={{ background: "var(--iyc-ionian-900)" }} />
              )}

              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    [String(itinerary.totalDays), tUpper("itinerary.days", "Days")],
                    [String(itinerary.totalMiles), tUpper("itinerary.nauticalMiles", "NM")],
                    [String(stops.length), tUpper("itinerary.stops", "Stops")],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <div
                        className="text-2xl font-bold leading-none text-white md:text-[28px]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {v}
                      </div>
                      <div
                        className="iyc-mono mt-1.5 text-[10px] tracking-wider"
                        style={{ color: "var(--iyc-sand-200)" }}
                      >
                        {removeGreekTonos(l)}
                      </div>
                    </div>
                  ))}
                </div>

                {places.length > 0 && (
                  <div>
                    <div
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--iyc-sun-300)" }}
                    >
                      {removeGreekTonos(tUpper("itinerary.portsOfCall", "Ports of call"))}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--iyc-sand-100)" }}>
                      {[...new Set(places.map((p) => p.name))].join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ENQUIRY MODAL — portaled to body to escape clipPath container
          ═══════════════════════════════════════════════════════════════ */}
      {enquiryOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />
          <div className="relative z-[110] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {enquirySuccess ? (
              /* ── Success state ─────────────────────────────────────── */
              <div className="relative overflow-hidden">
                <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 60%, var(--iyc-ionian-500) 100%)" }}>
                  <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                  <button onClick={() => setEnquiryOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <X className="w-4 h-4 text-[var(--text-heading)]/70" />
                  </button>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20">
                      <CheckCircle2 className="w-8 h-8 text-[var(--text-heading)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-heading)] mb-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                      {enquiryForm.firstName ? `${t("itinerary.enquiry.thankYouName", "Thank You,")} ${enquiryForm.firstName}!` : t("itinerary.enquiry.thankYou", "Thank You!")}
                    </h3>
                    <p className="text-[var(--text-heading)]/70 text-sm leading-relaxed max-w-sm mx-auto">
                      {t("itinerary.enquiry.received", "Your enquiry for the")} <span className="text-[var(--text-heading)] font-semibold">{name[locale] || t("itinerary.enquiry.charterItinerary", "charter itinerary")}</span> {t("itinerary.enquiry.hasBeenReceived", "has been received.")}
                    </p>
                  </div>
                </div>

                <div className="px-8 -mt-4 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-[var(--border-hairline)] p-5">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-hairline)]">
                      <div className="w-11 h-11 rounded-full bg-[var(--surface-inverse)] flex items-center justify-center text-white text-xs font-bold shrink-0">IYC</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[var(--text-body)]">{t("itinerary.enquiry.teamName", "IYC Charter Team")}</p>
                        <p className="text-[10px] text-[var(--text-subtle)]">{t("itinerary.enquiry.teamRole", "Charter Advisor")}</p>
                      </div>
                      <span className="text-[9px] text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {t("itinerary.enquiry.willRespondShortly", "Will respond shortly")}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("itinerary.enquiry.confirmationSent", "Confirmation sent")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">{t("itinerary.enquiry.checkInbox", "Check your inbox at")} {enquiryForm.email || t("itinerary.enquiry.yourEmail", "your email")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarDays className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("itinerary.enquiry.proposal24h", "Tailored proposal within 24h")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">
                            {selectedMonths.length > 0
                              ? `${t("itinerary.enquiry.availabilityFor", "Availability & pricing for")} ${selectedMonths.map((m) => { const [y, mo] = m.split("-"); return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}` }).join(", ")}`
                              : t("itinerary.enquiry.bestAvailableDates", "Best available dates and pricing options")
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Anchor className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("itinerary.enquiry.itinerarySuggestions", "Itinerary suggestions included")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">{t("itinerary.enquiry.routesCuratedFor", "Routes curated for")} {enquiryGuestCount} {enquiryGuestCount !== 1 ? t("itinerary.enquiry.guests", "guests") : t("itinerary.enquiry.guest", "guest")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 pt-5 pb-8 text-center">
                  <button onClick={() => setEnquiryOpen(false)} className="px-8 py-3 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98] cursor-pointer" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}>
                    {t("itinerary.enquiry.continueBrowsing", "Continue Browsing")}
                  </button>
                  <p className="text-[10px] text-[var(--text-subtle)] mt-3">
                    {t("itinerary.enquiry.haveQuestions", "Have questions? Call us at")} <span className="font-semibold text-[var(--text-muted)]">+30 210 XXX XXXX</span>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Enquiry form ──────────────────────────────────────── */
              <>
                <div className="relative px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 100%)" }}>
                  <button onClick={() => setEnquiryOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20 p-2">
                      <Image src="/brand/iyc-logo-white.svg" alt="IYC" width={240} height={80} unoptimized className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("itinerary.enquiry.formTitle", "Plan Your Itinerary Charter")}</h2>
                      <p className="text-[11px] text-white/60 mt-0.5">{name[locale] || "Custom sailing itinerary"}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {/* Preferred period */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4 text-[var(--text-link)]" />
                      <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("itinerary.enquiry.preferredPeriod", "Preferred Period")}</span>
                    </div>
                    <div className="bg-[var(--surface-sunken)] rounded-xl p-3.5 border border-[var(--border-hairline)]">
                      {(() => {
                        const byYear: Record<number, string[]> = {}
                        for (const m of availableMonths) {
                          const y = parseInt(m.split("-")[0])
                          if (!byYear[y]) byYear[y] = []
                          byYear[y].push(m)
                        }
                        return Object.entries(byYear).map(([year, months]) => (
                          <div key={year} className="mb-2 last:mb-0">
                            <span className="text-[9px] uppercase font-bold text-[var(--text-subtle)] tracking-wider mb-1.5 block">{year}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {months.map((m) => {
                                const selected = selectedMonths.includes(m)
                                const monthIdx = parseInt(m.split("-")[1]) - 1
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => toggleMonth(m)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer border ${
                                      selected
                                        ? "text-white border-transparent shadow-sm"
                                        : "border-[var(--border-hairline)] text-[var(--text-muted)] hover:border-[var(--iyc-ionian-600)]/40 hover:text-[var(--text-link)] hover:bg-[var(--iyc-ionian-600)]/5"
                                    }`}
                                    style={selected ? { backgroundColor: "var(--iyc-ionian-600)" } : undefined}
                                  >
                                    {MONTH_NAMES[monthIdx]}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()}

                      {/* Guests inline */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-hairline)]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{tUpper("itinerary.enquiry.guests", "Guests")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setEnquiryGuestCount(Math.max(1, enquiryGuestCount - 1))} className="w-6 h-6 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer">-</button>
                          <span className="text-xs font-bold w-4 text-center" style={{ color: "var(--text-heading)" }}>{enquiryGuestCount}</span>
                          <button type="button" onClick={() => setEnquiryGuestCount(Math.min(20, enquiryGuestCount + 1))} className="w-6 h-6 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact fields */}
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-[var(--text-link)]" />
                    <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("itinerary.enquiry.yourDetails", "Your Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("itinerary.enquiry.firstName", "First Name")} *</label>
                        <input type="text" value={enquiryForm.firstName} onChange={(e) => setEnquiryForm({ ...enquiryForm, firstName: e.target.value })} placeholder="John" className="w-full border border-[var(--border-hairline)] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[var(--iyc-ionian-600)] focus:ring-1 focus:ring-[var(--iyc-ionian-600)]/20 transition bg-[var(--surface-sunken)]/50" style={{ color: "var(--text-heading)" }} />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("itinerary.enquiry.lastName", "Last Name")}</label>
                        <input type="text" value={enquiryForm.lastName} onChange={(e) => setEnquiryForm({ ...enquiryForm, lastName: e.target.value })} placeholder="Doe" className="w-full border border-[var(--border-hairline)] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[var(--iyc-ionian-600)] focus:ring-1 focus:ring-[var(--iyc-ionian-600)]/20 transition bg-[var(--surface-sunken)]/50" style={{ color: "var(--text-heading)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("itinerary.enquiry.email", "Email")} *</label>
                      <input type="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })} placeholder="john@example.com" className="w-full border border-[var(--border-hairline)] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[var(--iyc-ionian-600)] focus:ring-1 focus:ring-[var(--iyc-ionian-600)]/20 transition bg-[var(--surface-sunken)]/50" style={{ color: "var(--text-heading)" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("itinerary.enquiry.phone", "Phone")}</label>
                      <input type="tel" value={enquiryForm.phone} onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })} placeholder="+30 123 456 7890" className="w-full border border-[var(--border-hairline)] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[var(--iyc-ionian-600)] focus:ring-1 focus:ring-[var(--iyc-ionian-600)]/20 transition bg-[var(--surface-sunken)]/50" style={{ color: "var(--text-heading)" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("itinerary.enquiry.specialRequests", "Special Requests")}</label>
                      <textarea value={enquiryForm.notes} onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })} placeholder={t("itinerary.enquiry.specialRequestsPlaceholder", "Celebrations, dietary needs, preferred destinations...")} rows={3} className="w-full border border-[var(--border-hairline)] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[var(--iyc-ionian-600)] focus:ring-1 focus:ring-[var(--iyc-ionian-600)]/20 transition resize-none bg-[var(--surface-sunken)]/50" style={{ color: "var(--text-heading)" }} />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitEnquiry}
                    disabled={!enquiryForm.firstName || !enquiryForm.email || enquirySubmitting}
                    className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 mt-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}
                  >
                    {enquirySubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("itinerary.enquiry.sending", "Sending your enquiry...")}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t("itinerary.enquiry.sendEnquiry", "Send Enquiry")}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-[var(--text-subtle)] mt-2.5">{t("itinerary.enquiry.noCommitment", "No commitment required")} &middot; {t("itinerary.enquiry.responseTime", "Response within 24h")}</p>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox */}
      {lightbox && <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </>
  )
}

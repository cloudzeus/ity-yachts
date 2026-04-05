"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ChevronLeft, ChevronRight, ArrowUpRight, Ruler, BedDouble, Users, Sailboat, Anchor } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/components/locale-text"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface FleetYacht {
  id: number
  name: string
  slug: string
  image: string
  category: string
  loa: number
  cabins: number
  berths: number
  baseName: string
}

export function FleetCarouselSection({ yachts: rawYachts }: { yachts: FleetYacht[] }) {
  const { t } = useTranslations()
  // Infinite loop: triple the array so we always have cards on both sides
  const yachts = [...rawYachts, ...rawYachts, ...rawYachts]
  const realCount = rawYachts.length
  // Start in the middle copy so there are always cards to the left
  const startIndex = realCount
  const [activeIndex, setActiveIndex] = useState(startIndex)
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isScrollingRef = useRef(false)

  const total = yachts.length
  if (realCount === 0) return null

  const centerCard = useCallback(
    (idx: number, smooth = true) => {
      const card = cardRefs.current[idx]
      if (card && trackRef.current) {
        const track = trackRef.current
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const trackCenter = track.offsetWidth / 2
        isScrollingRef.current = true
        track.scrollTo({ left: cardCenter - trackCenter, behavior: smooth ? "smooth" : "instant" })
        setTimeout(() => { isScrollingRef.current = false }, smooth ? 500 : 50)
      }
    },
    []
  )

  const scrollToIndex = useCallback(
    (idx: number) => {
      // Wrap around within the tripled array
      let clamped = idx
      if (clamped < realCount) {
        // Jumped past left edge of middle copy — teleport to middle
        clamped = clamped + realCount
      } else if (clamped >= realCount * 2) {
        // Jumped past right edge of middle copy — teleport to middle
        clamped = clamped - realCount
      }
      setActiveIndex(clamped)
      centerCard(clamped)
    },
    [realCount, centerCard]
  )

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const step = isMobile ? 1 : 3
  const prev = () => scrollToIndex(activeIndex - step)
  const next = () => scrollToIndex(activeIndex + step)

  // Sync activeIndex with scroll position
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let ticking = false
    const onScroll = () => {
      if (isScrollingRef.current) return
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          const center = track.scrollLeft + track.offsetWidth / 2
          let closest = 0
          let minDist = Infinity
          cardRefs.current.forEach((card, i) => {
            if (!card) return
            const cardCenter = card.offsetLeft + card.offsetWidth / 2
            const dist = Math.abs(center - cardCenter)
            if (dist < minDist) {
              minDist = dist
              closest = i
            }
          })
          setActiveIndex(closest)
          ticking = false
        })
      }
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => track.removeEventListener("scroll", onScroll)
  }, [])

  // Center the starting card on mount (instant, no animation)
  useEffect(() => {
    // Small delay to let layout settle
    requestAnimationFrame(() => {
      centerCard(startIndex, false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The display index (1-based, from real yacht count)
  const displayIndex = (activeIndex % realCount) + 1
  const headerRef = useRef<HTMLDivElement>(null)

  // Animate header on scroll
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      // Icon + label
      gsap.fromTo(
        ".fleet-badge",
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Title words
      gsap.fromTo(
        ".fleet-title-word",
        { opacity: 0, y: 50, rotateX: 20 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Description
      gsap.fromTo(
        ".fleet-desc",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.4, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // CTA link
      gsap.fromTo(
        ".fleet-cta",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.7, delay: 0.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section className="relative w-full pt-32 pb-24" style={{ background: "#070c26" }}>
      {/* Header */}
      <header ref={headerRef} className="w-full px-6 md:px-12 lg:px-16 pt-8 pb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="max-w-3xl">
          <div className="fleet-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0, 119, 182, 0.15)" }}>
              <Sailboat className="w-5 h-5" style={{ color: "var(--secondary-light)" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--secondary-light)" }}>{removeGreekTonos(t("home.fleet.badge", "Our Fleet"))}</span>
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl mb-5 tracking-wide"
            style={{ fontFamily: "var(--font-display)", color: "#ffffff", perspective: "600px" }}
          >
            <span className="fleet-title-word inline-block font-light" style={{ opacity: 0 }}>Yachts</span>{" "}
            <span className="fleet-title-word inline-block font-light" style={{ opacity: 0 }}>&amp;</span>{" "}
            <span className="fleet-title-word inline-block font-light" style={{ opacity: 0 }}>Catamarans</span>{" "}
            <span className="fleet-title-word inline-block font-extrabold" style={{ opacity: 0 }}>for</span>{" "}
            <span className="fleet-title-word inline-block font-extrabold" style={{ opacity: 0 }}>Charter</span>
          </h2>
          <p className="fleet-desc text-[#8a9ab3] text-sm md:text-base leading-relaxed max-w-[620px]" style={{ opacity: 0 }}>
            {t("home.fleet.description", "We do not simply list boats; we curate legendary journeys. Explore our privately owned fleet in the Ionian Sea—hand-picked for superior comfort and exceptional crews. From our base in Lefkada, follow the wake of Odysseus on a voyage tailored just for you.")}
          </p>
        </div>
        <div className="fleet-cta" style={{ opacity: 0 }}>
          <Link
            href="/fleet"
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors group"
          >
            <span className="text-[11px] font-medium border-b border-white/60 pb-[2px] group-hover:border-gray-300 transition-colors tracking-wider uppercase">
              {removeGreekTonos(t("home.fleet.cta", "Discover Fleet"))}
            </span>
            <div className="border border-white/30 p-1 rounded-sm group-hover:border-white/60 transition-colors">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </header>

      {/* Carousel Controls */}
      <div className="flex justify-center items-center gap-8 mt-16 mb-10">
        <button
          onClick={prev}
          className="flex items-center justify-center rounded-full bg-white hover:bg-white/90 transition-all duration-300 hover:scale-105"
          style={{ width: "50px", height: "50px" }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "#070c26" }} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-extralight" style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.7)" }}>{displayIndex}</span>
          <span className="text-2xl font-extralight" style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
          <span className="text-4xl font-extralight" style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.35)" }}>{realCount}</span>
        </div>
        <button
          onClick={next}
          className="flex items-center justify-center rounded-full bg-white hover:bg-white/90 transition-all duration-300 hover:scale-105"
          style={{ width: "50px", height: "50px" }}
        >
          <ChevronRight className="w-5 h-5" style={{ color: "#070c26" }} />
        </button>
      </div>

      {/* Carousel Track */}
      <div
        ref={trackRef}
        className="w-full overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="flex items-center justify-start py-4" style={{ gap: "24px" }}>
          {yachts.map((yacht, i) => {
            const dist = Math.abs(i - activeIndex)
            const isActive = dist === 0

            return (
              <div
                key={`${yacht.id}-${i}`}
                ref={(el) => { cardRefs.current[i] = el }}
                className="flex-shrink-0 transition-all duration-500 w-[85vw] md:w-[min(550px,65vw)]"
                style={{
                  transform: isActive ? "scale(1.12)" : "scale(0.88)",
                  opacity: isActive ? 1 : 0.92,
                  filter: isActive ? "none" : "brightness(0.8)",
                  zIndex: isActive ? 20 : 10 - dist,
                  transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                  margin: "0 -4px",
                }}
              >
                <YachtCarouselCard yacht={yacht} onClick={() => scrollToIndex(i)} isActive={isActive} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function YachtCarouselCard({ yacht, onClick, isActive }: { yacht: FleetYacht; onClick: () => void; isActive: boolean }) {
  const { t } = useTranslations()
  const [liked, setLiked] = useState(false)

  return (
    <div
      onClick={onClick}
      className="relative w-full rounded-2xl overflow-hidden group cursor-pointer border border-white/5 aspect-square md:aspect-[16/10]"
      style={{ boxShadow: isActive ? "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)" : "0 20px 40px -15px rgba(0,0,0,0.5)", background: "#070c26" }}
    >
      {/* Background Image */}
      {yacht.image ? (
        <Image
          src={yacht.image}
          alt={yacht.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="600px"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--gradient-ocean)" }} />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" style={{ height: "33%" }} />
      <div
        className="absolute inset-0 mt-auto"
        style={{
          height: "55%",
          background: "linear-gradient(to top, #070c26 0%, rgba(7,12,38,0.75) 50%, transparent 100%)",
        }}
      />

      {/* Top badges */}
      <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 backdrop-blur-[12px] border border-white/15">
          {removeGreekTonos(yacht.category)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
          className="w-9 h-9 bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
          />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-20">
        <h3
          className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight drop-shadow-lg"
          style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}
        >
          {yacht.name}
        </h3>

        {/* Specs Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {yacht.loa > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-[12px] border border-white/15">
              <Ruler className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-gray-300 font-medium">{Math.round(yacht.loa * 3.28084)}ft / {yacht.loa}m</span>
            </div>
          )}
          {yacht.cabins > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-[12px] border border-white/15">
              <BedDouble className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-gray-300 font-medium">{yacht.cabins} {t("home.fleet.cabins", "Cabins")}</span>
            </div>
          )}
          {yacht.berths > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-[12px] border border-white/15">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-gray-300 font-medium">{yacht.berths} {t("home.fleet.guests", "Guests")}</span>
            </div>
          )}
        </div>

        {/* Divider + CTA */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5">
            <Anchor className="w-3 h-3" style={{ color: "#0055a9" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#0055a9" }}>
              {removeGreekTonos(yacht.baseName || "Ionian Sea")}
            </span>
          </div>
          <Link
            href={`/fleet/${yacht.slug || yacht.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-[12px] border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-300"
          >
            <span className="text-[11px] text-gray-300 font-medium">{t("home.fleet.details", "Details")}</span>
            <ArrowUpRight className="w-3 h-3 text-gray-300" />
          </Link>
        </div>
      </div>
    </div>
  )
}

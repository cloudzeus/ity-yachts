"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "@/components/locale-link"
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
  const realCount = rawYachts.length

  /* The loop needs cards beyond both edges, not two extra copies of the whole
     fleet. Tripling eighteen yachts put fifty-four cards in the DOM — 78% of
     every node on the homepage and 86% of its inline SVG — to keep four of
     them visible. A pad of four each side does the same job: no scroll
     position can reach the end of it before the wrap fires. */
  const PAD = Math.min(4, realCount)
  const yachts = [...rawYachts.slice(-PAD), ...rawYachts, ...rawYachts.slice(0, PAD)]
  // The real set starts after the leading pad.
  const startIndex = PAD
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
      let wrapped = false
      if (clamped < PAD) {
        // Ran off the leading pad — jump to the same yacht at the far end.
        clamped = clamped + realCount
        wrapped = true
      } else if (clamped >= PAD + realCount) {
        // Ran off the trailing pad — jump back to the same yacht at the start.
        clamped = clamped - realCount
        wrapped = true
      }
      setActiveIndex(clamped)
      /* A wrap crosses the whole track, and animating it takes longer than the
         guard that silences the scroll listener — so the listener woke up
         mid-flight and snapped the index to whatever card it was passing.
         After 18 the counter read 12. A wrap is a teleport, not a journey. */
      centerCard(clamped, !wrapped)
    },
    [realCount, PAD, centerCard]
  )

  /* One card per click. It used to move three on desktop while the counter
     below reported a single yacht, so the numbers ran 1, 4, 7, 10, 3, 6 — you
     reached every boat eventually, but it read as a handful repeating at
     random, and the counter never described what was on screen. */
  const prev = () => scrollToIndex(activeIndex - 1)
  const next = () => scrollToIndex(activeIndex + 1)

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
  /* Which yacht is in the middle, counted from the real set rather than from
     the padded array — the pad would otherwise offset every number. */
  const displayIndex = (((activeIndex - PAD) % realCount) + realCount) % realCount + 1
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
    <section className="relative w-full pt-32 pb-24" style={{ background: "var(--surface-page)" }}>
      {/* Header */}
      <header ref={headerRef} className="w-full px-6 md:px-12 lg:px-16 pt-8 pb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="max-w-3xl">
          <div className="fleet-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(15, 121, 190, 0.12)" }}>
              <Sailboat className="w-5 h-5" style={{ color: "var(--iyc-ionian-500)" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>{removeGreekTonos(t("home.fleet.badge", "Our Fleet"))}</span>
          </div>
          <h2
            className="section-heading mb-5"
            style={{ color: "var(--text-heading)", perspective: "600px" }}
          >
            {/* Was five hardcoded English words split for the typewriter, so
                the Greek and German sites showed an English heading. */}
            <span className="font-light">{t("home.fleet.headingLead", "Yachts & Catamarans")}</span>{" "}
            <span className="font-extrabold">{t("home.fleet.headingAccent", "for Charter")}</span>
          </h2>
          
            {t("home.fleet.description", "We do not simply list boats; we curate legendary journeys. Explore our privately owned fleet in the Ionian Sea—hand-picked for superior comfort and exceptional crews. From our base in Lefkada, follow the wake of Odysseus on a voyage tailored just for you.")}
          
        </div>
        <div className="fleet-cta" style={{ opacity: 0 }}>
          <Link
            href="/fleet"
            className="flex items-center gap-2 text-[var(--text-heading)] hover:text-[var(--text-link)] transition-colors group"
          >
            <span className="text-[11px] font-medium border-b border-[var(--border-strong)] pb-[2px] group-hover:border-[var(--text-link)] transition-colors tracking-wider uppercase">
              {removeGreekTonos(t("home.fleet.cta", "Discover Fleet"))}
            </span>
            <div className="border border-[var(--border-default)] p-1 rounded-sm group-hover:border-[var(--text-link)] transition-colors">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </header>

      {/* Carousel Controls */}
      <div className="flex justify-center items-center gap-8 mt-16 mb-10">
        <button
          onClick={prev}
          aria-label={t("fleet.prevYacht", "Previous yacht")}
          className="flex items-center justify-center rounded-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{ width: "50px", height: "50px" }}
        >
          <ChevronLeft aria-hidden="true" className="w-5 h-5" style={{ color: "#FFFFFF" }} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-extralight" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>{displayIndex}</span>
          <span className="text-2xl font-extralight" style={{ color: "var(--border-strong)" }}>/</span>
          <span className="text-4xl font-extralight" style={{ fontFamily: "var(--font-display)", color: "var(--text-subtle)" }}>{realCount}</span>
        </div>
        <button
          onClick={next}
          aria-label={t("fleet.nextYacht", "Next yacht")}
          className="flex items-center justify-center rounded-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{ width: "50px", height: "50px" }}
        >
          <ChevronRight aria-hidden="true" className="w-5 h-5" style={{ color: "#FFFFFF" }} />
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
                  opacity: isActive ? 1 : 0.72,
                  filter: isActive ? "none" : "saturate(0.85)",
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
      className="relative w-full rounded-2xl overflow-hidden group cursor-pointer border border-[var(--border-hairline)] aspect-square md:aspect-[16/10]"
      style={{ boxShadow: isActive ? "var(--shadow-lg)" : "var(--shadow-md)", background: "var(--surface-card)" }}
    >
      {/* Background Image */}
      {yacht.image ? (
        <Image
          src={yacht.image}
          alt={`${yacht.name}${yacht.category ? `, a ${yacht.category.toLowerCase()}` : ""} for charter from ${yacht.baseName || "Lefkada"}`}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="600px"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--gradient-ocean)" }} />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: "30%", background: "linear-gradient(to bottom, rgba(4,13,25,.16), transparent)" }} />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "58%",
          background: "var(--scrim-card)",
        }}
      />

      {/* Top badges */}
      <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--text-on-accent)] bg-[var(--action-accent)]">
          {removeGreekTonos(yacht.category)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
          /* An icon alone is not a name. Thirty of these on the homepage read
             as thirty unlabelled buttons to anyone not looking at the screen. */
          aria-label={`${liked ? "Remove" : "Save"} ${yacht.name} ${liked ? "from" : "to"} your shortlist`}
          aria-pressed={liked}
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
          style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
        >
          {yacht.name}
        </h3>

        {/* Specs Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {yacht.loa > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <Ruler className="w-3 h-3 text-[var(--iyc-ionian-600)]" />
              <span className="text-[11px] text-[var(--text-body)] font-medium">{Math.round(yacht.loa * 3.28084)}ft / {yacht.loa}m</span>
            </div>
          )}
          {yacht.cabins > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <BedDouble className="w-3 h-3 text-[var(--iyc-ionian-600)]" />
              <span className="text-[11px] text-[var(--text-body)] font-medium">{yacht.cabins} {t("home.fleet.cabins", "Cabins")}</span>
            </div>
          )}
          {yacht.berths > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <Users className="w-3 h-3 text-[var(--iyc-ionian-600)]" />
              <span className="text-[11px] text-[var(--text-body)] font-medium">{yacht.berths} {t("home.fleet.guests", "Guests")}</span>
            </div>
          )}
        </div>

        {/* Divider + CTA */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5">
            <Anchor className="w-3 h-3" style={{ color: "var(--iyc-ionian-300)" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--iyc-ionian-300)" }}>
              {removeGreekTonos(yacht.baseName || "Ionian Sea")}
            </span>
          </div>
          {/* Thirty links reading only "Details" tell a crawler and a screen
              reader nothing. The boat's name goes inside the link as hidden
              text — an aria-label would fix the screen reader but leave the
              crawler reading "Details" thirty times. */}
          <Link
            href={`/fleet/${yacht.slug || yacht.id}`}
            onClick={(e) => e.stopPropagation()}
            title={yacht.name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-[12px] border border-[var(--border-hairline)] hover:bg-white/20 hover:border-white/30 transition-all duration-300"
          >
            <span className="text-[11px] text-[var(--text-body)] font-medium">
              <span className="sr-only">{yacht.name} — </span>
              {t("home.fleet.details", "Details")}
            </span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
        </div>
      </div>
    </div>
  )
}

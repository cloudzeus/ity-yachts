"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  FileCheck,
  CarTaxiFront,
  ShoppingBasket,
  CloudSun,
  Compass,
  House,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

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

/**
 * The six things IYC actually does for a crew, taken from the design kit.
 * The copy lives in the translation table so it stays editable in /admin; the
 * strings here are only the English fallback.
 */
const SERVICES: { key: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    key: "paperwork",
    icon: FileCheck,
    title: "We handle the paperwork",
    body: "Your officially approved charter contract is ready when you arrive. Greece's full EU membership means no clearing in and out of ports.",
  },
  {
    key: "taxi",
    icon: CarTaxiFront,
    title: "Taxi from the airport",
    body: "Your taxi waits at Preveza with your name on a board and brings you to the boat in twenty minutes.",
  },
  {
    key: "provisioning",
    icon: ShoppingBasket,
    title: "A cold fridge waiting",
    body: "Send us your provisioning list and the fridge is stocked before you step aboard.",
  },
  {
    key: "weather",
    icon: CloudSun,
    title: "Weather by SMS",
    body: "All the important weather information reaches your phone throughout the whole trip.",
  },
  {
    key: "skipper",
    icon: Compass,
    title: "Skipper on request",
    body: "We can arrange a skipper or sailing instructor who knows the area properly.",
  },
  {
    key: "onland",
    icon: House,
    title: "A week on land",
    body: "Holiday houses and apartments on Lefkada, before or after the sailing trip.",
  },
]

/* Per-column parallax travel, as a fraction of the tile's own height. The
   driver floors at 0.15, so these sit close together — the point is a slight
   shear between columns, not three separate speeds. */
const COLUMN_DRIFT = ["0.16", "0.26", "0.20"]

/* Foreground values for the weather panel, which sits on the ionian gradient.
   Kept as constants because they repeat across a dozen nodes, and because the
   rule is absolute: nothing dark is ever set on the navy. */
const SEA_LINE = "rgba(255,255,255,0.62)"
const SEA_LABEL = "rgba(255,255,255,0.66)"
const SEA_RULE = "rgba(255,255,255,0.18)"

function kphToKnots(kph: number) {
  return Math.round(kph * 0.539957)
}

/**
 * Our service.
 *
 * One bento grid, not a card row with two odd tiles parked underneath. Nine
 * cells over three rows, filled exactly: the weather panel is the only tile
 * that takes two, everything else is a single cell.
 *
 *   ┌─────────┬─────────┬─────────┐
 *   │ weather │   s1    │   s2    │
 *   │         ├─────────┼─────────┤
 *   │         │   s3    │   s4    │
 *   ├─────────┼─────────┼─────────┤
 *   │   s5    │   s6    │ odyssey │
 *   └─────────┴─────────┴─────────┘
 *
 * The weather panel carries the ionian ramp rather than the card surface. Nine
 * cream tiles in a row read as one undifferentiated block; the sea blue and the
 * taupe give the eye two places to land.
 */
export function ServicesSection() {
  const { t, tUpper } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)

  // The live weather strip hits a third-party API, so it is fetched on the
  // client and cannot delay the homepage HTML.
  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWeather(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".svc-tile",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ".svc-grid", start: "top 85%" },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const lift = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(var(--lift-hover))"
      e.currentTarget.style.boxShadow = "var(--shadow-md)"
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(0)"
      e.currentTarget.style.boxShadow = "var(--shadow-sm)"
    },
  }

  const serviceTile = (s: (typeof SERVICES)[number], i: number) => (
    /* Parallax on the wrapper, entrance reveal on the tile inside it — both
       animate y, so they cannot share an element. */
    <div key={s.key} className="h-full" data-parallax={COLUMN_DRIFT[i % 3]}>
      <div
        className="svc-tile flex h-full gap-4 rounded-3xl p-6"
        style={{
          opacity: 0,
          background: "var(--surface-card)",
          border: "1px solid var(--border-hairline)",
          boxShadow: "var(--shadow-sm)",
          transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        }}
        {...lift}
      >
        <span
          className="grid h-10 w-10 flex-shrink-0 place-items-center"
          style={{
            borderRadius: "var(--iyc-radius-md)",
            background: "var(--iyc-ionian-50)",
            color: "var(--iyc-ionian-600)",
          }}
        >
          <s.icon size={18} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div>
          <h3
            className="text-[1.1875rem] leading-snug"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
          >
            {t(`home.service.${s.key}.title`, s.title)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {t(`home.service.${s.key}.body`, s.body)}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: "var(--surface-page)" }}
    >
      {/* Background SVG */}
      <div
        aria-hidden="true"
        data-parallax="0.28"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
        }}
      >
        <Image src="/brand/topographic.svg" alt="" fill className="object-cover opacity-60" unoptimized />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(251,249,245,.97), rgba(251,249,245,.88) 50%, rgba(251,249,245,.97))" }} />
      </div>

      {/* Ambient glows. They drift further than anything else in the section —
          they are heavily blurred discs, so there is no edge to expose. */}
      <div data-parallax="0.5" className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "#84776e", filter: "blur(150px)", opacity: 0.1, transform: "translate(33%, -33%)" }} />
      <div data-parallax="0.34" className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "var(--iyc-sand-200)", filter: "blur(100px)", opacity: 0.7, transform: "translate(-25%, 25%)" }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-20 md:py-24">
        {/* Centred heading, as the kit sets it. Width in px, not ch: `ch`
            resolves against the container's 16px body size, so a 52ch box is
            ~420px and broke the heading over four lines. */}
        <div className="mx-auto mb-14 max-w-[860px] text-center">
          <span className="label-sm mb-3 block" style={{ color: "var(--iyc-taupe-500)" }}>
            {tUpper("home.service.eyebrow", "Our service")}
          </span>
          <h2 className="section-heading" style={{ color: "var(--text-heading)" }}>
            <span className="font-light">{t("home.service.headingLead", "German thoroughness,")}</span>{" "}
            <span className="font-extrabold" style={{ color: "var(--iyc-ionian-600)" }}>
              {t("home.service.headingAccent", "Greek hospitality")}
            </span>
          </h2>
        </div>

        <div className="svc-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[minmax(212px,auto)]">
          {/* Live conditions — the ionian ramp, double height. Every value on
              it is white or near-white: nothing dark ever sits on the navy. */}
          <div
            className="svc-tile relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl p-8 lg:row-span-2 lg:min-h-0"
            style={{
              opacity: 0,
              background: "linear-gradient(158deg, var(--iyc-ionian-700), var(--iyc-ionian-900))",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "var(--shadow-md)",
              transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
            }}
            {...lift}
          >
            <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SEA_LINE} strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span className="text-xs font-medium tracking-wider uppercase" style={{ color: SEA_LABEL }}>{tUpper("home.services.lefkadaMarina", "Lefkada Marina")}</span>
                </div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={SEA_LINE} strokeWidth="1"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              </div>
              <div className="text-center mb-6">
                <span className="text-7xl font-extralight tracking-tighter text-white">{weather ? `${weather.temp_c}°` : "—"}</span>
                <div className="mt-2">
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>{weather?.condition ?? "…"}</span>
                  <span className="text-xs ml-2" style={{ color: SEA_LABEL }}>{weather ? `H:${weather.high_c}° L:${weather.low_c}°` : ""}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 py-6" style={{ borderTop: `1px solid ${SEA_RULE}`, borderBottom: `1px solid ${SEA_RULE}` }}>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SEA_LINE} strokeWidth="1.5" className="mx-auto mb-2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>
                  <span className="text-sm font-medium text-white">{weather ? `${kphToKnots(weather.wind_kph)} kt` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: SEA_LABEL }}>{tUpper("home.services.wind", "Wind")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SEA_LINE} strokeWidth="1.5" className="mx-auto mb-2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                  <span className="text-sm font-medium text-white">{weather ? `${weather.humidity}%` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: SEA_LABEL }}>{tUpper("home.services.humidity", "Humidity")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SEA_LINE} strokeWidth="1.5" className="mx-auto mb-2"><path d="M2 6s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /><path d="M2 12s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /></svg>
                  <span className="text-sm font-medium text-white">{weather?.wave_height_m != null ? `${weather.wave_height_m}m` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: SEA_LABEL }}>{tUpper("home.services.waves", "Waves")}</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: SEA_LABEL }}>{tUpper("home.services.perfectConditions", "Perfect Sailing Conditions")}</span>
              </div>
            </div>
          </div>

          {SERVICES.map(serviceTile)}

          {/* The IYC panel — a single cell like the rest. It used to run 2×2 and
              simply overpowered the section. */}
          <div
            className="svc-tile relative flex flex-col items-center justify-center overflow-hidden rounded-3xl p-7 text-center"
            style={{
              opacity: 0,
              background: "#84776e",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="relative mb-4 h-9 w-24">
              <Image src="/brand/iyc-logo-navy.svg" alt="IYC" fill className="object-contain brightness-0 invert" unoptimized />
            </div>
            <h3 className="mb-3 text-lg font-light uppercase" style={{ fontFamily: "var(--font-display)", color: "#ffffff", letterSpacing: "0.05em" }}>
              {tUpper("home.services.theOdyssey", "The Odyssey")}
            </h3>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
              {t("home.services.odysseyDescription", "We have chartered out of Lefkada since 1979 — the same family, the same pontoon, and a sea we have not run out of reasons to sail.")}
            </p>
            <div className="mt-auto flex gap-6">
              <div className="text-center">
                <span className="text-2xl font-light text-white">500+</span>
                <span className="mt-1 block text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.82)" }}>{tUpper("home.services.voyages", "Voyages")}</span>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.25)" }} />
              <div className="text-center">
                <span className="text-2xl font-light text-white">18+</span>
                <span className="mt-1 block text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.82)" }}>{tUpper("home.services.yachts", "Yachts")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

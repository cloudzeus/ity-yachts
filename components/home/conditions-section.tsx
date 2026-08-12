"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
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

function kphToKnots(kph: number) {
  return Math.round(kph * 0.539957)
}

/**
 * Live conditions at the marina, paired with who we are.
 *
 * This band used to carry the service cards as well. They came out at the
 * client's request and the row was rebalanced to two halves rather than left
 * as two narrow cards against an empty six columns.
 */
export function ConditionsSection() {
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
        ".svc-card",
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".svc-grid", start: "top 85%" },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

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
        <Image
          src="/brand/topographic.svg"
          alt=""
          fill
          className="object-cover opacity-60"
          unoptimized
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(251,249,245,.97), rgba(251,249,245,.88) 50%, rgba(251,249,245,.97))" }} />
      </div>

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "#84776e", filter: "blur(150px)", opacity: 0.1, transform: "translate(33%, -33%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "var(--iyc-sand-200)", filter: "blur(100px)", opacity: 0.7, transform: "translate(-25%, 25%)" }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-20 md:py-24">
        <div className="svc-grid grid grid-cols-1 md:grid-cols-12 gap-6 relative">
          {/* Weather Card */}
          <div
            className="svc-card md:col-span-12 lg:col-span-5 relative h-[420px] rounded-3xl overflow-hidden p-8 flex flex-col"
            style={{
              opacity: 0,
              background: "var(--surface-card)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--border-hairline)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-subtle)" }}>{tUpper("home.services.lefkadaMarina", "Lefkada Marina")}</span>
                </div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              </div>
              <div className="text-center mb-6">
                <span className="text-7xl font-extralight text-[var(--text-heading)] tracking-tighter">{weather ? `${weather.temp_c}°` : "—"}</span>
                <div className="mt-2">
                  <span className="text-[var(--text-muted)] text-sm">{weather?.condition ?? "Loading..."}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--text-subtle)" }}>{weather ? `H:${weather.high_c}° L:${weather.low_c}°` : ""}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 py-6" style={{ borderTop: "1px solid var(--border-hairline)", borderBottom: "1px solid var(--border-hairline)" }}>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>
                  <span className="text-[var(--text-body)] text-sm font-medium">{weather ? `${kphToKnots(weather.wind_kph)} kt` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "var(--text-subtle)" }}>{tUpper("home.services.wind", "Wind")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                  <span className="text-[var(--text-body)] text-sm font-medium">{weather ? `${weather.humidity}%` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "var(--text-subtle)" }}>{tUpper("home.services.humidity", "Humidity")}</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2"><path d="M2 6s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /><path d="M2 12s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" /></svg>
                  <span className="text-[var(--text-body)] text-sm font-medium">{weather?.wave_height_m != null ? `${weather.wave_height_m}m` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "var(--text-subtle)" }}>{tUpper("home.services.waves", "Waves")}</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>{tUpper("home.services.perfectConditions", "Perfect Sailing Conditions")}</span>
              </div>
            </div>
          </div>

          {/* IYC Info Card — #84776e background */}
          <div
            className="svc-card md:col-span-12 lg:col-span-7 relative h-[420px] rounded-3xl overflow-hidden p-8 md:p-12 flex flex-col items-center justify-center text-center"
            style={{
              opacity: 0,
              background: "#84776e",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="w-36 h-14 relative mb-6">
              <Image
                src="/brand/iyc-logo-navy.svg"
                alt="IYC Logo"
                fill
                className="object-contain brightness-0 invert"
                unoptimized
              />
            </div>
            <h4 className="text-2xl md:text-3xl mb-5 uppercase tracking-wide font-light" style={{ fontFamily: "var(--font-display)", color: "#ffffff", letterSpacing: "0.05em" }}>
              {tUpper("home.services.theOdyssey", "The Odyssey")}
            </h4>
            <p className="text-base leading-relaxed mb-8 max-w-[52ch]" style={{ color: "rgba(255,255,255,0.88)" }}>
              {t("home.services.odysseyDescription", "Since 2015, we've been crafting mythic voyages through the Ionian Isles. Every journey honors the spirit of exploration.")}
            </p>
            <div className="flex gap-8">
              <div className="text-center">
                <span className="text-3xl font-light text-white">500+</span>
                <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(255,255,255,0.82)" }}>{tUpper("home.services.voyages", "Voyages")}</span>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.25)" }} />
              <div className="text-center">
                <span className="text-3xl font-light text-white">18+</span>
                <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(255,255,255,0.82)" }}>{tUpper("home.services.yachts", "Yachts")}</span>
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
        </div>
      </div>
    </section>
  )
}

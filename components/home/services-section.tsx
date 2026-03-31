"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

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

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)

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
      // Header badge
      gsap.fromTo(
        ".svc-badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Title words
      gsap.fromTo(
        ".svc-title-word",
        { opacity: 0, y: 50, rotateX: 15 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Subtitle
      gsap.fromTo(
        ".svc-subtitle",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.3, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      )
      // Cards stagger
      gsap.fromTo(
        ".svc-card",
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".svc-grid", start: "top 85%" },
        }
      )
      // Second row cards
      gsap.fromTo(
        ".svc-card-row2",
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".svc-row2", start: "top 85%" },
        }
      )
      // Third row cards
      gsap.fromTo(
        ".svc-card-row3",
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".svc-row3", start: "top 85%" },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

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
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: "#84776e", filter: "blur(150px)", opacity: 0.1, transform: "translate(33%, -33%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: "#070c26", filter: "blur(100px)", opacity: 0.9, transform: "translate(-25%, 25%)" }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 md:py-32">
        {/* Header */}
        <div className="flex flex-col mb-16 relative">
          {/* Decorative compass */}
          <div className="absolute -top-12 -left-4 opacity-10 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
          </div>

          <div className="max-w-3xl">
            <div className="svc-badge flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(132,119,110,0.15)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>
                Curated Experiences
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-6xl mb-5 tracking-wide"
              style={{ fontFamily: "var(--font-display)", color: "#ffffff", perspective: "600px" }}
            >
              <span className="svc-title-word inline-block font-light" style={{ opacity: 0 }}>Elevate</span>{" "}
              <span className="svc-title-word inline-block font-light" style={{ opacity: 0 }}>Your</span>{" "}
              <span className="svc-title-word inline-block font-extrabold" style={{ opacity: 0, color: "#84776e" }}>Voyage</span>
            </h2>

            <p
              className="svc-subtitle text-sm md:text-base leading-relaxed max-w-[620px]"
              style={{ fontFamily: "var(--font-body)", color: "#8a9ab3", opacity: 0 }}
            >
              Beyond <span className="text-white font-semibold">exceptional vessels</span>, we curate every detail of your journey. From{" "}
              <span className="text-white font-semibold">masterfully crafted itineraries</span> to world-class dining, experience true{" "}
              <span className="text-white font-semibold">mythic luxury</span>.
            </p>
          </div>
        </div>

        {/* Grid — Row 1 */}
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "#84776e" }}>Lefkada Marina</span>
                </div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                  </svg>
                  <span className="text-white text-sm font-medium">{weather ? `${kphToKnots(weather.wind_kph)} kt` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>Wind</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <span className="text-white text-sm font-medium">{weather ? `${weather.humidity}%` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>Humidity</span>
                </div>
                <div className="text-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="1.5" className="mx-auto mb-2">
                    <path d="M2 6s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" />
                    <path d="M2 12s2-2 4-2 4 2 4 2 2-2 4-2 4 2 4 2 2-2 4-2" />
                  </svg>
                  <span className="text-white text-sm font-medium">{weather?.wave_height_m != null ? `${weather.wave_height_m}m` : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider block mt-1" style={{ color: "rgba(132,119,110,0.7)" }}>Waves</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(132,119,110,0.6)" }}>Perfect Sailing Conditions</span>
              </div>
            </div>
          </div>

          {/* IYC Info Card */}
          <div
            className="svc-card md:col-span-6 lg:col-span-3 relative h-[420px] rounded-3xl overflow-hidden p-8 flex flex-col items-center justify-center text-center"
            style={{
              opacity: 0,
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(132,119,110,0.3)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            }}
          >
            <div className="w-36 h-14 relative mb-6">
              <Image
                src="https://iycweb.b-cdn.net/IYC_LOGO_TRANS_BLUE.svg"
                alt="IYC Logo"
                fill
                className="object-contain opacity-90"
                unoptimized
              />
            </div>
            <h4 className="text-xl mb-4 text-white uppercase tracking-wide font-light" style={{ fontFamily: "var(--font-display)" }}>
              The Odyssey
            </h4>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9ca3af" }}>
              Since 2015, we&apos;ve been crafting mythic voyages through the Ionian Isles. Every journey honors the spirit of exploration.
            </p>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="text-2xl font-light text-white">500+</span>
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: "#84776e" }}>Voyages</span>
              </div>
              <div className="w-px" style={{ background: "rgba(132,119,110,0.2)" }} />
              <div className="text-center">
                <span className="text-2xl font-light text-white">18+</span>
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: "#84776e" }}>Yachts</span>
              </div>
            </div>
          </div>

          {/* Decorative concentric circles */}
          <div className="absolute top-1/3 -right-20 opacity-20 pointer-events-none z-0">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#84776e" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" stroke="#84776e" strokeWidth="0.5" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#84776e" strokeWidth="0.5" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#84776e" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Custom Routes — Large Card */}
          <ServiceImageCard
            className="svc-card md:col-span-12 lg:col-span-6 h-[420px]"
            image="https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?q=80&w=1200&auto=format&fit=crop"
            alt="Custom Routes"
            label="Tailored Journeys"
            title="Custom Routes"
            titleSize="text-3xl"
            description="Tailor-made itineraries crafted exclusively to your preferences. Navigate from secluded, untouched coves to vibrant, historic harbours across the Mediterranean."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            }
            horizontal
          />
        </div>

        {/* Grid — Row 2 */}
        <div className="svc-row2 grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* 24/7 Concierge */}
          <ServiceImageCard
            className="svc-card-row2 md:col-span-6 lg:col-span-3 h-[420px]"
            image="https://iycweb.b-cdn.net/1774937738210-selective-focus-shot-of-fruits-on-a-white-tray-on-2026-03-18-09-31-08-utc.webp"
            alt="24/7 Concierge"
            label="Always Available"
            title="24/7 Concierge"
            description="Dedicated support before, during, and after your charter. We anticipate your needs and handle every detail flawlessly."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            }
          />

          {/* Gourmet Catering */}
          <ServiceImageCard
            className="svc-card-row2 md:col-span-6 lg:col-span-3 h-[420px]"
            image="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop"
            alt="Gourmet Catering"
            label="Culinary Excellence"
            title="Gourmet Catering"
            description="Private chefs and curated dining experiences featuring the finest, locally-sourced Mediterranean cuisine."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            }
          />

          {/* Safety First — White Card */}
          <div
            className="svc-card-row2 md:col-span-6 lg:col-span-3 relative h-[420px] rounded-3xl overflow-hidden block"
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
                <span className="text-xs font-semibold tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                  Peace of Mind
                </span>
                <h3 className="text-2xl mb-3 uppercase tracking-wide font-light" style={{ color: "#070c26", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                  Safety First
                </h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#4b5563" }}>
                  Fully insured vessels, highly certified crew, and rigorous safety protocols implemented on every single voyage.
                </p>
              </div>
            </div>
          </div>

          {/* Luxury Amenities */}
          <ServiceImageCard
            className="svc-card-row2 md:col-span-6 lg:col-span-3 h-[420px]"
            image="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800&auto=format&fit=crop"
            alt="Luxury Amenities"
            label="Premium Comfort"
            title="Luxury Amenities"
            description="State-of-the-art water toys, rejuvenating spa treatments, and premium entertainment systems aboard every yacht."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        </div>

        {/* Grid — Row 3 */}
        <div className="svc-row3 grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Flexible Booking */}
          <ServiceImageCard
            className="svc-card-row3 md:col-span-12 lg:col-span-5 h-[420px]"
            image="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop"
            alt="Flexible Booking"
            label="On Your Terms"
            title="Flexible Booking"
            description="Bareboat or crewed, day charter or week-long — book on your terms with easy modifications and transparent policies."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />

          {/* Skippers School */}
          <ServiceImageCard
            className="svc-card-row3 md:col-span-12 lg:col-span-7 h-[420px]"
            image="https://iycweb.b-cdn.net/1774937590395-young-strong-beautiful-woman-sailing-the-boat-2026-01-08-07-49-53-utc.webp"
            alt="Skippers School"
            label="Master The Seas"
            title="Skippers School"
            titleSize="text-3xl"
            description="Learn to captain your own vessel with our professional training programs. Attain comprehensive certification courses guided by seasoned maritime experts."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            }
            horizontal
          />
        </div>
      </div>
    </section>
  )
}

/* ─── Reusable Image Service Card ──────────────────────────────────────── */

function ServiceImageCard({
  className = "",
  image,
  alt,
  label,
  title,
  titleSize = "text-2xl",
  description,
  icon,
  horizontal = false,
}: {
  className?: string
  image: string
  alt: string
  label: string
  title: string
  titleSize?: string
  description: string
  icon: React.ReactNode
  horizontal?: boolean
}) {
  return (
    <a
      href="#"
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
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover transition-transform duration-[800ms] group-hover:scale-[1.08]"
        style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(7,12,38,0) 0%, rgba(7,12,38,0.8) 60%, rgba(7,12,38,0.98) 100%)",
        }}
      />

      <div className={`absolute inset-0 p-8 flex flex-col justify-end ${horizontal ? "md:flex-row md:items-end md:justify-between" : ""}`}>
        {horizontal ? (
          <>
            <div className="flex-1 md:pr-12">
              <span className="text-xs font-medium tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                {label}
              </span>
              <h3 className={`${titleSize} mb-3 uppercase tracking-wide font-light`} style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", color: "#ffffff" }}>
                {title}
              </h3>
              <p className="text-sm font-light max-w-lg leading-relaxed" style={{ color: "#d1d5db" }}>
                {description}
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex-shrink-0">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#84776e] group-hover:text-[#070c26]"
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
          </>
        ) : (
          <>
            <div className="mb-auto flex justify-end">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#84776e] group-hover:text-[#070c26]"
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
            <div>
              <span className="text-xs font-medium tracking-wider uppercase mb-3 block" style={{ color: "#84776e" }}>
                {label}
              </span>
              <h3 className={`${titleSize} mb-3 uppercase tracking-wide font-light`} style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", color: "#ffffff" }}>
                {title}
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: "#d1d5db" }}>
                {description}
              </p>
            </div>
          </>
        )}
      </div>
    </a>
  )
}

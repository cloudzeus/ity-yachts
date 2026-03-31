"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CharterSearchForm } from "./charter-search-form"
import { FleetCarouselSection } from "./fleet-carousel-section"
import { LocationsSection } from "./locations-section"
import { ItinerariesSection } from "./itineraries-section"
import { FeaturedYachtsSection } from "./featured-yachts-section"
import { TestimonialsSection } from "./testimonials-section"
import { ServicesSection } from "./services-section"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroData {
  overSubheading: string
  heading: string
  subheading: string
}

interface HomepageProps {
  hero: HeroData
  destinations: Array<{
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
  }>
  itineraries: Array<{
    id: string
    name: string
    slug: string
    image: string
    shortDesc: string
    totalDays: number
    totalMiles: number
    startFrom: string
  }>
  yachts: Array<{
    id: number
    name: string
    slug: string
    image: string
    category: string
    loa: number
    cabins: number
    berths: number
    baseName: string
    priceFrom?: number
  }>
  fleetYachts?: Array<{
    id: number
    name: string
    slug: string
    image: string
    category: string
    loa: number
    cabins: number
    berths: number
    baseName: string
  }>
  reviews: Array<{
    id: string
    name: string
    content: string
    rating: number
    image?: string | null
    date: string
  }>
}

export function HomepageClient({ hero, destinations, itineraries, yachts, fleetYachts, reviews }: HomepageProps) {
  const heroVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Ensure hero video plays and loops
    const video = heroVideoRef.current
    if (video) {
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Hero text animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      ".hero-heading",
      { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
      { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2 }
    )
    tl.fromTo(
      ".hero-subheading",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9 },
      "-=0.6"
    )

    // Refresh ScrollTrigger after layout settles
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {/* Hero with search form overlapping bottom edge */}
      <section className="relative z-20">
        {/* Video area */}
        <div className="relative w-full flex flex-col px-6 md:px-12" style={{ aspectRatio: "16/9" }}>
          {/* Video Background */}
          <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
            <video
              ref={heroVideoRef}
              src="https://iycweb.b-cdn.net/1774760973356-lonely-sailboat-sailing-on-blue-water-aerial-view-2026-01-21-13-48-12-utc.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
              suppressHydrationWarning
            />
          </div>

          {/* Light overlay for top portion only */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0, 33, 71, 0.5) 0%, rgba(0, 33, 71, 0.15) 40%, transparent 60%)",
            }}
          />

          {/* Navy gradient rising from bottom — 100% at bottom, fading to 15% into hero */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "40%",
              background:
                "linear-gradient(to top, #070c26 0%, rgba(7,12,38,0.7) 40%, rgba(7,12,38,0.15) 100%)",
            }}
          />

          {/* Hero Text — absolute center */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center pointer-events-auto">
              {hero.overSubheading && (
                <div className="mb-5 inline-block rounded-sm border border-white/20 px-4 py-1.5">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest text-white/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {hero.overSubheading}
                  </span>
                </div>
              )}

              {hero.heading && (
                <h1
                  className="hero-heading mb-5 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                    opacity: 0,
                    color: "#0055a9",
                    textShadow: "0 2px 30px rgba(255,255,255,0.15)",
                  }}
                >
                  {hero.heading}
                </h1>
              )}

              {hero.subheading && (
                <p
                  className="hero-subheading mx-auto max-w-xl text-lg text-white/90"
                  style={{ fontFamily: "var(--font-body)", opacity: 0, textShadow: "0 1px 10px rgba(0,0,0,0.2)" }}
                >
                  {hero.subheading}
                </p>
              )}
            </div>
          </div>

          {/* Search form pinned to bottom — z-40 so dropdowns appear above next section */}
          <div className="relative z-40 w-full max-w-5xl mx-auto mt-auto mb-8 px-0">
            <CharterSearchForm />
          </div>
        </div>
      </section>

      {/* Fleet Carousel */}
      {fleetYachts && fleetYachts.length > 0 && (
        <FleetCarouselSection yachts={fleetYachts} />
      )}

      {/* Locations - Mythic Grid */}
      <LocationsSection destinations={destinations} />

      {/* Services — Curated Experiences */}
      <ServicesSection />

      {/* Itineraries - Parallax Cards */}
      <ItinerariesSection itineraries={itineraries} />

      {/* Testimonials */}
      <TestimonialsSection reviews={reviews} />

    </>
  )
}

"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CharterSearchForm } from "./charter-search-form"
import { DestinationsSection } from "./destinations-section"
import { ItinerariesSection } from "./itineraries-section"
import { FeaturedYachtsSection } from "./featured-yachts-section"
import { TestimonialsSection } from "./testimonials-section"
import { ServicesSection } from "./services-section"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface HomepageProps {
  destinations: Array<{
    id: string
    name: string
    slug: string
    image: string
    shortDesc: string
    yachtCount?: number
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
  reviews: Array<{
    id: string
    name: string
    content: string
    rating: number
    image?: string | null
    date: string
  }>
}

export function HomepageClient({ destinations, itineraries, yachts, reviews }: HomepageProps) {
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
      <section className="relative">
        {/* Video area */}
        <div className="relative h-[85vh] min-h-[600px] flex flex-col px-6 md:px-12 overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0" suppressHydrationWarning>
            <video
              src="https://iycweb.b-cdn.net/1774760973356-lonely-sailboat-sailing-on-blue-water-aerial-view-2026-01-21-13-48-12-utc.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              suppressHydrationWarning
            />
          </div>

          {/* Blue-to-transparent gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0, 33, 71, 0.7) 0%, rgba(0, 33, 71, 0.3) 30%, rgba(0, 33, 71, 0.08) 55%, transparent 75%, rgba(6, 12, 39, 0.45) 100%)",
            }}
          />

          {/* Hero Text — centered */}
          <div className="relative z-10 w-full max-w-5xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
            <div className="mb-5 inline-block rounded-sm border border-white/20 px-4 py-1.5">
              <span
                className="text-xs font-semibold uppercase tracking-widest text-white/70"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Luxury Yacht Charters
              </span>
            </div>

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
              IONISCHE YACHT CHARTER
            </h1>

            <p
              className="hero-subheading mx-auto max-w-xl text-lg text-white/90"
              style={{ fontFamily: "var(--font-body)", opacity: 0, textShadow: "0 1px 10px rgba(0,0,0,0.2)" }}
            >
              Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers.
            </p>
          </div>

          {/* Search Form — pinned to bottom of hero */}
          <div className="relative z-10 w-full max-w-5xl mx-auto pb-6">
            <CharterSearchForm />
          </div>
        </div>
      </section>

      {/* Destinations - Horizontal Scroll */}
      <DestinationsSection destinations={destinations} />

      {/* Featured Yachts - Mouse Scale */}
      <FeaturedYachtsSection yachts={yachts} />

      {/* Itineraries - Parallax Cards */}
      <ItinerariesSection itineraries={itineraries} />

      {/* Services + Stats */}
      <ServicesSection />

      {/* Testimonials */}
      <TestimonialsSection reviews={reviews} />

    </>
  )
}

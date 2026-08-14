"use client"

import { useEffect, useMemo } from "react"
import Link from "@/components/locale-link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/components/locale-text"
import { CharterSearchForm } from "./charter-search-form"
import { FleetCarouselSection } from "./fleet-carousel-section"
import { LocationsSection } from "./locations-section"
import { ItinerariesSection } from "./itineraries-section"
import { FeaturedYachtsSection } from "./featured-yachts-section"
import { TestimonialsSection } from "./testimonials-section"
import { ServicesSection } from "./services-section"
import { FamilySection, type FamilyMember } from "./family-section"
import type { FleetRanges } from "@/lib/fleet-ranges"
import { NewsSection } from "./news-section"
import { FaqSection } from "./faq-section"
import { AnswerBlock } from "@/components/answer-block"
import type { NewsCard } from "@/lib/news"
import type { FaqEntry } from "@/lib/faqs"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type T = Record<string, string> | null

interface HeroData {
  overSubheading: string | T
  heading: string | T
  subheading: string | T
}

interface HomepageProps {
  hero: HeroData
  destinations: Array<{
    id: string
    name: string
    nameT?: T
    slug: string
    image: string
    mediaType?: string
    shortDesc: string | T
    yachtCount?: number
    latitude?: number | null
    longitude?: number | null
    prefecture?: string | T
  }>
  itineraries: Array<{
    id: string
    name: string
    nameT?: T
    slug: string
    image: string
    shortDesc: string | T
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
    categoryT?: T
    loa: number
    cabins: number
    berths: number
    baseName: string
    baseNameT?: T
    priceFrom?: number
  }>
  fleetYachts?: Array<{
    id: number
    name: string
    slug: string
    image: string
    category: string
    categoryT?: T
    loa: number
    cabins: number
    berths: number
    baseName: string
    baseNameT?: T
  }>
  reviews: Array<{
    id: string
    name: string
    content: string
    contentT?: T
    rating: number
    image?: string | null
    date: string
  }>
  staff: FamilyMember[]
  fleetRanges: FleetRanges
  news: NewsCard[]
  faqs: FaqEntry[]
}

function r(field: string | T | undefined, locale: string): string {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[locale] || field.en || ""
}

export function HomepageClient({ hero, destinations, itineraries, yachts, fleetYachts, reviews, staff, fleetRanges, news, faqs }: HomepageProps) {
  const { locale, t } = useTranslations()

  // Resolve all translation objects to current locale strings
  const heroResolved = useMemo(() => ({
    overSubheading: r(hero.overSubheading, locale),
    heading: r(hero.heading, locale),
    subheading: r(hero.subheading, locale),
  }), [hero, locale])

  const destResolved = useMemo(() => destinations.map((d) => ({
    ...d,
    name: r(d.nameT, locale) || d.name,
    shortDesc: r(d.shortDesc, locale),
    prefecture: r(d.prefecture, locale),
  })), [destinations, locale])

  const itinResolved = useMemo(() => itineraries.map((it) => ({
    ...it,
    name: r(it.nameT, locale) || it.name,
    shortDesc: r(it.shortDesc, locale),
  })), [itineraries, locale])

  const yachtResolved = useMemo(() => yachts.map((y) => ({
    ...y,
    category: r(y.categoryT, locale) || y.category,
    baseName: r(y.baseNameT, locale) || y.baseName,
  })), [yachts, locale])

  const fleetResolved = useMemo(() => fleetYachts?.map((y) => ({
    ...y,
    category: r(y.categoryT, locale) || y.category,
    baseName: r(y.baseNameT, locale) || y.baseName,
  })), [fleetYachts, locale])

  const reviewResolved = useMemo(() => reviews.map((rv) => ({
    ...rv,
    content: r(rv.contentT, locale) || rv.content,
  })), [reviews, locale])

  useEffect(() => {
    // Hero text animation. Both lines come from the CMS and may be absent —
    // animate only what actually rendered, otherwise GSAP warns on every load
    // and, worse, the element keeps the opacity:0 it starts with.
    const heading = document.querySelector(".hero-heading")
    const sub = document.querySelector(".hero-subheading")
    const actions = document.querySelector(".hero-actions")
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    if (heading) {
      tl.fromTo(
        heading,
        { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
        { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2 }
      )
    }
    if (sub) {
      tl.fromTo(
        sub,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9 },
        heading ? "-=0.6" : 0
      )
    }
    if (actions) {
      tl.fromTo(actions, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
    }

    // Refresh ScrollTrigger after layout settles
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)
    return () => {
      clearTimeout(timeout)
      tl.kill()
    }
  }, [])

  return (
    <>
      {/* Hero with search form overlapping bottom edge */}
      <section className="relative z-20">
        {/* Video area */}
        <div className="relative w-full flex flex-col px-6 md:px-12" style={{ minHeight: "100svh", height: "100dvh" }}>
          {/* Hero media — a still sits under the video (the kit's HeroMedia
              pattern), so the frame is never empty while the clip buffers or
              if the CDN is unreachable. */}
          <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
            <img
              src="/brand/hero-aerial.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Light overlay for top portion only */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(4,13,25,0.5) 0%, rgba(46,44,40,0.15) 40%, transparent 60%)",
            }}
          />

          {/* Hero settles INTO the warm page, per the kit — the deep sea stays
              at the top of the frame, the foot of the hero becomes limestone. */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "55%",
              background:
                "linear-gradient(to bottom, rgba(4,13,25,0) 0%, rgba(4,13,25,0.18) 35%, var(--surface-page) 100%)",
            }}
          />

          {/* Hero Text — absolute center */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {/* 880px, as the kit sets it. Unconstrained, the headline broke
                after "γερμανική" and left "ακρίβεια." orphaned on its own line. */}
            <div className="pointer-events-auto mx-auto max-w-[880px] px-6 text-center">
              {heroResolved.overSubheading && (
                <div className="mb-5 inline-block rounded-sm border border-white/20 px-4 py-1.5">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest text-white/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {removeGreekTonos(heroResolved.overSubheading)}
                  </span>
                </div>
              )}

              {heroResolved.heading && (
                <h1
                  className="hero-heading mb-5 text-4xl font-bold md:text-5xl lg:text-6xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "var(--tracking-display)",
                    lineHeight: 1.08,
                    opacity: 0,
                    // The hero headline sits on the deep sea: ionian-600 was
                    // 2.84:1 there. The kit sets it white.
                    color: "#FFFFFF",
                    textShadow: "0 2px 30px rgba(4,13,25,0.35)",
                  }}
                >
                  {heroResolved.heading}
                </h1>
              )}

              {heroResolved.subheading && (
                <p
                  className="hero-subheading mx-auto text-lg md:text-xl"
                  style={{
                    fontFamily: "var(--font-body)",
                    maxWidth: "48ch",
                    color: "rgba(255,255,255,0.92)",
                    opacity: 0,
                    textShadow: "0 1px 10px rgba(4,13,25,0.35)",
                  }}
                >
                  {heroResolved.subheading}
                </p>
              )}

              {/* The kit closes the hero with two actions before the search bar:
                  one filled, one outlined. Ours went straight from copy to the
                  search form, so the headline had nothing to lead into. */}
              <div className="hero-actions mt-8 flex flex-wrap items-center justify-center gap-3" style={{ opacity: 0 }}>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--action-accent)",
                    color: "var(--text-on-accent)",
                    borderRadius: "var(--iyc-radius-sm)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {t("home.hero.requestOffer", "Request an offer")}
                </Link>
                <Link
                  href="/fleet"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(251,249,245,0.5)",
                    color: "var(--iyc-sand-50)",
                    borderRadius: "var(--iyc-radius-sm)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {t("home.hero.exploreFleet", "Explore the fleet")}
                </Link>
              </div>
            </div>
          </div>

          {/* Search form pinned to bottom — z-40 so dropdowns appear above next section */}
          <div className="relative z-40 w-full max-w-5xl mx-auto mt-auto mb-16 md:mb-28 px-0">
            <CharterSearchForm ranges={fleetRanges} />
          </div>
        </div>
      </section>

      <AnswerBlock
        eyebrowKey="answer.eyebrow"
        eyebrowFallback="In short"
        bodyKey="answer.home"
        bodyFallback={"IYC Ionische Yacht Charter is a family business that has sailed out of Lefkada since 1979. We charter our own sailing yachts and catamarans from one base in Lefkada harbour — bareboat or with a skipper — across the Ionian Sea from May to October. A Greek base, a German office, the same family throughout."}
        container="w-full px-6 md:px-12 lg:px-16"
        spacing="pt-20 pb-0 md:pt-24"
      />

      {/* Fleet Carousel */}
      {fleetResolved && fleetResolved.length > 0 && (
        <FleetCarouselSection yachts={fleetResolved} />
      )}

      {/* Locations - Mythic Grid */}
      <LocationsSection destinations={destResolved} />

      {/* Our service — six cards, then live conditions and the IYC card */}
      <ServicesSection />

      {/* Itineraries - Parallax Cards */}
      <ItinerariesSection itineraries={itinResolved} />

      {/* Testimonials */}
      <TestimonialsSection reviews={reviewResolved} />

      {/* The questions people ask before booking, answered on the page. */}
      <FaqSection faqs={faqs} />

      {/* The three most recent pieces */}
      <NewsSection articles={news} />

      {/* The family behind the business */}
      <FamilySection members={staff} />

    </>
  )
}

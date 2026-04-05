"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Compass, Clock, Navigation, ArrowRight } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { TextReveal, ParallaxImage } from "./scroll-animations"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ItineraryItem {
  id: string
  name: string
  slug: string
  image: string
  shortDesc: string
  totalDays: number
  totalMiles: number
  startFrom: string
}

export function ItinerariesSection({ itineraries }: { itineraries: ItineraryItem[] }) {
  const { t } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)

  if (itineraries.length === 0) return null

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden"
      style={{ background: "#070c26" }}
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-16">
        <TextReveal>
          <span className="label-sm mb-3 block" style={{ color: "var(--secondary-light)" }}>
            {t("home.itineraries.label", "Itineraries")}
          </span>
        </TextReveal>
        <TextReveal delay={0.1}>
          <h2
            className="text-4xl md:text-6xl font-bold max-w-3xl text-white"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("home.itineraries.badge", "Curated Sailing Routes")}
          </h2>
        </TextReveal>
        <TextReveal delay={0.2}>
          <p
            className="text-lg mt-4 max-w-xl text-white/50"
          >
            {t("home.itineraries.description", "Hand-crafted itineraries through the most captivating waters, designed by our expert skippers.")}
          </p>
        </TextReveal>
      </div>

      {/* Itinerary Cards */}
      <div className="max-w-7xl mx-auto">
        {itineraries.map((item, i) => (
          <ItineraryCard key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* View All Link */}
      <div className="max-w-7xl mx-auto mt-12">
        <TextReveal>
          <Link
            href="/itineraries"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:gap-3"
            style={{ color: "var(--secondary-light)", fontFamily: "var(--font-display)" }}
          >
            {t("home.itineraries.viewAll", "View all itineraries")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </TextReveal>
      </div>
    </section>
  )
}

function ItineraryCard({ item, index }: { item: ItineraryItem; index: number }) {
  const { t } = useTranslations()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === cardRef.current) t.kill()
      })
    }
  }, [])

  const isReversed = index % 2 === 1

  return (
    <div ref={cardRef} style={{ opacity: 0 }}>
      <Link
        href={`/itineraries/${item.slug}`}
        className={`group flex flex-col ${
          isReversed ? "md:flex-row-reverse" : "md:flex-row"
        } gap-6 md:gap-10 mb-12 md:mb-16 items-stretch`}
      >
        {/* Image with parallax */}
        <div className="md:w-3/5 rounded-md overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <div className="relative w-full h-full overflow-hidden">
            {item.image ? (
              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              </div>
            ) : (
              <div
                className="w-full h-full"
                style={{ background: "var(--gradient-ocean)" }}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="md:w-2/5 flex flex-col justify-center py-4">
          <h3
            className="text-2xl md:text-3xl font-bold mb-4 text-white group-hover:text-[#0077B6] transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
            }}
          >
            {item.name}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-4">
            {item.startFrom && (
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4" style={{ color: "var(--secondary-light)" }} />
                <span className="text-sm text-white/50">
                  {t("home.itineraries.from", "From")} {item.startFrom}
                </span>
              </div>
            )}
            {item.totalDays > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" style={{ color: "var(--secondary-light)" }} />
                <span className="text-sm text-white/50">
                  {item.totalDays} {t("home.itineraries.days", "days")}
                </span>
              </div>
            )}
            {item.totalMiles > 0 && (
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4" style={{ color: "var(--secondary-light)" }} />
                <span className="text-sm text-white/50">
                  {item.totalMiles} nm
                </span>
              </div>
            )}
          </div>

          <p
            className="text-sm line-clamp-3 mb-6 text-white/50"
          >
            {item.shortDesc}
          </p>

          <span
            className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
            style={{ color: "var(--secondary-light)", fontFamily: "var(--font-display)" }}
          >
            {t("home.itineraries.viewItinerary", "View itinerary")}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </div>
  )
}

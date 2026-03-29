"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MapPin, ArrowRight } from "lucide-react"
import { TextReveal } from "./scroll-animations"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface Destination {
  id: string
  name: string
  slug: string
  image: string
  shortDesc: string
  yachtCount?: number
}

export function DestinationsSection({ destinations }: { destinations: Destination[] }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Horizontal scroll with GSAP ScrollTrigger
  useEffect(() => {
    if (!sectionRef.current || !scrollContainerRef.current || !trackRef.current) return
    if (destinations.length < 2) return

    const track = trackRef.current
    const scrollWidth = track.scrollWidth - window.innerWidth

    if (scrollWidth <= 0) return

    const tween = gsap.to(track, {
      x: -scrollWidth,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${scrollWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [destinations.length])

  if (destinations.length === 0) return null

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: "var(--primary)" }}>
      {/* Header */}
      <div ref={scrollContainerRef} className="relative min-h-screen flex flex-col">
        <div className="px-6 md:px-12 pt-24 pb-8">
          <TextReveal>
            <span
              className="label-sm mb-3 block"
              style={{ color: "var(--secondary-light)" }}
            >
              Destinations
            </span>
          </TextReveal>
          <TextReveal delay={0.1}>
            <h2
              className="text-4xl md:text-6xl font-bold text-white max-w-2xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Explore Our Charter Destinations
            </h2>
          </TextReveal>
        </div>

        {/* Horizontal track */}
        <div className="flex-1 flex items-center">
          <div ref={trackRef} className="flex gap-6 px-6 md:px-12 py-8 will-change-transform">
            {destinations.map((dest, i) => (
              <DestinationCard key={dest.id} destination={dest} reversed={i % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Destination Card with Mouse-Scale Effect ─────────────────────────── */

function DestinationCard({
  destination,
  reversed,
}: {
  destination: Destination
  reversed: boolean
}) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)
  const currentScale = useRef(1)
  const targetScale = useRef(1)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Scale based on distance from center
    const dx = x - 0.5
    const dy = y - 0.5
    const dist = Math.sqrt(dx * dx + dy * dy)
    targetScale.current = 1.05 + dist * 0.08

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(animate)
    }
  }

  const animate = () => {
    const delta = targetScale.current - currentScale.current
    currentScale.current += delta * 0.1

    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${currentScale.current})`
    }

    if (Math.abs(delta) > 0.001) {
      rafId.current = requestAnimationFrame(animate)
    } else {
      rafId.current = null
    }
  }

  const handleMouseLeave = () => {
    targetScale.current = 1
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(animate)
    }
  }

  return (
    <Link
      href={`/locations/${destination.slug}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex-shrink-0 w-[75vw] md:w-[40vw] lg:w-[30vw] rounded-md overflow-hidden cursor-pointer"
      style={{ aspectRatio: "3/4" }}
    >
      {/* Image with scale effect */}
      <div ref={imageRef} className="absolute inset-0 transition-none will-change-transform">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 75vw, 40vw"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--gradient-ocean)" }} />
        )}
      </div>

      {/* Gradient overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(0,10,30,0.85) 0%, rgba(0,10,30,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Hover brighten overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-10">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#0077B6]" />
          {destination.yachtCount !== undefined && (
            <span className="text-xs text-white/50">
              {destination.yachtCount} yachts
            </span>
          )}
        </div>
        <h3
          className="text-2xl md:text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          {destination.name}
        </h3>
        <p className="text-sm text-white/60 line-clamp-2 mb-4">
          {destination.shortDesc}
        </p>
        <div className="flex items-center gap-2 text-[#0077B6] text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          Explore
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

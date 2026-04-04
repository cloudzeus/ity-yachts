"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MapPin, ArrowRight, Compass, Navigation } from "lucide-react"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface LocationItem {
  id: string
  name: string
  slug: string
  image: string | null
  imageType: string | null
  shortDesc: string
  prefecture: string
  city: string
  latitude: number | null
  longitude: number | null
}

/* ─── Coordinate formatter ──────────────────────────────────────────────── */
function formatCoord(val: number, isLat: boolean) {
  const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W"
  const abs = Math.abs(val)
  const deg = Math.floor(abs)
  const min = ((abs - deg) * 60).toFixed(1)
  return `${deg}°${min}'${dir}`
}

/* ─── Main Grid ─────────────────────────────────────────────────────────── */

export function LocationsGrid({ locations }: { locations: LocationItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return

    const cards = gridRef.current.querySelectorAll("[data-loc-card]")
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 80, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [locations.length])

  if (locations.length === 0) {
    return (
      <p className="text-center text-white/40 py-20 text-lg">
        No destinations available yet. Check back soon.
      </p>
    )
  }

  const [featured, ...rest] = locations

  return (
    <div ref={gridRef}>
      {/* Featured hero card */}
      <FeaturedCard location={featured} />

      {/* Bento grid */}
      {rest.length > 0 && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-5">
          {rest.map((loc, i) => {
            // Alternating pattern: wide(8col) + narrow(4col), then narrow(4col) + wide(8col)
            const pairIndex = Math.floor(i / 2)
            const isFirst = i % 2 === 0
            const isWide = pairIndex % 2 === 0 ? isFirst : !isFirst
            // If it's the last item and alone, make it full width
            const isLastAlone = i === rest.length - 1 && i % 2 === 0

            return (
              <div
                key={loc.id}
                data-loc-card
                className={
                  isLastAlone
                    ? "md:col-span-12"
                    : isWide
                      ? "md:col-span-7"
                      : "md:col-span-5"
                }
                style={{ opacity: 0 }}
              >
                <LocationCard location={loc} tall={isWide} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Featured Card ─────────────────────────────────────────────────────── */

function FeaturedCard({ location }: { location: LocationItem }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
    if (imgRef.current) {
      const moveX = (0.5 - mouse.x) * 20
      const moveY = (0.5 - mouse.y) * 20
      imgRef.current.style.transform = `scale(1.08) translate(${moveX}px, ${moveY}px)`
    }
  }

  const handleMouseLeave = () => {
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)"
    }
  }

  return (
    <Link
      ref={cardRef}
      href={`/locations/${location.slug}`}
      data-loc-card
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative block w-full rounded-2xl overflow-hidden"
      style={{ aspectRatio: "21/9", opacity: 0 }}
    >
      {/* Image */}
      <div
        ref={imgRef}
        className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
      >
        {location.image ? (
          location.imageType === "video" ? (
            <video
              src={location.image}
              muted
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={location.image}
              alt={location.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#0d2847]" />
        )}
      </div>

      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(0,10,30,0.7) 0%, transparent 50%, rgba(0,10,30,0.5) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,10,30,0.9) 0%, transparent 50%)",
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(0,119,182,0.08), transparent 60%)`,
        }}
      />

      {/* Featured badge */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full bg-white/10 text-white/80 backdrop-blur-md border border-white/10">
          <Compass className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
          Featured Destination
        </span>
      </div>

      {/* Coordinates */}
      {location.latitude && location.longitude && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
          <Navigation className="w-3 h-3 text-[#0077B6]/70" />
          <span className="text-[10px] font-mono text-white/40 tracking-wider">
            {formatCoord(location.latitude, true)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 z-10">
        <div className="max-w-2xl">
          {(location.prefecture || location.city) && (
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-[#0077B6]" />
              <span className="text-xs uppercase tracking-[0.15em] text-white/50 font-medium">
                {[location.prefecture, location.city].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          <h2
            className="text-3xl md:text-5xl font-bold mb-3 transition-colors duration-500 group-hover:!text-[#0077B6]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "#fff" }}
          >
            {location.name}
          </h2>
          {location.shortDesc && (
            <p className="text-base text-white/50 line-clamp-2 max-w-lg mb-5">
              {location.shortDesc}
            </p>
          )}
          <div className="flex items-center gap-2.5 text-[#0077B6] text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
            Explore destination
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0077B6]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
    </Link>
  )
}

/* ─── Standard Card ─────────────────────────────────────────────────────── */

function LocationCard({ location, tall }: { location: LocationItem; tall: boolean }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    if (imgRef.current) {
      imgRef.current.style.transform = `scale(1.06) translate(${(0.5 - x) * 12}px, ${(0.5 - y) * 12}px)`
    }
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(400px circle at ${x * 100}% ${y * 100}%, rgba(0,119,182,0.1), transparent 60%)`
      glowRef.current.style.opacity = "1"
    }
  }

  const handleMouseLeave = () => {
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)"
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = "0"
    }
  }

  return (
    <Link
      ref={cardRef}
      href={`/locations/${location.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col rounded-xl overflow-hidden h-full"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        minHeight: tall ? "420px" : "360px",
      }}
    >
      {/* Image area */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: tall ? "260px" : "200px" }}>
        <div
          ref={imgRef}
          className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
        >
          {location.image ? (
            location.imageType === "video" ? (
              <video
                src={location.image}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={location.image}
                alt={location.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#0d2847]" />
          )}
        </div>

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,10,30,0.8) 0%, transparent 60%)" }}
        />

        {/* Glow follow */}
        <div
          ref={glowRef}
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ opacity: 0 }}
        />

        {/* Coordinates chip */}
        {location.latitude && location.longitude && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
            <Navigation className="w-3 h-3 text-[#0077B6]/70" />
            <span className="text-[10px] font-mono text-white/40 tracking-wider">
              {formatCoord(location.latitude, true)}
            </span>
          </div>
        )}

        {/* Bottom name overlay (on image) */}
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          {(location.prefecture || location.city) && (
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3 h-3 text-[#0077B6]/80" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                {[location.prefecture, location.city].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          <h3
            className="text-xl md:text-2xl font-bold transition-colors duration-500 group-hover:!text-[#0077B6]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em", color: "#fff" }}
          >
            {location.name}
          </h3>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 pt-3">
        {location.shortDesc && (
          <p className="text-sm text-white/45 line-clamp-2 mb-4">
            {location.shortDesc}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0077B6] text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-400">
            Explore
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="w-8 h-[1px] bg-white/10 group-hover:bg-[#0077B6]/30 group-hover:w-12 transition-all duration-500" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0077B6]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-600" />
    </Link>
  )
}

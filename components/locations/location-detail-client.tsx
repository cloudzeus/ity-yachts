"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  MapPin,
  Navigation,
  ArrowLeft,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Maximize2,
  Anchor,
  Thermometer,
  Wind,
  Droplets,
  Waves,
} from "lucide-react"
import { LocationMap } from "./location-map"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

type LocationData = {
  name: string
  slug: string
  shortDesc: string
  description: string
  prefecture: string
  city: string
  latitude: number | null
  longitude: number | null
  defaultMedia: string | null
  defaultMediaType: string | null
  images: string[]
}

/* ─── Coordinate formatter ──────────────────────────────────────────────── */

function formatCoord(val: number, isLat: boolean) {
  const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W"
  const abs = Math.abs(val)
  const deg = Math.floor(abs)
  const min = ((abs - deg) * 60).toFixed(1)
  return `${deg}°${min}'${dir}`
}

/* ─── Lightbox ──────────────────────────────────────────────────────────── */

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[]
  initialIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const isVideo = (src: string) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src)

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" })
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, scale: 0.92, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.1 }
    )
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      if (e.key === "ArrowRight") nav(1)
      if (e.key === "ArrowLeft") nav(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [images.length])

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" })
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.95,
      y: 10,
      duration: 0.25,
      ease: "power2.in",
      onComplete: onClose,
    })
  }

  const nav = (dir: number) => {
    const next = idx + dir
    if (next < 0 || next >= images.length) return
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        x: dir * -30,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setIdx(next)
          gsap.fromTo(
            contentRef.current,
            { opacity: 0, x: dir * 30 },
            { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
          )
        },
      })
    } else setIdx(next)
  }

  const src = images[idx]
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={handleClose}
    >
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-10 size-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
      >
        <X className="size-5" />
      </button>
      <div ref={contentRef} className="relative" onClick={(e) => e.stopPropagation()}>
        {isVideo(src) ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="rounded-md"
            style={{ maxWidth: "90vw", maxHeight: "85vh" }}
          />
        ) : (
          <img
            src={src}
            alt=""
            className="rounded-md"
            style={{ maxWidth: "90vw", maxHeight: "85vh", display: "block" }}
          />
        )}
        {images.length > 1 && (
          <>
            {idx > 0 && (
              <button
                onClick={() => nav(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all duration-200"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {idx < images.length - 1 && (
              <button
                onClick={() => nav(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all duration-200"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i !== idx) nav(i - idx)
                  }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === idx ? 16 : 6,
                    height: 6,
                    background: i === idx ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function LocationDetailClient({ location }: { location: LocationData }) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const heroImgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const mapSectionRef = useRef<HTMLElement>(null)

  // All gallery images (hero + images array)
  const allImages: string[] = []
  if (location.defaultMedia) allImages.push(location.defaultMedia)
  for (const img of location.images) {
    if (!allImages.includes(img)) allImages.push(img)
  }

  // ── Weather fetch ─────────────────────────────────────────────────────
  const [weather, setWeather] = useState<{
    temp_c: number
    condition: string
    wind_kph: number
    humidity: number
    wave_height_m: number | null
  } | null>(null)

  useEffect(() => {
    const q = hasCoords
      ? `${location.latitude},${location.longitude}`
      : location.name
    fetch(`/api/weather?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWeather(d))
      .catch(() => {})
  }, [])

  // ── Hero parallax ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!heroImgRef.current) return
    const tween = gsap.to(heroImgRef.current, {
      yPercent: 25,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
      },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  // ── Content entrance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!contentRef.current) return
    const sections = contentRef.current.querySelectorAll("[data-reveal]")
    sections.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 40 })
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      })
    })
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  // ── Gallery stagger (after section reveals) ────────────────────────────
  useEffect(() => {
    if (!galleryRef.current) return
    const items = galleryRef.current.querySelectorAll("[data-gallery-item]")
    // Set initial state, animate after a short delay to let section reveal first
    items.forEach((el) => {
      ;(el as HTMLElement).style.opacity = "0"
      ;(el as HTMLElement).style.transform = "translateY(20px)"
    })
    const timer = setTimeout(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: galleryRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        },
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const hasCoords = location.latitude && location.longitude

  return (
    <>
      {/* ── Cinematic Hero ──────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div ref={heroImgRef} className="absolute inset-0 will-change-transform" style={{ top: "-10%" , bottom: "-10%" }}>
          {location.defaultMedia ? (
            location.defaultMediaType === "video" ? (
              <video
                src={location.defaultMedia}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={location.defaultMedia}
                alt={location.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
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
            background:
              "linear-gradient(to top, #060c27 0%, rgba(6,12,39,0.6) 40%, rgba(6,12,39,0.2) 70%, rgba(6,12,39,0.4) 100%)",
          }}
        />

        {/* Side vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(6,12,39,0.5) 0%, transparent 30%, transparent 70%, rgba(6,12,39,0.5) 100%)",
          }}
        />

        {/* Back nav */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <Link
            href="/locations"
            className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Destinations
          </Link>
        </div>

        {/* Coordinates + Weather chips */}
        <div className="absolute top-28 right-6 md:right-12 z-20 flex flex-col items-end gap-2">
          {hasCoords && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
              <Navigation className="w-3.5 h-3.5 text-[#0077B6]/80" />
              <span className="text-[11px] font-mono text-white/50 tracking-wider">
                {formatCoord(location.latitude!, true)} / {formatCoord(location.longitude!, false)}
              </span>
            </div>
          )}
          {weather && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[#0077B6]/80" />
                <span className="text-[11px] font-mono text-white/50">{weather.temp_c}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#0077B6]/80" />
                <span className="text-[11px] font-mono text-white/50">{weather.wind_kph} kn</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#0077B6]/80" />
                <span className="text-[11px] font-mono text-white/50">{weather.humidity}%</span>
              </div>
              {weather.wave_height_m !== null && (
                <div className="flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-[#0077B6]/80" />
                  <span className="text-[11px] font-mono text-white/50">{weather.wave_height_m}m</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen button on hero */}
        {location.defaultMedia && (
          <button
            onClick={() => setLightbox({ images: allImages, index: 0 })}
            className="absolute bottom-8 right-6 md:right-12 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            View fullscreen
          </button>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-6 md:px-12 pb-12">
          <div className="max-w-5xl mx-auto">
            {(location.prefecture || location.city) && (
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[#0077B6]" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/50 font-medium">
                  {[location.prefecture, location.city].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: "#fff" }}
            >
              {location.name}
            </h1>
            {location.shortDesc && (
              <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
                {location.shortDesc}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-6">
              {allImages.length > 1 && (
                <button
                  onClick={() => setLightbox({ images: allImages, index: 0 })}
                  className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
                >
                  <Compass className="w-4 h-4" />
                  {allImages.length} photos
                </button>
              )}
              {hasCoords && (
                <button
                  onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  View on map
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0077B6]/20 to-transparent" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div ref={contentRef} className="relative">
        {/* Description section */}
        {location.description && (
          <section data-reveal className="px-6 md:px-12 pt-16 pb-12">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left label */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-[1px] bg-[#0077B6]/40" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0077B6]">
                      About
                    </span>
                  </div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "#fff" }}
                  >
                    {location.name}
                  </h2>
                </div>

                {/* Right content */}
                <div className="lg:col-span-9">
                  <div
                    className="prose prose-lg prose-invert max-w-none"
                    style={{ color: "rgba(255,255,255,0.65)", textAlign: "justify" }}
                    dangerouslySetInnerHTML={{ __html: location.description }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Divider */}
        {location.description && location.images.length > 0 && (
          <div data-reveal className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        )}

        {/* ── Gallery ────────────────────────────────────────────────────── */}
        {location.images.length > 0 && (
          <section data-reveal className="px-6 md:px-12 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-[1px] bg-[#0077B6]/40" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0077B6]">
                  Gallery
                </span>
              </div>

              <div ref={galleryRef} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {location.images.map((url, i) => {
                  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)
                  // First image large, others standard
                  const isLarge = i === 0
                  return (
                    <div
                      key={i}
                      data-gallery-item
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightbox({ images: location.images, index: i })}
                      className={`group relative overflow-hidden rounded-lg cursor-pointer ${
                        isLarge ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"
                      }`}
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={url}
                          alt={`${location.name} ${i + 1}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                        />
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Map ────────────────────────────────────────────────────────── */}
        {hasCoords && (
          <section ref={mapSectionRef} data-reveal className="px-6 md:px-12 pb-20 pt-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-[1px] bg-[#0077B6]/40" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0077B6]">
                  Location
                </span>
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <LocationMap
                  latitude={location.latitude!}
                  longitude={location.longitude!}
                  name={location.name}
                  className="w-full h-72 md:h-[28rem]"
                />
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5 text-[#0077B6]/60" />
                    <span className="text-xs text-white/40 font-mono">
                      {formatCoord(location.latitude!, true)}, {formatCoord(location.longitude!, false)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/@${location.latitude},${location.longitude},14z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#0077B6]/70 hover:text-[#0077B6] transition-colors"
                  >
                    Open in Google Maps
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA / Other destinations ───────────────────────────────────── */}
        <section data-reveal className="px-6 md:px-12 pb-24">
          <div className="max-w-5xl mx-auto text-center">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent mb-12" />
            <p className="text-white/40 text-sm mb-4">Want to explore more?</p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300 text-sm font-medium"
            >
              Browse all destinations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}

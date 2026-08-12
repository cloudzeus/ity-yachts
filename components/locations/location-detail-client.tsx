"use client"

import { useState, useRef, useEffect, useMemo } from "react"
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
import { useTranslations } from "@/lib/use-translations"
import { ScrollTypewriter } from "@/components/scroll-typewriter"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

type TranslatedField = Record<string, string> | null | undefined

type LocationData = {
  name: string
  nameTranslations?: TranslatedField
  slug: string
  shortDesc: string | TranslatedField
  description: string | TranslatedField
  prefecture: string | TranslatedField
  city: string
  latitude: number | null
  longitude: number | null
  defaultMedia: string | null
  defaultMediaType: string | null
  images: string[]
}

function resolveField(field: string | TranslatedField, locale: string): string {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[locale] || field.en || ""
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
          <Image
            src={src}
            alt=""
            width={1600}
            height={1200}
            className="rounded-md"
            style={{ maxWidth: "90vw", maxHeight: "85vh", display: "block", width: "auto", height: "auto" }}
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

export function LocationDetailClient({ location, mapsKey }: { location: LocationData; mapsKey: string | null }) {
  const { locale, t, tUpper } = useTranslations()
  const locName = resolveField(location.nameTranslations, locale) || location.name
  const locShortDesc = resolveField(location.shortDesc, locale)
  const locDescription = resolveField(location.description, locale)

  // The CMS stores these descriptions as one unbroken string with no markup,
  // which renders as a single wall of text. Group the sentences into
  // paragraphs so the copy has rhythm (and so the drop cap has something to
  // attach to). Text that already carries markup is passed through untouched.
  const locDescriptionHtml = useMemo(() => {
    if (!locDescription) return ""
    if (/<\/?[a-z][\s\S]*>/i.test(locDescription)) return locDescription
    const paragraphs = locDescription.trim().split(/\n\s*\n/)
    const blocks =
      paragraphs.length > 1
        ? paragraphs
        : (locDescription.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [locDescription]).reduce<string[]>(
            (acc, sentence, i) => {
              const group = Math.floor(i / 3)
              acc[group] = (acc[group] ?? "") + sentence
              return acc
            },
            []
          )
    return blocks
      .map((b) => `<p>${b.trim()}</p>`)
      .join("")
  }, [locDescription])
  const locPrefecture = resolveField(location.prefecture, locale)
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
    // Cinematic hero: the frame opens on a wide crop and settles as it leaves,
    // travelling far enough to actually read as movement.
    const tween = gsap.fromTo(
      heroImgRef.current,
      { yPercent: -10, scale: 1.16 },
      {
        yPercent: 26,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  // ── Content entrance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!contentRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const root = contentRef.current
    const ctx = gsap.context(() => {
      // Fade-only reveal for sections that host a pin — a transform on the
      // ancestor would trap the pinned element's position:fixed.
      root.querySelectorAll<HTMLElement>("[data-reveal-fade]").forEach((el) => {
        // Anything already on screen must not be hidden — if its trigger then
        // fails to fire, the section stays invisible and the page reads blank.
        if (el.getBoundingClientRect().top < window.innerHeight) return
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: 1, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        })
      })

      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        )
      })

      // Section labels draw their rule as they arrive
      root.querySelectorAll("[data-rule]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          }
        )
      })

      // Pin the label column so it holds position while the prose runs past,
      // releasing exactly when the text ends. Desktop only — on a narrow
      // screen the two halves are stacked and pinning would just hide content.
      const label = root.querySelector<HTMLElement>("[data-pin-label]")
      const body = root.querySelector<HTMLElement>("[data-pin-body]")
      if (label && body && window.matchMedia("(min-width: 1024px)").matches) {
        ScrollTrigger.create({
          trigger: body,
          start: "top 140px",
          end: () => `+=${Math.max(0, body.offsetHeight - label.offsetHeight)}`,
          pin: label,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
      }

      // The prose reveals a line at a time as it is read. Words are wrapped
      // first, grouped by their measured offsetTop (the only reliable way to
      // know where the browser broke each line), then each line is wrapped in
      // its own block so it can carry its own trigger. Triggering every line
      // off the paragraph made them all fire within the first 100px.
      const attachLineTweens = (para: HTMLElement) => {
        para.querySelectorAll<HTMLElement>(".iyc-line").forEach((line) => {
          gsap.fromTo(
            line,
            { opacity: 0.1, y: 14 },
            {
              opacity: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: line,
                start: "top 86%",
                end: "top 62%",
                scrub: 0.4,
              },
            }
          )
        })
      }

      const buildLines = () => {
        root.querySelectorAll<HTMLElement>("[data-ink] p").forEach((para, pIndex) => {
          // The opening paragraph carries a floated drop cap; wrapping its
          // lines in blocks cancels the float wrap and mangles the indent.
          // It gets a plain scrubbed fade instead.
          if (pIndex === 0) {
            if (!para.dataset.lead) {
              para.dataset.lead = "1"
            }
            gsap.fromTo(
              para,
              { opacity: 0.25 },
              {
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: para, start: "top 88%", end: "top 55%", scrub: 0.4 },
              }
            )
            return
          }
          // Already split on a previous mount? Reuse the lines and just
          // re-attach the tweens. The guard used to sit on a data attribute
          // that survives ctx.revert(), so React's double-invoke in dev left
          // the markup split but every tween gone.
          if (para.dataset.lined) {
            attachLineTweens(para)
            return
          }
          para.dataset.lined = "1"

          const frag = document.createDocumentFragment()
          for (const w of (para.textContent ?? "").split(/(\s+)/)) {
            if (!w) continue
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(w))
              continue
            }
            const el = document.createElement("span")
            el.textContent = w
            el.style.display = "inline-block"
            frag.appendChild(el)
          }
          para.textContent = ""
          para.appendChild(frag)

          const words = Array.from(para.querySelectorAll<HTMLElement>("span"))
          const groups: HTMLElement[][] = []
          let top: number | null = null
          for (const w of words) {
            const t = Math.round(w.offsetTop)
            if (top === null || Math.abs(t - top) > 4) {
              top = t
              groups.push([])
            }
            groups[groups.length - 1].push(w)
          }

          // rebuild as one block per line
          para.textContent = ""
          for (const g of groups) {
            const line = document.createElement("span")
            line.className = "iyc-line"
            line.style.display = "block"
            g.forEach((w, i) => {
              if (i) line.appendChild(document.createTextNode(" "))
              w.style.display = "inline"
              line.appendChild(w)
            })
            para.appendChild(line)
          }

          attachLineTweens(para)
        })
      }
      buildLines()

    }, root)
    // Failsafe. Scroll-driven reveals are the classic way to ship a blank
    // page: one stale trigger and the content never un-hides. Two seconds in,
    // anything still dimmed gets forced visible.
    const failsafe = window.setTimeout(() => {
      root
        .querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-fade], .iyc-line, [data-ink] p")
        .forEach((el) => {
          if (parseFloat(getComputedStyle(el).opacity) < 0.9) {
            gsap.set(el, { opacity: 1, y: 0, clearProps: "opacity,transform" })
          }
        })
    }, 2000)

    // Scoped: reverts only what this component created.
    return () => {
      clearTimeout(failsafe)
      ctx.revert()
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
        <div ref={heroImgRef} className="absolute inset-x-0 will-change-transform" style={{ top: "-22%", bottom: "-22%" }}>
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
                data-hero-media
                className="object-cover"
                priority
                sizes="100vw"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#05111F] to-[#0B3A5C]" />
          )}
        </div>

        {/* One scrim, weighted to the foot where the type sits. The previous
            pair darkened the top (0.4) and both edges (0.5) as well, which
            buried the photograph the hero exists to show. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--scrim-photo)" }}
        />
        {/* A short wash at the very top so the fixed header stays readable */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: "linear-gradient(to bottom, rgba(4,13,25,.55), transparent)" }}
        />

        {/* Back nav */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <Link
            href="/locations"
            className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[rgba(4,13,25,0.55)] backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("locationDetail.allDestinations", "All Destinations")}
          </Link>
        </div>

        {/* Coordinates + Weather chips */}
        <div className="absolute top-28 right-6 md:right-12 z-20 flex flex-col items-end gap-2">
          {hasCoords && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(4,13,25,0.62)] backdrop-blur-md border border-white/10">
              <Navigation className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/80" />
              <span className="text-[11px] font-mono text-white/85 tracking-wider">
                {formatCoord(location.latitude!, true)} / {formatCoord(location.longitude!, false)}
              </span>
            </div>
          )}
          {weather && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[rgba(4,13,25,0.62)] backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/80" />
                <span className="text-[11px] font-mono text-white/85">{weather.temp_c}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/80" />
                <span className="text-[11px] font-mono text-white/85">{weather.wind_kph} kn</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/80" />
                <span className="text-[11px] font-mono text-white/85">{weather.humidity}%</span>
              </div>
              {weather.wave_height_m !== null && (
                <div className="flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/80" />
                  <span className="text-[11px] font-mono text-white/85">{weather.wave_height_m}m</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen button on hero */}
        {location.defaultMedia && (
          <button
            onClick={() => setLightbox({ images: allImages, index: 0 })}
            className="absolute bottom-8 right-6 md:right-12 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[rgba(4,13,25,0.55)] backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {t("locationDetail.viewFullscreen", "View fullscreen")}
          </button>
        )}

        {/* Hero content */}
        <div data-hero-copy className="absolute bottom-0 inset-x-0 z-10 px-6 md:px-12 pb-12">
          <div className="max-w-5xl mx-auto">
            {(locPrefecture || location.city) && (
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[var(--iyc-ionian-500)]" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium">
                  {removeGreekTonos([locPrefecture, location.city].filter(Boolean).join(" · "))}
                </span>
              </div>
            )}
            <ScrollTypewriter
              as="h1"
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: "#fff" }}
            >
              {locName}
            </ScrollTypewriter>
            {locShortDesc && (
              <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
                {locShortDesc}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-6">
              {allImages.length > 1 && (
                <button
                  onClick={() => setLightbox({ images: allImages, index: 0 })}
                  className="flex items-center gap-2 text-white/75 hover:text-white transition-colors text-sm"
                >
                  <Compass className="w-4 h-4" />
                  {t("locationDetail.photosCount", "{count} photos").replace("{count}", String(allImages.length))}
                </button>
              )}
              {hasCoords && (
                <button
                  onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="flex items-center gap-2 text-white/75 hover:text-white transition-colors text-sm cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  {t("locationDetail.viewOnMap", "View on map")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0F79BE]/20 to-transparent" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div ref={contentRef} className="relative">
        {/* Description section */}
        {locDescription && (
          <section data-reveal-fade className="relative px-6 md:px-12 pt-20 pb-16">
            {/* Catalogue engraving, drifting behind the column */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                data-parallax="0.38"
                data-parallax-rotate="14"
                data-parallax-scale="1.25"
                className="absolute -right-16 top-10 hidden w-[260px] opacity-[0.16] lg:block"
              >
                <Image src="/brand/engravings/compass.png" alt="" width={260} height={260} unoptimized />
              </div>
            </div>

            <div className="relative z-10 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                {/* Left label — sticky, so it holds position while the prose runs */}
                <div className="lg:col-span-3">
                  <div data-pin-label>
                    <div className="mb-3 flex items-center gap-3">
                      <div data-rule className="h-[1px] w-8 bg-[var(--iyc-ionian-500)]/50" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-link)]">
                        {tUpper("locationDetail.about", "About")}
                      </span>
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}
                    >
                      {locName}
                    </h2>
                    {location.latitude != null && location.longitude != null && (
                      <p className="iyc-mono mt-3 text-[11px] text-[var(--text-subtle)]">
                        {formatCoord(location.latitude, true)} · {formatCoord(location.longitude, false)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prose — a drop cap opens it, and the measure is capped so
                    lines stay in the 65–75 character band. */}
                <div data-pin-body className="lg:col-span-9">
                  <div
                    data-ink
                    className="iyc-prose max-w-[68ch] text-[1.0625rem]"
                    style={{ color: "var(--text-body)", lineHeight: "var(--leading-body)" }}
                    dangerouslySetInnerHTML={{ __html: locDescriptionHtml }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Divider */}
        {locDescription && location.images.length > 0 && (
          <div data-reveal className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        )}

        {/* ── Gallery ────────────────────────────────────────────────────── */}
        {location.images.length > 0 && (
          <section data-reveal className="px-6 md:px-12 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div data-rule className="w-8 h-[1px] bg-[var(--iyc-ionian-500)]/50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-link)]">
                  {tUpper("locationDetail.gallery", "Gallery")}
                </span>
              </div>

              <div ref={galleryRef} className="grid grid-cols-1 gap-6 md:grid-cols-6">
                {location.images.map((url, i) => {
                  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)
                  // Editorial rhythm: a wide plate, then a pair of uprights,
                  // repeating. Replaces the one-big-tile-plus-thumbnails grid.
                  const inPair = i % 3 !== 0
                  const span = inPair ? "md:col-span-3" : "md:col-span-6"
                  const ratio = inPair ? "aspect-[4/3]" : "aspect-[21/9]"
                  return (
                    <figure
                      key={i}
                      data-gallery-item
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightbox({ images: location.images, index: i })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setLightbox({ images: location.images, index: i })
                        }
                      }}
                      aria-label={`${location.name} — photo ${i + 1} of ${location.images.length}`}
                      className={`iyc-card group relative m-0 cursor-pointer overflow-hidden rounded-[var(--iyc-radius-lg)] ${span} ${ratio}`}
                      style={{ border: "1px solid var(--border-hairline)" }}
                    >
                      {/* Oversized so a 35% drift never reveals the frame edge */}
                      <div
                        data-parallax="0.35"
                        className="absolute inset-x-0 -inset-y-[20%] h-[140%] transition-transform duration-[900ms] group-hover:scale-[1.04]"
                      >
                        {isVideo ? (
                          <video
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={url}
                            alt={`${location.name} ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes={inPair ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
                          />
                        )}
                      </div>

                      {/* Frame number — an editorial marker, not chrome */}
                      <figcaption className="iyc-mono pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-[rgba(4,13,25,0.72)] px-2.5 py-1 text-[10px] text-white/85">
                        {String(i + 1).padStart(2, "0")} / {String(location.images.length).padStart(2, "0")}
                      </figcaption>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-transparent transition-colors duration-500 group-hover:bg-[rgba(4,13,25,0.18)]" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-accent)] backdrop-blur-sm flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-[var(--text-heading)]" />
                        </div>
                      </div>
                    </figure>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Map ────────────────────────────────────────────────────────── */}
        {hasCoords && (
          <section ref={mapSectionRef} data-reveal className="relative overflow-hidden px-6 md:px-12 pb-20 pt-4">
            <div
              aria-hidden="true"
              data-parallax="0.34"
              data-parallax-rotate="-10"
              data-parallax-scale="1.2"
              className="pointer-events-none absolute -left-20 bottom-8 hidden w-[240px] opacity-[0.14] lg:block"
            >
              <Image src="/brand/engravings/anchor.png" alt="" width={240} height={240} unoptimized />
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div data-rule className="w-8 h-[1px] bg-[var(--iyc-ionian-500)]/50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-link)]">
                  {tUpper("locationDetail.location", "Location")}
                </span>
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-hairline)" }}
              >
                <LocationMap
                  latitude={location.latitude!}
                  longitude={location.longitude!}
                  name={location.name}
                  className="w-full h-72 md:h-[28rem]"
                  mapsKey={mapsKey}
                />
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: "var(--surface-card)" }}
                >
                  <div className="flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5 text-[var(--iyc-ionian-500)]/60" />
                    <span className="text-xs text-[var(--text-subtle)] font-mono">
                      {formatCoord(location.latitude!, true)}, {formatCoord(location.longitude!, false)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/@${location.latitude},${location.longitude},14z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[var(--iyc-ionian-500)]/70 hover:text-[var(--iyc-ionian-500)] transition-colors"
                  >
                    {t("locationDetail.openInGoogleMaps", "Open in Google Maps")}
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
            <p className="text-[var(--text-subtle)] text-sm mb-4">{t("locationDetail.exploreMorePrompt", "Want to explore more?")}</p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-hairline)] text-[var(--text-heading)] hover:bg-[var(--surface-accent)] transition-all duration-300 text-sm font-medium"
            >
              {t("locationDetail.browseAllDestinations", "Browse all destinations")}
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

"use client"

import { useEffect, useRef } from "react"
import Link from "@/components/locale-link"
import Image from "next/image"
import gsap from "gsap"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import { openPlanner } from "@/components/plan/plan-launcher"

export interface HeroSectionProps {
  /** Admin-configured hero data from page.heroSection */
  data?: {
    mediaUrl: string
    mediaType: "image" | "video"
    overSubheading?: Record<string, string>
    heading: Record<string, string>
    subheading: Record<string, string>
    buttonText: Record<string, string>
    buttonLink: string
  } | null
}

export function HeroSection({ data }: HeroSectionProps) {
  const { t, locale } = useTranslations()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subheadingRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    if (headingRef.current) {
      tl.fromTo(
        headingRef.current,
        { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
        { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2 }
      )
    }
    if (subheadingRef.current) {
      tl.fromTo(
        subheadingRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9 },
        "-=0.6"
      )
    }
    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.4"
      )
    }
  }, [])

  /* ─── Dynamic hero from admin ──────────────────────────────────────── */
  if (data?.mediaUrl) {
    const overSubheading = data.overSubheading?.[locale] || data.overSubheading?.en || ""
    const heading = data.heading[locale] || data.heading.en || ""
    const subheading = data.subheading[locale] || data.subheading.en || ""
    const buttonText = data.buttonText[locale] || data.buttonText.en || ""
    const buttonLink = data.buttonLink || "#"

    return (
      <section className="relative flex min-h-screen items-center justify-center px-6 md:px-12">
        {/* Background */}
        <div className="absolute inset-0" suppressHydrationWarning>
          {data.mediaType === "video" ? (
            <video
              src={data.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              suppressHydrationWarning
            />
          ) : (
            <Image
              src={data.mediaUrl}
              alt={heading || "Hero"}
              fill
              className="object-cover object-center"
              priority
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#05111F]/60 via-[#05111F]/40 to-[#05111F]" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-3xl text-center">
          {overSubheading && (
            <div className="mb-5 inline-block rounded-sm border border-white/20 px-4 py-1.5">
              <span
                className="text-xs font-semibold uppercase tracking-widest text-white/70"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {removeGreekTonos(overSubheading)}
              </span>
            </div>
          )}

          {heading && (
            <h1
              ref={headingRef}
              className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", opacity: 0 }}
            >
              {heading}
            </h1>
          )}

          {subheading && (
            <p
              ref={subheadingRef}
              className="mx-auto mb-10 max-w-xl text-lg text-white"
              style={{ fontFamily: "var(--font-body)", opacity: 0 }}
            >
              {subheading}
            </p>
          )}

          {buttonText && (
            <div ref={ctaRef} style={{ opacity: 0 }}>
              <Link
                href={buttonLink}
                className="inline-block bg-white transition-all duration-200 hover:bg-[var(--iyc-taupe-500)] hover:text-white active:scale-[0.985] px-8 py-3.5 text-sm font-semibold transition-all hover:bg-white/90"
                style={{ borderRadius: "6px", color: "#05111F", fontFamily: "var(--font-display)" }}
              >
                {buttonText}
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  /* ─── Default / fallback hero (no admin data) ─────────────────────── */
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 md:px-12">
      <Image
        src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2940&auto=format&fit=crop"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#05111F]/60 via-[#05111F]/40 to-[#05111F]" />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <div className="mb-6 inline-block rounded-sm border border-white/15 px-4 py-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-white/60"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Luxury Yacht Charters
          </span>
        </div>

        <h1
          ref={headingRef}
          className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", opacity: 0 }}
        >
          {t("home.hero.title", "Discover the World by Sea")}
        </h1>

        <p
          ref={subheadingRef}
          className="mx-auto mb-10 max-w-xl text-lg text-white"
          style={{ fontFamily: "var(--font-body)", opacity: 0 }}
        >
          {t(
            "home.hero.subtitle",
            "Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers. Your voyage begins here."
          )}
        </p>

        <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ opacity: 0 }}>
          <Link
            href="#" onClick={(e) => { e.preventDefault(); openPlanner() }}
            className="bg-white px-8 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-[var(--iyc-taupe-500)] hover:text-white active:scale-[0.985]"
            style={{ borderRadius: "var(--iyc-radius-sm)", color: "var(--iyc-ionian-900)", fontFamily: "var(--font-display)" }}
          >
            {t("home.hero.cta.planning", "Start Planning")}
          </Link>
          <Link
            href="/fleet"
            className="border border-[var(--border-inverse)] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/35 hover:bg-white/10 active:scale-[0.985]"
            style={{ borderRadius: "var(--iyc-radius-sm)", fontFamily: "var(--font-display)" }}
          >
            {t("home.hero.cta.fleet", "Explore Fleet")}
          </Link>
        </div>
      </div>
    </section>
  )
}

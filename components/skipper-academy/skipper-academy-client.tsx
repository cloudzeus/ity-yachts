"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Anchor,
  Compass,
  Shield,
  Navigation,
  Wind,
  LifeBuoy,
  Users,
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
  Clock,
  Calendar,
  Award,
  MapPin,
  Mail,
  ArrowRight,
  Sailboat,
  BookOpen,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─── Types & Helpers ──────────────────────────────────────────────────────── */

type T = Record<string, string>

interface SkipperImages {
  heroImage: string | null
  heroMediaType: "image" | "video"
  ctaImage: string | null
  ctaMediaType: "image" | "video"
}

const FALLBACK_HERO = "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2940&auto=format&fit=crop"
const FALLBACK_CTA = "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2874&auto=format&fit=crop"

const ICON_MAP: Record<string, LucideIcon> = {
  Anchor, Compass, Shield, Navigation, Wind, LifeBuoy, Users, Clock, Calendar,
  Award, MapPin, Mail, Sailboat, BookOpen,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Compass
}

function t(val: T | undefined, locale: string): string {
  if (!val) return ""
  return val[locale] || val.en || ""
}

/* ─── Curriculum icon mapping ──────────────────────────────────────────────── */
const CURRICULUM_ICONS: LucideIcon[] = [Shield, Sailboat, Navigation, Anchor, LifeBuoy, Wind, Users, Compass]
const STAT_ICONS: LucideIcon[] = [Clock, Calendar, Anchor, Award]

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

interface Props {
  images: SkipperImages
  content: Record<string, unknown>
}

export function SkipperAcademyClient({ images, content }: Props) {
  const { locale } = useTranslations()

  const vp = (content.valueProposition || {}) as { headline?: T; subtext?: T; body?: T }
  const features = (content.features || []) as Array<{ icon: string; title: T; description: T }>
  const tp = (content.trainingProgram || {}) as { headline?: T; body?: T; curriculum?: T[]; audience?: T[] }
  const testimonials = (content.testimonials || []) as Array<{ name: string; location: T; content: T; rating: number }>
  const stats = (content.stats || []) as Array<{ value: T; label: T }>
  const cta = (content.cta || {}) as { headline?: T; body?: T; primaryButton?: T; primaryLink?: string; secondaryButton?: T; secondaryLink?: string }
  const blessing = (content.blessing || {}) as { quote?: T; subtitle?: T }

  return (
    <>
      <HeroSection src={images.heroImage || FALLBACK_HERO} mediaType={images.heroMediaType} />
      <ValueProposition locale={locale} data={vp} />
      <FeaturesGrid locale={locale} features={features} />
      <TrainingProgram locale={locale} data={tp} />
      <TestimonialsSection locale={locale} testimonials={testimonials} />
      <QuickFacts locale={locale} stats={stats} />
      <CtaSection src={images.ctaImage || FALLBACK_CTA} mediaType={images.ctaMediaType} locale={locale} data={cta} />
      <BlessingSection locale={locale} data={blessing} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ═══════════════════════════════════════════════════════════════════════════════ */

function HeroSection({ src, mediaType }: { src: string; mediaType: "image" | "video" }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    if (badgeRef.current) tl.fromTo(badgeRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 })
    if (headingRef.current) tl.fromTo(headingRef.current, { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" }, { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2 }, "-=0.4")
    if (subRef.current) tl.fromTo(subRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 }, "-=0.6")
    if (ctaRef.current) tl.fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.4")
  }, [])

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 md:px-12">
      <div className="absolute inset-0">
        {mediaType === "video" ? (
          <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="Sailing boats on turquoise Ionian Sea with Greek islands" fill className="object-cover object-center" priority />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#060c27]/70 via-[#060c27]/50 to-[#060c27]" />

      {/* Decorative compass */}
      <div className="pointer-events-none absolute right-8 bottom-32 z-0 opacity-[0.04] md:right-20">
        <svg width="300" height="300" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#ffffff" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="35" stroke="#ffffff" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="25" stroke="#ffffff" strokeWidth="0.3" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="#ffffff" strokeWidth="0.3" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#ffffff" strokeWidth="0.3" />
          <line x1="15" y1="15" x2="85" y2="85" stroke="#ffffff" strokeWidth="0.2" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="#ffffff" strokeWidth="0.2" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center">
        <div ref={badgeRef} className="mb-6 inline-flex items-center gap-2 rounded-sm border border-white/15 px-4 py-1.5" style={{ opacity: 0 }}>
          <Anchor className="h-3.5 w-3.5 text-[#84776e]" strokeWidth={1.5} />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/60" style={{ fontFamily: "var(--font-body)" }}>
            IYC Skipper Academy
          </span>
        </div>

        <h1 ref={headingRef} className="mb-6 text-4xl font-bold leading-[1.1] text-white md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", opacity: 0 }}>
          Master the Art of Sailing{" "}
          <span className="text-[#84776e]">in Greece&apos;s Most Beautiful Waters</span>
        </h1>

        <p ref={subRef} className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl" style={{ fontFamily: "var(--font-body)", opacity: 0 }}>
          Learn practical seamanship and gain confidence with experienced instructors in the idyllic Ionian Sea
        </p>

        <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ opacity: 0 }}>
          <Link href="#schedule" className="group inline-flex items-center gap-2 bg-white px-8 py-4 text-sm font-semibold transition-all duration-300 hover:bg-[#84776e] hover:text-white" style={{ borderRadius: "6px", color: "#060c27", fontFamily: "var(--font-display)" }}>
            Explore Training Dates
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="#program" className="inline-flex items-center gap-2 border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5" style={{ borderRadius: "6px", fontFamily: "var(--font-display)" }}>
            View Curriculum
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/20 pt-2">
          <div className="h-2 w-0.5 animate-bounce rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 2 — VALUE PROPOSITION
   ═══════════════════════════════════════════════════════════════════════════════ */

function ValueProposition({ locale, data }: { locale: string; data: { headline?: T; subtext?: T; body?: T } }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".vp-badge", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".vp-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".vp-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".vp-body", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".vp-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-28 md:py-36" style={{ background: "#060c27" }}>
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full" style={{ background: "#84776e", filter: "blur(200px)", opacity: 0.06 }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="vp-badge mb-4 flex items-center justify-center gap-2" style={{ opacity: 0 }}>
          <div className="h-px w-8" style={{ background: "#84776e" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>Why Choose Us</span>
          <div className="h-px w-8" style={{ background: "#84776e" }} />
        </div>

        <h2 className="vp-title mb-6 text-3xl font-bold text-white md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", opacity: 0 }}>
          {t(data.headline, locale) || "Why Choose IYC Skipper Academy?"}
        </h2>

        <p className="vp-sub mx-auto mb-8 text-lg font-medium md:text-xl" style={{ color: "#84776e", fontFamily: "var(--font-display)", opacity: 0 }}>
          {t(data.subtext, locale) || "Successful Skippering: Safety, Practice & Real Experience"}
        </p>

        <div className="vp-line mx-auto mb-10 h-px w-24 origin-center" style={{ background: "linear-gradient(90deg, transparent, #84776e, transparent)" }} />

        <p className="vp-body mx-auto max-w-3xl text-base leading-relaxed md:text-lg" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)", opacity: 0 }}>
          {t(data.body, locale) || "Participants receive both theoretical knowledge and hands-on practical experience to independently conduct sailing tours or refresh maritime skills."}
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 3 — FEATURES GRID
   ═══════════════════════════════════════════════════════════════════════════════ */

function FeaturesGrid({ locale, features }: { locale: string; features: Array<{ icon: string; title: T; description: T }> }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".feat-header", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".feat-card", { opacity: 0, y: 50, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".feat-grid", start: "top 85%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-28 md:py-36" style={{ background: "#070c26" }}>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]">
        <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="waves" x="0" y="0" width="200" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 Q 50 0, 100 20 Q 150 40, 200 20" fill="none" stroke="#84776e" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6">
        <div className="feat-header mb-16 text-center" style={{ opacity: 0 }}>
          <span className="mb-4 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>Key Benefits</span>
          <h2 className="text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            What Sets Us Apart
          </h2>
        </div>

        <div className="feat-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => {
            const Icon = getIcon(feat.icon)
            return (
              <div
                key={i}
                className="feat-card group relative rounded-2xl p-8 transition-all duration-500"
                style={{ opacity: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(132,119,110,0.15)", backdropFilter: "blur(8px)" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-6px)"; el.style.borderColor = "rgba(132,119,110,0.4)"; el.style.boxShadow = "0 20px 50px rgba(0,0,0,0.3)" }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.borderColor = "rgba(132,119,110,0.15)"; el.style.boxShadow = "none" }}
              >
                <div className="absolute top-0 left-0 right-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: "linear-gradient(90deg, #84776e, transparent)" }} />
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 group-hover:bg-[#84776e]/20" style={{ background: "rgba(132,119,110,0.1)" }}>
                  <Icon className="h-6 w-6 text-[#84776e]" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {t(feat.title, locale)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-body)" }}>
                  {t(feat.description, locale)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 4 — TRAINING PROGRAM
   ═══════════════════════════════════════════════════════════════════════════════ */

function TrainingProgram({ locale, data }: { locale: string; data: { headline?: T; body?: T; curriculum?: T[]; audience?: T[] } }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".tp-header", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".tp-body", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.15, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".tp-item", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".tp-grid", start: "top 85%" } })
      gsap.fromTo(".tp-audience", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".tp-audience-list", start: "top 85%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  const curriculum = data.curriculum || []
  const audience = data.audience || []

  return (
    <section id="program" ref={sectionRef} className="relative overflow-hidden py-28 md:py-36" style={{ background: "#060c27" }}>
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full" style={{ background: "#84776e", filter: "blur(180px)", opacity: 0.05, transform: "translate(40%, -40%)" }} />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6">
        <div className="tp-header mb-6" style={{ opacity: 0 }}>
          <span className="mb-4 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>The Program</span>
          <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {t(data.headline, locale) || "Comprehensive Skipper Training in the Ionian Sea"}
          </h2>
        </div>

        <p className="tp-body mb-16 max-w-3xl text-base leading-relaxed md:text-lg" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)", opacity: 0 }}>
          {t(data.body, locale) || "Our week-long training program combines classroom instruction with real-world sailing practice."}
        </p>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h3 className="mb-8 text-lg font-semibold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
              Key Topics Covered
            </h3>
            <div className="tp-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
              {curriculum.map((item, i) => {
                const Icon = CURRICULUM_ICONS[i % CURRICULUM_ICONS.length]
                return (
                  <div key={i} className="tp-item flex items-center gap-4 rounded-xl px-5 py-4 transition-colors duration-300 hover:bg-white/[0.04]" style={{ opacity: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(132,119,110,0.1)" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(132,119,110,0.12)" }}>
                      <Icon className="h-5 w-5 text-[#84776e]" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-white/80" style={{ fontFamily: "var(--font-body)" }}>
                      {t(item, locale)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-8 text-lg font-semibold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
              Who Should Attend
            </h3>
            <div className="tp-audience-list space-y-4">
              {audience.map((item, i) => (
                <div key={i} className="tp-audience flex items-start gap-4 rounded-xl px-5 py-5 transition-colors duration-300 hover:bg-white/[0.04]" style={{ opacity: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(132,119,110,0.1)" }}>
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(132,119,110,0.2)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#84776e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-base text-white/75" style={{ fontFamily: "var(--font-body)" }}>
                    {t(item, locale)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="#schedule" className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-300 hover:text-white" style={{ color: "#84776e", fontFamily: "var(--font-display)" }}>
                See Full Curriculum
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 5 — TESTIMONIALS
   ═══════════════════════════════════════════════════════════════════════════════ */

function TestimonialsSection({ locale, testimonials }: { locale: string; testimonials: Array<{ name: string; location: T; content: T; rating: number }> }) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trackRef.current) return
    gsap.to(trackRef.current, { x: -current * 100 + "%", duration: 0.6, ease: "power3.out" })
  }, [current])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".test-header", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: el, start: "top 80%" } })
      gsap.fromTo(".test-carousel", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.2, scrollTrigger: { trigger: el, start: "top 80%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  if (testimonials.length === 0) return null

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-28 md:py-36" style={{ background: "#070c26" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="test-header mb-16 flex flex-col md:flex-row md:items-end md:justify-between" style={{ opacity: 0 }}>
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#84776e" }}>Testimonials</span>
            <h2 className="text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              What Our Participants Say
            </h2>
          </div>
          <div className="mt-6 flex gap-3 md:mt-0">
            <button onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30" aria-label="Previous testimonial">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrent((p) => Math.min(testimonials.length - 1, p + 1))} disabled={current === testimonials.length - 1} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30" aria-label="Next testimonial">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="test-carousel overflow-hidden" style={{ opacity: 0 }}>
          <div ref={trackRef} className="flex will-change-transform" style={{ width: `${testimonials.length * 100}%` }}>
            {testimonials.map((item, i) => (
              <div key={i} className="px-2" style={{ width: `${100 / testimonials.length}%` }}>
                <div className="rounded-2xl p-8 md:p-12" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(132,119,110,0.15)" }}>
                  <Quote className="mb-6 h-10 w-10 text-[#84776e]/40" />
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-5 w-5 ${j < item.rating ? "fill-[#FFB703] text-[#FFB703]" : "text-white/20"}`} />
                    ))}
                  </div>
                  <p className="mb-8 text-lg leading-relaxed text-white/80 md:text-xl" style={{ fontFamily: "var(--font-body)" }}>
                    &ldquo;{t(item.content, locale)}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ background: "rgba(132,119,110,0.25)", fontFamily: "var(--font-display)" }}>
                      {item.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>{item.name}</div>
                      <div className="text-xs text-white/40">{t(item.location, locale)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 cursor-pointer rounded-full transition-all ${i === current ? "w-6 bg-[#84776e]" : "w-2 bg-white/20 hover:bg-white/40"}`} aria-label={`Go to testimonial ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 6 — QUICK FACTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function QuickFacts({ locale, stats }: { locale: string; stats: Array<{ value: T; label: T }> }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".stat-item", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, scrollTrigger: { trigger: el, start: "top 85%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-28" style={{ background: "#060c27" }}>
      <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, rgba(132,119,110,0.2), transparent)" }} />

      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((stat, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length]
            return (
              <div key={i} className="stat-item group flex flex-col items-center rounded-2xl px-6 py-10 text-center transition-all duration-300 hover:bg-white/[0.03]" style={{ opacity: 0, border: "1px solid rgba(132,119,110,0.1)" }}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 group-hover:bg-[#84776e]/20" style={{ background: "rgba(132,119,110,0.1)" }}>
                  <Icon className="h-6 w-6 text-[#84776e]" strokeWidth={1.5} />
                </div>
                <span className="mb-2 text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {t(stat.value, locale)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(132,119,110,0.8)" }}>
                  {t(stat.label, locale)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, rgba(132,119,110,0.2), transparent)" }} />
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 7 — DUAL CTA
   ═══════════════════════════════════════════════════════════════════════════════ */

function CtaSection({ src, mediaType, locale, data }: { src: string; mediaType: "image" | "video"; locale: string; data: { headline?: T; body?: T; primaryButton?: T; primaryLink?: string; secondaryButton?: T; secondaryLink?: string } }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".cta-content", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, scrollTrigger: { trigger: el, start: "top 80%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="schedule" ref={sectionRef} className="relative overflow-hidden py-28 md:py-36" style={{ background: "#070c26" }}>
      <div className="absolute inset-0">
        {mediaType === "video" ? (
          <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="Sailing in the Ionian Sea" fill className="object-cover" />
        )}
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,12,38,0.92) 0%, rgba(7,12,38,0.85) 50%, rgba(7,12,38,0.95) 100%)" }} />

      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "#84776e", filter: "blur(150px)", opacity: 0.08 }} />

      <div className="cta-content relative z-10 mx-auto max-w-3xl px-6 text-center" style={{ opacity: 0 }}>
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(132,119,110,0.12)", border: "1px solid rgba(132,119,110,0.2)" }}>
          <Compass className="h-10 w-10 text-[#84776e]" strokeWidth={1} />
        </div>

        <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          {t(data.headline, locale) || "Ready to Gain Confidence at the Helm?"}
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/60" style={{ fontFamily: "var(--font-body)" }}>
          {t(data.body, locale) || "Join our next training program in the Ionian Islands. Limited spots available for 2026."}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={data.primaryLink || "/contact"} className="group inline-flex items-center gap-2 bg-white px-8 py-4 text-sm font-semibold transition-all duration-300 hover:bg-[#84776e] hover:text-white" style={{ borderRadius: "6px", color: "#060c27", fontFamily: "var(--font-display)" }}>
            {t(data.primaryButton, locale) || "View 2026 Training Dates"}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href={data.secondaryLink || "/contact"} className="inline-flex items-center gap-2 border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5" style={{ borderRadius: "6px", fontFamily: "var(--font-display)" }}>
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            {t(data.secondaryButton, locale) || "Get in Touch"}
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 8 — MARITIME BLESSING
   ═══════════════════════════════════════════════════════════════════════════════ */

function BlessingSection({ locale, data }: { locale: string; data: { quote?: T; subtitle?: T } }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".blessing-content", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: el, start: "top 90%" } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-28" style={{ background: "#060c27" }}>
      <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, rgba(132,119,110,0.15), transparent)" }} />

      <div className="blessing-content mx-auto max-w-[1200px] px-6 text-center" style={{ opacity: 0 }}>
        <div className="mx-auto mb-4 h-px w-16" style={{ background: "#84776e" }} />
        <p className="text-xl font-light italic text-white/70 md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          &ldquo;{t(data.quote, locale) || "Mast und Schotbruch!"}&rdquo;
        </p>
        <p className="mt-2 text-sm text-white/40" style={{ fontFamily: "var(--font-body)" }}>
          {t(data.subtitle, locale) || "Wishing you prosperous winds and safe passages"}
        </p>
      </div>
    </section>
  )
}

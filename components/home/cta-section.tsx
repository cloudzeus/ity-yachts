"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function CTASection() {
  const { t } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !bgRef.current) return

    // Parallax background
    gsap.to(bgRef.current, {
      yPercent: -15,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    })

    // Content reveal
    const content = sectionRef.current.querySelector("[data-cta-content]")
    if (content) {
      gsap.fromTo(
        content,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === sectionRef.current) t.kill()
      })
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 h-[130%] -top-[15%] bg-cover bg-center will-change-transform"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2940&auto=format&fit=crop')",
        }}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,10,30,0.6), rgba(0,10,30,0.75))",
        }}
      />

      {/* Content */}
      <div
        data-cta-content
        className="relative z-10 text-center px-6 max-w-3xl"
        style={{ opacity: 0 }}
      >
        <h2
          className="text-4xl md:text-6xl font-bold text-white mb-6"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {t("home.cta.title", "Your Voyage Starts Here")}
        </h2>
        <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
          {t("home.cta.description", "Let our charter specialists craft the perfect sailing experience tailored to your desires. Contact us today to begin planning.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/enquiry"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white rounded-md transition-all hover:brightness-110"
            style={{
              background: "var(--gradient-ocean)",
              fontFamily: "var(--font-display)",
            }}
          >
            {t("home.cta.planCharter", "Plan My Charter")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/fleet"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white rounded-md border border-white/20 transition-all hover:bg-white/10 hover:border-white/40"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("home.cta.exploreFleet", "Explore Fleet")}
          </Link>
        </div>
      </div>
    </section>
  )
}

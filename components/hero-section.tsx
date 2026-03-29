"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"

export function HeroSection() {
  const { t } = useTranslations()

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 md:px-12">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2940&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060c27]/60 via-[#060c27]/40 to-[#060c27]" />

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
          className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          {t("home.hero.title", "Discover the World by Sea")}
        </h1>

        <p
          className="mx-auto mb-10 max-w-xl text-lg text-white/60"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("home.hero.subtitle", "Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers. Your voyage begins here.")}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/start-planning"
            className="bg-white px-8 py-3.5 text-sm font-semibold transition-all hover:bg-white/90"
            style={{
              borderRadius: "6px",
              color: "#060c27",
              fontFamily: "var(--font-display)",
            }}
          >
            {t("home.hero.cta.planning", "Start Planning")}
          </Link>
          <Link
            href="/fleet"
            className="border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
            style={{ borderRadius: "6px", fontFamily: "var(--font-display)" }}
          >
            {t("home.hero.cta.fleet", "Explore Fleet")}
          </Link>
        </div>
      </div>
    </section>
  )
}

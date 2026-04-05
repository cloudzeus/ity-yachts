"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import gsap from "gsap"
import { useTranslations } from "@/lib/use-translations"

type Locale = "en" | "el" | "de"

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "el", label: "EL" },
  { code: "de", label: "DE" },
]

/* ── single pill button with text-slide effect ── */
function LangButton({
  lang,
  active,
  onClick,
}: {
  lang: (typeof LANGUAGES)[number]
  active: boolean
  onClick: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const topRef = useRef<HTMLSpanElement>(null)
  const bottomRef = useRef<HTMLSpanElement>(null)

  const animateIn = useCallback(() => {
    if (active) return
    const tl = gsap.timeline({ defaults: { duration: 0.35, ease: "power3.inOut" } })
    tl.to(topRef.current, { y: "-100%", opacity: 0 }, 0)
    tl.fromTo(bottomRef.current, { y: "100%", opacity: 0 }, { y: "0%", opacity: 1 }, 0)
  }, [active])

  const animateOut = useCallback(() => {
    if (active) return
    const tl = gsap.timeline({ defaults: { duration: 0.3, ease: "power3.inOut" } })
    tl.to(topRef.current, { y: "0%", opacity: 1 }, 0)
    tl.to(bottomRef.current, { y: "100%", opacity: 0 }, 0)
  }, [active])

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseEnter={animateIn}
      onMouseLeave={animateOut}
      className="relative h-7 w-7 overflow-hidden"
      style={{ perspective: "200px" }}
    >
      {/* top label (default visible) */}
      <span
        ref={topRef}
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tracking-wider transition-none"
        style={{
          color: active ? "#fff" : "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-display)",
        }}
      >
        {lang.label}
      </span>
      {/* bottom label (slides in on hover) */}
      <span
        ref={bottomRef}
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tracking-wider transition-none"
        style={{
          color: "var(--tertiary-fixed-dim)",
          fontFamily: "var(--font-display)",
          transform: "translateY(100%)",
          opacity: 0,
        }}
      >
        {lang.label}
      </span>
    </button>
  )
}

/* ── main switcher ── */
export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  /* animate the sliding background pill behind the active item */
  useEffect(() => {
    if (!mounted || !containerRef.current || !sliderRef.current) return
    const idx = LANGUAGES.findIndex((l) => l.code === locale)
    const buttons = containerRef.current.querySelectorAll("button")
    const btn = buttons[idx]
    if (!btn) return

    gsap.to(sliderRef.current, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: 0.4,
      ease: "power3.out",
    })

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        x: btn.offsetLeft,
        width: btn.offsetWidth,
        duration: 0.4,
        ease: "power3.out",
      })
    }
  }, [locale, mounted])

  if (!mounted) return null

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-0.5 rounded-full px-[3px] py-[3px]"
      style={{
        background: "rgba(0, 33, 71, 0.5)",
        border: "1px solid rgba(0, 99, 153, 0.25)",
      }}
    >
      {/* ocean gradient glow behind active pill */}
      <div
        ref={glowRef}
        className="absolute top-[3px] h-7 rounded-full"
        style={{
          background: "rgba(0, 99, 153, 0.15)",
          filter: "blur(6px)",
        }}
      />
      {/* sliding active pill */}
      <div
        ref={sliderRef}
        className="absolute top-[3px] h-7 rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--secondary), var(--primary-container))",
          boxShadow: "0 0 8px rgba(0, 99, 153, 0.4)",
        }}
      />

      {LANGUAGES.map((lang) => (
        <LangButton
          key={lang.code}
          lang={lang}
          active={locale === lang.code}
          onClick={() => setLocale(lang.code)}
        />
      ))}
    </div>
  )
}

"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { Search, X, ArrowRight } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { t } = useTranslations()

  const quickLinks = [
    { label: t("search.link.motorYachts", "Motor Yachts"), href: "/fleet?type=motor" },
    { label: t("search.link.sailingYachts", "Sailing Yachts"), href: "/fleet?type=sailing" },
    { label: t("search.link.mediterranean", "Mediterranean"), href: "/destinations/mediterranean" },
    { label: t("search.link.caribbean", "Caribbean"), href: "/destinations/caribbean" },
    { label: t("search.link.catamarans", "Catamarans"), href: "/experiences/day-charter" },
    { label: t("search.link.luxury", "Luxury Charters"), href: "/experiences/weekly-charter" },
  ]
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const timeline = useRef<gsap.core.Timeline | null>(null)

  const animateOpen = useCallback(() => {
    const overlay = overlayRef.current
    const content = contentRef.current
    const input = inputRef.current
    const links = linksRef.current
    if (!overlay || !content || !input || !links) return

    overlay.style.display = "flex"
    document.body.style.overflow = "hidden"

    const tl = gsap.timeline()
    timeline.current = tl

    tl.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    )
      .fromTo(
        content,
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" },
        "-=0.15"
      )
      .fromTo(
        input,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        links.children,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: "power2.out",
        },
        "-=0.15"
      )

    setTimeout(() => input.focus(), 350)
  }, [])

  const animateClose = useCallback(() => {
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!overlay || !content) return

    const tl = gsap.timeline({
      onComplete: () => {
        overlay.style.display = "none"
        document.body.style.overflow = ""
        setQuery("")
      },
    })

    tl.to(content, {
      opacity: 0,
      y: -30,
      scale: 0.97,
      duration: 0.3,
      ease: "power2.in",
    }).to(overlay, { opacity: 0, duration: 0.2, ease: "power2.in" }, "-=0.15")
  }, [])

  useEffect(() => {
    if (open) {
      animateOpen()
    } else if (overlayRef.current?.style.display === "flex") {
      animateClose()
    }
  }, [open, animateOpen, animateClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (open) onClose()
        else onClose() // parent toggles
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-start"
      style={{ backgroundColor: "rgba(6, 12, 39, 0.97)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-sm text-white/60 transition-colors hover:text-white"
        aria-label="Close search"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Content */}
      <div
        ref={contentRef}
        className="mt-[15vh] w-full max-w-2xl px-6"
      >
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder", "Search destinations, yachts, experiences...")}
            className="w-full border-b border-white/20 bg-transparent pb-4 pl-10 text-2xl font-light text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
            style={{ fontFamily: "var(--font-display)" }}
          />
        </div>

        {/* Quick links */}
        <div className="mt-10">
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("search.quickLinks", "Quick Links")}
          </p>
          <div ref={linksRef} className="grid gap-1 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="group flex items-center justify-between rounded-sm px-4 py-3 text-white/70 transition-all hover:bg-white/5 hover:text-white"
              >
                <span
                  className="text-base font-medium"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {link.label}
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="mt-10 text-center text-sm text-white/25">
          Press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-xs text-white/40">ESC</kbd> to close
        </p>
      </div>
    </div>
  )
}

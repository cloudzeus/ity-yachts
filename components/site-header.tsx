"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { Menu, X, User, Anchor } from "lucide-react"
import { SearchModal } from "@/components/search-modal"
import { useTranslations } from "@/lib/use-translations"

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslations()

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const onScroll = () => {
      const isScrolled = window.scrollY > 50
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
        gsap.to(header, {
          backgroundColor: isScrolled ? "rgba(6, 12, 39, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          duration: 0.4,
          ease: "power2.out",
        })
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [scrolled])

  useEffect(() => {
    const menu = mobileMenuRef.current
    const items = menuItemsRef.current
    if (!menu || !items) return

    if (mobileOpen) {
      gsap.set(menu, { display: "flex" })
      gsap.fromTo(
        menu,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
      )
      gsap.fromTo(
        items.children,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.1,
        }
      )
    } else {
      gsap.to(menu, {
        opacity: 0,
        y: -20,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => { gsap.set(menu, { display: "none" }) },
      })
    }
  }, [mobileOpen])

  const navLinks = [
    { label: t("header.nav.destinations", "Destinations"), href: "/destinations" },
    { label: t("header.nav.fleet", "Fleet"), href: "/fleet" },
    { label: t("header.nav.experiences", "Experiences"), href: "/experiences" },
    { label: t("header.nav.about", "About"), href: "/about" },
    { label: t("header.nav.contact", "Contact"), href: "/contact" },
  ]

  return (
    <>
      <style jsx global>{`
        .btn-plan {
          background: #fff;
          color: #060c27;
          transition: background 0.25s ease, color 0.25s ease;
        }
        .btn-plan:hover {
          background: #84776e !important;
          color: #fff !important;
        }
      `}</style>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-shadow"
        style={{ backgroundColor: "transparent" }}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-12">
          {/* Logo */}
          <Link href="/" className="relative z-10 shrink-0">
            <Image
              src="https://iycweb.b-cdn.net/IYC_LOGO_TRANS_white.svg"
              alt="IYC Yachts"
              width={100}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/start-planning"
              className="btn-plan hidden items-center gap-1.5 px-3 py-1.5 text-xs font-semibold sm:inline-flex"
              style={{
                borderRadius: "6px",
                fontFamily: "var(--font-display)",
              }}
            >
              <Anchor className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("header.startPlanning", "Start Planning")}
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:text-white"
              aria-label="Open search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <Link
              href="/login"
              className="flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:text-white"
              aria-label="Customer login"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          ref={mobileMenuRef}
          className="hidden flex-col bg-[#060c27] px-6 pb-8 pt-4 lg:hidden"
          style={{ display: "none" }}
        >
          <div ref={menuItemsRef} className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-4 py-3 text-base font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/start-planning"
              onClick={() => setMobileOpen(false)}
              className="btn-plan mt-4 px-5 py-3 text-center text-sm font-semibold"
              style={{
                borderRadius: "6px",
                fontFamily: "var(--font-display)",
              }}
            >
              {t("header.startPlanning", "Start Planning")}
            </Link>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

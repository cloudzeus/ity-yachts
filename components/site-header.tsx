"use client"

import { useEffect, useRef, useState } from "react"
import Link from "@/components/locale-link"
import Image from "next/image"
import gsap from "gsap"
import { Menu, X, Anchor } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from "@/lib/use-translations"
import { useNavigation } from "@/lib/use-navigation"
import { openPlanner } from "@/components/plan/plan-launcher"

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useTranslations()
  const { items: navItems } = useNavigation()

  const navLinks = navItems
    .filter((item) => !item.isHomePage)
    .map((item) => ({
      label: item.translations?.[locale] || item.translations?.en || item.label,
      href: item.href,
    }))

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const onScroll = () => {
      const isScrolled = window.scrollY > 50
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
        gsap.to(header, {
          backgroundColor: isScrolled ? "rgba(4,13,25,0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          duration: 0.4,
          ease: "power2.out",
        })
        if (logoRef.current) {
          gsap.to(logoRef.current, {
            height: isScrolled ? 36 : 56,
            duration: 0.4,
            ease: "power2.out",
          })
        }
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

  return (
    <>
      <style jsx global>{`
        /* The header CTA is the accent button in the system: sunset amber
           with DARK text (white on #E2963C is 2.42:1 and fails AA). */
        .btn-plan {
          background: var(--action-accent);
          color: var(--text-on-accent);
          transition: background var(--dur-fast) var(--ease-out);
        }
        .btn-plan:hover {
          background: var(--action-accent-hover) !important;
        }
        .btn-plan:active {
          transform: scale(var(--press-scale));
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
              ref={logoRef}
              src="/brand/iyc-logo-white.svg"
              alt="IYC Yachts"
              width={140}
              height={56}
              className="w-auto"
              style={{ height: 56 }}
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
            {/* Opens the docked planner rather than navigating: the visitor
                keeps the page they were reading. */}
            <button
              type="button"
              onClick={openPlanner}
              className="btn-plan hidden items-center gap-1.5 px-3 py-1.5 text-xs font-semibold sm:inline-flex"
              style={{
                borderRadius: "6px",
                fontFamily: "var(--font-display)",
              }}
            >
              <Anchor className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("header.startPlanning", "Start Planning")}
            </button>

            <div className="mx-2">
              <LanguageSwitcher />
            </div>


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
          className="hidden flex-col bg-[var(--surface-inverse)] px-6 pb-8 pt-4 lg:hidden"
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
            <button
              type="button"
              onClick={() => { setMobileOpen(false); openPlanner() }}
              className="btn-plan mt-4 px-5 py-3 text-center text-sm font-semibold"
              style={{
                borderRadius: "6px",
                fontFamily: "var(--font-display)",
              }}
            >
              {t("header.startPlanning", "Start Planning")}
            </button>
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Safety net for scroll-driven reveals.
 *
 * Large parts of this site render with an inline `opacity: 0` and rely on a
 * GSAP ScrollTrigger to fade them in. That is a blank-page waiting to happen:
 * one stale trigger, one animation that never gets created, one reduced-motion
 * early-return, and the section stays invisible forever with no way back.
 *
 * This walks the page after it settles and un-hides anything still at zero.
 * Under `prefers-reduced-motion` it runs immediately, because in that mode the
 * animations that were supposed to reveal the content never run at all.
 */
export function RevealFailsafe() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith("/admin")) return

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
        const inline = el.style.opacity
        if (inline !== "" && parseFloat(inline) < 0.05) {
          // Leave genuinely interactive overlays alone — they hide on purpose.
          if (el.closest("[data-radix-popper-content-wrapper], [role='dialog']")) return
          el.style.opacity = ""
          if (el.style.transform?.includes("translate")) el.style.transform = ""
        }
      })
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) {
      // Nothing is going to animate these in — show them now.
      const t = window.setTimeout(revealAll, 60)
      return () => clearTimeout(t)
    }

    // Otherwise give the reveals a fair chance, then rescue whatever is left.
    const t = window.setTimeout(revealAll, 3000)
    return () => clearTimeout(t)
  }, [pathname])

  return null
}

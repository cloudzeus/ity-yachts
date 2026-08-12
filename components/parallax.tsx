"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Drives every `[data-parallax]` element on the page.
 *
 * `data-parallax` is the travel distance as a fraction of the element's own
 * height — 0.4 means it moves 40% of its height across the section's scroll.
 * Anything under ~0.15 is imperceptible, so that is the floor.
 *
 *   data-parallax        travel, 0.15–0.6 (default 0.3)
 *   data-parallax-scale  end scale, e.g. 1.2
 *   data-parallax-rotate degrees of rotation across the range
 *   data-parallax-x      horizontal travel as a fraction of width
 *
 * Elements that fill a fixed frame must be oversized (see `.iyc-parallax-media`
 * in globals.css) or the drift exposes an edge.
 */
export function Parallax() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith("/admin")) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) return

    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>("[data-parallax]")
      for (const el of nodes) {
        // Floor at 0.15 — below that nobody sees it and it is just cost.
        const travel = Math.max(0.15, parseFloat(el.dataset.parallax || "0.3"))
        const xTravel = parseFloat(el.dataset.parallaxX || "0")
        const scaleTo = parseFloat(el.dataset.parallaxScale || "")
        const rotate = parseFloat(el.dataset.parallaxRotate || "0")
        const trigger = el.closest("section") || el.parentElement || el

        gsap.fromTo(
          el,
          {
            yPercent: travel * 50,
            xPercent: xTravel * 50,
            rotation: -rotate,
            ...(scaleTo ? { scale: 1 } : null),
          },
          {
            yPercent: -travel * 50,
            xPercent: -xTravel * 50,
            rotation: rotate,
            ...(scaleTo ? { scale: scaleTo } : null),
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          }
        )
      }

      // Full-bleed hero media: settles from a wide crop as you scroll away,
      // while the copy over it drifts up faster than the page.
      gsap.utils.toArray<HTMLElement>("[data-hero-media]").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.18, yPercent: -6 },
          {
            scale: 1,
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("section") || el.parentElement || el,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          }
        )
      })

      gsap.utils.toArray<HTMLElement>("[data-hero-copy]").forEach((el) => {
        gsap.to(el, {
          yPercent: -38,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") || el.parentElement || el,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        })
      })
    })

    const refresh = () => ScrollTrigger.refresh()
    const t = window.setTimeout(refresh, 400)

    return () => {
      clearTimeout(t)
      ctx.revert()
    }
  }, [pathname])

  return null
}

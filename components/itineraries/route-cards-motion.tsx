"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Motion for the route cards: a parallax offset per card, and a skew driven by
 * how fast the page is moving.
 *
 * It attaches by selector to markup rendered on the server, so the cards stay
 * a server component and only the behaviour ships to the client.
 *
 * Velocity is read from the scroll position frame to frame rather than from
 * Lenis directly — Lenis is registered in a module that only exposes
 * stop/start, and reading the position works the same whether smooth scrolling
 * is on, off, or disabled by the OS setting.
 */
export function RouteCardsMotion() {
  useEffect(() => {
    // Everything below is decoration. Under reduced motion the cards simply
    // sit where the layout puts them.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const cards = gsap.utils.toArray<HTMLElement>("[data-route-card]")
    if (!cards.length) return

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        // Alternate depth so the pair drifts apart slightly as it crosses the
        // viewport. Same distance both ways, opposite sign.
        const drift = i % 2 === 0 ? -46 : 46

        gsap.fromTo(
          card,
          { y: -drift },
          {
            y: drift,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
            },
          }
        )

        // Entrance, once. Separate from the parallax so the scrub does not
        // fight the reveal.
        gsap.fromTo(
          card.querySelector("[data-route-card-inner]"),
          { opacity: 0, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            delay: i * 0.08,
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          }
        )
      })

      // ── Velocity skew ────────────────────────────────────────────────
      // Fast scrolling leans the cards a degree or so and lets them settle.
      // Capped hard: past about 2° this stops reading as momentum and starts
      // reading as a rendering fault.
      let last = window.scrollY
      let skew = 0
      const setSkew = gsap.quickSetter(cards, "skewY", "deg")
      const setScale = gsap.quickSetter(cards, "scaleY")

      const tick = () => {
        const now = window.scrollY
        const raw = (now - last) * 0.06
        last = now
        const target = gsap.utils.clamp(-2, 2, raw)
        // Ease toward the target, and always decay toward zero, so the lean
        // disappears the moment scrolling stops rather than sticking.
        skew += (target - skew) * 0.12
        if (Math.abs(skew) < 0.01) skew = 0
        setSkew(skew)
        setScale(1 - Math.abs(skew) * 0.006)
      }

      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        setSkew(0)
        setScale(1)
      }
    })

    return () => ctx.revert()
  }, [])

  return null
}

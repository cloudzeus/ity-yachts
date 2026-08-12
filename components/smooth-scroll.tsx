"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { registerLenis, unregisterLenis } from "@/lib/scroll-lock"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function SmoothScroll() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  useEffect(() => {
    if (isAdmin) return

    // Smooth scrolling is motion. Honour the OS setting and leave the browser's
    // native scrolling alone for anyone who asked for stillness.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Driven by the GSAP ticker below, not its own loop.
      autoRaf: false,
    })

    registerLenis(lenis)

    // One clock, not two. Previously Lenis ran its own requestAnimationFrame
    // while GSAP ran another, so ScrollTrigger read positions from a frame
    // Lenis had already moved past — which is what made pinned and scrubbed
    // sections judder.
    lenis.on("scroll", ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    // GSAP's lag smoothing fakes elapsed time after a slow frame, which makes
    // a scrub jump. With an external scroller it must be off.
    gsap.ticker.lagSmoothing(0)

    // ScrollTrigger measures on creation, before webfonts swap in and before
    // images below the fold have height. Re-measure once things settle, or
    // every trigger below the first screen is anchored to a stale offset.
    const refresh = () => ScrollTrigger.refresh()
    const settleTimers = [
      window.setTimeout(refresh, 300),
      window.setTimeout(refresh, 1200),
    ]
    window.addEventListener("load", refresh)
    document.fonts?.ready.then(refresh).catch(() => {})

    // Late-loading media changes document height; re-measure when it does.
    //
    // This has to be debounced and height-gated. Refreshing recalculates every
    // trigger on the page, and the scrubbed parallax moves elements around —
    // so an unguarded observer feeds itself: parallax shifts layout, the
    // observer fires, the refresh re-measures and re-applies the scrub, which
    // shifts layout again. That loop is what made scrolling seize up.
    let lastHeight = document.body.scrollHeight
    let roTimer: number | null = null
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight
      if (Math.abs(h - lastHeight) < 4) return // ignore sub-pixel / width-only churn
      lastHeight = h
      if (roTimer !== null) clearTimeout(roTimer)
      roTimer = window.setTimeout(() => {
        roTimer = null
        lastHeight = document.body.scrollHeight
        lenis.resize()
        ScrollTrigger.refresh()
      }, 250)
    })
    ro.observe(document.body)

    // Let in-page anchors ride the smooth scroller instead of jumping.
    const onAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null
      if (!target) return
      const id = target.getAttribute("href")
      if (!id || id === "#") return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el as HTMLElement, { offset: -80 })
    }
    document.addEventListener("click", onAnchorClick)

    return () => {
      settleTimers.forEach(clearTimeout)
      if (roTimer !== null) clearTimeout(roTimer)
      window.removeEventListener("load", refresh)
      document.removeEventListener("click", onAnchorClick)
      ro.disconnect()
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      unregisterLenis()
      lenis.off("scroll", ScrollTrigger.update)
      lenis.destroy()
    }
  }, [isAdmin])

  return null
}

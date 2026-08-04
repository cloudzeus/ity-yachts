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

    // autoRaf: true — Lenis drives its own requestAnimationFrame loop.
    // This is more reliable than the gsap.ticker approach which can get
    // stuck when the browser throttles the tab or has rendering lag.
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: true,
    })

    // Register globally so modals can stop/start it via lockScroll/unlockScroll
    registerLenis(lenis)

    // Keep GSAP ScrollTrigger in sync with Lenis scroll position
    lenis.on("scroll", ScrollTrigger.update)

    return () => {
      unregisterLenis()
      lenis.off("scroll", ScrollTrigger.update)
      lenis.destroy()
    }
  }, [isAdmin])

  return null
}

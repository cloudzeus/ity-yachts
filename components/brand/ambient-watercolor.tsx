"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * The brand's ambient background language: catalogue engravings that enlarge
 * and fade up as their section scrolls through the viewport.
 *
 * Each piece enters small and fully transparent, grows to full size at its
 * target opacity, then keeps drifting. Decorative only — `pointer-events:
 * none`, `aria-hidden`, and always behind a z-indexed content layer. Give the
 * parent `position: relative` and put content in a `relative z-10` wrapper.
 */

export type AmbientPiece = {
  /** File in /public/brand/engravings or /public/brand/watercolor */
  src: string
  /** CSS inset values, e.g. { top: "8%", left: "-4%" } */
  position: React.CSSProperties
  width: number
  /** Opacity once fully scrolled in. 0–1. */
  opacity?: number
  /** Parallax factor, 0.05–0.12. */
  speed?: number
  /** Float loop duration in seconds, 7–15s. */
  drift?: number
  /** How much smaller it starts, as a fraction. 0.35 = enters at 65% size. */
  grow?: number
}

export function AmbientWatercolor({
  pieces,
  className = "",
}: {
  pieces: AmbientPiece[]
  className?: string
}) {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    // Respect the OS setting — show the pieces at rest, don't animate them.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) {
      layer.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
        el.style.opacity = el.dataset.opacity || "0.5"
      })
      return
    }

    const section = layer.closest("section") || layer.parentElement || layer

    const ctx = gsap.context(() => {
      layer.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
        const target = parseFloat(el.dataset.opacity || "0.5")
        const speed = parseFloat(el.dataset.speed || "0.08")
        const grow = parseFloat(el.dataset.grow || "0.35")
        const travel = speed * 900

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          })
          // enters small and invisible, magnifies up to its resting opacity…
          .fromTo(
            el,
            { y: travel / 2, scale: 1 - grow, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: target, duration: 0.55, ease: "none" }
          )
          // …then keeps growing gently and drifts back out of sight
          .to(
            el,
            {
              y: -travel / 2,
              scale: 1 + grow / 2,
              autoAlpha: target * 0.45,
              duration: 0.45,
              ease: "none",
            }
          )
      })
    }, layer)

    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => {
      clearTimeout(t)
      ctx.revert()
    }
  }, [pieces])

  return (
    <div ref={layerRef} className={`iyc-ambient ${className}`} aria-hidden="true">
      {pieces.map((piece, i) => (
        <div
          key={`${piece.src}-${i}`}
          data-piece=""
          data-opacity={piece.opacity ?? 0.5}
          data-speed={piece.speed ?? 0.08}
          data-grow={piece.grow ?? 0.35}
          style={{ ...piece.position, opacity: 0, willChange: "transform, opacity" }}
        >
          <div
            className="iyc-drift"
            style={{ animationDuration: `${piece.drift ?? 11}s` }}
          >
            <Image
              src={piece.src}
              alt=""
              width={piece.width}
              height={piece.width}
              className="h-auto w-full select-none"
              style={{ width: piece.width }}
              unoptimized
              priority={false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

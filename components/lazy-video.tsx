"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A background video that costs nothing until it is on screen.
 *
 * `autoPlay` makes a browser fetch the whole file the moment the element
 * exists, whatever `preload` says. On the homepage that meant two location
 * cards — one 33 MB, one 17 MB — downloading in full before a visitor had
 * scrolled anywhere near them.
 *
 * So the `<video>` is not rendered at all until it comes into view. Until
 * then the element is a poster, or the page's own sunken colour.
 */
export function LazyVideo({
  src,
  poster,
  className,
  style,
  /** How far ahead of the viewport to start loading. */
  rootMargin = "200px",
}: {
  src: string
  poster?: string | null
  className?: string
  style?: React.CSSProperties
  rootMargin?: string
}) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = holderRef.current
    if (!el) return

    // No observer (or reduced motion): keep the poster and never fetch.
    if (typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            // Once loaded it stays; re-observing would restart the download.
            io.disconnect()
          }
        }
      },
      { rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={holderRef} className={className} style={style}>
      {inView ? (
        <video
          src={src}
          poster={poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--surface-sunken)" }} />
      )}
    </div>
  )
}

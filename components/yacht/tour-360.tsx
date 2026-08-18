"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
/* Photo Sphere Viewer draws its own navbar and loader; without this the
   controls render as unstyled text over the panorama. */
import "@photo-sphere-viewer/core/index.css"
import { X } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import {
  asTour360,
  faceUrls,
  sceneTitle,
  tileUrl,
  type Tour360,
  type Tour360Scene,
} from "@/lib/tour360"

/**
 * The 360° walkthrough, in our own page instead of someone else's.
 *
 * The tours came out of Panotour, which shipped a krpano player in an iframe
 * on a separate domain. Photo Sphere Viewer reads the same cube tiles, so the
 * photography is untouched and everything around it — the room names, the
 * language, the styling, the fact that it is inside the yacht page rather than
 * a link away — is ours.
 *
 * Loaded on demand. Photo Sphere Viewer pulls in three.js, which is far too
 * much to put in the bundle of a page most visitors will read without ever
 * opening the tour, and it touches `window` at import time so it cannot be
 * server-rendered at all. The import happens when the viewer opens.
 */
export function Tour360Viewer({
  tour: raw,
  yachtName,
}: {
  tour: unknown
  yachtName: string
}) {
  const { t, locale } = useTranslations()
  const tour = asTour360(raw)
  const [open, setOpen] = useState(false)

  if (!tour) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-end gap-2 group/tour"
        aria-label={t("yacht.tour360", "360° tour")}
      >
        <span className="text-white text-sm font-bold tracking-wide drop-shadow">
          {t("yacht.tour360", "360° tour")}
        </span>
        <span className="relative w-28 h-20 rounded-xl overflow-hidden border-2 border-white/80 shadow-lg transition-all duration-500 ease-out group-hover/tour:scale-105 group-hover/tour:border-white">
          {/* The scene's own thumbnail, so the tile shows the room it opens. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${tileBase(tour)}/${tour.scenes[0].folder}/thumbnail.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white text-xs font-bold tracking-widest">
            360°
          </span>
        </span>
      </button>

      {open && <Portal><Stage
            tour={tour}
            yachtName={yachtName}
            locale={locale}
            failedText={t("yacht.tour360.failed", "The tour could not be loaded.")}
            onClose={() => setOpen(false)}
          /></Portal>}
    </>
  )
}

/**
 * Take the viewer out to the body.
 *
 * The tile that opens it lives in the hero, and the hero is a positioned
 * section — so a dialog rendered where the button is inherits that stacking
 * context and cannot climb out of it. z-index 200 lost to a header at 50 and
 * the site navigation drew straight across the panorama.
 */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? createPortal(children, document.body) : null
}

function tileBase(tour: Tour360) {
  // Mirrors TOUR360_BASE, but the thumbnail is the only URL built outside lib.
  const base =
    process.env.NEXT_PUBLIC_TOUR360_BASE?.replace(/\/+$/, "") ||
    "https://www.iyc.de/dl/360_degrees"
  return `${base}/${tour.base}`
}

function Stage({
  tour,
  yachtName,
  locale,
  failedText,
  onClose,
}: {
  tour: Tour360
  yachtName: string
  locale: string
  failedText: string
  onClose: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<{ destroy: () => void; setPanorama: (p: unknown, o?: unknown) => Promise<unknown> } | null>(null)
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  /** What Photo Sphere Viewer needs to draw one scene. */
  const panorama = useCallback(
    (scene: Tour360Scene) => {
      const psv = scene.psv!
      return {
        faceSize: psv.size,
        nbTiles: psv.grid,
        // Six whole 1024px faces, so the sphere is filled before any tile lands.
        baseUrl: faceUrls(tour, scene.folder),
        tileUrl: (face: string, col: number, row: number) =>
          tileUrl(tour, scene, face, col, row),
      }
    },
    [tour]
  )

  useEffect(() => {
    let cancelled = false
    const node = host.current
    if (!node) return

    ;(async () => {
      try {
        const [{ Viewer }, { CubemapTilesAdapter }] = await Promise.all([
          import("@photo-sphere-viewer/core"),
          import("@photo-sphere-viewer/cubemap-tiles-adapter"),
        ])
        if (cancelled) return
        const v = new Viewer({
          container: node,
          adapter: [CubemapTilesAdapter, { showErrorTile: false, baseBlur: true }],
          panorama: panorama(tour.scenes[0]),
          navbar: ["zoom", "move", "fullscreen"],
          loadingTxt: "",
          defaultZoomLvl: 30,
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: false,
        })
        viewer.current = v as unknown as typeof viewer.current
        setReady(true)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()

    return () => {
      cancelled = true
      viewer.current?.destroy()
      viewer.current = null
    }
    // Built once; scenes are swapped through setPanorama below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const go = (i: number) => {
    if (i === index || !viewer.current) return
    setIndex(i)
    viewer.current.setPanorama(panorama(tour.scenes[i]), { showLoader: false })
  }

  const current = tour.scenes[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${yachtName} — 360°`}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#040d19" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <p className="text-white text-sm font-semibold truncate">
          {yachtName}
          <span className="text-white/50 font-normal"> · {sceneTitle(current, locale as never)}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div ref={host} className="absolute inset-0" />
        {!ready && !failed && (
          <p className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
            …
          </p>
        )}
        {failed && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-white/70 text-sm">
            {failedText}
          </p>
        )}
      </div>

      {/* Room list. Panotour put this in the top corner in capitals; here it is
          a strip of thumbnails, which is what people actually recognise. */}
      {tour.scenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 md:px-6">
          {tour.scenes.map((s, i) => (
            <button
              key={s.folder}
              type="button"
              onClick={() => go(i)}
              aria-current={i === index}
              className="group/scene shrink-0 text-left"
            >
              <span
                className="block w-24 h-16 rounded-lg overflow-hidden border-2 transition"
                style={{ borderColor: i === index ? "#fff" : "rgba(255,255,255,0.25)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${tileBase(tour)}/${s.folder}/thumbnail.jpg`}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </span>
              {/* The strip is set in capitals, and Greek in capitals is
                  written without its accents. */}
              <span
                className="mt-1 block max-w-24 truncate text-[10px] uppercase tracking-wider"
                style={{ color: i === index ? "#fff" : "rgba(255,255,255,0.55)" }}
              >
                {removeGreekTonos(sceneTitle(s, locale as never))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  ColorScheme,
} from "@vis.gl/react-google-maps"

export type StoryPoint = {
  lat: number
  lng: number
  label: string
  dayNumber: number
  index: number
  type: "leg" | "place"
  images: string[]
}

const LOGO_URL = "/brand/iyc-logo-white.svg"

/* ─── Route polyline + strict bounds enforcement ────────────────────────── */
function RouteAndPan({
  points,
  activeIndex,
}: {
  points: StoryPoint[]
  activeIndex: number
}) {
  const map = useMap()
  const polyRef = useRef<google.maps.Polyline | null>(null)
  const glowRef = useRef<google.maps.Polyline | null>(null)
  const fitted = useRef(false)
  const prevIndex = useRef(activeIndex)
  const minZoom = useRef<number>(3)
  const allBounds = useRef<google.maps.LatLngBounds | null>(null)

  // Build bounds from all points
  const getBounds = () => {
    const bounds = new google.maps.LatLngBounds()
    for (const p of points) bounds.extend({ lat: p.lat, lng: p.lng })
    return bounds
  }

  const fitAll = (m: google.maps.Map) => {
    const bounds = getBounds()
    allBounds.current = bounds
    if (points.length === 1) {
      m.setCenter({ lat: points[0].lat, lng: points[0].lng })
      m.setZoom(10)
      minZoom.current = 10
    } else {
      m.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 })
      // Capture the zoom level that shows all spots
      google.maps.event.addListenerOnce(m, "idle", () => {
        minZoom.current = m.getZoom() ?? 6
      })
    }
  }

  // Check if all markers are visible in current viewport
  const allMarkersVisible = (m: google.maps.Map): boolean => {
    const viewport = m.getBounds()
    if (!viewport) return true
    for (const p of points) {
      if (!viewport.contains({ lat: p.lat, lng: p.lng })) return false
    }
    return true
  }

  // Draw polyline & initial fit
  useEffect(() => {
    if (!map || points.length === 0) return

    if (!fitted.current) {
      fitAll(map)
      fitted.current = true
    }

    if (polyRef.current) polyRef.current.setMap(null)
    if (glowRef.current) glowRef.current.setMap(null)

    const path = points.map((p) => ({ lat: p.lat, lng: p.lng }))

    glowRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      // --iyc-ionian-200. Literal on purpose: google.maps does not resolve
      // CSS variables, and a var() here renders as black.
      strokeColor: "#9CCBEC",
      strokeOpacity: 0.22,
      strokeWeight: 12,
      map,
    })

    polyRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      // --iyc-ionian-300, the lightest step that still holds a line against
      // the dark map. ionian-600 disappeared into the water.
      strokeColor: "#5FAEDF",
      strokeOpacity: 0.95,
      strokeWeight: 3,
      map,
    })

    // Prevent zoom out past min level (all spots must be visible)
    const zoomListener = map.addListener("zoom_changed", () => {
      const z = map.getZoom()
      if (z !== undefined && z < minZoom.current) {
        map.setZoom(minZoom.current)
      }
    })

    // Prevent panning so far that any marker goes off-screen
    const dragListener = map.addListener("dragend", () => {
      if (!allMarkersVisible(map) && allBounds.current) {
        // Snap back to fit all markers
        map.panToBounds(allBounds.current, { top: 80, right: 80, bottom: 80, left: 80 })
      }
    })

    return () => {
      polyRef.current?.setMap(null)
      glowRef.current?.setMap(null)
      google.maps.event.removeListener(zoomListener)
      google.maps.event.removeListener(dragListener)
    }
  }, [map, points])

  // On leg click: reset to initial position showing all spots
  useEffect(() => {
    if (!map || prevIndex.current === activeIndex) {
      prevIndex.current = activeIndex
      return
    }
    prevIndex.current = activeIndex
    fitAll(map)
  }, [activeIndex, map, points])

  return null
}

/* ─── Hide place names, keep only water/beach labels ──────────────────── */
function HideLabels() {
  const map = useMap()
  const applied = useRef(false)

  useEffect(() => {
    if (!map || applied.current) return
    applied.current = true

    // Use the Maps JS featureType styling to hide administrative/locality labels
    // but keep natural water/beach labels
    const style = new google.maps.StyledMapType(
      [
        // Hide all locality / city / town labels
        { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
        // Hide POI labels except parks/beaches
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "on" }] },
        // Hide road labels
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        // Hide transit
        { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
        // Keep water labels (seas, bays, beaches)
        { featureType: "water", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "landscape.natural", elementType: "labels", stylers: [{ visibility: "on" }] },
      ],
      { name: "Clean" }
    )
    map.mapTypes.set("clean", style)
    map.setMapTypeId("clean")
  }, [map])

  return null
}

/* ─── Logo marker (active point) with orbiting image avatars ──────────── */
function LogoMarker({
  point,
  onClick,
  onImageClick,
}: {
  point: StoryPoint
  onClick: () => void
  onImageClick: (images: string[], index: number) => void
}) {
  const avatarRefs = useRef<(HTMLButtonElement | null)[]>([])
  const hasAnimated = useRef(false)
  const imgs = point.images.slice(0, 6) // max 6 avatars
  const radius = imgs.length > 0 ? 52 : 0 // orbit radius from center

  // Stagger avatars in on mount
  useEffect(() => {
    if (imgs.length === 0 || hasAnimated.current) return
    hasAnimated.current = true
    const els = avatarRefs.current.filter(Boolean)
    if (els.length === 0) return
    // Start hidden
    for (const el of els) {
      if (el) { el.style.opacity = "0"; el.style.transform = "scale(0.3)" }
    }
    // Stagger in
    const timeouts: ReturnType<typeof setTimeout>[] = []
    els.forEach((el, i) => {
      const t = setTimeout(() => {
        if (el) {
          el.style.transition = "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)"
          el.style.opacity = "1"
          el.style.transform = "scale(1)"
        }
      }, 80 + i * 70)
      timeouts.push(t)
    })
    return () => timeouts.forEach(clearTimeout)
  }, [imgs.length])

  // Reset animation flag when point changes
  useEffect(() => {
    hasAnimated.current = false
  }, [point.index])

  return (
    <AdvancedMarker
      position={{ lat: point.lat, lng: point.lng }}
      onClick={onClick}
      zIndex={100}
    >
      <div className="relative cursor-pointer flex flex-col items-center" style={{ width: imgs.length > 0 ? 140 : 60, height: imgs.length > 0 ? 140 : 60 }}>
        {/* Orbiting image avatars */}
        {imgs.map((url, i) => {
          const angle = (i / imgs.length) * 2 * Math.PI - Math.PI / 2 // start from top
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          return (
            <button
              key={i}
              ref={(el) => { avatarRefs.current[i] = el }}
              onClick={(e) => { e.stopPropagation(); onImageClick(point.images, i) }}
              className="absolute rounded-full overflow-hidden cursor-pointer hover:scale-110 hover:z-10"
              style={{
                width: 34,
                height: 34,
                left: "50%",
                top: "50%",
                marginLeft: x - 17,
                marginTop: y - 17,
                border: "2px solid rgba(255,255,255,0.7)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease",
                zIndex: 5,
              }}
            >
              <Image src={url} alt="" width={1200} height={800} className="w-full h-full object-cover" />
            </button>
          )
        })}

        {/* Pulse ring */}
        <span
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            left: "50%",
            top: "50%",
            marginLeft: -28,
            marginTop: -28,
            background: "rgba(95, 174, 223, 0.12)",
            animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />
        {/* Logo container */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            left: "50%",
            top: "50%",
            marginLeft: -22,
            marginTop: -22,
            background: "linear-gradient(135deg, rgba(0,99,153,0.9), rgba(4,13,25,0.95))",
            border: "2px solid rgba(95, 174, 223, 0.5)",
            boxShadow: "0 0 30px rgba(95, 174, 223, 0.35), 0 0 12px rgba(95, 174, 223, 0.2), 0 4px 16px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}
        >
          <Image
            src={LOGO_URL}
            alt="IYC"
            width={26}
            height={26}
            unoptimized
            className="w-[26px] h-[26px] object-contain"
            style={{ filter: "brightness(1.2)" }}
          />
        </div>
        {/* Label */}
        <div
          className="absolute whitespace-nowrap px-2.5 py-1 rounded-sm text-[10px] font-semibold text-white"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "calc(50% + 30px)",
            background: "rgba(4,13,25,0.88)",
            border: "1px solid rgba(95, 174, 223, 0.15)",
            backdropFilter: "blur(8px)",
            boxShadow: "var(--shadow-md)",
            zIndex: 10,
          }}
        >
          {point.label}
        </div>
      </div>
    </AdvancedMarker>
  )
}

/* ─── Inactive marker dot ─────────────────────────────────────────────── */
function InactiveMarker({
  point,
  onClick,
}: {
  point: StoryPoint
  onClick: () => void
}) {
  return (
    <AdvancedMarker
      position={{ lat: point.lat, lng: point.lng }}
      onClick={onClick}
      zIndex={10}
    >
      <div className="cursor-pointer group">
        <div
          className="flex items-center justify-center rounded-full text-white font-bold"
          style={{
            width: 20,
            height: 20,
            background: "rgba(190, 90, 15, 0.7)",
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            fontSize: 8,
            transition: "all 0.3s ease",
          }}
        >
          {point.index + 1}
        </div>
        {/* Hover tooltip */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap px-2 py-0.5 rounded-sm text-[9px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: "rgba(4,13,25,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {point.label}
        </div>
      </div>
    </AdvancedMarker>
  )
}

/* ─── Main map component ──────────────────────────────────────────────── */
interface Props {
  points: StoryPoint[]
  activeIndex: number
  onPointClick: (index: number) => void
  onImageClick?: (images: string[], index: number) => void
  className?: string
  /** Resolved on the server; null when no key is configured. */
  mapsKey: string | null
}

export function ItineraryStoryMap({ points, activeIndex, onPointClick, onImageClick, className, mapsKey }: Props) {
  const apiKey = mapsKey

  if (!apiKey || points.length === 0) {
    return (
      <div className={`relative flex items-center justify-center bg-[var(--surface-inverse)] ${className || ""}`}>
        <p className="text-white/20 text-sm">Map unavailable</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: points[0].lat, lng: points[0].lng }}
          defaultZoom={8}
          gestureHandling="none"
          disableDefaultUI
          zoomControl={false}
          colorScheme={ColorScheme.DARK}
          mapId="itinerary-story"
          style={{ width: "100%", height: "100%" }}
        >
          <HideLabels />
          <RouteAndPan points={points} activeIndex={activeIndex} />
          {points.map((p, i) =>
            i === activeIndex ? (
              <LogoMarker
                key={`m-${i}`}
                point={p}
                onClick={() => onPointClick(i)}
                onImageClick={onImageClick || (() => {})}
              />
            ) : (
              <InactiveMarker
                key={`m-${i}`}
                point={p}
                onClick={() => onPointClick(i)}
              />
            )
          )}
        </Map>
      </APIProvider>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { Loader2, MapPin } from "lucide-react"

export type RoutePoint = {
  lat: number
  lng: number
  label: string
  type: "start" | "place" | "leg"
  order: number
}

const MARKER_COLORS: Record<string, string> = {
  start: "#DC2626",
  place: "#006399",
  leg: "#1a6b3c",
}

function FitBoundsAndPolyline({ points, initialFitDone }: { points: RoutePoint[]; initialFitDone: React.MutableRefObject<boolean> }) {
  const map = useMap()
  const polyRef = useRef<google.maps.Polyline | null>(null)

  const draw = useCallback(() => {
    if (!map || points.length === 0) return

    // Only fit bounds on first render, not after drags
    if (!initialFitDone.current) {
      const bounds = new google.maps.LatLngBounds()
      for (const p of points) {
        bounds.extend({ lat: p.lat, lng: p.lng })
      }
      if (points.length === 1) {
        map.setCenter({ lat: points[0].lat, lng: points[0].lng })
        map.setZoom(12)
      } else {
        map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 })
      }
      initialFitDone.current = true
    }

    // Redraw polyline
    if (polyRef.current) {
      polyRef.current.setMap(null)
    }

    const sorted = [...points].sort((a, b) => a.order - b.order)
    const path = sorted.map((p) => ({ lat: p.lat, lng: p.lng }))

    polyRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#006399",
      strokeOpacity: 0.8,
      strokeWeight: 2.5,
      map,
    })
  }, [map, points, initialFitDone])

  useEffect(() => {
    draw()
    return () => {
      if (polyRef.current) {
        polyRef.current.setMap(null)
      }
    }
  }, [draw])

  return null
}

interface Props {
  points: RoutePoint[]
  onPointDrag?: (index: number, lat: number, lng: number) => void
}

export function RouteMap({ points, onPointDrag }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)
  const initialFitDone = useRef(false)

  // Reset fit when points count changes (new point added/removed)
  const prevCount = useRef(points.length)
  useEffect(() => {
    if (points.length !== prevCount.current) {
      initialFitDone.current = false
      prevCount.current = points.length
    }
  }, [points.length])

  useEffect(() => {
    setLoadingKey(true)
    fetch("/api/admin/geocode/maps-key")
      .then((r) => r.json())
      .then((j) => setApiKey(j.key || null))
      .catch(() => setApiKey(null))
      .finally(() => setLoadingKey(false))
  }, [])

  if (points.length === 0) {
    return (
      <div className="w-full py-6 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
        <MapPin className="size-5" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
        <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Add coordinates to see the route map</span>
      </div>
    )
  }

  if (loadingKey) {
    return (
      <div className="flex items-center justify-center h-48 rounded" style={{ background: "var(--surface-container)" }}>
        <Loader2 className="size-5 animate-spin" style={{ color: "var(--on-surface-variant)" }} />
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-1 px-4 text-center rounded" style={{ background: "var(--surface-container)" }}>
        <MapPin className="size-6" style={{ color: "var(--on-surface-variant)" }} />
        <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Google Maps API key not configured</p>
      </div>
    )
  }

  const center = { lat: points[0].lat, lng: points[0].lng }

  return (
    <div className="rounded overflow-hidden" style={{ border: "1px solid var(--outline-variant)", height: 220 }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={8}
          gestureHandling="cooperative"
          disableDefaultUI
          mapTypeControl={false}
          streetViewControl={false}
          zoomControl
          mapId="route-map"
          style={{ width: "100%", height: "100%" }}
        >
          <FitBoundsAndPolyline points={points} initialFitDone={initialFitDone} />
          {points.map((p, i) => (
            <AdvancedMarker
              key={`marker-${i}`}
              position={{ lat: p.lat, lng: p.lng }}
              draggable
              onDragEnd={(e) => {
                const latLng = e.latLng
                if (latLng && onPointDrag) {
                  onPointDrag(i, latLng.lat(), latLng.lng())
                }
              }}
            >
              <div className="relative group cursor-grab active:cursor-grabbing">
                <div
                  className="flex items-center justify-center rounded-full shadow-md text-white text-[9px] font-bold"
                  style={{
                    width: p.type === "start" ? 28 : 22,
                    height: p.type === "start" ? 28 : 22,
                    background: MARKER_COLORS[p.type],
                    border: "2px solid white",
                  }}
                >
                  {p.order}
                </div>
                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[9px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
                  style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
                >
                  {p.label}
                  <span className="block text-[8px] opacity-70">Drag to reposition</span>
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { Loader2, MapPin, X, Anchor, Navigation, GripVertical, Maximize2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ─── Types ──────────────────────────────────────────────────────────────────

type LegData = {
  id: string
  sortOrder: number
  name: Record<string, string>
  description: Record<string, string>
  latitude: number | null
  longitude: number | null
  images: string[]
}

type DayData = {
  id: string
  dayNumber: number
  description: Record<string, string>
  legs: LegData[]
}

type MarkerEntry = {
  lat: number
  lng: number
  label: string
  type: "start" | "place" | "leg"
  color: string
  dayNumber?: number
  legIndex?: number
  placeIndex?: number
  dayIndex?: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  startLatitude: number | null
  startLongitude: number | null
  startFrom: string
  places: Array<{ name: string; latitude: number; longitude: number }>
  days: DayData[]
  onStartDrag: (lat: number, lng: number) => void
  onPlaceDrag: (placeIndex: number, lat: number, lng: number) => void
  onLegDrag: (dayIndex: number, legIndex: number, lat: number, lng: number) => void
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const DAY_COLORS = [
  "#006399", "#b45309", "#7c3aed", "#059669", "#dc2626",
  "#0891b2", "#c026d3", "#65a30d", "#ea580c", "#4f46e5",
]

function getDayColor(dayIndex: number) {
  return DAY_COLORS[dayIndex % DAY_COLORS.length]
}

// ─── Fit Bounds + Polylines ─────────────────────────────────────────────────

function MapEffects({ markers, days }: { markers: MarkerEntry[]; days: DayData[] }) {
  const map = useMap()
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const fittedRef = useRef(false)

  const draw = useCallback(() => {
    if (!map || markers.length === 0) return

    // Fit bounds once
    if (!fittedRef.current) {
      const bounds = new google.maps.LatLngBounds()
      for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng })
      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].lat, lng: markers[0].lng })
        map.setZoom(12)
      } else {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
      }
      fittedRef.current = true
    }

    // Clear old polylines
    for (const p of polylinesRef.current) p.setMap(null)
    polylinesRef.current = []

    // Draw a polyline per day
    days.forEach((day, di) => {
      const dayLegs = day.legs
        .filter((l) => l.latitude != null && l.longitude != null)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      if (dayLegs.length < 2) return

      const path = dayLegs.map((l) => ({ lat: l.latitude!, lng: l.longitude! }))
      const poly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: getDayColor(di),
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      })
      polylinesRef.current.push(poly)
    })

    // Overall route polyline (all markers in order, dashed)
    if (markers.length >= 2) {
      const allPath = markers.map((m) => ({ lat: m.lat, lng: m.lng }))
      const overallPoly = new google.maps.Polyline({
        path: allPath,
        geodesic: true,
        strokeColor: "#94a3b8",
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.5, scale: 3 },
          offset: "0",
          repeat: "14px",
        }],
        map,
      })
      polylinesRef.current.push(overallPoly)
    }
  }, [map, markers, days])

  useEffect(() => {
    draw()
    return () => {
      for (const p of polylinesRef.current) p.setMap(null)
    }
  }, [draw])

  return null
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function RouteMapEditor({
  open, onOpenChange,
  startLatitude, startLongitude, startFrom,
  places, days,
  onStartDrag, onPlaceDrag, onLegDrag,
}: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<MarkerEntry | null>(null)

  useEffect(() => {
    if (!open) return
    setLoadingKey(true)
    fetch("/api/admin/geocode/maps-key")
      .then((r) => r.json())
      .then((j) => setApiKey(j.key || null))
      .catch(() => setApiKey(null))
      .finally(() => setLoadingKey(false))
  }, [open])

  // Build markers list
  const markers: MarkerEntry[] = []

  if (startLatitude != null && startLongitude != null) {
    markers.push({
      lat: startLatitude, lng: startLongitude,
      label: startFrom || "Start",
      type: "start", color: "#DC2626",
    })
  }

  places.forEach((p, pi) => {
    if (p.latitude && p.longitude) {
      markers.push({
        lat: p.latitude, lng: p.longitude,
        label: p.name, type: "place", color: "#006399",
        placeIndex: pi,
      })
    }
  })

  days.forEach((day, di) => {
    day.legs.forEach((leg, li) => {
      if (leg.latitude != null && leg.longitude != null) {
        markers.push({
          lat: leg.latitude, lng: leg.longitude,
          label: leg.name?.en || `Leg ${li + 1}`,
          type: "leg", color: getDayColor(di),
          dayNumber: day.dayNumber, legIndex: li, dayIndex: di,
        })
      }
    })
  })

  function handleDragEnd(marker: MarkerEntry, markerIndex: number, lat: number, lng: number) {
    if (marker.type === "start") {
      onStartDrag(lat, lng)
    } else if (marker.type === "place" && marker.placeIndex != null) {
      onPlaceDrag(marker.placeIndex, lat, lng)
    } else if (marker.type === "leg" && marker.dayIndex != null && marker.legIndex != null) {
      onLegDrag(marker.dayIndex, marker.legIndex, lat, lng)
    }
  }

  const defaultCenter = markers.length > 0
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : { lat: 38.5, lng: 24.0 }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden flex flex-col"
        style={{
          background: "var(--surface-container-lowest)",
          width: "70vw",
          maxWidth: "70vw",
          height: "70vh",
          maxHeight: "70vh",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <Maximize2 className="size-4" style={{ color: "var(--primary)" }} />
          <div className="flex-1">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                Route Map Editor
              </DialogTitle>
              <DialogDescription className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                Drag markers to reposition. Changes save automatically.
              </DialogDescription>
            </DialogHeader>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "#DC2626" }} />
              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "#006399" }} />
              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Places</span>
            </div>
            {days.map((day, di) => (
              <div key={day.id} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: getDayColor(di) }} />
                <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Day {day.dayNumber}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body: sidebar + map */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div
            className="w-56 flex-shrink-0 overflow-y-auto flex flex-col gap-0.5 py-2 px-2"
            style={{ borderRight: "1px solid var(--outline-variant)", background: "var(--surface-container)" }}
          >
            {/* Start point */}
            {startLatitude != null && startLongitude != null && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "rgba(220,38,38,0.08)" }}
                onClick={() => setSelectedMarker(markers.find((m) => m.type === "start") || null)}
              >
                <span className="size-3 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold" style={{ background: "#DC2626" }}>S</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate" style={{ color: "var(--on-surface)" }}>{startFrom || "Start Point"}</div>
                  <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-variant)" }}>{startLatitude.toFixed(4)}, {startLongitude.toFixed(4)}</div>
                </div>
                <GripVertical className="size-3 flex-shrink-0" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
              </div>
            )}

            {/* Places */}
            {places.filter((p) => p.latitude && p.longitude).length > 0 && (
              <>
                <div className="text-[9px] uppercase tracking-wider font-semibold px-2 pt-2 pb-1" style={{ color: "var(--on-surface-variant)" }}>Places</div>
                {places.map((p, pi) => {
                  if (!p.latitude || !p.longitude) return null
                  return (
                    <div
                      key={pi}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ background: "rgba(0,99,153,0.06)" }}
                      onClick={() => setSelectedMarker(markers.find((m) => m.type === "place" && m.placeIndex === pi) || null)}
                    >
                      <span className="size-3 rounded-full flex-shrink-0" style={{ background: "#006399" }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium truncate" style={{ color: "var(--on-surface)" }}>{p.name}</div>
                        <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-variant)" }}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Days & Legs */}
            {days.map((day, di) => {
              const legsWithCoords = day.legs.filter((l) => l.latitude != null && l.longitude != null)
              if (legsWithCoords.length === 0) return null
              return (
                <div key={day.id}>
                  <div className="flex items-center gap-1.5 px-2 pt-3 pb-1">
                    <Anchor className="size-3" style={{ color: getDayColor(di) }} />
                    <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: getDayColor(di) }}>
                      Day {day.dayNumber}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>
                      ({legsWithCoords.length} leg{legsWithCoords.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  {day.legs.map((leg, li) => {
                    if (leg.latitude == null || leg.longitude == null) return null
                    return (
                      <div
                        key={leg.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: `${getDayColor(di)}0F` }}
                        onClick={() => setSelectedMarker(markers.find((m) => m.type === "leg" && m.dayIndex === di && m.legIndex === li) || null)}
                      >
                        <span
                          className="size-3 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold"
                          style={{ background: getDayColor(di) }}
                        >
                          {li + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium truncate" style={{ color: "var(--on-surface)" }}>
                            {leg.name?.en || `Leg ${li + 1}`}
                          </div>
                          <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
                            {leg.latitude!.toFixed(4)}, {leg.longitude!.toFixed(4)}
                          </div>
                        </div>
                        <GripVertical className="size-3 flex-shrink-0" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {markers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <MapPin className="size-5" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
                <span className="text-[10px] text-center" style={{ color: "var(--on-surface-variant)" }}>
                  No points with coordinates yet.
                  Add coordinates to days and legs to see them here.
                </span>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {loadingKey ? (
              <div className="flex items-center justify-center h-full" style={{ background: "var(--surface-container)" }}>
                <Loader2 className="size-6 animate-spin" style={{ color: "var(--on-surface-variant)" }} />
              </div>
            ) : !apiKey ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 px-8 text-center" style={{ background: "var(--surface-container)" }}>
                <MapPin className="size-8" style={{ color: "var(--on-surface-variant)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>Google Maps API key not configured</p>
              </div>
            ) : (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={defaultCenter}
                  defaultZoom={8}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  mapTypeControl
                  streetViewControl={false}
                  zoomControl
                  fullscreenControl={false}
                  mapId="route-map-editor"
                  style={{ width: "100%", height: "100%" }}
                >
                  <MapEffects markers={markers} days={days} />

                  {markers.map((m, i) => (
                    <AdvancedMarker
                      key={`${m.type}-${m.placeIndex ?? ""}-${m.dayIndex ?? ""}-${m.legIndex ?? ""}-${i}`}
                      position={{ lat: m.lat, lng: m.lng }}
                      draggable
                      onDragEnd={(e) => {
                        const latLng = e.latLng
                        if (latLng) {
                          handleDragEnd(m, i, latLng.lat(), latLng.lng())
                        }
                      }}
                    >
                      <div className="relative group cursor-grab active:cursor-grabbing">
                        <div
                          className="flex items-center justify-center rounded-full shadow-lg text-white font-bold transition-transform hover:scale-110"
                          style={{
                            width: m.type === "start" ? 32 : 26,
                            height: m.type === "start" ? 32 : 26,
                            background: m.color,
                            border: "2.5px solid white",
                            fontSize: m.type === "start" ? 10 : 9,
                            boxShadow: selectedMarker === m ? `0 0 0 3px ${m.color}40, 0 2px 8px rgba(0,0,0,0.3)` : "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                        >
                          {m.type === "start" ? "S" : m.type === "place" ? "P" : (m.legIndex != null ? m.legIndex + 1 : "")}
                        </div>
                        {/* Tooltip on hover */}
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50"
                          style={{ background: "var(--inverse-surface)", color: "var(--inverse-on-surface)" }}
                        >
                          <div className="font-semibold">{m.label}</div>
                          {m.dayNumber != null && (
                            <div className="text-[9px] opacity-70">Day {m.dayNumber} &middot; Leg {(m.legIndex ?? 0) + 1}</div>
                          )}
                          <div className="text-[9px] opacity-60 font-mono">{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</div>
                          <div className="text-[9px] opacity-50 mt-0.5">Drag to reposition</div>
                        </div>
                      </div>
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            )}

            {/* Selected marker info overlay */}
            {selectedMarker && (
              <div
                className="absolute top-3 left-3 flex items-center gap-2.5 px-3 py-2 shadow-lg rounded-md z-10"
                style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
              >
                <span className="size-3 rounded-full" style={{ background: selectedMarker.color }} />
                <div>
                  <div className="text-[11px] font-medium" style={{ color: "var(--on-surface)" }}>{selectedMarker.label}</div>
                  <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
                    {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                  </div>
                </div>
                <button onClick={() => setSelectedMarker(null)} className="ml-1">
                  <X className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                </button>
              </div>
            )}

            {/* Point count badge */}
            <div
              className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md shadow-md text-[10px] font-medium z-10"
              style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)" }}
            >
              {markers.length} point{markers.length !== 1 ? "s" : ""} on map
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

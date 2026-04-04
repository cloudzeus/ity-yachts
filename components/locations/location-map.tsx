"use client"

import { useEffect, useRef, useState } from "react"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  ColorScheme,
} from "@vis.gl/react-google-maps"

const LOGO_URL = "https://iycweb.b-cdn.net/IYC_LOGO_TRANS_white.svg"

/* ─── Hide place labels, keep water/natural ─────────────────────────────── */

function HideLabels() {
  const map = useMap()
  const applied = useRef(false)

  useEffect(() => {
    if (!map || applied.current) return
    applied.current = true

    const style = new google.maps.StyledMapType(
      [
        { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
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

/* ─── Logo marker ───────────────────────────────────────────────────────── */

function LogoMarker({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <AdvancedMarker position={{ lat, lng }} zIndex={100}>
      <div className="relative flex flex-col items-center" style={{ width: 60, height: 60 }}>
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
            background: "rgba(88, 214, 241, 0.12)",
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
            background: "linear-gradient(135deg, rgba(0,99,153,0.9), rgba(0,33,71,0.95))",
            border: "2px solid rgba(88, 214, 241, 0.5)",
            boxShadow:
              "0 0 30px rgba(88, 214, 241, 0.35), 0 0 12px rgba(88, 214, 241, 0.2), 0 4px 16px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}
        >
          <img
            src={LOGO_URL}
            alt="IYC"
            className="w-[26px] h-[26px] object-contain"
            style={{ filter: "brightness(1.2)" }}
          />
        </div>
        {/* Label */}
        <div
          className="absolute whitespace-nowrap px-2.5 py-1 rounded-sm text-[10px] font-semibold"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "calc(50% + 30px)",
            background: "rgba(6, 12, 39, 0.88)",
            border: "1px solid rgba(88, 214, 241, 0.15)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            color: "#fff",
            zIndex: 10,
          }}
        >
          {name}
        </div>
      </div>
    </AdvancedMarker>
  )
}

/* ─── Main component ────────────────────────────────────────────────────── */

interface LocationMapProps {
  latitude: number
  longitude: number
  name: string
  className?: string
}

export function LocationMap({ latitude, longitude, name, className }: LocationMapProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/maps-key")
      .then((r) => r.json())
      .then((j) => setApiKey(j.key || null))
      .catch(() => setApiKey(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-[#060c27] ${className || ""}`}>
        <div className="size-6 rounded-full border-2 border-white/10 border-t-[#58D6F1]/60 animate-spin" />
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className={`relative flex items-center justify-center bg-[#060c27] ${className || ""}`}>
        <p className="text-white/20 text-sm">Map unavailable</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={12}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl={false}
          colorScheme={ColorScheme.DARK}
          mapId="location-detail"
          style={{ width: "100%", height: "100%" }}
        >
          <HideLabels />
          <LogoMarker lat={latitude} lng={longitude} name={name} />
        </Map>
      </APIProvider>
    </div>
  )
}

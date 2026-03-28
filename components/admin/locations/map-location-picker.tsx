"use client"

import { useState, useCallback, useEffect } from "react"
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import { MapPin, Loader2, X } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface MapPickerResult {
  name: string
  city: string
  municipality: string
  latitude: number
  longitude: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (result: MapPickerResult) => void
}

// Greece center
const DEFAULT_CENTER = { lat: 38.5, lng: 24.0 }
const DEFAULT_ZOOM = 6

export function MapLocationPicker({ open, onOpenChange, onConfirm }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [reversing, setReversing] = useState(false)
  const [suggestedName, setSuggestedName] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [municipality, setMunicipality] = useState("")

  // Fetch Google Maps key on open
  useEffect(() => {
    if (!open) return
    setLoadingKey(true)
    fetch("/api/admin/geocode/maps-key")
      .then((r) => r.json())
      .then((j) => setApiKey(j.key || null))
      .catch(() => setApiKey(null))
      .finally(() => setLoadingKey(false))
  }, [open])

  const handleMapClick = useCallback(async (e: { detail: { latLng: { lat: number; lng: number } | null } }) => {
    const latLng = e.detail.latLng
    if (!latLng) return
    const { lat, lng } = latLng

    setPin({ lat, lng })
    setReversing(true)
    setSuggestedName("")
    setName("")
    setCity("")
    setMunicipality("")

    try {
      const res = await fetch(`/api/admin/geocode/reverse?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const json = await res.json()
        setSuggestedName(json.name || "")
        setName(json.name || "")
        setCity(json.city || "")
        setMunicipality(json.municipality || "")
      }
    } finally {
      setReversing(false)
    }
  }, [])

  function handleConfirm() {
    if (!pin || !name) return
    onConfirm({
      name,
      city,
      municipality,
      latitude: pin.lat,
      longitude: pin.lng,
    })
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setPin(null)
    setSuggestedName("")
    setName("")
    setCity("")
    setMunicipality("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}>
      <DialogContent
        className="sm:max-w-3xl p-0 overflow-hidden"
        style={{ background: "var(--surface-container-lowest)", maxHeight: "90vh" }}
      >
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              Pick Location on Map
            </DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Click anywhere on the map to place a pin. We&apos;ll suggest a name based on the location.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Map area */}
        <div className="relative w-full" style={{ height: 420 }}>
          {loadingKey ? (
            <div className="flex items-center justify-center h-full" style={{ background: "var(--surface-container)" }}>
              <Loader2 className="size-6 animate-spin" style={{ color: "var(--on-surface-variant)" }} />
            </div>
          ) : !apiKey ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-8 text-center" style={{ background: "var(--surface-container)" }}>
              <MapPin className="size-8" style={{ color: "var(--on-surface-variant)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>Google Maps API key not configured</p>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Add your Google Maps API key in Settings &gt; API Keys to use the map picker.
              </p>
            </div>
          ) : (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling="greedy"
                disableDefaultUI={false}
                mapId="location-picker"
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%" }}
              >
                {pin && (
                  <AdvancedMarker position={pin}>
                    <div
                      className="flex items-center justify-center rounded-full shadow-lg"
                      style={{ width: 36, height: 36, background: "var(--primary)" }}
                    >
                      <MapPin className="size-5 text-white" />
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          )}

          {/* Coordinates overlay */}
          {pin && (
            <div
              className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 text-xs font-mono shadow-lg"
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-xs)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              <button onClick={() => { setPin(null); setName(""); setCity(""); setMunicipality(""); setSuggestedName("") }}>
                <X className="size-3" style={{ color: "var(--on-surface-variant)" }} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom form */}
        <div className="px-5 pb-5 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          {pin ? (
            <>
              {reversing ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  <Loader2 className="size-3 animate-spin" />
                  Looking up location...
                </div>
              ) : (
                <>
                  {suggestedName && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <MapPin className="size-3" style={{ color: "var(--secondary)" }} />
                      Suggested: <strong style={{ color: "var(--on-surface)" }}>{suggestedName}</strong>
                      {city && <span>({city})</span>}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Location Name *</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter location name"
                        autoFocus
                        className="h-8 text-xs"
                        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>City</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="h-8 text-xs"
                        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Municipality</Label>
                      <Input
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        placeholder="Municipality"
                        className="h-8 text-xs"
                        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={!name || reversing}
                  className="h-8 text-xs text-white gap-1.5"
                  style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
                >
                  <MapPin className="size-3.5" />
                  Create Location
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-center py-2" style={{ color: "var(--on-surface-variant)" }}>
              Click on the map to place a pin and set the location.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

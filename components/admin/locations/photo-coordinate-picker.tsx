"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Camera, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface GeotaggedMedia {
  id: string
  name: string
  url: string
  folder: string
  latitude: number
  longitude: number
  capturedAt: string | null
}

/**
 * Take a location's coordinates from a photograph that was shot there.
 *
 * Geocoding a name guesses; a camera recorded the fact. For a bay with no
 * street address — which is most of what this site catalogues — the photograph
 * is the more accurate source, and someone on the base has usually already
 * taken one.
 */
export function PhotoCoordinatePicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<GeotaggedMedia[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    setLoading(true)
    fetch("/api/admin/media/geotagged")
      .then((r) => (r.ok ? r.json() : { media: [] }))
      .then((d) => setMedia(d.media ?? []))
      .catch(() => setMedia([]))
      .finally(() => { setLoading(false); setLoaded(true) })
  }, [open, loaded])

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 flex-shrink-0 gap-1 text-xs"
        style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
        title="Take the coordinates from a photograph"
      >
        <Camera className="size-3" />
        From photo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Coordinates from a photograph</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              <Loader2 className="size-4 animate-spin" /> Looking through the library…
            </div>
          ) : media.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm" style={{ color: "var(--on-surface)" }}>No geotagged photographs yet</p>
              <p className="mx-auto mt-2 max-w-[46ch] text-xs leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                A position is read from a photograph&apos;s EXIF when it is uploaded. Only a phone or a
                camera with GPS writes one, and messaging apps strip it — so send originals, not
                forwards, if you want the coordinates to survive.
              </p>
            </div>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4">
              {media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onPick(m.latitude, m.longitude); setOpen(false) }}
                  className="group overflow-hidden rounded-lg border text-left transition hover:shadow-md"
                  style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
                >
                  <div className="relative aspect-[4/3] w-full" style={{ background: "var(--surface-container)" }}>
                    <Image src={m.url} alt={m.name} fill className="object-cover" sizes="200px" unoptimized />
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3 flex-shrink-0" style={{ color: "var(--secondary)" }} />
                      <code className="truncate text-[10px]" style={{ color: "var(--on-surface)" }}>
                        {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                      </code>
                    </div>
                    <p className="mt-1 truncate text-[10px]" style={{ color: "var(--on-surface-variant)" }} title={m.name}>
                      {m.folder ? `${m.folder}/` : ""}{m.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

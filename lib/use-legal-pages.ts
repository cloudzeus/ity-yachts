"use client"

import { useEffect, useState } from "react"

export interface LegalLink {
  slug: string
  title: Record<string, string>
}

/* Fetched once per document and shared, the same way navigation is — the
   footer is on every page and does not need to ask again on each of them. */
let cached: LegalLink[] | null = null
let inFlight: Promise<LegalLink[]> | null = null

function load(): Promise<LegalLink[]> {
  if (cached) return Promise.resolve(cached)
  if (inFlight) return inFlight

  inFlight = fetch("/api/legal")
    .then((r) => r.json())
    .then((data) => {
      cached = (data.pages ?? []) as LegalLink[]
      inFlight = null
      return cached
    })
    .catch(() => {
      inFlight = null
      return []
    })

  return inFlight
}

export function useLegalPages(): LegalLink[] {
  const [pages, setPages] = useState<LegalLink[]>(cached ?? [])

  useEffect(() => {
    let alive = true
    load().then((p) => { if (alive) setPages(p) })
    return () => { alive = false }
  }, [])

  return pages
}

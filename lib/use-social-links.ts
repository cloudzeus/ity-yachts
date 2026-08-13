"use client"

import { useEffect, useState } from "react"

export interface SocialLink {
  network: string
  url: string
}

/* Fetched once per document and shared, like the navigation and legal links. */
let cached: SocialLink[] | null = null
let inFlight: Promise<SocialLink[]> | null = null

function load(): Promise<SocialLink[]> {
  if (cached) return Promise.resolve(cached)
  if (inFlight) return inFlight

  inFlight = fetch("/api/social")
    .then((r) => r.json())
    .then((data) => {
      cached = (data.links ?? []) as SocialLink[]
      inFlight = null
      return cached
    })
    .catch(() => {
      inFlight = null
      return []
    })

  return inFlight
}

export function useSocialLinks(): SocialLink[] {
  const [links, setLinks] = useState<SocialLink[]>(cached ?? [])

  useEffect(() => {
    let alive = true
    load().then((l) => { if (alive) setLinks(l) })
    return () => { alive = false }
  }, [])

  return links
}

"use client"

import { useEffect, useState } from "react"

export interface NavItem {
  id: string
  label: string
  slug: string
  href: string
  isHomePage: boolean
  menuOrder: number
  translations: Record<string, string>
}

let cachedItems: NavItem[] | null = null
let fetchPromise: Promise<NavItem[]> | null = null

function fetchNavItems(): Promise<NavItem[]> {
  if (cachedItems) return Promise.resolve(cachedItems)
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch("/api/navigation")
    .then((res) => res.json())
    .then((data) => {
      cachedItems = data.items || []
      fetchPromise = null
      return cachedItems!
    })
    .catch(() => {
      fetchPromise = null
      return []
    })

  return fetchPromise
}

export function useNavigation() {
  const [items, setItems] = useState<NavItem[]>(cachedItems || [])
  const [loading, setLoading] = useState(!cachedItems)

  useEffect(() => {
    fetchNavItems().then((navItems) => {
      setItems(navItems)
      setLoading(false)
    })
  }, [])

  return { items, loading }
}

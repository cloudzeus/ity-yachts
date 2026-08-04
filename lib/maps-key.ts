import "server-only"

import { db } from "@/lib/db"

/**
 * The Google Maps browser key, configured by an admin and stored in settings.
 *
 * Read this in a server component and pass it down, so map components render
 * with the key already in hand instead of blocking on a round trip after mount.
 */
export async function getGoogleMapsKey(): Promise<string | null> {
  try {
    const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
    if (!record) return null
    const keys = record.value as Record<string, string>
    return keys.googleMapsKey || null
  } catch {
    return null
  }
}

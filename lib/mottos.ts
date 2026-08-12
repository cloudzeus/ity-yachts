import { db } from "@/lib/db"

/**
 * Mottos — the reusable marketing lines that open a hero or headline a
 * section.
 *
 * They live in their own table rather than in `site_translations` because a
 * motto is not a UI string: it is a three-part unit (heading, subheading,
 * subtext) that an editor picks from a list and drops wherever a page needs
 * one. The same line is meant to appear on several pages, so it is stored once
 * and referenced by slug.
 */

export type Locale = "en" | "el" | "de"

export const MOTTO_CATEGORIES = [
  { value: "hero", label: "Hero headlines" },
  { value: "family", label: "Family & emotion" },
  { value: "heritage", label: "Heritage & trust" },
  { value: "action", label: "Action & service" },
] as const

export interface MottoText {
  heading: string
  subheading: string
  subtext: string
}

export interface MottoRecord extends MottoText {
  id: string
  slug: string
  category: string
  sortOrder: number
}

function pick(field: unknown, locale: Locale): string {
  const v = (typeof field === "string" ? safeParse(field) : field) as Record<string, string> | null
  if (!v) return ""
  // Fall back through English before German: an untranslated motto should read
  // as the original line, not as a half-finished one.
  return (v[locale] || v.en || v.de || v.el || "").trim()
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

/** Every active motto, resolved to one locale — for pickers and listings. */
export async function listMottos(locale: Locale, category?: string): Promise<MottoRecord[]> {
  const rows = await db.motto.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  })
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    category: r.category,
    sortOrder: r.sortOrder,
    heading: pick(r.heading, locale),
    subheading: pick(r.subheading, locale),
    subtext: pick(r.subtext, locale),
  }))
}

/**
 * One motto by slug. Returns null rather than throwing so a page that
 * references a motto since deleted degrades to its own fallback copy instead
 * of failing to render.
 */
export async function getMotto(slug: string, locale: Locale): Promise<MottoText | null> {
  const r = await db.motto.findUnique({ where: { slug } })
  if (!r || !r.isActive) return null
  return {
    heading: pick(r.heading, locale),
    subheading: pick(r.subheading, locale),
    subtext: pick(r.subtext, locale),
  }
}

/** All three locales for one motto — what the admin editor needs. */
export async function getMottoRaw(slug: string) {
  return db.motto.findUnique({ where: { slug } })
}

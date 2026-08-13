/**
 * Shared shape for article categories and tags.
 *
 * The two are near-identical — a translated name, a slug, an order and a
 * status — so they share their types and their slug rule rather than drifting
 * apart one field at a time.
 */
export type Taxonomy = "categories" | "tags"

export interface TaxonomyRow {
  id: string
  slug: string
  name: Record<string, string>
  description?: Record<string, string> | null
  color?: string | null
  sortOrder: number
  status: string
  articleCount?: number
}

/**
 * Latin slug from any of the three languages.
 *
 * Greek is transliterated rather than stripped: without it, «Ιστιοπλοΐα»
 * reduces to an empty string and every Greek-only name would collide on the
 * same fallback slug.
 */
const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
  ά: "a", έ: "e", ή: "i", ί: "i", ό: "o", ύ: "y", ώ: "o", ϊ: "i", ϋ: "y",
  ΐ: "i", ΰ: "y",
}

export function slugify(input: string): string {
  const lower = input.toLowerCase().trim()
  const latin = [...lower].map((c) => GREEK[c] ?? c).join("")
  return (
    latin
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  )
}

/** The first name that has been filled, in the order a person would expect. */
export function primaryName(name: Record<string, string> | null | undefined) {
  if (!name) return ""
  return (name.en || name.el || name.de || "").trim()
}

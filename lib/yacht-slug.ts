/**
 * Yacht addresses that say what they are.
 *
 * A boat lived at /fleet/37558107 — a NAUSYS primary key, which tells a
 * visitor nothing and a search engine less. The URL is one of the few places
 * where "Sun Odyssey 479" can appear before anyone clicks.
 *
 * The id stays at the front, and that is the whole design. The names belong to
 * NAUSYS and are rewritten on every sync: with a name-only address, one
 * rename in the ERP turns every indexed page and every link the office has
 * emailed into a 404, silently and all at once. Here the id still resolves,
 * the wrong spelling redirects to the right one, and nothing breaks.
 *
 * Anything after the id is decoration. /fleet/37558107 and
 * /fleet/37558107-anything both find the boat; only the canonical form is
 * served, the rest redirect to it.
 */

/** Latin letters and digits, everything else a hyphen. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents rather than drop the letter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * The readable part: the boat's name, then its model.
 *
 * The model as NAUSYS stores it carries a cabin count — "Sun Odyssey 479 -
 * 4 cab." — which is inventory shorthand, not something anyone searches for,
 * so it is cut. The name is not repeated when it already is the model.
 */
export function yachtSlugText(yacht: { name?: string | null; model?: { name?: string | null } | null }): string {
  const name = (yacht.name ?? "").trim()
  /* "- 4 cab." and "- 4 + 2 cab." both, the second being how a catamaran's
     crew cabins are written. Matching only the first left Lola at
     lola-lagoon-42-4-2-cab. */
  const model = (yacht.model?.name ?? "")
    .replace(/\s*-\s*\d+(\s*\+\s*\d+)?\s*cab\.?.*$/i, "")
    .trim()
  const parts = model && model.toLowerCase() !== name.toLowerCase() ? [name, model] : [name]
  return slugify(parts.filter(Boolean).join(" "))
}

/** The canonical path segment, e.g. "37558107-sirius-sun-odyssey-479". */
export function yachtSlug(yacht: {
  id: number
  name?: string | null
  model?: { name?: string | null } | null
}): string {
  const text = yachtSlugText(yacht)
  return text ? `${yacht.id}-${text}` : String(yacht.id)
}

/** The canonical path, without a locale prefix. */
export function yachtPath(yacht: {
  id: number
  name?: string | null
  model?: { name?: string | null } | null
}): string {
  return `/fleet/${yachtSlug(yacht)}`
}

/**
 * The id at the front of a URL segment, or null.
 *
 * Deliberately lenient about what follows: a stale slug, a truncated one, or
 * a bare id all resolve. Being strict here would mean a boat renamed in the
 * ERP became unreachable at the address people already have.
 */
export function yachtIdFromParam(param: string): number | null {
  const match = /^(\d+)(?:-|$)/.exec(param)
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

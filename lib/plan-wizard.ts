/**
 * The shape of a planning request.
 *
 * Shared by the wizard and the API so the two cannot drift. No database import
 * here — the client bundle needs the types and the option lists.
 */

/**
 * How settled the dates are.
 *
 *   exact   the charter runs from dateFrom to dateTo
 *   window  they can sail any `duration` between windowFrom and windowTo —
 *           the common case, and the one that gives us room to find a boat
 *   months  only the months are decided
 *   unsure  nothing decided yet
 */
export type Timing = "exact" | "window" | "months" | "unsure"
export type Duration = "week" | "tendays" | "twoweeks" | "longer" | "unsure"
export type CrewMode = "bareboat" | "skippered" | "crewed" | "advise"
export type BoatKind = "monohull" | "catamaran" | "either"
export type Experience = "licensed-experienced" | "licensed-rusty" | "no-licence" | "never-sailed"
export type Occasion = "family" | "friends" | "couple" | "corporate" | "other"
export type Contact = "email" | "phone" | "whatsapp"

export interface PlanAnswers {
  // When
  timing: Timing
  dateFrom?: string // ISO date, when timing === "exact"
  dateTo?: string
  windowFrom?: string // ISO date, when timing === "window" — the earliest they could start
  windowTo?: string // …and the latest they must be back
  months: string[] // "2026-06" …, when timing === "months"
  duration: Duration
  flexible: boolean

  // Who
  adults: number
  children: number
  childAges?: string
  occasion: Occasion

  // How
  crewMode: CrewMode
  experience: Experience

  // What
  boatKind: BoatKind
  cabins?: number
  priorities: string[]

  // Where
  regions: string[]

  // Budget
  budgetFrom?: number
  budgetTo?: number
  budgetFlexible: boolean

  // Extras
  extras: string[]

  // Contact
  firstName: string
  lastName: string
  email: string
  phone?: string
  contactPreference: Contact
  locale: string
  notes?: string
}

/** Priorities and extras are free-form lists; these are the offered options. */
export const PRIORITY_OPTIONS = [
  "comfort",
  "recent",
  "easy-handling",
  "space",
  "watertoys",
  "aircon",
  "budget",
] as const

export const EXTRA_OPTIONS = [
  "provisioning",
  "transfer",
  "skipper",
  "hostess",
  "sup",
  "outboard",
  "wifi",
  "accommodation",
] as const

export const REGION_OPTIONS = [
  "lefkada",
  "meganisi",
  "ithaca",
  "kefalonia",
  "kalamos-kastos",
  "paxos-antipaxos",
  "corfu",
  "advise",
] as const

/** Nothing is required except the contact block and a sense of when. */
export function validate(a: Partial<PlanAnswers>): string | null {
  if (!a.firstName?.trim()) return "firstName"
  if (!a.email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return "email"
  if (!a.timing) return "timing"
  if (a.timing === "exact" && (!a.dateFrom || !a.dateTo)) return "dates"
  if (a.timing === "window" && (!a.windowFrom || !a.windowTo)) return "window"
  if (a.timing === "months" && !(a.months && a.months.length)) return "months"
  if (!a.adults || a.adults < 1) return "adults"
  return null
}

/** Total people aboard, which is what a berth count has to cover. */
export function crewSize(a: Pick<PlanAnswers, "adults" | "children">) {
  return (a.adults || 0) + (a.children || 0)
}

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

/** The services IYC actually offers — the same six on the homepage, plus the
 *  on-board extras from the yacht pages. Nothing here that we cannot supply. */
export const EXTRA_OPTIONS = [
  "provisioning",
  "transfer",
  "skipper",
  "instructor",
  "hostess",
  "weathersms",
  "sup",
  "outboard",
  "blister",
  "accommodation",
] as const

/** Every charter starts and ends on the IYC pontoon in Lefkada harbour. These
 *  are the waters they sail to, never a choice of base. */
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

/**
 * English labels for the stored codes, for the admin.
 *
 * The emails carry their own table because they need Greek and German as well;
 * this one exists so the admin does not have to import a server-only module to
 * render "no-licence" as something a person can read.
 */
export const LABEL_EN: Record<string, string> = {
  exact: "Fixed dates", window: "Anywhere in a span", months: "Certain months", unsure: "Not decided",
  week: "One week", tendays: "Ten days", twoweeks: "Two weeks", longer: "Longer than two weeks",
  bareboat: "Bareboat", skippered: "With a skipper", crewed: "Fully crewed", advise: "Wants advice",
  "licensed-experienced": "Licensed, sails regularly", "licensed-rusty": "Licensed, out of practice",
  "no-licence": "No licence", "never-sailed": "Never sailed",
  monohull: "Sailing yacht", catamaran: "Catamaran", either: "No preference",
  family: "Family holiday", friends: "Friends", couple: "Couple", corporate: "Company trip", other: "Other",
  comfort: "Comfort", recent: "A recent boat", "easy-handling": "Easy to handle", space: "Space aboard",
  watertoys: "Water toys", aircon: "Air conditioning", budget: "Keeping cost down",
  provisioning: "Provisioning", transfer: "Airport transfer", skipper: "Skipper",
  instructor: "Sailing instructor", hostess: "Hostess", weathersms: "Weather by SMS",
  sup: "SUP", outboard: "Outboard", blister: "Blister", accommodation: "Room on land",
  lefkada: "Lefkada", meganisi: "Meganisi", ithaca: "Ithaca", kefalonia: "Kefalonia",
  "kalamos-kastos": "Kalamos & Kastos", "paxos-antipaxos": "Paxos & Antipaxos", corfu: "Corfu",
  email: "Email", phone: "Phone", whatsapp: "WhatsApp",
}

/** Total people aboard, which is what a berth count has to cover. */
export function crewSize(a: Pick<PlanAnswers, "adults" | "children">) {
  return (a.adults || 0) + (a.children || 0)
}

import type { PlanAnswers } from "@/lib/plan-wizard"

/**
 * Push anything the planner recorded in the past forward to when it can
 * actually be sailed.
 *
 * The model is told today's date, but "first half of July" said in August is
 * still resolved to July of the current year — so the conversation happily
 * recorded, and offered, weeks that had already gone. A prompt rule alone is a
 * request; this is the guarantee.
 *
 * A pair is shifted by the same number of years, never separately: moving only
 * the start of a window turns "6th to 27th" into a span running backwards.
 */

/** The charter season, so a date is rolled to a month we actually sail in. */
export const SEASON_FIRST_MONTH = 5 // May
export const SEASON_LAST_MONTH = 10 // October

const isoDate = /^\d{4}-\d{2}-\d{2}$/
const isoMonth = /^\d{4}-\d{2}$/

/** Today as yyyy-mm-dd, so callers can pass a fixed date in a test. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** How many whole years a date must move to stop being in the past. */
function yearsToShift(value: string, today: string): number {
  if (value >= today) return 0
  const year = Number(value.slice(0, 4))
  const rest = value.slice(4)
  let shift = 1
  // A leap day lands on the 28th in a common year; comparing strings is enough
  // to know when it has cleared today.
  while (`${year + shift}${rest}` < today && shift < 10) shift++
  return shift
}

const addYears = (value: string, years: number) =>
  years === 0 ? value : `${Number(value.slice(0, 4)) + years}${value.slice(4)}`

/**
 * A month string, moved to the next time that month comes round in season.
 * "2026-06" asked in August 2026 means June 2027, not a month already gone.
 */
export function normaliseMonth(month: string, today = todayIso()): string {
  if (!isoMonth.test(month)) return month
  const thisMonth = today.slice(0, 7)
  if (month >= thisMonth) return month
  let years = 1
  while (addYears(month, years) < thisMonth && years < 10) years++
  return addYears(month, years)
}

/** The answers, with every date and month brought forward if it has passed. */
export function normalisePlanDates(
  answers: Partial<PlanAnswers>,
  today = todayIso()
): Partial<PlanAnswers> {
  const out: Partial<PlanAnswers> = { ...answers }

  // Each pair moves together, by whichever shift the earlier of the two needs.
  for (const [from, to] of [
    ["dateFrom", "dateTo"],
    ["windowFrom", "windowTo"],
  ] as const) {
    const a = out[from]
    const b = out[to]
    const dates = [a, b].filter((d): d is string => typeof d === "string" && isoDate.test(d))
    if (!dates.length) continue

    const endShift = typeof b === "string" && isoDate.test(b) ? yearsToShift(b, today) : null
    const startPast = typeof a === "string" && isoDate.test(a) && a < today

    /* A span that straddles today is not a past span: "any week in August",
       asked on the 14th, means the rest of this August. Clamp the start to
       today and leave the end where it is. Only when the whole span has gone
       does it move to next year — and then both ends move together. */
    if (endShift === 0 && startPast) {
      out[from] = today
      continue
    }

    const shift = Math.max(...dates.map((d) => yearsToShift(d, today)))
    if (shift === 0) continue
    if (typeof a === "string" && isoDate.test(a)) out[from] = addYears(a, shift)
    if (typeof b === "string" && isoDate.test(b)) out[to] = addYears(b, shift)
  }

  if (Array.isArray(out.months) && out.months.length) {
    // Duplicates can appear once two past months roll onto the same one.
    out.months = [...new Set(out.months.map((m) => normaliseMonth(m, today)))].sort()
  }

  return out
}

/** The months still ahead this season, then next season — for the prompt. */
export function bookableMonths(today = todayIso(), count = 8): string[] {
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
  const months: string[] = []
  let year = y
  let month = m
  while (months.length < count) {
    if (month >= SEASON_FIRST_MONTH && month <= SEASON_LAST_MONTH) {
      months.push(`${year}-${String(month).padStart(2, "0")}`)
    }
    month++
    if (month > 12) { month = 1; year++ }
  }
  return months
}

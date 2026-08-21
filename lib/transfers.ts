/**
 * The last leg, which no flight API knows about.
 *
 * These are the defaults. What the site shows comes from the `transfers`
 * setting, edited in /admin — taxi fares and coach prices move, and a price
 * that can only be corrected by a developer is a price that stays wrong.
 *
 * These figures come from the office's own transfer sheet. They are the part
 * of the journey a visitor cannot look up anywhere and the reason the page is
 * worth having at all: knowing a plane lands at Preveza is not the same as
 * knowing the pontoon is twenty minutes and forty euros away.
 *
 * Prices are indicative and dated on the page rather than presented as a
 * quote — they came with "Angaben ohne Gewähr" on the sheet and should keep
 * that character.
 */

export interface Transfer {
  /** Where the journey to Lefkada starts. */
  fromKey: string
  from: { en: string; el: string; de: string }
  /** Roughly how long, in the visitor's language. */
  duration: { en: string; el: string; de: string }
  /** What it costs, and by what means. */
  cost: { en: string; el: string; de: string }
  /** Distance is the honest way to say "this one is far". */
  emphasis: "primary" | "secondary"
  link?: { label: string; href: string }
}

export const DEFAULT_TRANSFERS: Transfer[] = [
  {
    fromKey: "preveza",
    from: { en: "Preveza (Aktion) airport", el: "Αεροδρόμιο Πρέβεζας (Άκτιο)", de: "Flughafen Preveza (Aktion)" },
    duration: { en: "20 minutes", el: "20 λεπτά", de: "20 Minuten" },
    cost: {
      en: "about €40 by taxi, up to 4 people",
      el: "περίπου 40€ με ταξί, έως 4 άτομα",
      de: "ca. 40 € mit dem Taxi, bis 4 Personen",
    },
    emphasis: "primary",
  },
  {
    fromKey: "igoumenitsa",
    from: { en: "Igoumenitsa ferry port", el: "Λιμάνι Ηγουμενίτσας", de: "Fährhafen Igoumenitsa" },
    duration: { en: "1 hour 30 minutes", el: "1 ώρα 30 λεπτά", de: "1 Stunde 30 Minuten" },
    cost: {
      en: "about €150 by taxi (4 people) or €200 by minibus (7–8 people)",
      el: "περίπου 150€ με ταξί (4 άτομα) ή 200€ με μίνι λεωφορείο (7–8 άτομα)",
      de: "ca. 150 € mit dem Taxi (4 Personen) oder 200 € mit dem Minibus (7–8 Personen)",
    },
    emphasis: "secondary",
  },
  {
    fromKey: "athens",
    from: {
      en: "Athens or Thessaloniki",
      el: "Αθήνα ή Θεσσαλονίκη",
      de: "Athen oder Thessaloniki",
    },
    duration: { en: "about 5 hours", el: "περίπου 5 ώρες", de: "etwa 5 Stunden" },
    cost: {
      en: "about €35 by coach",
      el: "περίπου 35€ με λεωφορείο",
      de: "ca. 35 € mit dem Fernbus",
    },
    emphasis: "secondary",
    link: { label: "ktel-lefkadas.gr", href: "https://www.ktel-lefkadas.gr" },
  },
]

/** When the defaults were taken off the office's own sheet. */
export const DEFAULT_TRANSFERS_UPDATED = "2026-01-01"

/**
 * The office's own flight sheet, as a file.
 *
 * The live timetable on the page is built from what the airlines have filed
 * and is always current, which is the right thing on screen and the wrong
 * thing in a bag. People planning a journey print it, forward it to whoever
 * is booking, or open it on a phone with no signal — and for that they want
 * one document, dated, that does not change under them.
 *
 * So this is a file the office uploads, not something generated. It is their
 * artefact: their layout, their wording, their choice of what to include.
 */
export interface Brochure {
  /** Where the file lives, on the media CDN. */
  url: string
  /** The name it is saved under when downloaded. */
  name: string
  /** What the link says, per language. */
  label: { en: string; el: string; de: string }
  /** Bytes, so the page can warn before a large download on mobile. */
  size?: number
  /** When the office last replaced it. */
  updated?: string
}

/** What the `transfers` setting holds. */
export interface TransfersSetting {
  items: Transfer[]
  /** The date shown beside the prices, so it is the office's claim, not ours. */
  updated: string
  /** Absent until the office uploads one; the page simply omits the card. */
  brochure?: Brochure | null
}

/** Read the stored shape, falling back to the defaults field by field. */
export function asTransfers(value: unknown): TransfersSetting {
  const v = (value ?? {}) as Partial<TransfersSetting>
  const items = Array.isArray(v.items) && v.items.length ? v.items : DEFAULT_TRANSFERS
  /* A brochure without a URL is not a brochure — better no card than a link
     to nowhere. */
  const b = v.brochure
  const brochure: Brochure | null =
    b && typeof b.url === "string" && b.url.trim()
      ? {
          url: b.url.trim(),
          name: (b.name ?? "flights.pdf").trim(),
          label: { en: b.label?.en ?? "", el: b.label?.el ?? "", de: b.label?.de ?? "" },
          size: b.size,
          updated: b.updated,
        }
      : null
  return {
    items,
    updated: (v.updated ?? DEFAULT_TRANSFERS_UPDATED).trim() || DEFAULT_TRANSFERS_UPDATED,
    brochure,
  }
}

/** A size a person can read, or nothing when we were not told. */
export function readableSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / 1_048_576
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

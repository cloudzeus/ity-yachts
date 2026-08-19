/**
 * The last leg, which no flight API knows about.
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

export const TRANSFERS: Transfer[] = [
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

/** When the transfer figures were last confirmed by the office. */
export const TRANSFERS_UPDATED = "2026-01-01"

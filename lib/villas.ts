/**
 * The three villas, as much of them as belongs on this site.
 *
 * They are Maria's — the base manager's — and they sit a few minutes from the
 * water on Lefkada. Guests routinely want a night or two ashore either side
 * of a week afloat, and until now the only mention of that was a line in her
 * biography.
 *
 * Deliberately not a copy of ioniandreamvillas.com. That site can sell them;
 * this page has one job, which is to tell a charter guest the villas exist
 * and are the same family, and then send them there. Room counts and one
 * photograph each — anything more and we are maintaining a second villa
 * website that drifts out of date on its own.
 *
 * No prices. They move by season and by year, and a figure repeated here is
 * a figure nobody will remember to change — a guest quoting it back at the
 * office is worse than never having shown one.
 */

export interface Villa {
  key: string
  /** As it is written on the door, and in Greek beneath. */
  name: string
  greek: string
  bedrooms: number
  guests: number
  /** Square metres. */
  size: number
  image: string
  /** Deep link to the villa's own page. */
  href: string
}

export const VILLAS_URL = "https://ionian-dream-villas.com/en"

export const VILLAS: Villa[] = [
  {
    key: "castro",
    name: "Castro",
    greek: "Κάστρο",
    bedrooms: 3,
    guests: 6,
    size: 140,
    image: "https://iycweb.b-cdn.net/villas/1787837567166-castro.webp",
    href: "https://ionian-dream-villas.com/en/villas/castro",
  },
  {
    key: "jira",
    name: "Jira",
    greek: "Γύρα",
    bedrooms: 3,
    guests: 6,
    size: 140,
    image: "https://iycweb.b-cdn.net/villas/1787837567959-jira.webp",
    href: "https://ionian-dream-villas.com/en/villas/jira",
  },
  {
    key: "milos",
    name: "Milos",
    greek: "Μύλος",
    bedrooms: 3,
    guests: 6,
    size: 140,
    image: "https://iycweb.b-cdn.net/villas/1787837568907-milos.webp",
    href: "https://ionian-dream-villas.com/en/villas/milos",
  },
]

/** The wide photograph at the top. */
export const VILLAS_HERO = "https://iycweb.b-cdn.net/villas/1787837564924-hero.webp"

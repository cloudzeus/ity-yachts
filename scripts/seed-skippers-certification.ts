import "dotenv/config"
import { db } from "../lib/db"

/**
 * The Skippers School leads to Deutscher Segler-Verband certification.
 *
 * Stored on the service rather than written into the route, so any other
 * service can carry an accrediting body later and this one stays editable.
 */
const CERTIFICATION = {
  logo: "https://iycweb.b-cdn.net/general/1786438820517-dsv-logo-large.webp",
  name: {
    en: "Deutscher Segler-Verband",
    el: "Deutscher Segler-Verband",
    de: "Deutscher Segler-Verband",
  },
  body: {
    en: "Our courses are run to the standards of the German Sailing Association, and lead to its recognised certificates — the same qualification you would sit for in Germany, taken in the Ionian.",
    el: "Τα μαθήματά μας ακολουθούν τα πρότυπα της Γερμανικής Ιστιοπλοϊκής Ομοσπονδίας και οδηγούν στα αναγνωρισμένα πιστοποιητικά της — το ίδιο δίπλωμα που θα βγάζατε στη Γερμανία, με εξετάσεις στο Ιόνιο.",
    de: "Unsere Kurse folgen den Standards des Deutschen Segler-Verbands und führen zu seinen anerkannten Scheinen — dieselbe Qualifikation wie in Deutschland, nur im Ionischen Meer erworben.",
  },
}

async function main() {
  const updated = await db.service.update({
    where: { slug: "skippers-school" },
    data: { certification: CERTIFICATION },
    select: { slug: true, certification: true },
  })
  console.log(updated.slug, "->", JSON.stringify(updated.certification).slice(0, 90), "…")
  await db.$disconnect()
}

main()

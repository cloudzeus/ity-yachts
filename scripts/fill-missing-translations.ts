import "dotenv/config"
import { db } from "../lib/db"

/**
 * Keys the code asks for that the translation table never had.
 *
 * `t("key", "English fallback")` renders the fallback silently when the key is
 * missing, so a Greek or German reader saw English and nothing anywhere
 * reported a problem. Written by hand rather than machine-translated: these
 * are short interface labels where the existing table already fixes the
 * vocabulary — cabins are Kajüten, routes are Διαδρομές / Segelrouten — and a
 * batch translator would have invented a second word for each.
 */
const ENTRIES: { key: string; en: string; el: string; de: string }[] = [
  // Navigation and the breadcrumb trail
  { key: "nav.home", en: "Home", el: "Αρχική", de: "Startseite" },
  { key: "nav.breadcrumb", en: "Breadcrumb", el: "Διαδρομή πλοήγησης", de: "Navigationspfad" },
  { key: "nav.news", en: "News", el: "Νέα", de: "Neuigkeiten" },
  { key: "nav.services", en: "Services", el: "Υπηρεσίες", de: "Leistungen" },
  { key: "nav.destinations", en: "Destinations", el: "Προορισμοί", de: "Reiseziele" },
  { key: "nav.itineraries", en: "Itineraries", el: "Διαδρομές", de: "Routen" },

  // Fleet listing
  { key: "fleet.searchLabel", en: "Search the fleet by name, model or builder", el: "Αναζήτηση στον στόλο με όνομα, μοντέλο ή ναυπηγείο", de: "Flotte nach Name, Modell oder Werft durchsuchen" },
  { key: "fleet.prevYacht", en: "Previous yacht", el: "Προηγούμενο σκάφος", de: "Vorherige Yacht" },
  { key: "fleet.nextYacht", en: "Next yacht", el: "Επόμενο σκάφος", de: "Nächste Yacht" },
  { key: "pagination.previous", en: "Previous page", el: "Προηγούμενη σελίδα", de: "Vorherige Seite" },
  { key: "pagination.next", en: "Next page", el: "Επόμενη σελίδα", de: "Nächste Seite" },

  // Yacht detail
  { key: "yacht.spec.cabinsShort", en: "cabins", el: "καμπίνες", de: "Kajüten" },
  { key: "gallery.previous", en: "Previous photo", el: "Προηγούμενη φωτογραφία", de: "Vorheriges Foto" },
  { key: "gallery.next", en: "Next photo", el: "Επόμενη φωτογραφία", de: "Nächstes Foto" },
  { key: "yacht.callUs", en: "Call us about this yacht", el: "Καλέστε μας για αυτό το σκάφος", de: "Rufen Sie uns zu dieser Yacht an" },

  // Itinerary detail
  { key: "itinerary.nauticalMiles", en: "NM", el: "ν.μ.", de: "sm" },
  { key: "itinerary.stops", en: "Stops", el: "Στάσεις", de: "Stopps" },

  // Search modal shortcuts
  { key: "search.link.destinations", en: "Destinations", el: "Προορισμοί", de: "Reiseziele" },
  { key: "search.link.routes", en: "Sailing routes", el: "Διαδρομές ιστιοπλοΐας", de: "Segelrouten" },
  { key: "search.link.services", en: "Services", el: "Υπηρεσίες", de: "Leistungen" },
  { key: "search.link.story", en: "Our story", el: "Η ιστορία μας", de: "Unsere Geschichte" },

  // Homepage FAQ block — lead and accent are two halves of one sentence.
  { key: "home.faq.eyebrow", en: "Before you book", el: "Πριν κλείσετε", de: "Vor der Buchung" },
  { key: "home.faq.headingLead", en: "Questions we", el: "Ερωτήσεις που", de: "Fragen, die uns" },
  { key: "home.faq.headingAccent", en: "are asked", el: "μας κάνετε", de: "gestellt werden" },
  { key: "home.faq.viewAll", en: "All the practical questions", el: "Όλες οι πρακτικές ερωτήσεις", de: "Alle praktischen Fragen" },
]

async function main() {
  for (const e of ENTRIES) {
    const data = { ...e, namespace: e.key.split(".")[0] }
    await db.siteTranslation.upsert({ where: { key: e.key }, create: data, update: data })
  }
  console.log(`${ENTRIES.length} keys written`)
  await db.$disconnect()
}
main()

import "dotenv/config"
import { db } from "../lib/db"

/**
 * Page titles and descriptions, in all three languages.
 *
 * These were written once in English and read in English on every version of
 * the site, so /de/fleet went out announcing itself as "Charter Fleet
 * Lefkada". Indexable, but unable to compete for a German query — which made
 * the language routing half a fix.
 *
 * Lengths are deliberate: a title has 47 characters before the " | IYC Yachts"
 * suffix pushes it past where Google truncates, and a description has 158.
 */
const E = [
  // ── Home + the layout default
  { key: "meta.home.title", en: "Yacht Charter Lefkada — IYC Ionische Yacht Charter", el: "Ναύλωση σκάφους στη Λευκάδα — IYC Ionische Yacht Charter", de: "Yachtcharter Lefkada — IYC Ionische Yacht Charter" },
  { key: "meta.home.description",
    en: "Family-run yacht charter from Lefkada since 1979. Sailing yachts and catamarans in the Ionian, bareboat or with a skipper — Greek warmth, German order.",
    el: "Οικογενειακή ναύλωση σκαφών από τη Λευκάδα από το 1979. Ιστιοπλοϊκά και καταμαράν στο Ιόνιο, χωρίς πλήρωμα ή με κυβερνήτη — ελληνική ζεστασιά, γερμανική τάξη.",
    de: "Familiengeführter Yachtcharter ab Lefkada seit 1979. Segelyachten und Katamarane im Ionischen Meer, bareboat oder mit Skipper, griechisch-deutsch geführt." },

  // ── Fleet
  { key: "meta.fleet.title", en: "Charter Fleet Lefkada — Yachts & Catamarans", el: "Στόλος Λευκάδα — ιστιοπλοϊκά και καταμαράν", de: "Charterflotte Lefkada — Yachten & Katamarane" },
  { key: "meta.fleet.description",
    en: "Our charter fleet in Lefkada: sailing yachts and catamarans, 2 to 6 cabins, bareboat or skippered. Live availability and prices for the Ionian.",
    el: "Ο στόλος μας στη Λευκάδα: ιστιοπλοϊκά και καταμαράν, 2 ως 6 καμπίνες, χωρίς πλήρωμα ή με κυβερνήτη. Ζωντανή διαθεσιμότητα και τιμές για το Ιόνιο.",
    de: "Unsere Charterflotte in Lefkada: Segelyachten und Katamarane, 2 bis 6 Kabinen, bareboat oder mit Skipper. Live-Verfügbarkeit und Preise fürs Ionische Meer." },

  // ── Destinations
  { key: "meta.locations.title", en: "Ionian Sailing Destinations from Lefkada", el: "Προορισμοί ιστιοπλοΐας στο Ιόνιο", de: "Segelziele im Ionischen Meer ab Lefkada" },
  { key: "meta.locations.description",
    en: "Where to sail from Lefkada: Ithaca, Kefalonia, Meganisi, Kalamos, Kastos and Paxos. Anchorages, harbours and bays across the Ionian, with coordinates.",
    el: "Πού να πλεύσετε από τη Λευκάδα: Ιθάκη, Κεφαλονιά, Μεγανήσι, Κάλαμος, Καστός, Παξοί. Αγκυροβόλια, λιμάνια και όρμοι σε όλο το Ιόνιο, με συντεταγμένες.",
    de: "Wohin ab Lefkada: Ithaka, Kefalonia, Meganisi, Kalamos, Kastos und Paxos. Ankerplätze, Häfen und Buchten im ganzen Ionischen Meer, mit Koordinaten." },

  // ── Routes
  { key: "meta.itineraries.title", en: "Ionian Sailing Routes from Lefkada", el: "Διαδρομές ιστιοπλοΐας από τη Λευκάδα", de: "Segelrouten im Ionischen Meer ab Lefkada" },
  { key: "meta.itineraries.description",
    en: "Week-long sailing routes out of Lefkada, day by day: distances, anchorages and harbours through Meganisi, Ithaca, Kefalonia and the Inland Sea.",
    el: "Εβδομαδιαίες διαδρομές από τη Λευκάδα, μέρα με τη μέρα: αποστάσεις, αγκυροβόλια και λιμάνια μέσα από Μεγανήσι, Ιθάκη, Κεφαλονιά και το Εσωτερικό Ιόνιο.",
    de: "Einwöchige Segelrouten ab Lefkada, Tag für Tag: Distanzen, Ankerplätze und Häfen über Meganisi, Ithaka, Kefalonia und das Binnenmeer." },

  // ── Services
  { key: "meta.services.title", en: "Charter Services in Lefkada", el: "Υπηρεσίες ναύλωσης στη Λευκάδα", de: "Charter-Leistungen in Lefkada" },
  { key: "meta.services.description",
    en: "Everything around the boat: a skipper or hostess, provisioning, tailored routes, transfers and the paperwork. What we arrange before you reach Lefkada.",
    el: "Όλα γύρω από το σκάφος: κυβερνήτης ή οικοδέσποινα, εφοδιασμός, προσαρμοσμένες διαδρομές, μεταφορές και τα χαρτιά. Όσα κανονίζουμε πριν φτάσετε.",
    de: "Alles rund ums Boot: Skipper oder Hostess, Proviant, maßgeschneiderte Routen, Transfers und Papiere. Was wir regeln, bevor Sie in Lefkada ankommen." },

  // ── News
  { key: "meta.news.title", en: "Sailing the Ionian — Notes from Lefkada", el: "Ιστιοπλοΐα στο Ιόνιο — από τη Λευκάδα", de: "Segeln im Ionischen Meer — aus Lefkada" },
  { key: "meta.news.description",
    en: "Winds, anchorages, boats and what a week aboard is actually like, written by the people who run the base in Lefkada and sail these islands every season.",
    el: "Άνεμοι, αγκυροβόλια, σκάφη και το πώς είναι πραγματικά μια εβδομάδα εν πλω, γραμμένα από όσους κρατούν τη βάση στη Λευκάδα και πλέουν εδώ κάθε σεζόν.",
    de: "Winde, Ankerplätze, Boote und wie eine Woche an Bord wirklich ist — von denen, die die Basis in Lefkada führen und jede Saison hier segeln." },

  // ── FAQ
  { key: "meta.faq.title", en: "Chartering in Lefkada — Your Questions Answered", el: "Ναύλωση στη Λευκάδα — οι ερωτήσεις σας", de: "Chartern auf Lefkada — Ihre Fragen" },
  { key: "meta.faq.description",
    en: "Licences, getting to Lefkada, when to sail, what a charter includes, one-way trips and the floating bridge — answered plainly by the people who run the base.",
    el: "Άδειες, πώς φτάνετε στη Λευκάδα, πότε να πλεύσετε, τι περιλαμβάνει η ναύλωση, διαδρομές μονής κατεύθυνσης και η πλωτή γέφυρα — απαντημένα απλά.",
    de: "Führerscheine, Anreise nach Lefkada, wann segeln, was enthalten ist, One-Way-Törns und die Schwimmbrücke — schlicht beantwortet von der Basis." },

  // ── Contact
  { key: "meta.contact.title", en: "Contact — Our Base in Lefkada", el: "Επικοινωνία — η βάση μας στη Λευκάδα", de: "Kontakt — unsere Basis auf Lefkada" },
  { key: "meta.contact.description",
    en: "Talk to the people who run the base. Our office is at Filippa Panagou 22, Lefkada 31100, with a second in Munich. We answer in Greek, German and English.",
    el: "Μιλήστε με όσους κρατούν τη βάση. Γραφείο στη Φιλίππα Πανάγου 22, Λευκάδα 31100, και δεύτερο στο Μόναχο. Απαντάμε ελληνικά, γερμανικά και αγγλικά.",
    de: "Sprechen Sie mit dem Team vor Ort. Büro in der Filippa Panagou 22, Lefkada 31100, ein zweites in München. Wir antworten griechisch, deutsch und englisch." },

  // ── Our story
  { key: "meta.about.title", en: "Our Story — Yacht Charter in Lefkada since 1979", el: "Η ιστορία μας — στη Λευκάδα από το 1979", de: "Unsere Geschichte — Lefkada seit 1979" },
  { key: "meta.about.description",
    en: "Two countries, one family, and the Ionian since 1979. How Ionische Yacht Charter came to be, told from our base in Lefkada.",
    el: "Δύο χώρες, μία οικογένεια και το Ιόνιο από το 1979. Πώς έγινε η IYC Ionische Yacht Charter, από τη βάση μας στη Λευκάδα.",
    de: "Zwei Länder, eine Familie und das Ionische Meer seit 1979. Wie IYC Ionische Yacht Charter entstand, erzählt von unserer Basis auf Lefkada." },

  // ── Fragments the dynamic pages build their titles and descriptions from
  { key: "meta.location.suffix", en: "— Sailing the Ionian", el: "— ιστιοπλοΐα στο Ιόνιο", de: "— Segeln im Ionischen Meer" },
  { key: "meta.location.descTail",
    en: "What to expect, where to anchor, and how far it is from our base in Lefkada.",
    el: "Τι να περιμένετε, πού να αγκυροβολήσετε και πόσο απέχει από τη βάση μας στη Λευκάδα.",
    de: "Was Sie erwartet, wo Sie ankern, und wie weit es von unserer Basis auf Lefkada ist." },

  { key: "meta.itinerary.suffix", en: "— Ionian Route", el: "— διαδρομή στο Ιόνιο", de: "— Route im Ionischen Meer" },
  { key: "meta.itinerary.days", en: "days", el: "μέρες", de: "Tage" },
  { key: "meta.itinerary.miles", en: "nautical miles", el: "ναυτικά μίλια", de: "Seemeilen" },
  { key: "meta.itinerary.from", en: "from", el: "από", de: "ab" },
  { key: "meta.itinerary.descTail",
    en: "Day by day, with the anchorages and harbours along the way.",
    el: "Μέρα με τη μέρα, με τα αγκυροβόλια και τα λιμάνια στη διαδρομή.",
    de: "Tag für Tag, mit den Ankerplätzen und Häfen unterwegs." },

  { key: "meta.service.suffix", en: "— Charter Services, Lefkada", el: "— υπηρεσίες ναύλωσης, Λευκάδα", de: "— Charter-Leistungen, Lefkada" },
  { key: "meta.service.descPad",
    en: "Arranged before you arrive, by the family who have run this base since 1979.",
    el: "Κανονισμένα πριν φτάσετε, από την οικογένεια που κρατά αυτή τη βάση από το 1979.",
    de: "Geregelt, bevor Sie ankommen — von der Familie, die diese Basis seit 1979 führt." },
  { key: "meta.service.descFallback", en: "for your charter from Lefkada.", el: "για τη ναύλωσή σας από τη Λευκάδα.", de: "für Ihren Charter ab Lefkada." },

  { key: "meta.yacht.cabins", en: "cabins", el: "καμπίνες", de: "Kabinen" },
  { key: "meta.yacht.guests", en: "guests", el: "επιβάτες", de: "Gäste" },
  { key: "meta.yacht.kind", en: "Sailing yacht", el: "Ιστιοπλοϊκό", de: "Segelyacht" },
  { key: "meta.notFound", en: "Not found", el: "Δεν βρέθηκε", de: "Nicht gefunden" },
]

async function main() {
  const tooLong: string[] = []
  for (const e of E) {
    const data = { ...e, namespace: "meta" }
    await db.siteTranslation.upsert({ where: { key: e.key }, create: data, update: data })
    for (const l of ["en", "el", "de"] as const) {
      const v = e[l]
      const limit = e.key === "meta.home.title" ? 60 : e.key.endsWith(".title") ? 47 : e.key.endsWith(".description") ? 158 : 999
      if (v.length > limit) tooLong.push(`${e.key}[${l}] ${v.length} > ${limit}`)
    }
  }
  console.log(`${E.length} keys written`)
  if (tooLong.length) { console.log("\nover the limit:"); tooLong.forEach((x) => console.log("  " + x)) }
  else console.log("all titles and descriptions within their limits")
  await db.$disconnect()
}
main()

import "dotenv/config"
import { db } from "../lib/db"

/**
 * The one-paragraph answer at the top of each main page.
 *
 * Greek and German were drafted by the translator and then corrected by hand,
 * because it reached for words the site had already settled: a skipper here is
 * a κυβερνήτης, not a πλοηγός (that is a harbour pilot), and bareboat is
 * χωρίς πλήρωμα, not γυμνά. The same pass fixes two older strings that had
 * the identical faults.
 */
const ENTRIES = [
  {
    key: "answer.eyebrow",
    en: "In short",
    el: "Εν συντομία",
    de: "Kurz gesagt",
  },
  {
    key: "answer.home",
    en: "IYC Ionische Yacht Charter is a family business that has sailed out of Lefkada since 1979. We charter our own sailing yachts and catamarans from one base in Lefkada harbour — bareboat or with a skipper — across the Ionian Sea from May to October. A Greek base, a German office, the same family throughout.",
    el: "Η IYC Ionische Yacht Charter είναι μια οικογενειακή επιχείρηση που ταξιδεύει από τη Λευκάδα από το 1979. Ναυλώνουμε τα δικά μας ιστιοπλοϊκά και καταμαράν από μία βάση στο λιμάνι της Λευκάδας — χωρίς πλήρωμα ή με κυβερνήτη — σε όλο το Ιόνιο, από τον Μάιο ως τον Οκτώβριο. Ελληνική βάση, γερμανικό γραφείο, η ίδια οικογένεια σε όλα.",
    de: "IYC Ionische Yacht Charter ist ein Familienbetrieb, der seit 1979 von Lefkada aus segelt. Wir verchartern unsere eigenen Segelyachten und Katamarane von einer einzigen Basis im Hafen von Lefkada — bareboat oder mit Skipper — im gesamten Ionischen Meer von Mai bis Oktober. Griechische Basis, deutsches Büro, durchgehend dieselbe Familie.",
  },
  {
    key: "answer.fleet",
    en: "Every yacht here is owned by us and berthed in Lefkada, so what you read is what you board, with no broker in between. Sailing yachts and catamarans, chartered by the week, bareboat or with a skipper. Availability and prices come live from our booking system rather than from a brochure.",
    el: "Κάθε σκάφος εδώ είναι δικό μας και ελλιμενίζεται στη Λευκάδα, οπότε αυτό που διαβάζετε είναι αυτό στο οποίο θα επιβιβαστείτε — χωρίς μεσάζοντα. Ιστιοπλοϊκά και καταμαράν, με ναύλωση ανά εβδομάδα, χωρίς πλήρωμα ή με κυβερνήτη. Η διαθεσιμότητα και οι τιμές έρχονται ζωντανά από το σύστημα κρατήσεών μας, όχι από έναν κατάλογο.",
    de: "Jede Yacht hier gehört uns und liegt in Lefkada — was Sie lesen, ist das Boot, das Sie betreten, ohne Makler dazwischen. Segelyachten und Katamarane, wochenweise verchartert, bareboat oder mit Skipper. Verfügbarkeit und Preise kommen live aus unserem Buchungssystem, nicht aus einem Prospekt.",
  },
  {
    key: "answer.locations",
    en: "These are the islands and anchorages you can reach from Lefkada within a week's sailing. The Ionian lies parallel to the mainland coast, so hardly a point in it is more than 30 nautical miles from a protected harbour — which is why it forgives beginners and still rewards experienced crews.",
    el: "Αυτά είναι τα νησιά και τα αγκυροβόλια που φτάνετε από τη Λευκάδα μέσα σε μια εβδομάδα πλεύσης. Το Ιόνιο απλώνεται παράλληλα στην ηπειρωτική ακτή, οπότε δύσκολα βρίσκεις σημείο πάνω από 30 ναυτικά μίλια από προστατευμένο λιμάνι — γι' αυτό συγχωρεί τους αρχάριους και εξακολουθεί να ανταμείβει τα έμπειρα πληρώματα.",
    de: "Das sind die Inseln und Ankerplätze, die Sie von Lefkada aus in einer Segelwoche erreichen. Das Ionische Meer verläuft parallel zur Festlandküste, sodass kaum ein Punkt darin mehr als 30 Seemeilen von einem geschützten Hafen entfernt liegt — deshalb verzeiht es Anfängern und belohnt trotzdem erfahrene Crews.",
  },
  {
    key: "answer.itineraries",
    en: "Each route here starts and finishes on our own pontoon in Lefkada and is built around a week aboard. Most legs run two to four hours, which leaves the rest of the day for swimming rather than sailing. Treat them as drafts: we redraw any of them around your dates, your crew and the wind.",
    el: "Κάθε διαδρομή εδώ ξεκινά και τελειώνει στη δική μας προβλήτα στη Λευκάδα και είναι φτιαγμένη για μια εβδομάδα πάνω στο σκάφος. Τα περισσότερα σκέλη κρατούν δύο με τέσσερις ώρες, κι έτσι η υπόλοιπη μέρα μένει για μπάνιο, όχι για πλεύση. Δείτε τες ως προσχέδια: ξαναχαράζουμε οποιαδήποτε γύρω από τις ημερομηνίες σας, το πλήρωμά σας και τον άνεμο.",
    de: "Jede Route hier beginnt und endet an unserem eigenen Steg in Lefkada und ist auf eine Woche an Bord ausgelegt. Die meisten Etappen dauern zwei bis vier Stunden — der Rest des Tages bleibt zum Schwimmen statt zum Segeln. Betrachten Sie sie als Entwürfe: Wir zeichnen jede davon um Ihre Termine, Ihre Crew und den Wind neu.",
  },
  {
    key: "answer.services",
    en: "The things we arrange around the charter itself — custom routes, concierge, catering, safety, onboard amenities, flexible booking and our skippers school. Each is handled by the same office in Lefkada that hands you the keys, so there is nobody else to chase when something needs changing.",
    el: "Όσα οργανώνουμε γύρω από την ίδια τη ναύλωση — προσαρμοσμένες διαδρομές, concierge, catering, ασφάλεια, παροχές επί του σκάφους, ευέλικτη κράτηση και η σχολή κυβερνητών μας. Όλα τα χειρίζεται το ίδιο γραφείο στη Λευκάδα που σας δίνει τα κλειδιά, οπότε δεν έχετε να κυνηγήσετε κανέναν άλλον όταν κάτι χρειαστεί να αλλάξει.",
    de: "Was wir rund um die Charter selbst organisieren — maßgeschneiderte Routen, Concierge, Catering, Sicherheit, Bordausstattung, flexible Buchung und unsere Skipperschule. Alles davon betreut dasselbe Büro in Lefkada, das Ihnen die Schlüssel übergibt — es gibt also niemanden sonst hinterherzulaufen, wenn sich etwas ändern soll.",
  },

  /* Older strings with the same two faults: "γυμνό κατάρτι" is a naked mast,
     and a πλοηγός is the pilot who brings ships into harbour. */
  {
    key: "services.subtitle",
    en: "Everything you need for an unforgettable voyage — from bareboat to fully crewed luxury, tailored to your journey.",
    el: "Όλα όσα χρειάζεστε για ένα αξέχαστο ταξίδι — από ναύλωση χωρίς πλήρωμα ως πλήρως επανδρωμένη πολυτέλεια, προσαρμοσμένα στο δικό σας ταξίδι.",
    de: "Alles, was Sie für eine unvergessliche Reise benötigen — vom Bareboat-Charter bis zur voll bemannten Luxusyacht, maßgeschneidert auf Ihre Route.",
  },
  {
    key: "home.itineraries.description",
    en: "Hand-crafted itineraries through the most captivating waters, designed by our expert skippers.",
    el: "Προσεκτικά σχεδιασμένα δρομολόγια μέσα από τα πιο μαγευτικά νερά, σχεδιασμένα από τους έμπειρους κυβερνήτες μας.",
    de: "Maßgeschneiderte Routen durch die faszinierendsten Gewässer, entworfen von unseren erfahrenen Skippern.",
  },
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

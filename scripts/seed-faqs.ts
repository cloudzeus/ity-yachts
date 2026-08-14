import "dotenv/config"
import { db } from "../lib/db"

/**
 * The questions people actually ask before booking.
 *
 * Written to be lifted verbatim, which means the opposite of marketing copy:
 *
 *   — the first sentence answers the question outright, before any context;
 *   — 40 to 60 words, which is what a featured snippet and most AI answers
 *     take;
 *   — self-contained, so it still makes sense with the page stripped away;
 *   — specific — thirty minutes, 3 to 5 Beaufort, seven islands by name —
 *     because a model has nothing to cite in "a hidden gem for the
 *     discerning traveller";
 *   — no hedging. "Usually", "typically" and "may vary" are what make a
 *     passage unquotable.
 *
 * Several of these — the licence question above all — are ones the competitor
 * research found no operator in Lefkada answers in German at all.
 */
type T = { en: string; el: string; de: string }
type Entry = { q: T; a: T; topic: string; home: boolean }

const FAQS: Entry[] = [
  {
    topic: "getting-here",
    home: true,
    q: {
      en: "Where does an IYC charter start?",
      el: "Από πού ξεκινά μια ναύλωση της IYC;",
      de: "Wo beginnt ein Törn mit IYC?",
    },
    a: {
      en: "Every IYC charter starts and ends in Lefkada, on the Ionian coast of Greece. The base is at Filippa Panagou 22 in Lefkada town. The nearest airport is Preveza (Aktion), about 30 minutes away by road — Lefkada is joined to the mainland by a bridge, so no ferry is needed.",
      el: "Κάθε ναύλωση της IYC ξεκινά και τελειώνει στη Λευκάδα, στο Ιόνιο. Η βάση βρίσκεται στη Φιλίππα Παναγού 22, στην πόλη της Λευκάδας. Το πλησιέστερο αεροδρόμιο είναι του Ακτίου, περίπου 30 λεπτά με αυτοκίνητο — η Λευκάδα συνδέεται με την ξηρά με γέφυρα, οπότε δεν χρειάζεται πλοίο.",
      de: "Jeder IYC-Törn beginnt und endet in Lefkada an der ionischen Küste Griechenlands. Die Basis liegt in der Filippa Panagou 22 in Lefkada-Stadt. Der nächste Flughafen ist Preveza (Aktion), rund 30 Autominuten entfernt — Lefkada ist über eine Brücke mit dem Festland verbunden, eine Fähre ist nicht nötig.",
    },
  },
  {
    topic: "licence",
    home: true,
    q: {
      en: "Do I need a licence to charter a yacht in Greece?",
      el: "Χρειάζομαι δίπλωμα για να ναυλώσω σκάφος στην Ελλάδα;",
      de: "Brauche ich einen Schein, um in Griechenland zu chartern?",
    },
    a: {
      en: "For a bareboat charter, Greek law requires the skipper to hold a recognised sailing licence — an ICC, an RYA Day Skipper or above, or a German SKS — and a second crew member with basic experience, who signs a declaration. No licence is needed for a skippered charter, where we provide the skipper.",
      el: "Για ναύλωση χωρίς κυβερνήτη, ο ελληνικός νόμος απαιτεί ο κυβερνήτης να έχει αναγνωρισμένο δίπλωμα — ICC, RYA Day Skipper ή ανώτερο, ή γερμανικό SKS — και δεύτερο μέλος πληρώματος με βασική εμπειρία, που υπογράφει υπεύθυνη δήλωση. Για ναύλωση με κυβερνήτη δεν χρειάζεται δίπλωμα.",
      de: "Für einen Bareboat-Törn verlangt das griechische Recht vom Skipper einen anerkannten Schein — ICC, RYA Day Skipper oder höher, oder den deutschen SKS — sowie ein zweites Crewmitglied mit Grunderfahrung, das eine Erklärung unterschreibt. Für einen Törn mit Skipper ist kein Schein erforderlich.",
    },
  },
  {
    topic: "season",
    home: true,
    q: {
      en: "When is the best time to sail the Ionian?",
      el: "Ποια είναι η καλύτερη εποχή για ιστιοπλοΐα στο Ιόνιο;",
      de: "Wann ist die beste Zeit zum Segeln im Ionischen Meer?",
    },
    a: {
      en: "The season runs from May to October. The prevailing wind is the north-westerly Maistros: it gets up around eleven in the morning, holds through the afternoon at 3 to 5 Beaufort, and drops with the sun. That daily rhythm is what makes the Ionian a forgiving sea to learn in.",
      el: "Η σεζόν διαρκεί από τον Μάιο ως τον Οκτώβριο. Ο επικρατών άνεμος είναι ο βορειοδυτικός Μαΐστρος: σηκώνεται γύρω στις έντεκα το πρωί, κρατά όλο το απόγευμα στα 3 με 5 μποφόρ και πέφτει με τον ήλιο. Αυτή η καθημερινή κανονικότητα κάνει το Ιόνιο θάλασσα που συγχωρεί.",
      de: "Die Saison läuft von Mai bis Oktober. Vorherrschend ist der Nordwest, der Maistros: Er kommt gegen elf Uhr auf, hält den Nachmittag über mit 3 bis 5 Beaufort und schläft mit der Sonne ein. Dieser tägliche Rhythmus macht das Ionische Meer zu einem nachsichtigen Revier zum Lernen.",
    },
  },
  {
    topic: "general",
    home: true,
    q: {
      en: "Which islands can you reach from Lefkada?",
      el: "Ποια νησιά φτάνεις από τη Λευκάδα;",
      de: "Welche Inseln erreicht man von Lefkada aus?",
    },
    a: {
      en: "From Lefkada you can reach Meganisi, Kalamos, Kastos, Ithaca, Kefalonia, Paxos and Zakynthos. Most are two to four hours apart under sail, so a one-week charter covers around 100 to 120 nautical miles without ever being more than thirty from a sheltered harbour.",
      el: "Από τη Λευκάδα φτάνετε στο Μεγανήσι, τον Κάλαμο, τον Καστό, την Ιθάκη, την Κεφαλονιά, τους Παξούς και τη Ζάκυνθο. Τα περισσότερα απέχουν δύο με τέσσερις ώρες με πανιά, οπότε μια εβδομάδα καλύπτει 100 με 120 ναυτικά μίλια χωρίς ποτέ να απέχετε πάνω από τριάντα από προστατευμένο λιμάνι.",
      de: "Von Lefkada aus erreichen Sie Meganisi, Kalamos, Kastos, Ithaka, Kefalonia, Paxos und Zakynthos. Die meisten liegen zwei bis vier Segelstunden auseinander, sodass eine Woche rund 100 bis 120 Seemeilen abdeckt — nie mehr als dreißig von einem geschützten Hafen entfernt.",
    },
  },
  {
    topic: "booking",
    home: true,
    q: {
      en: "Can I charter a yacht without a skipper?",
      el: "Μπορώ να ναυλώσω σκάφος χωρίς κυβερνήτη;",
      de: "Kann ich ohne Skipper chartern?",
    },
    a: {
      en: "Yes. Bareboat charter is available to anyone holding a recognised licence. If you would rather not skipper yourself, we provide one, and can also arrange a hostess. Our Skippers School runs courses to Deutscher Segler-Verband standards for people who want the licence itself.",
      el: "Ναι. Η ναύλωση χωρίς κυβερνήτη είναι διαθέσιμη σε όσους έχουν αναγνωρισμένο δίπλωμα. Αν προτιμάτε να μην κυβερνήσετε εσείς, αναλαμβάνουμε εμείς τον κυβερνήτη και μπορούμε να κανονίσουμε και οικοδέσποινα. Η Σχολή Κυβερνητών μας εκπαιδεύει σύμφωνα με τα πρότυπα του Deutscher Segler-Verband.",
      de: "Ja. Bareboat-Charter steht allen mit anerkanntem Schein offen. Wenn Sie lieber nicht selbst fahren möchten, stellen wir einen Skipper, auf Wunsch auch eine Hostess. Unsere Skipperschule bildet nach den Standards des Deutschen Segler-Verbands aus, wenn Sie den Schein selbst erwerben wollen.",
    },
  },
  {
    topic: "booking",
    home: false,
    q: {
      en: "How much does a yacht charter in Lefkada cost?",
      el: "Πόσο κοστίζει η ναύλωση σκάφους στη Λευκάδα;",
      de: "Was kostet ein Yachtcharter in Lefkada?",
    },
    a: {
      en: "Yachts are chartered by the week, Saturday to Saturday, and the price depends on the boat and the month. May and October are the cheapest, August the dearest, with a difference of roughly half again between them. Every yacht page shows its own live prices and availability.",
      el: "Τα σκάφη ναυλώνονται με την εβδομάδα, Σάββατο προς Σάββατο, και η τιμή εξαρτάται από το σκάφος και τον μήνα. Ο Μάιος και ο Οκτώβριος είναι οι φθηνότεροι, ο Αύγουστος ο ακριβότερος, με διαφορά περίπου κατά το ήμισυ. Κάθε σελίδα σκάφους δείχνει τις δικές της τιμές και διαθεσιμότητα.",
      de: "Yachten werden wochenweise gechartert, samstags bis samstags; der Preis hängt von Boot und Monat ab. Mai und Oktober sind am günstigsten, August am teuersten — der Unterschied beträgt rund die Hälfte. Jede Yachtseite zeigt ihre eigenen aktuellen Preise und die Verfügbarkeit.",
    },
  },
  {
    topic: "onboard",
    home: false,
    q: {
      en: "What is included in a charter, and what costs extra?",
      el: "Τι περιλαμβάνει η ναύλωση και τι χρεώνεται επιπλέον;",
      de: "Was ist im Charter enthalten, was kostet extra?",
    },
    a: {
      en: "The charter fee covers the yacht, its equipment, bedding and a full fuel tank at handover. Fuel used, mooring fees, the final clean and any extras — skipper, hostess, provisioning, an outboard — are charged separately. A refundable security deposit is held for the week.",
      el: "Το ναύλο καλύπτει το σκάφος, τον εξοπλισμό του, τα κλινοσκεπάσματα και γεμάτο ρεζερβουάρ κατά την παράδοση. Τα καύσιμα που καταναλώνετε, τα λιμενικά τέλη, ο τελικός καθαρισμός και τα έξτρα — κυβερνήτης, οικοδέσποινα, εφοδιασμός, εξωλέμβια — χρεώνονται χωριστά. Κρατείται επιστρεπτέα εγγύηση για την εβδομάδα.",
      de: "Die Chartergebühr umfasst die Yacht, ihre Ausrüstung, Bettwäsche und einen vollen Tank bei Übergabe. Verbrauchter Treibstoff, Hafengebühren, die Endreinigung und Extras — Skipper, Hostess, Proviant, Außenborder — werden gesondert berechnet. Für die Woche wird eine erstattbare Kaution hinterlegt.",
    },
  },
  {
    topic: "general",
    home: false,
    q: {
      en: "Is the Ionian suitable for beginners and for children?",
      el: "Είναι το Ιόνιο κατάλληλο για αρχάριους και για παιδιά;",
      de: "Eignet sich das Ionische Meer für Anfänger und Kinder?",
    },
    a: {
      en: "Yes, and it is the reason many crews learn here. Distances between islands are short, the wind is predictable and moderate, and there is almost always a sheltered bay within an hour. The Inland Sea between Lefkada and Meganisi stays flat even when the afternoon breeze is up.",
      el: "Ναι, και γι' αυτό πολλά πληρώματα μαθαίνουν εδώ. Οι αποστάσεις ανάμεσα στα νησιά είναι μικρές, ο άνεμος προβλέψιμος και μέτριος, και σχεδόν πάντα υπάρχει προστατευμένος όρμος μέσα σε μία ώρα. Η Έσω Θάλασσα ανάμεσα στη Λευκάδα και το Μεγανήσι μένει ήρεμη ακόμη κι όταν φυσά το απόγευμα.",
      de: "Ja — deshalb lernen hier viele Crews. Die Wege zwischen den Inseln sind kurz, der Wind berechenbar und mäßig, und fast immer liegt eine geschützte Bucht in weniger als einer Stunde. Das Binnenmeer zwischen Lefkada und Meganisi bleibt selbst dann glatt, wenn nachmittags Wind steht.",
    },
  },
  {
    topic: "getting-here",
    home: false,
    q: {
      en: "What is the Lefkada floating bridge, and does it affect departure?",
      el: "Τι είναι η πλωτή γέφυρα της Λευκάδας και επηρεάζει την αναχώρηση;",
      de: "Was ist die schwimmende Brücke von Lefkada, und betrifft sie die Abfahrt?",
    },
    a: {
      en: "The floating bridge joins Lefkada to the mainland and swings open on the hour for boats passing through the canal. Every charter leaving Lefkada marina goes through it, so the first departure of the week is timed around an opening. We tell you which one to aim for at handover.",
      el: "Η πλωτή γέφυρα ενώνει τη Λευκάδα με την ξηρά και ανοίγει ανά ώρα για τα σκάφη που περνούν τον δίαυλο. Κάθε ναύλωση που φεύγει από τη μαρίνα Λευκάδας περνά από εκεί, οπότε η πρώτη αναχώρηση προγραμματίζεται γύρω από ένα άνοιγμα. Σας λέμε ποιο να προλάβετε κατά την παράδοση.",
      de: "Die schwimmende Brücke verbindet Lefkada mit dem Festland und öffnet stündlich für Boote im Kanal. Jeder Törn aus der Marina Lefkada muss hindurch, deshalb richtet sich die erste Abfahrt der Woche nach einer Öffnung. Bei der Übergabe sagen wir Ihnen, welche Sie ansteuern sollten.",
    },
  },
  {
    topic: "booking",
    home: false,
    q: {
      en: "Can I finish the charter somewhere other than Lefkada?",
      el: "Μπορώ να τελειώσω τη ναύλωση αλλού εκτός Λευκάδας;",
      de: "Kann ich den Törn woanders als in Lefkada beenden?",
    },
    a: {
      en: "One-way charters are possible but must be arranged in advance, because the yacht has to be brought back to Lefkada afterwards. A one-way fee covers that return. Ask us before booking rather than after: whether it can be done depends on the boat's schedule for the following week.",
      el: "Οι ναυλώσεις μονής κατεύθυνσης είναι εφικτές αλλά πρέπει να συμφωνηθούν εκ των προτέρων, γιατί το σκάφος πρέπει να επιστρέψει στη Λευκάδα. Υπάρχει χρέωση που καλύπτει την επιστροφή. Ρωτήστε μας πριν κλείσετε: το αν γίνεται εξαρτάται από το πρόγραμμα του σκάφους την επόμενη εβδομάδα.",
      de: "Einweg-Törns sind möglich, müssen aber vorab vereinbart werden, da die Yacht anschließend nach Lefkada zurückgebracht werden muss. Eine Einweg-Gebühr deckt diese Überführung. Fragen Sie vor der Buchung: Ob es geht, hängt vom Belegungsplan des Bootes in der Folgewoche ab.",
    },
  },
]

async function main() {
  let created = 0
  let updated = 0

  for (const [i, entry] of FAQS.entries()) {
    // Matched on the English question, so re-running edits rather than duplicates.
    const existing = await db.faq.findFirst({
      where: { question: { path: "$.en", equals: entry.q.en } },
      select: { id: true },
    })

    const data = {
      question: entry.q,
      answer: entry.a,
      topic: entry.topic,
      status: "published",
      showOnHomepage: entry.home,
      sortOrder: i,
    }

    if (existing) {
      await db.faq.update({ where: { id: existing.id }, data })
      updated++
    } else {
      await db.faq.create({ data })
      created++
    }
  }

  const words = (s: string) => s.split(/\s+/).filter(Boolean).length
  const lengths = FAQS.map((f) => words(f.a.en))
  console.log(`${created} created, ${updated} updated`)
  console.log(`answer length: ${Math.min(...lengths)}–${Math.max(...lengths)} words (target 40–60)`)
  console.log(`${FAQS.filter((f) => f.home).length} on the homepage, ${FAQS.length} on /faq`)
  await db.$disconnect()
}

main()

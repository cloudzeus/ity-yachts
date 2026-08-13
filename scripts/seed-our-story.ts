import "dotenv/config"
import { db } from "../lib/db"

/**
 * The "Our story" page.
 *
 * The copy lives in text_components rather than in the page builder, because
 * the builder's blocks hold a single string each and this page has to exist in
 * three languages. The photographs stay in the route — which picture carries
 * which chapter is a layout decision, not content.
 */
type T = { en: string; el: string; de: string }

const COPY: Record<string, T> = {
  "story.eyebrow": {
    en: "Since 1979",
    el: "Από το 1979",
    de: "Seit 1979",
  },
  "story.title": {
    en: "Our story",
    el: "Η ιστορία μας",
    de: "Unsere Geschichte",
  },
  "story.subtitle": {
    en: "Two countries. One family. One love for the Ionian.",
    el: "Δύο χώρες. Μία οικογένεια. Μία αγάπη για το Ιόνιο.",
    de: "Zwei Länder. Eine Familie. Eine Liebe zum Ionischen Meer.",
  },

  "story.lead": {
    en:
      "<p>Ionische Yacht Charter is more than a company that rents out sailing boats. It is a family story that joins Greece to Germany, and the sea to more than four decades of experience.</p>" +
      "<p>We have been in Lefkada, at the heart of the Ionian, since 1979 — welcoming people who want to meet Greece from the water, and to meet it differently. Personally, honestly, and with the assurance that only decades can give.</p>" +
      "<p>The Ionian is not a destination to us. It is home.</p>",
    el:
      "<p>Η Ionische Yacht Charter είναι κάτι περισσότερο από μια εταιρεία ενοικίασης ιστιοπλοϊκών. Είναι μια οικογενειακή ιστορία που ενώνει την Ελλάδα με τη Γερμανία και τη θάλασσα με περισσότερες από τέσσερις δεκαετίες εμπειρίας.</p>" +
      "<p>Από το 1979 βρισκόμαστε στη Λευκάδα, στην καρδιά του Ιονίου, καλωσορίζοντας ανθρώπους που θέλουν να γνωρίσουν την Ελλάδα από τη θάλασσα με έναν διαφορετικό τρόπο. Προσωπικά, αυθεντικά και με την ασφάλεια που προσφέρει η εμπειρία δεκαετιών.</p>" +
      "<p>Για εμάς το Ιόνιο δεν είναι απλώς ένας προορισμός. Είναι το σπίτι μας.</p>",
    de:
      "<p>Ionische Yacht Charter ist mehr als ein Unternehmen, das Segelyachten vermietet. Es ist eine Familiengeschichte, die Griechenland mit Deutschland verbindet — und das Meer mit über vier Jahrzehnten Erfahrung.</p>" +
      "<p>Seit 1979 sind wir in Lefkada, im Herzen des Ionischen Meeres, und empfangen Menschen, die Griechenland vom Wasser aus kennenlernen möchten — auf eine andere Art. Persönlich, ehrlich und mit der Sicherheit, die nur Jahrzehnte geben können.</p>" +
      "<p>Das Ionische Meer ist für uns kein Reiseziel. Es ist unser Zuhause.</p>",
  },

  // ── 1 ─────────────────────────────────────────────────────────────────────
  "story.1.heading": {
    en: "In Lefkada since 1979",
    el: "Από το 1979 στη Λευκάδα",
    de: "Seit 1979 in Lefkada",
  },
  "story.1.body": {
    en:
      "<p>IYC was among the first companies to run organised yacht charter in the Ionian. A great deal has changed since. The boats grew more modern, the technology moved on, and more and more people discovered how singular these islands are.</p>" +
      "<p>What did not change is how we treat everyone who comes to us: with personal care, with knowledge of the sea, and with a genuine interest in the voyage they are about to make.</p>" +
      "<p>The experience gathered from 1979 to today does not sit only in our boats or our maintenance schedules. It sits in knowing the place — the winds, the harbours, the safe coves, the small villages, the tavernas the locals go to. In all the small things that turn a week's holiday into a voyage you will remember for years.</p>",
    el:
      "<p>Η IYC ήταν από τις πρώτες εταιρείες που δραστηριοποιήθηκαν οργανωμένα στο yacht charter στο Ιόνιο. Από τότε έχουν αλλάξει πολλά. Τα σκάφη έγιναν πιο σύγχρονα, η τεχνολογία εξελίχθηκε και όλο και περισσότεροι άνθρωποι ανακάλυψαν τη μοναδική ομορφιά των Ιονίων Νήσων.</p>" +
      "<p>Αυτό που δεν άλλαξε είναι ο τρόπος με τον οποίο αντιμετωπίζουμε κάθε άνθρωπο που έρχεται σε εμάς. Με προσωπική φροντίδα, γνώση της θάλασσας και πραγματικό ενδιαφέρον για το ταξίδι που πρόκειται να κάνει.</p>" +
      "<p>Η εμπειρία που έχει συγκεντρωθεί από το 1979 μέχρι σήμερα δεν βρίσκεται μόνο στα σκάφη μας ή στις διαδικασίες συντήρησης. Βρίσκεται στη γνώση του τόπου. Στους ανέμους. Στα λιμάνια. Στους ασφαλείς όρμους. Στα μικρά χωριά. Στα εστιατόρια που αγαπούν οι ντόπιοι. Και σε όλες εκείνες τις λεπτομέρειες που μπορούν να μετατρέψουν μία εβδομάδα διακοπών σε ένα ταξίδι που θα θυμάσαι για χρόνια.</p>",
    de:
      "<p>IYC gehörte zu den ersten Unternehmen, die im Ionischen Meer organisiert Yachtcharter betrieben. Seither hat sich vieles verändert. Die Boote wurden moderner, die Technik entwickelte sich weiter, und immer mehr Menschen entdeckten, wie einzigartig diese Inseln sind.</p>" +
      "<p>Was sich nicht verändert hat, ist die Art, wie wir jedem Menschen begegnen, der zu uns kommt: mit persönlicher Sorgfalt, mit Kenntnis des Meeres und mit echtem Interesse an der Reise, die vor ihm liegt.</p>" +
      "<p>Die Erfahrung, die sich seit 1979 angesammelt hat, steckt nicht nur in unseren Booten oder in den Wartungsplänen. Sie steckt im Wissen um diesen Ort — um die Winde, die Häfen, die sicheren Buchten, die kleinen Dörfer, die Tavernen, in die die Einheimischen gehen. In all den Kleinigkeiten, die aus einer Urlaubswoche eine Reise machen, an die man sich jahrelang erinnert.</p>",
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  "story.2.heading": {
    en: "Greek hospitality. German thoroughness.",
    el: "Ελληνική φιλοξενία. Γερμανική συνέπεια.",
    de: "Griechische Gastfreundschaft. Deutsche Gründlichkeit.",
  },
  "story.2.body": {
    en:
      "<p>Our family has roots in both countries. Maria and Thomas's mother comes from Lefkada; their father is German.</p>" +
      "<p>That double descent is not simply part of the family history. It is how IYC works.</p>" +
      "<p>From the Greek side we keep the hospitality, the personal contact, the love of the place and an honest relationship with the guest. From the German side we keep the organisation, the precision, the reliability and the attention to detail.</p>" +
      "<p>To us these two are not opposites. They are the ideal combination — the warmth of Greece with the order of Germany.</p>",
    el:
      "<p>Η οικογένειά μας έχει ρίζες και στις δύο χώρες. Η μητέρα της Maria και του Thomas κατάγεται από τη Λευκάδα, ενώ ο πατέρας τους είναι Γερμανός.</p>" +
      "<p>Αυτή η διπλή καταγωγή δεν αποτελεί απλώς μέρος της οικογενειακής μας ιστορίας. Αποτελεί τον τρόπο με τον οποίο λειτουργεί η IYC.</p>" +
      "<p>Από την ελληνική πλευρά κρατάμε τη φιλοξενία, την προσωπική επαφή, την αγάπη για τον τόπο και την αυθεντική σχέση με τον επισκέπτη. Από τη γερμανική πλευρά κρατάμε την οργάνωση, την ακρίβεια, την αξιοπιστία και την προσοχή στη λεπτομέρεια.</p>" +
      "<p>Για εμάς αυτά τα δύο δεν είναι αντίθετα. Είναι ο ιδανικός συνδυασμός. Η ζεστασιά της Ελλάδας με την οργάνωση της Γερμανίας.</p>",
    de:
      "<p>Unsere Familie hat Wurzeln in beiden Ländern. Die Mutter von Maria und Thomas stammt aus Lefkada, ihr Vater ist Deutscher.</p>" +
      "<p>Diese doppelte Herkunft ist nicht bloß ein Teil unserer Familiengeschichte. Sie ist die Art, wie IYC arbeitet.</p>" +
      "<p>Von der griechischen Seite behalten wir die Gastfreundschaft, den persönlichen Kontakt, die Liebe zu diesem Ort und ein ehrliches Verhältnis zum Gast. Von der deutschen Seite behalten wir die Organisation, die Genauigkeit, die Verlässlichkeit und den Blick fürs Detail.</p>" +
      "<p>Für uns sind das keine Gegensätze. Es ist die ideale Verbindung — die Wärme Griechenlands mit der Ordnung Deutschlands.</p>",
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  "story.3.heading": {
    en: "A family between Lefkada and Germany",
    el: "Μια οικογένεια ανάμεσα στη Λευκάδα και τη Γερμανία",
    de: "Eine Familie zwischen Lefkada und Deutschland",
  },
  "story.3.body": {
    en:
      "<p>Today the next generation of the family carries the story on.</p>" +
      "<p>Maria Ramisch is in Lefkada and runs our base. With Greek and German roots, raised between the two cultures and years on the island behind her, she knows the Ionian not as a destination but as somebody who lives here. She speaks Greek, German and English, and is beside our guests before they cast off and for the whole of their voyage.</p>" +
      "<p>Her brother Thomas Ramisch represents IYC in Germany and is the first point of contact for many of our guests.</p>" +
      "<p>Greece and Germany may be hundreds of kilometres apart. For the IYC family they have been two sides of the same story for decades.</p>",
    el:
      "<p>Σήμερα η επόμενη γενιά της οικογένειας συνεχίζει την ιστορία της IYC.</p>" +
      "<p>Η Maria Ramisch βρίσκεται στη Λευκάδα και έχει την ευθύνη της βάσης μας. Με ελληνικές και γερμανικές ρίζες, μεγαλωμένη ανάμεσα στις δύο κουλτούρες και με πολυετή παρουσία στο νησί, γνωρίζει το Ιόνιο όχι σαν τουριστικός προορισμός αλλά σαν άνθρωπος που ζει εδώ. Μιλά ελληνικά, γερμανικά και αγγλικά και βρίσκεται δίπλα στους επισκέπτες μας πριν από την αναχώρηση αλλά και καθ' όλη τη διάρκεια του ταξιδιού τους.</p>" +
      "<p>Ο αδελφός της Thomas Ramisch εκπροσωπεί την IYC στη Γερμανία και αποτελεί το πρώτο σημείο επικοινωνίας για πολλούς από τους πελάτες μας.</p>" +
      "<p>Η Ελλάδα και η Γερμανία μπορεί να απέχουν εκατοντάδες χιλιόμετρα. Για την οικογένεια της IYC όμως αποτελούν εδώ και δεκαετίες δύο πλευρές της ίδιας ιστορίας.</p>",
    de:
      "<p>Heute führt die nächste Generation der Familie die Geschichte weiter.</p>" +
      "<p>Maria Ramisch ist in Lefkada und verantwortet unsere Basis. Mit griechischen und deutschen Wurzeln, aufgewachsen zwischen beiden Kulturen und seit vielen Jahren auf der Insel, kennt sie das Ionische Meer nicht als Reiseziel, sondern als jemand, der hier lebt. Sie spricht Griechisch, Deutsch und Englisch und ist für unsere Gäste da — vor dem Ablegen und während der gesamten Reise.</p>" +
      "<p>Ihr Bruder Thomas Ramisch vertritt IYC in Deutschland und ist für viele unserer Gäste der erste Ansprechpartner.</p>" +
      "<p>Griechenland und Deutschland mögen Hunderte Kilometer auseinanderliegen. Für die Familie IYC sind sie seit Jahrzehnten zwei Seiten derselben Geschichte.</p>",
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  "story.4.heading": {
    en: "We are not a faceless charter company",
    el: "Δεν είμαστε μια απρόσωπη εταιρεία charter",
    de: "Wir sind keine anonyme Charterfirma",
  },
  "story.4.body": {
    en:
      "<p>When you write to IYC, you are talking to people who know the boats personally, know the base, and know the water you are about to sail.</p>" +
      "<p>We do not simply want to hand you a yacht and a key. We want to know that you are setting off properly prepared, and that there is somebody beside you the moment you need one.</p>" +
      "<p>So our support begins before you even reach Lefkada and carries on until you are back — from choosing the right boat and arranging your arrival, to briefing you on the area, the weather and the routes open to you.</p>",
    el:
      "<p>Όταν επικοινωνείτε με την IYC, μιλάτε με ανθρώπους που γνωρίζουν προσωπικά τα σκάφη, τη βάση και την περιοχή στην οποία πρόκειται να ταξιδέψετε.</p>" +
      "<p>Δεν θέλουμε απλώς να σας παραδώσουμε ένα σκάφος και ένα κλειδί. Θέλουμε να γνωρίζουμε ότι ξεκινάτε το ταξίδι σας σωστά προετοιμασμένοι και ότι υπάρχει κάποιος δίπλα σας όταν τον χρειαστείτε.</p>" +
      "<p>Για αυτό η υποστήριξή μας ξεκινά πριν ακόμα φτάσετε στη Λευκάδα και συνεχίζεται μέχρι την επιστροφή σας. Από την επιλογή του κατάλληλου σκάφους και την οργάνωση της άφιξής σας μέχρι την ενημέρωση για την περιοχή, τον καιρό και τις διαδρομές που μπορείτε να ακολουθήσετε.</p>",
    de:
      "<p>Wenn Sie sich an IYC wenden, sprechen Sie mit Menschen, die die Boote persönlich kennen, die Basis kennen und das Revier kennen, in dem Sie unterwegs sein werden.</p>" +
      "<p>Wir wollen Ihnen nicht einfach ein Boot und einen Schlüssel übergeben. Wir wollen wissen, dass Sie gut vorbereitet ablegen — und dass jemand da ist, sobald Sie ihn brauchen.</p>" +
      "<p>Deshalb beginnt unsere Betreuung, bevor Sie überhaupt in Lefkada ankommen, und endet erst mit Ihrer Rückkehr: von der Wahl des passenden Bootes und der Organisation Ihrer Anreise bis zur Einweisung in Revier, Wetter und mögliche Routen.</p>",
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  "story.5.heading": {
    en: "We know the Ionian because we live here",
    el: "Γνωρίζουμε το Ιόνιο γιατί ζούμε εδώ",
    de: "Wir kennen das Ionische Meer, weil wir hier leben",
  },
  "story.5.body": {
    en:
      "<p>Lefkada sits at the heart of one of the finest sailing grounds in the Mediterranean: Ithaca, Kefalonia, Meganisi, Kalamos, Kastos, Paxos, Zakynthos. Small harbours, sheltered bays and islands that are often only a few hours' sailing from one another.</p>" +
      "<p>After this many years here we know not only where you can go, but when it is worth going, where to drop anchor, and which places genuinely repay the trip.</p>" +
      "<p>That is the knowledge we share with the people who sail with us.</p>",
    el:
      "<p>Η Λευκάδα βρίσκεται στην καρδιά ενός από τα ομορφότερα ιστιοπλοϊκά πεδία της Μεσογείου: Ιθάκη, Κεφαλονιά, Μεγανήσι, Κάλαμος, Καστός, Παξοί, Ζάκυνθος. Μικρά λιμάνια, προστατευμένοι κόλποι και νησιά που πολλές φορές βρίσκονται μόλις λίγες ώρες ιστιοπλοΐας το ένα από το άλλο.</p>" +
      "<p>Μετά από τόσα χρόνια εδώ, γνωρίζουμε όχι μόνο πού μπορείτε να πάτε αλλά και πότε αξίζει να πάτε, πού να αγκυροβολήσετε και ποια μέρη αξίζει πραγματικά να γνωρίσετε.</p>" +
      "<p>Αυτή τη γνώση μοιραζόμαστε με τους ανθρώπους που ταξιδεύουν μαζί μας.</p>",
    de:
      "<p>Lefkada liegt im Herzen eines der schönsten Segelreviere des Mittelmeers: Ithaka, Kefalonia, Meganisi, Kalamos, Kastos, Paxos, Zakynthos. Kleine Häfen, geschützte Buchten und Inseln, die oft nur wenige Segelstunden voneinander entfernt sind.</p>" +
      "<p>Nach so vielen Jahren hier wissen wir nicht nur, wohin Sie fahren können, sondern auch, wann es sich lohnt, wo Sie ankern und welche Orte den Weg wirklich wert sind.</p>" +
      "<p>Dieses Wissen teilen wir mit den Menschen, die mit uns segeln.</p>",
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  "story.6.heading": {
    en: "Experience shows in the details",
    el: "Η εμπειρία φαίνεται στις λεπτομέρειες",
    de: "Erfahrung zeigt sich im Detail",
  },
  "story.6.body": {
    en:
      "<p>More than four decades at sea have taught us that a charter is not judged by the age or the model of a boat alone. It is judged by the maintenance. The preparation. The equipment. The proper check before every departure. And above all by the people standing behind all of it.</p>" +
      "<p>That is why we give particular weight to the care and upkeep of our fleet, and to our team being there in person before, during and after the voyage.</p>",
    el:
      "<p>Περισσότερες από τέσσερις δεκαετίες στη θάλασσα μας έχουν μάθει ότι η αξιοπιστία ενός charter δεν κρίνεται μόνο από την ηλικία ή το μοντέλο ενός σκάφους. Κρίνεται από τη συντήρηση. Την προετοιμασία. Τον εξοπλισμό. Τον σωστό έλεγχο πριν από κάθε αναχώρηση. Και κυρίως από τους ανθρώπους που βρίσκονται πίσω από όλα αυτά.</p>" +
      "<p>Για αυτό δίνουμε ιδιαίτερη σημασία στη φροντίδα και τη συντήρηση του στόλου μας και στην προσωπική παρουσία της ομάδας μας πριν, κατά τη διάρκεια και μετά το ταξίδι.</p>",
    de:
      "<p>Mehr als vier Jahrzehnte auf dem Wasser haben uns gelehrt, dass sich ein Charter nicht am Alter oder am Modell eines Bootes allein bemisst. Er bemisst sich an der Wartung. An der Vorbereitung. An der Ausrüstung. An der gründlichen Kontrolle vor jedem Auslaufen. Und vor allem an den Menschen, die dahinterstehen.</p>" +
      "<p>Deshalb legen wir besonderen Wert auf die Pflege und Wartung unserer Flotte und darauf, dass unser Team vor, während und nach der Reise persönlich da ist.</p>",
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  "story.7.heading": {
    en: "A tradition that keeps moving",
    el: "Παράδοση που συνεχίζει να εξελίσσεται",
    de: "Eine Tradition, die sich weiterentwickelt",
  },
  "story.7.body": {
    en:
      "<p>We are proud of our history. But we have no intention of staying in it.</p>" +
      "<p>Each new generation of the family brings new ideas, new technology and new ways to make our guests' time better. The philosophy, though, has not moved since 1979: know our boats, know our sea, and know the people who sail with us.</p>",
    el:
      "<p>Είμαστε υπερήφανοι για την ιστορία μας. Αλλά δεν θέλουμε να μένουμε στο παρελθόν.</p>" +
      "<p>Κάθε νέα γενιά της οικογένειας φέρνει νέες ιδέες, νέες τεχνολογίες και νέους τρόπους για να κάνουμε την εμπειρία των επισκεπτών μας καλύτερη. Η φιλοσοφία όμως παραμένει η ίδια από το 1979. Να γνωρίζουμε τα σκάφη μας. Να γνωρίζουμε τη θάλασσά μας. Και να γνωρίζουμε τους ανθρώπους που ταξιδεύουν μαζί μας.</p>",
    de:
      "<p>Wir sind stolz auf unsere Geschichte. Stehen bleiben wollen wir darin aber nicht.</p>" +
      "<p>Jede neue Generation der Familie bringt neue Ideen, neue Technik und neue Wege, das Erlebnis unserer Gäste besser zu machen. Die Haltung ist seit 1979 dieselbe geblieben: unsere Boote kennen, unser Meer kennen und die Menschen kennen, die mit uns segeln.</p>",
  },

  // ── closing ───────────────────────────────────────────────────────────────
  "story.closing.heading": {
    en: "Sailing with friends",
    el: "Sailing with friends",
    de: "Sailing with friends",
  },
  "story.closing.body": {
    en:
      "<p>There is a phrase that has followed IYC for years. Sailing with friends.</p>" +
      "<p>To us it is not a slogan. It is how we want somebody to feel when they arrive in Lefkada — not as one more booking reference, but as a guest who has come to people who know the sea, love their home and want to share it.</p>" +
      "<p>That is IYC. A family with Greek and German roots. A story that began in 1979. And a love for the Ionian that is still going.</p>",
    el:
      "<p>Υπάρχει μια φράση που συνοδεύει την IYC εδώ και χρόνια. Sailing with friends.</p>" +
      "<p>Για εμάς δεν είναι απλώς ένα slogan. Είναι ο τρόπος με τον οποίο θέλουμε να αισθάνεται κάποιος όταν φτάνει στη Λευκάδα. Όχι σαν ένας ακόμη αριθμός κράτησης, αλλά σαν ένας επισκέπτης που έφτασε σε ανθρώπους που γνωρίζουν τη θάλασσα, αγαπούν τον τόπο τους και θέλουν να τον μοιραστούν μαζί του.</p>" +
      "<p>Αυτό είναι η IYC. Μια οικογένεια με ελληνικές και γερμανικές ρίζες. Μια ιστορία που ξεκίνησε το 1979. Και μια αγάπη για το Ιόνιο που συνεχίζεται μέχρι σήμερα.</p>",
    de:
      "<p>Es gibt einen Satz, der IYC seit Jahren begleitet. Sailing with friends.</p>" +
      "<p>Für uns ist das kein Slogan. Es ist das Gefühl, das jemand haben soll, wenn er in Lefkada ankommt — nicht als weitere Buchungsnummer, sondern als Gast bei Menschen, die das Meer kennen, ihre Heimat lieben und sie teilen möchten.</p>" +
      "<p>Das ist IYC. Eine Familie mit griechischen und deutschen Wurzeln. Eine Geschichte, die 1979 begann. Und eine Liebe zum Ionischen Meer, die bis heute anhält.</p>",
  },
  "story.closing.welcome": {
    en: "Welcome to the IYC family. Welcome to Lefkada.",
    el: "Καλώς ήρθατε στην οικογένεια της IYC. Καλώς ήρθατε στη Λευκάδα.",
    de: "Willkommen in der IYC-Familie. Willkommen in Lefkada.",
  },
  "story.closing.cta": {
    en: "Come and sail with us",
    el: "Ελάτε να ταξιδέψουμε μαζί",
    de: "Segeln Sie mit uns",
  },

  // ── the figures alongside the story ───────────────────────────────────────
  "story.fact.1.label": { en: "In the Ionian since", el: "Στο Ιόνιο από το", de: "Im Ionischen Meer seit" },
  "story.fact.2.value": { en: "2", el: "2", de: "2" },
  "story.fact.2.label": { en: "Countries, one family", el: "Χώρες, μία οικογένεια", de: "Länder, eine Familie" },
  "story.fact.3.value": { en: "3", el: "3", de: "3" },
  "story.fact.3.label": { en: "Languages spoken at the base", el: "Γλώσσες στη βάση μας", de: "Sprachen an unserer Basis" },
}

async function main() {
  const page = await db.page.findUnique({ where: { slug: "about-us" } })
  if (!page) throw new Error("about-us page not found")

  await db.page.update({
    where: { id: page.id },
    data: {
      name: "Our story",
      menuLabel: "Our story",
      translations: { en: "Our story", el: "Η ιστορία μας", de: "Unsere Geschichte" },
      metaTitle: "Our story — IYC Yachts",
      metaDesc:
        "Two countries, one family, and the Ionian since 1979. The story of Ionische Yacht Charter, told from Lefkada.",
      status: "published",
      showInMenu: true,
      centralMenu: true,
    },
  })

  for (const [key, translations] of Object.entries(COPY)) {
    await db.textComponent.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      create: { pageId: page.id, key, translations },
      update: { translations },
    })
  }

  console.log(`page renamed, ${Object.keys(COPY).length} text components written`)
  await db.$disconnect()
}

main()

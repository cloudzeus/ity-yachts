import "dotenv/config"
import { db } from "../lib/db"

/**
 * Two articles, written in all three languages rather than translated from
 * one — each reads for its own audience.
 *
 * The Odyssey piece deliberately makes no claim about where Nolan's film was
 * shot. Production details are not something this business can verify, and a
 * charter article does not need them: the islands Homer actually names are a
 * week's sailing from the pontoon, and that is the part we can stand behind.
 */

const CDN = "https://iycweb.b-cdn.net/locations"

const ARTICLES = [
  {
    slug: "the-odyssey-islands-you-can-sail-to",
    categorySlug: "sailing-area",
    tags: ["ithaca", "kefalonia", "lefkada", "anchorages"],
    author: "Maria Ramisch",
    readMinutes: 5,
    publishedAt: new Date("2026-08-12T09:00:00Z"),
    defaultMedia: `${CDN}/1786615800834-luxury-boats-at-gidaki-beach-on-the-island-of-itha-2026-03-16-02-13-30-utc.webp`,
    media: [
      `${CDN}/1786615794199-summer-sea-view-of-assos-village-greece-kefaloni-2026-03-25-23-45-42-utc.webp`,
      `${CDN}/1786615793645-azure-water-of-fteri-beach-cephalonia-kefalonia-2026-03-09-08-58-23-utc.webp`,
      `${CDN}/1786615801662-lefkada-greece-ionian-sea-2026-03-10-22-31-26-utc.webp`,
    ],
    metaTitle: "The Odyssey's Islands, by Yacht from Lefkada",
    metaDesc:
      "Ithaca, Kefalonia and Zakynthos are named in Homer's Odyssey, and all lie within a week's sailing of Lefkada. What is there, and how far it is.",
    title: {
      en: "The islands Homer names, and how far they are from our pontoon",
      el: "Τα νησιά που ονομάζει ο Όμηρος, και πόσο απέχουν από την προβλήτα μας",
      de: "Die Inseln, die Homer nennt — und wie weit sie von unserem Steg entfernt sind",
    },
    shortDesc: {
      en: "Nolan's film has put the Odyssey back in front of everyone this summer. Three of the islands Homer names outright are within a week's sailing of Lefkada — and one of them is Odysseus's home.",
      el: "Η ταινία του Νόλαν έφερε φέτος το καλοκαίρι την Οδύσσεια ξανά μπροστά σε όλους. Τρία από τα νησιά που ονομάζει ρητά ο Όμηρος απέχουν λιγότερο από μια εβδομάδα πλεύσης από τη Λευκάδα — και το ένα είναι το σπίτι του Οδυσσέα.",
      de: "Nolans Film hat die Odyssee in diesem Sommer wieder in aller Munde gebracht. Drei der Inseln, die Homer ausdrücklich nennt, liegen keine Segelwoche von Lefkada entfernt — und eine davon ist die Heimat des Odysseus.",
    },
    description: {
      en: `<h2>Four names, straight out of the poem</h2>
<p>When Odysseus finally tells the Phaeacians who he is, he does it by naming his neighbourhood: Ithaca, and around it Doulichion, Same and Zakynthos. Three of those four are on today's chart. Same is Kefalonia. Zakynthos never changed its name at all. Ithaca is Ithaca. Only Doulichion is still argued over.</p>
<p>All of them lie in the water we sail every week. From our pontoon in Lefkada harbour you can be at anchor off Ithaca the same afternoon.</p>

<h2>Ithaca, the one people come for</h2>
<p>It is smaller than visitors expect and quieter than its fame suggests. Vathy sits at the end of a long, almost enclosed inlet — you motor in past the headlands and the town appears all at once around the bend. Kioni and Frikes, on the north-east coast, are small quays where the whole village is the waterfront.</p>
<p>Two places on Ithaca are worth the walk. Polis Bay on the west side, where excavation turned up bronze tripods and a shrine that suggests Odysseus was being honoured here as a cult figure centuries before anyone wrote a guidebook. And the cave at Marmarospilia above Vathy, traditionally identified as the Cave of the Nymphs, where the Phaeacians are said to have left him ashore, asleep, with his treasure stacked beside him.</p>
<p>Neither is signposted the way a museum would be. That is rather the point.</p>

<h2>Kefalonia, which Homer calls Same</h2>
<p>Fiskardo at the northern tip is the one Kefalonian village the 1953 earthquake left standing, which is why its Venetian houses look nothing like the rest of the island. Sami, further down the east coast, keeps the older name. Assos sits on an isthmus under a ruined fortress and has perhaps six berths, so it rewards arriving early.</p>

<h2>The argument nobody has settled</h2>
<p>At the start of the last century the German archaeologist Wilhelm Dörpfeld dug at Nydri, on Lefkada, and concluded that Homeric Ithaca was not Ithaca at all — it was Lefkada. Most scholars did not follow him. But he was a serious archaeologist, he found real Bronze Age graves, and if you anchor in Vlycho Bay you are looking at the hillside he spent years on.</p>
<p>We mention it not to settle anything but because it is a good thing to know while you are sitting there.</p>

<h2>A week that takes in all of it</h2>
<ul>
<li>Lefkada to Meganisi — two hours, and a first night at Spartochori or Vathy</li>
<li>Meganisi to Kioni, Ithaca — under three hours down the channel</li>
<li>Kioni to Fiskardo, Kefalonia — a short hop across</li>
<li>Fiskardo to Sami or the Ithaca west coast — half a day</li>
<li>Back north to Lefkada in two easy legs</li>
</ul>
<p>Nothing on that list is more than about four hours under sail. The rest of each day is swimming.</p>

<h2>Why the film sends people here</h2>
<p>A story that has been read for three thousand years came back into wide circulation this summer, and a lot of people discovered that its geography is not mythical. Ithaca is a ferry ride from Kefalonia and an afternoon's sail from our base. You can stand in Polis Bay. The poem's islands are ordinary places where people fish and grow olives, which somehow makes them better, not worse.</p>`,

      el: `<h2>Τέσσερα ονόματα, κατευθείαν από το έπος</h2>
<p>Όταν ο Οδυσσέας λέει επιτέλους στους Φαίακες ποιος είναι, το κάνει ονομάζοντας τη γειτονιά του: την Ιθάκη, και γύρω της το Δουλίχιο, τη Σάμη και τη Ζάκυνθο. Τα τρία από τα τέσσερα βρίσκονται στον σημερινό χάρτη. Η Σάμη είναι η Κεφαλονιά. Η Ζάκυνθος δεν άλλαξε ποτέ όνομα. Η Ιθάκη είναι η Ιθάκη. Μόνο για το Δουλίχιο συζητούν ακόμη.</p>
<p>Όλα βρίσκονται στα νερά που πλέουμε κάθε εβδομάδα. Από την προβλήτα μας στο λιμάνι της Λευκάδας μπορείτε να είστε αγκυροβολημένοι έξω από την Ιθάκη το ίδιο απόγευμα.</p>

<h2>Η Ιθάκη, αυτή για την οποία έρχονται</h2>
<p>Είναι μικρότερη απ' όσο περιμένει ο επισκέπτης και πιο ήσυχη απ' όσο δείχνει η φήμη της. Το Βαθύ βρίσκεται στο βάθος ενός μακρού, σχεδόν κλειστού κόλπου — μπαίνετε με μηχανή περνώντας τα ακρωτήρια και η πόλη εμφανίζεται μονομιάς μετά τη στροφή. Οι Κιόνι και οι Φρίκες, στη βορειοανατολική ακτή, είναι μικρές προβλήτες όπου όλο το χωριό είναι η παραλία.</p>
<p>Δύο σημεία στην Ιθάκη αξίζουν το περπάτημα. Ο κόλπος Πόλις στα δυτικά, όπου οι ανασκαφές έβγαλαν χάλκινους τρίποδες και ένα ιερό που δείχνει ότι ο Οδυσσέας τιμόταν εδώ ως λατρευτική μορφή αιώνες πριν γραφτεί ο πρώτος ταξιδιωτικός οδηγός. Και η σπηλιά στο Μαρμαροσπήλαιο πάνω από το Βαθύ, που παραδοσιακά ταυτίζεται με το Άντρο των Νυμφών, εκεί όπου λένε ότι οι Φαίακες τον άφησαν στη στεριά κοιμισμένο, με τους θησαυρούς του στοιβαγμένους δίπλα του.</p>
<p>Κανένα από τα δύο δεν έχει πινακίδες όπως θα είχε ένα μουσείο. Αυτό είναι μάλλον το νόημα.</p>

<h2>Η Κεφαλονιά, που ο Όμηρος τη λέει Σάμη</h2>
<p>Το Φισκάρδο στη βόρεια άκρη είναι το μόνο χωριό της Κεφαλονιάς που άφησε όρθιο ο σεισμός του 1953, γι' αυτό και τα βενετσιάνικα σπίτια του δεν μοιάζουν με τίποτε άλλο στο νησί. Η Σάμη, πιο κάτω στην ανατολική ακτή, κρατά το παλιό όνομα. Η Άσσος κάθεται σε έναν ισθμό κάτω από ερειπωμένο κάστρο και έχει ίσως έξι θέσεις, οπότε ανταμείβει όποιον φτάνει νωρίς.</p>

<h2>Η διαφωνία που δεν έκλεισε ποτέ</h2>
<p>Στις αρχές του περασμένου αιώνα ο Γερμανός αρχαιολόγος Βίλχελμ Ντέρπφελντ έσκαψε στο Νυδρί της Λευκάδας και κατέληξε ότι η ομηρική Ιθάκη δεν ήταν καθόλου η Ιθάκη — ήταν η Λευκάδα. Οι περισσότεροι μελετητές δεν τον ακολούθησαν. Ήταν όμως σοβαρός αρχαιολόγος, βρήκε πραγματικούς τάφους της εποχής του Χαλκού, και αν αγκυροβολήσετε στον κόλπο του Βλυχού κοιτάτε την πλαγιά όπου πέρασε χρόνια.</p>
<p>Το αναφέρουμε όχι για να λύσουμε κάτι, αλλά επειδή αξίζει να το ξέρετε ενώ κάθεστε εκεί.</p>

<h2>Μια εβδομάδα που τα περιλαμβάνει όλα</h2>
<ul>
<li>Λευκάδα προς Μεγανήσι — δύο ώρες, και πρώτη νύχτα στο Σπαρτοχώρι ή στο Βαθύ</li>
<li>Μεγανήσι προς Κιόνι Ιθάκης — κάτω από τρεις ώρες μέσα από το στενό</li>
<li>Κιόνι προς Φισκάρδο Κεφαλονιάς — ένα μικρό πέρασμα απέναντι</li>
<li>Φισκάρδο προς Σάμη ή τη δυτική Ιθάκη — μισή μέρα</li>
<li>Επιστροφή βόρεια στη Λευκάδα σε δύο άνετα σκέλη</li>
</ul>
<p>Τίποτε από αυτά δεν ξεπερνά τις τέσσερις ώρες υπό πανιά. Η υπόλοιπη μέρα είναι για μπάνιο.</p>

<h2>Γιατί η ταινία στέλνει κόσμο εδώ</h2>
<p>Μια ιστορία που διαβάζεται τρεις χιλιάδες χρόνια ξαναμπήκε φέτος το καλοκαίρι στην κυκλοφορία, και πολύς κόσμος ανακάλυψε ότι η γεωγραφία της δεν είναι μυθική. Η Ιθάκη απέχει ένα φέρι από την Κεφαλονιά και ένα απόγευμα πλεύσης από τη βάση μας. Μπορείτε να σταθείτε στον κόλπο Πόλις. Τα νησιά του έπους είναι συνηθισμένοι τόποι όπου οι άνθρωποι ψαρεύουν και βγάζουν λάδι — κάτι που τα κάνει καλύτερα, όχι χειρότερα.</p>`,

      de: `<h2>Vier Namen, direkt aus dem Epos</h2>
<p>Als Odysseus den Phaiaken endlich sagt, wer er ist, tut er es, indem er seine Nachbarschaft aufzählt: Ithaka, und ringsum Dulichion, Same und Zakynthos. Drei der vier stehen auf der heutigen Seekarte. Same ist Kefalonia. Zakynthos hat seinen Namen nie geändert. Ithaka ist Ithaka. Nur über Dulichion wird noch gestritten.</p>
<p>Alle liegen in dem Revier, das wir jede Woche befahren. Von unserem Steg im Hafen von Lefkada aus können Sie noch am selben Nachmittag vor Ithaka ankern.</p>

<h2>Ithaka, der Grund der Reise</h2>
<p>Es ist kleiner, als Besucher erwarten, und stiller, als sein Ruf vermuten lässt. Vathy liegt am Ende einer langen, fast geschlossenen Bucht — Sie motoren an den Landzungen vorbei, und hinter der Biegung erscheint der Ort auf einmal. Kioni und Frikes an der Nordostküste sind kleine Kais, an denen das ganze Dorf aus Uferpromenade besteht.</p>
<p>Zwei Orte auf Ithaka lohnen den Fußweg. Die Bucht von Polis im Westen, wo Ausgrabungen bronzene Dreifüße und ein Heiligtum zutage brachten — ein Hinweis darauf, dass Odysseus hier als Kultfigur verehrt wurde, Jahrhunderte bevor irgendjemand einen Reiseführer schrieb. Und die Höhle von Marmarospilia oberhalb von Vathy, traditionell als Nymphenhöhle gedeutet, wo die Phaiaken ihn schlafend an Land gelegt haben sollen, seine Schätze neben ihm aufgestapelt.</p>
<p>Keiner der beiden Orte ist ausgeschildert wie ein Museum. Das ist eher der Punkt.</p>

<h2>Kefalonia, bei Homer Same</h2>
<p>Fiskardo an der Nordspitze ist das einzige Dorf Kefalonias, das das Erdbeben von 1953 stehen ließ — deshalb sehen seine venezianischen Häuser aus wie nichts sonst auf der Insel. Sami weiter südlich an der Ostküste trägt noch den alten Namen. Assos sitzt auf einer Landenge unter einer verfallenen Festung und hat vielleicht sechs Liegeplätze, es belohnt also frühe Ankunft.</p>

<h2>Der Streit, den niemand beigelegt hat</h2>
<p>Zu Beginn des vorigen Jahrhunderts grub der deutsche Archäologe Wilhelm Dörpfeld bei Nydri auf Lefkada und kam zu dem Schluss, das homerische Ithaka sei gar nicht Ithaka gewesen — sondern Lefkada. Die meisten Fachleute folgten ihm nicht. Aber er war ein ernsthafter Archäologe, er fand echte bronzezeitliche Gräber, und wer in der Bucht von Vlycho ankert, blickt auf den Hang, an dem er Jahre verbracht hat.</p>
<p>Wir erwähnen es nicht, um etwas zu entscheiden, sondern weil man es gut wissen kann, während man dort liegt.</p>

<h2>Eine Woche, die alles mitnimmt</h2>
<ul>
<li>Lefkada nach Meganisi — zwei Stunden, erste Nacht in Spartochori oder Vathy</li>
<li>Meganisi nach Kioni auf Ithaka — knapp drei Stunden durch den Kanal</li>
<li>Kioni nach Fiskardo auf Kefalonia — ein kurzer Schlag hinüber</li>
<li>Fiskardo nach Sami oder an die Westküste Ithakas — ein halber Tag</li>
<li>In zwei entspannten Etappen zurück nach Norden</li>
</ul>
<p>Nichts davon dauert mehr als etwa vier Stunden unter Segeln. Der Rest des Tages gehört dem Wasser.</p>

<h2>Warum der Film Menschen hierher schickt</h2>
<p>Eine Geschichte, die seit dreitausend Jahren gelesen wird, kam in diesem Sommer wieder in Umlauf, und viele entdeckten dabei, dass ihre Geografie nicht mythisch ist. Ithaka ist eine Fährfahrt von Kefalonia entfernt und einen Nachmittag Segeln von unserer Basis. Man kann in der Bucht von Polis stehen. Die Inseln des Epos sind gewöhnliche Orte, an denen Menschen fischen und Oliven ernten — was sie eher besser macht als schlechter.</p>`,
    },
  },

  {
    slug: "why-the-ionian-and-not-the-cyclades",
    categorySlug: "sailing-area",
    tags: ["weather-wind", "first-charter", "family-sailing"],
    author: "Thomas Ramisch",
    readMinutes: 5,
    publishedAt: new Date("2026-08-13T09:00:00Z"),
    defaultMedia: `${CDN}/1786615801662-lefkada-greece-ionian-sea-2026-03-10-22-31-26-utc.webp`,
    media: [
      `${CDN}/1786615802375-yacht-boat-at-sarakiniko-beach-in-aegean-sea-milo-2026-03-09-22-09-03-utc.webp`,
      `${CDN}/1786615795120-azure-hidden-bay-on-greek-island-crystal-clear-wa-2026-03-09-22-08-24-utc.webp`,
    ],
    metaTitle: "Ionian or Cyclades? The Meltemi Decides",
    metaDesc:
      "In July and August the Meltemi blows 6 to 8 Beaufort across the Aegean for days at a time. The Ionian's Maistros gets up after lunch and drops at sunset.",
    title: {
      en: "Why we sail the Ionian and not the Cyclades",
      el: "Γιατί πλέουμε στο Ιόνιο και όχι στις Κυκλάδες",
      de: "Warum wir im Ionischen Meer segeln und nicht in den Kykladen",
    },
    shortDesc: {
      en: "One wind settles the question. In July and August the Meltemi can hold 6 to 8 Beaufort across the Aegean for days on end. The Ionian's Maistros gets up after lunch and goes to bed with the sun.",
      el: "Ένας άνεμος κρίνει το ζήτημα. Τον Ιούλιο και τον Αύγουστο το μελτέμι μπορεί να κρατήσει 6 με 8 μποφόρ στο Αιγαίο για μέρες. Ο μαΐστρος του Ιονίου σηκώνεται μετά το μεσημέρι και κοιμάται με τον ήλιο.",
      de: "Ein Wind entscheidet die Frage. Im Juli und August kann der Meltemi tagelang mit 6 bis 8 Beaufort über die Ägäis stehen. Der Maistros im Ionischen Meer kommt nach dem Mittag auf und legt sich mit der Sonne.",
    },
    description: {
      en: `<h2>The Meltemi is not a gust, it is a season</h2>
<p>The Meltemi is a northerly that sets in over the Aegean in high summer and can stay for three, four, five days without a break. At its ordinary strength it is 5 to 6 Beaufort. In a bad week it reaches 7, and gusts through the channels between islands come harder than the open-water number suggests.</p>
<p>It is a magnificent wind if you came to sail hard and your crew is experienced. It is a difficult one if you have children aboard, if this is your first bareboat, or if your plan depends on being somewhere on Thursday.</p>

<h2>What the Ionian does instead</h2>
<p>The Maistros is a thermal north-westerly. It is glassy at breakfast, fills in around eleven, holds 3 to 5 Beaufort through the afternoon and drops away with the sun. It does this most days from May to October, and it does it on a schedule you can plan a week around.</p>
<p>You sail after lunch. You anchor before dinner. Nobody is up at four in the morning re-laying an anchor because the wind backed.</p>

<h2>Distance is the other half of it</h2>
<p>The Cyclades are scattered across open water. Some of the crossings are 30 to 50 nautical miles with nothing in between, and a good number of the anchorages are open to the north — which is exactly where the Meltemi comes from.</p>
<p>The Ionian islands lie in a line parallel to the mainland coast. Hardly a point in the whole area is more than about 30 nautical miles from a protected harbour, and most legs are two to four hours. If the afternoon turns unpleasant, shelter is close enough that turning back costs you an hour, not a day.</p>

<h2>What that means for the people on board</h2>
<ul>
<li><strong>A first charter</strong> — mistakes here are cheap. There is room to make them.</li>
<li><strong>Children</strong> — short passages, warm water, an anchorage every afternoon.</li>
<li><strong>Anyone who gets seasick</strong> — the fetch is short, so the sea state stays modest even when it blows.</li>
<li><strong>Mixed crews</strong> — the people who want to sail get their four hours; the people who want to swim get the rest of the day.</li>
</ul>

<h2>Where the Cyclades win, honestly</h2>
<p>They are more dramatic. Whitewashed cubes on brown rock against that particular Aegean blue is a sight the green Ionian does not offer and does not try to. And for a strong crew that wants a proper beam reach in 25 knots with the boat lit up, the Meltemi is a gift, not a problem.</p>
<p>If that is the holiday you want, go — and go with someone who charters there. We would rather say so than sell you the wrong sea.</p>

<h2>The short version</h2>
<ul>
<li><strong>Aegean, July to August</strong> — Meltemi, 5 to 7 Bft, days at a time, long exposed crossings</li>
<li><strong>Ionian, May to October</strong> — Maistros, 3 to 5 Bft, afternoons only, shelter within 30 miles</li>
<li><strong>Choose the Cyclades</strong> if the crew is experienced and the sailing is the point</li>
<li><strong>Choose the Ionian</strong> if the holiday is the point and the sailing is how you get there</li>
</ul>`,

      el: `<h2>Το μελτέμι δεν είναι ριπή, είναι εποχή</h2>
<p>Το μελτέμι είναι βόρειος άνεμος που εγκαθίσταται στο Αιγαίο μέσα στο κατακαλόκαιρο και μπορεί να μείνει τρεις, τέσσερις, πέντε μέρες χωρίς διακοπή. Στη συνηθισμένη του ένταση είναι 5 με 6 μποφόρ. Σε κακή εβδομάδα φτάνει τα 7, και οι ριπές μέσα από τα στενά ανάμεσα στα νησιά έρχονται πιο δυνατές απ' όσο δείχνει ο αριθμός στα ανοιχτά.</p>
<p>Είναι θαυμάσιος άνεμος αν ήρθατε για σκληρή πλεύση και το πλήρωμά σας είναι έμπειρο. Είναι δύσκολος αν έχετε παιδιά, αν είναι η πρώτη σας ναύλωση χωρίς πλήρωμα, ή αν το πρόγραμμά σας εξαρτάται από το να βρίσκεστε κάπου την Πέμπτη.</p>

<h2>Τι κάνει αντ' αυτού το Ιόνιο</h2>
<p>Ο μαΐστρος είναι θερμικός βορειοδυτικός. Το πρωί η θάλασσα είναι λάδι, γύρω στις έντεκα σηκώνεται, κρατά 3 με 5 μποφόρ όλο το απόγευμα και πέφτει με τον ήλιο. Το κάνει τις περισσότερες μέρες από τον Μάιο ως τον Οκτώβριο, και το κάνει με ωράριο πάνω στο οποίο μπορείτε να στήσετε μια εβδομάδα.</p>
<p>Πλέετε μετά το μεσημέρι. Αγκυροβολείτε πριν το δείπνο. Κανείς δεν σηκώνεται στις τέσσερις τα ξημερώματα για να ξαναρίξει άγκυρα επειδή γύρισε ο αέρας.</p>

<h2>Η απόσταση είναι το άλλο μισό</h2>
<p>Οι Κυκλάδες είναι σκορπισμένες σε ανοιχτό πέλαγος. Κάποια περάσματα είναι 30 με 50 ναυτικά μίλια χωρίς τίποτε ενδιάμεσα, και αρκετά αγκυροβόλια είναι ανοιχτά στον βορρά — ακριβώς από εκεί δηλαδή που έρχεται το μελτέμι.</p>
<p>Τα Ιόνια νησιά βρίσκονται σε σειρά παράλληλη με την ηπειρωτική ακτή. Δύσκολα βρίσκεις σημείο σε όλη την περιοχή που να απέχει πάνω από 30 ναυτικά μίλια από προστατευμένο λιμάνι, και τα περισσότερα σκέλη κρατούν δύο με τέσσερις ώρες. Αν το απόγευμα δυσκολέψει, το καταφύγιο είναι αρκετά κοντά ώστε η επιστροφή να σας κοστίσει μια ώρα, όχι μια μέρα.</p>

<h2>Τι σημαίνει αυτό για όσους είναι πάνω στο σκάφος</h2>
<ul>
<li><strong>Πρώτη ναύλωση</strong> — τα λάθη εδώ είναι φθηνά. Υπάρχει χώρος να τα κάνετε.</li>
<li><strong>Παιδιά</strong> — μικρά περάσματα, ζεστό νερό, αγκυροβόλιο κάθε απόγευμα.</li>
<li><strong>Όποιος ζαλίζεται</strong> — η θάλασσα δεν προλαβαίνει να σηκωθεί, οπότε μένει ήπια ακόμη κι όταν φυσάει.</li>
<li><strong>Μεικτά πληρώματα</strong> — όσοι θέλουν να πλεύσουν παίρνουν τις τέσσερις ώρες τους· όσοι θέλουν μπάνιο παίρνουν την υπόλοιπη μέρα.</li>
</ul>

<h2>Πού κερδίζουν οι Κυκλάδες, ειλικρινά</h2>
<p>Είναι πιο θεαματικές. Άσπροι κύβοι πάνω σε καφέ βράχο μπροστά σε εκείνο το συγκεκριμένο αιγαιοπελαγίτικο μπλε είναι θέαμα που το πράσινο Ιόνιο δεν προσφέρει και δεν επιχειρεί να προσφέρει. Και για δυνατό πλήρωμα που θέλει σωστό πλαγιοδρομικό με 25 κόμβους και το σκάφος να πετάει, το μελτέμι είναι δώρο, όχι πρόβλημα.</p>
<p>Αν αυτές είναι οι διακοπές που θέλετε, πηγαίνετε — και πηγαίνετε με κάποιον που ναυλώνει εκεί. Προτιμούμε να το πούμε παρά να σας πουλήσουμε λάθος θάλασσα.</p>

<h2>Με λίγα λόγια</h2>
<ul>
<li><strong>Αιγαίο, Ιούλιος με Αύγουστος</strong> — μελτέμι, 5 με 7 μποφόρ, για μέρες, μεγάλα εκτεθειμένα περάσματα</li>
<li><strong>Ιόνιο, Μάιος με Οκτώβριος</strong> — μαΐστρος, 3 με 5 μποφόρ, μόνο απογεύματα, καταφύγιο μέσα σε 30 μίλια</li>
<li><strong>Διαλέξτε Κυκλάδες</strong> αν το πλήρωμα είναι έμπειρο και το ζητούμενο είναι η πλεύση</li>
<li><strong>Διαλέξτε Ιόνιο</strong> αν το ζητούμενο είναι οι διακοπές και η πλεύση είναι ο τρόπος να φτάσετε</li>
</ul>`,

      de: `<h2>Der Meltemi ist keine Bö, er ist eine Jahreszeit</h2>
<p>Der Meltemi ist ein Nordwind, der sich im Hochsommer über der Ägäis einstellt und drei, vier, fünf Tage ohne Pause stehen bleiben kann. In gewöhnlicher Stärke sind das 5 bis 6 Beaufort. In einer schlechten Woche werden es 7, und die Böen in den Kanälen zwischen den Inseln kommen härter, als die Zahl auf offener See vermuten lässt.</p>
<p>Er ist ein großartiger Wind, wenn Sie zum harten Segeln gekommen sind und Ihre Crew Erfahrung hat. Er ist ein schwieriger, wenn Kinder an Bord sind, wenn es Ihr erster Bareboat-Törn ist oder wenn Ihr Plan davon abhängt, am Donnerstag irgendwo zu sein.</p>

<h2>Was das Ionische Meer stattdessen tut</h2>
<p>Der Maistros ist ein thermischer Nordwestwind. Beim Frühstück spiegelglatt, kommt er gegen elf auf, hält den Nachmittag über 3 bis 5 Beaufort und legt sich mit der Sonne. Das tut er an den meisten Tagen von Mai bis Oktober, und zwar nach einem Fahrplan, um den herum sich eine ganze Woche planen lässt.</p>
<p>Sie segeln nach dem Mittag. Sie ankern vor dem Abendessen. Niemand steht um vier Uhr früh auf, um den Anker neu zu stecken, weil der Wind gedreht hat.</p>

<h2>Die Distanz ist die andere Hälfte</h2>
<p>Die Kykladen liegen verstreut im offenen Wasser. Manche Überfahrten messen 30 bis 50 Seemeilen ohne etwas dazwischen, und etliche Ankerplätze sind nach Norden offen — also genau dorthin, woher der Meltemi kommt.</p>
<p>Die Ionischen Inseln liegen in einer Reihe parallel zur Festlandküste. Kaum ein Punkt im ganzen Revier ist mehr als etwa 30 Seemeilen von einem geschützten Hafen entfernt, und die meisten Etappen dauern zwei bis vier Stunden. Wird der Nachmittag unangenehm, ist Schutz so nah, dass die Umkehr eine Stunde kostet und nicht einen Tag.</p>

<h2>Was das für die Menschen an Bord bedeutet</h2>
<ul>
<li><strong>Erster Törn</strong> — Fehler sind hier billig. Es ist Raum da, sie zu machen.</li>
<li><strong>Kinder</strong> — kurze Schläge, warmes Wasser, jeden Nachmittag ein Ankerplatz.</li>
<li><strong>Wer seekrank wird</strong> — der Seegang bleibt moderat, weil die Wellen keinen Anlauf haben.</li>
<li><strong>Gemischte Crews</strong> — wer segeln will, bekommt seine vier Stunden; wer schwimmen will, den Rest des Tages.</li>
</ul>

<h2>Wo die Kykladen gewinnen, ehrlich gesagt</h2>
<p>Sie sind dramatischer. Weiß gekalkte Würfel auf braunem Fels vor diesem bestimmten Ägäisblau sind ein Anblick, den das grüne Ionische Meer nicht bietet und auch nicht bieten will. Und für eine starke Crew, die einen richtigen Raumschotkurs bei 25 Knoten sucht, ist der Meltemi ein Geschenk und kein Problem.</p>
<p>Wenn das der Urlaub ist, den Sie wollen, fahren Sie hin — und fahren Sie mit jemandem, der dort verchartert. Das sagen wir lieber, als Ihnen das falsche Meer zu verkaufen.</p>

<h2>Kurz gefasst</h2>
<ul>
<li><strong>Ägäis, Juli bis August</strong> — Meltemi, 5 bis 7 Bft, tagelang, lange ungeschützte Überfahrten</li>
<li><strong>Ionisches Meer, Mai bis Oktober</strong> — Maistros, 3 bis 5 Bft, nur nachmittags, Schutz binnen 30 Meilen</li>
<li><strong>Wählen Sie die Kykladen</strong>, wenn die Crew erfahren ist und das Segeln der Zweck ist</li>
<li><strong>Wählen Sie das Ionische Meer</strong>, wenn der Urlaub der Zweck ist und das Segeln der Weg dorthin</li>
</ul>`,
    },
  },
]

async function main() {
  for (const a of ARTICLES) {
    const category = await db.articleCategory.findUnique({ where: { slug: a.categorySlug } })
    if (!category) throw new Error(`category ${a.categorySlug} missing`)

    const data = {
      title: a.title,
      status: "published",
      publishedAt: a.publishedAt,
      date: a.publishedAt,
      categoryId: category.id,
      author: a.author,
      shortDesc: a.shortDesc,
      description: a.description,
      readMinutes: a.readMinutes,
      defaultMedia: a.defaultMedia,
      defaultMediaType: "image",
      media: a.media,
      metaTitle: a.metaTitle,
      metaDesc: a.metaDesc,
    }

    const article = await db.article.upsert({
      where: { slug: a.slug },
      create: { slug: a.slug, ...data },
      update: data,
    })

    // Tags are a join table; replace rather than accumulate on a re-run.
    await db.articleTagLink.deleteMany({ where: { articleId: article.id } })
    for (const slug of a.tags) {
      const tag = await db.articleTag.findUnique({ where: { slug } })
      if (!tag) { console.log(`  ! tag ${slug} missing, skipped`); continue }
      await db.articleTagLink.create({ data: { articleId: article.id, tagId: tag.id } })
    }

    const words = (l: "en" | "el" | "de") =>
      a.description[l].replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
    console.log(`${a.slug}\n   en ${words("en")}w · el ${words("el")}w · de ${words("de")}w · tags ${a.tags.join(", ")}`)
  }
  await db.$disconnect()
}
main()

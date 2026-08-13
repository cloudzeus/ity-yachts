import "dotenv/config"
import { db } from "../lib/db"

/**
 * An article about Ionian Dream Villas, run by the same family as IYC.
 *
 * Every fact here comes from ionian-dream-villas.com: three villas in Agios
 * Nikitas, three bedrooms and six guests each, 140 m², private pool, seven
 * nights minimum. The site gives two different founding years, so no founding
 * year is claimed. Prices are stated as "from", because they are seasonal.
 */
const CDN = "https://ioniandreamvillas.b-cdn.net/strapi-import"

const HERO = `${CDN}/media/1777210366343-230623-idv-u0492-3e36e2e0c5.webp`
const GALLERY = [
  `${CDN}/villas/castro/1777210694395-castro-230623-idv-r3437-72b01dd47d.webp`,
  `${CDN}/villas/jira/1777210710080-jira-230622-idv-u0329-9e88496cf2.webp`,
  `${CDN}/villas/milos/1777210737122-milos-230623-idv-r3425-d3ac0e701c.webp`,
  `${CDN}/villas/castro/1777210701201-castro-230622-idv-u0442-069cd213c2.webp`,
]

const TITLE = {
  en: "A week ashore, a week aboard: our family's villas in Agios Nikitas",
  el: "Μια εβδομάδα στη στεριά, μια εν πλω: οι βίλες της οικογένειάς μας στον Άγιο Νικήτα",
  de: "Eine Woche an Land, eine an Bord: die Villen unserer Familie in Agios Nikitas",
}

const SHORT = {
  en: "<p>Ionian Dream Villas is run by the same family as IYC — three houses with private pools above Agios Nikitas, on the other side of Lefkada from our pontoon.</p>",
  el: "<p>Οι Ionian Dream Villas ανήκουν στην ίδια οικογένεια με την IYC — τρία σπίτια με ιδιωτική πισίνα πάνω από τον Άγιο Νικήτα, στην απέναντι πλευρά της Λευκάδας από την προβλήτα μας.</p>",
  de: "<p>Ionian Dream Villas wird von derselben Familie geführt wie IYC — drei Häuser mit eigenem Pool oberhalb von Agios Nikitas, auf der anderen Seite Lefkadas als unser Steg.</p>",
}

const BODY = {
  en: `<p>People ask us about this more often than you would think. A week on a boat is a wonderful thing, and for some crews it is also enough — the children want a pool, somebody wants a kitchen they can stand up straight in, and the idea of ending the fortnight with a few unhurried days ashore starts to sound better than another passage.</p>
<p>So it is worth saying plainly: the same family that runs IYC also runs <a href="https://ionian-dream-villas.com" rel="noopener">Ionian Dream Villas</a>, in Agios Nikitas. We are not recommending a partner. It is the same people, on the same island.</p>

<h2>Three houses above Agios Nikitas</h2>
<p>There are three villas — Castro, Jira and Milos — and they are near enough identical in shape: three bedrooms, six guests, 140 square metres, a private pool, and a few minutes' walk down to the beach. Each has two bathrooms and a guest WC, an open fireplace in the living room, and a wide wooden deck that the living space opens onto.</p>
<p>The beds are coco-mat, which is a detail we would not normally bother mentioning except that anyone who has slept in a forepeak for six nights tends to notice. Upstairs there is a gallery that works as a study, looking back at the mountains rather than out to sea.</p>
<p>The stay is a minimum of seven nights, and the weekly rate starts at €1,950 in May and October.</p>

<h2>Why Agios Nikitas, when the base is in Lefkada town</h2>
<p>Agios Nikitas sits on the west coast, which is the side of the island the boats do not go. The prevailing north-westerly makes that shore a lee, so a charter week runs east and south — down the channel, into the Inland Sea, out towards Meganisi and Ithaca. The west coast is where the long beaches are: Kathisma, Egremni, Porto Katsiki.</p>
<p>That is the point of pairing them. You spend one week seeing the parts of Lefkada that can only be reached by water, and the other seeing the parts that cannot.</p>

<h2>Putting the two weeks together</h2>
<p>If you want to do both, tell us when you write. We handle the charter and the house between us, which means one conversation rather than two, and the handover day arranged so that you are not carrying bags across the island at an awkward hour.</p>
<p>The villas take their own bookings at <a href="mailto:info@ionian-dream-villas.com">info@ionian-dream-villas.com</a> or on +30 694 7826186 if you would rather deal with that side directly. Either way it reaches the family.</p>`,

  el: `<p>Μας το ρωτούν πιο συχνά απ' όσο θα φανταζόσασταν. Μια εβδομάδα σε σκάφος είναι υπέροχο πράγμα, αλλά για ορισμένα πληρώματα είναι και αρκετή — τα παιδιά θέλουν πισίνα, κάποιος θέλει μια κουζίνα όπου να στέκεται όρθιος, και η ιδέα να κλείσει το δεκαπενθήμερο με λίγες ήρεμες μέρες στη στεριά αρχίζει να ακούγεται καλύτερη από άλλο ένα πέρασμα.</p>
<p>Αξίζει λοιπόν να το πούμε καθαρά: την ίδια οικογένεια που έχει την IYC έχει και τις <a href="https://ionian-dream-villas.com" rel="noopener">Ionian Dream Villas</a>, στον Άγιο Νικήτα. Δεν προτείνουμε κάποιον συνεργάτη. Είναι οι ίδιοι άνθρωποι, στο ίδιο νησί.</p>

<h2>Τρία σπίτια πάνω από τον Άγιο Νικήτα</h2>
<p>Οι βίλες είναι τρεις — Κάστρο, Γύρα και Μύλος — και έχουν σχεδόν την ίδια μορφή: τρία υπνοδωμάτια, έξι άτομα, 140 τετραγωνικά, ιδιωτική πισίνα και λίγα λεπτά περπάτημα ως την παραλία. Καθεμιά έχει δύο μπάνια και έναν ξενώνα WC, τζάκι στο σαλόνι και μια φαρδιά ξύλινη βεράντα στην οποία ανοίγει ο χώρος του καθιστικού.</p>
<p>Τα κρεβάτια είναι coco-mat — λεπτομέρεια που κανονικά δεν θα αναφέραμε, αν δεν την πρόσεχε κάθε άνθρωπος που έχει κοιμηθεί έξι νύχτες στην πλώρη. Στον επάνω όροφο υπάρχει ημιώροφος που λειτουργεί ως γραφείο, με θέα προς το βουνό αντί για τη θάλασσα.</p>
<p>Η ελάχιστη διαμονή είναι επτά νύχτες και η εβδομαδιαία τιμή ξεκινά από 1.950 € τον Μάιο και τον Οκτώβριο.</p>

<h2>Γιατί Άγιος Νικήτας, αφού η βάση είναι στη Λευκάδα</h2>
<p>Ο Άγιος Νικήτας βρίσκεται στη δυτική ακτή, δηλαδή στην πλευρά του νησιού όπου δεν πηγαίνουν τα σκάφη. Ο επικρατών βορειοδυτικός κάνει εκείνη την ακτή υπήνεμη, οπότε μια εβδομάδα ναύλωσης τραβά ανατολικά και νότια — κάτω από τον δίαυλο, στην Έσω Θάλασσα, προς το Μεγανήσι και την Ιθάκη. Στη δύση είναι οι μεγάλες παραλίες: Κάθισμα, Εγκρεμνοί, Πόρτο Κατσίκι.</p>
<p>Αυτό ακριβώς είναι το νόημα του συνδυασμού. Τη μία εβδομάδα βλέπετε τη Λευκάδα που φτάνεις μόνο από τη θάλασσα, την άλλη εκείνη που δεν φτάνεις.</p>

<h2>Πώς συνδυάζονται οι δύο εβδομάδες</h2>
<p>Αν θέλετε και τα δύο, πείτε το μας όταν μας γράψετε. Τη ναύλωση και το σπίτι τα αναλαμβάνουμε εμείς μεταξύ μας, που σημαίνει μία συνεννόηση αντί για δύο, και τη μέρα της παράδοσης κανονισμένη ώστε να μην κουβαλάτε βαλίτσες απ' άκρη σ' άκρη του νησιού σε άβολη ώρα.</p>
<p>Οι βίλες δέχονται και δικές τους κρατήσεις στο <a href="mailto:info@ionian-dream-villas.com">info@ionian-dream-villas.com</a> ή στο +30 694 7826186, αν προτιμάτε να τα πείτε απευθείας. Έτσι κι αλλιώς καταλήγει στην οικογένεια.</p>`,

  de: `<p>Diese Frage kommt häufiger, als man denkt. Eine Woche auf dem Boot ist eine wunderbare Sache — und für manche Crews ist sie auch genug. Die Kinder wollen einen Pool, jemand hätte gern eine Küche, in der er aufrecht stehen kann, und der Gedanke, die zwei Wochen mit ein paar ruhigen Tagen an Land zu beschließen, klingt allmählich besser als ein weiterer Schlag.</p>
<p>Also sagen wir es deutlich: Dieselbe Familie, die IYC führt, führt auch <a href="https://ionian-dream-villas.com" rel="noopener">Ionian Dream Villas</a> in Agios Nikitas. Das ist keine Partnerempfehlung. Es sind dieselben Leute, auf derselben Insel.</p>

<h2>Drei Häuser oberhalb von Agios Nikitas</h2>
<p>Es sind drei Villen — Castro, Jira und Milos — und sie sind im Zuschnitt nahezu gleich: drei Schlafzimmer, sechs Gäste, 140 Quadratmeter, ein eigener Pool und wenige Gehminuten hinunter zum Strand. Jede hat zwei Bäder und ein Gäste-WC, einen offenen Kamin im Wohnraum und eine breite Holzterrasse, auf die sich der Wohnbereich öffnet.</p>
<p>Die Betten sind von Coco-mat — ein Detail, das wir sonst nicht erwähnen würden, außer dass es jedem auffällt, der sechs Nächte in der Vorschiffskoje geschlafen hat. Im Obergeschoss liegt eine Galerie, die sich als Arbeitsplatz eignet, mit Blick auf die Berge statt aufs Meer.</p>
<p>Der Aufenthalt beträgt mindestens sieben Nächte, der Wochenpreis beginnt im Mai und Oktober bei 1.950 €.</p>

<h2>Warum Agios Nikitas, wenn die Basis in Lefkada-Stadt liegt</h2>
<p>Agios Nikitas liegt an der Westküste — also auf der Seite der Insel, zu der die Boote nicht fahren. Der vorherrschende Nordwest macht diese Küste zur Legerwall-Seite, deshalb führt eine Chartertörn nach Osten und Süden: durch den Kanal, ins Binnenmeer, hinaus Richtung Meganisi und Ithaka. Im Westen liegen die langen Strände: Kathisma, Egremni, Porto Katsiki.</p>
<p>Genau darum lohnt die Kombination. Die eine Woche sehen Sie das Lefkada, das nur vom Wasser aus erreichbar ist, die andere jenes, das es nicht ist.</p>

<h2>Wie sich die beiden Wochen verbinden lassen</h2>
<p>Wenn Sie beides möchten, schreiben Sie es uns gleich dazu. Charter und Haus regeln wir untereinander — das heißt ein Gespräch statt zwei, und der Wechseltag so gelegt, dass Sie nicht zu unpassender Stunde mit Gepäck über die Insel fahren.</p>
<p>Die Villen nehmen auch eigene Buchungen entgegen, unter <a href="mailto:info@ionian-dream-villas.com">info@ionian-dream-villas.com</a> oder +30 694 7826186, falls Sie das lieber direkt klären. Es landet ohnehin bei der Familie.</p>`,
}

async function main() {
  const category = await db.articleCategory.findUnique({ where: { slug: "news-from-the-base" }, select: { id: true } })
  const tags = await db.articleTag.findMany({ where: { slug: { in: ["lefkada", "family-sailing"] } }, select: { id: true } })

  const slug = "a-week-ashore-a-week-aboard"
  const words = BODY.en.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length

  const data = {
    title: TITLE,
    shortDesc: SHORT,
    description: BODY,
    slug,
    status: "published",
    publishedAt: new Date(),
    date: new Date(),
    author: "Maria Ramisch",
    categoryId: category?.id ?? null,
    defaultMedia: HERO,
    defaultMediaType: "image",
    media: GALLERY,
    readMinutes: Math.max(1, Math.round(words / 200)),
    metaTitle: "A week ashore, a week aboard — our villas in Agios Nikitas",
    metaDesc:
      "Ionian Dream Villas is run by the same family as IYC: three houses with private pools above Agios Nikitas, on the west coast of Lefkada. How to pair a villa week with a charter week.",
    sortOrder: 0,
  }

  const existing = await db.article.findUnique({ where: { slug }, select: { id: true } })
  const article = existing
    ? await db.article.update({ where: { slug }, data })
    : await db.article.create({ data })

  // Replace the tag links rather than adding to them, so re-running is safe.
  await db.articleTagLink.deleteMany({ where: { articleId: article.id } })
  for (const t of tags) {
    await db.articleTagLink.create({ data: { articleId: article.id, tagId: t.id } })
  }

  console.log(`${existing ? "updated" : "created"} /news/${slug} — ${words} words, ${data.readMinutes} min, ${tags.length} tags`)
  await db.$disconnect()
}

main()

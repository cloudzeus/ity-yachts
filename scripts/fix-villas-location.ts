import "dotenv/config"
import { db } from "../lib/db"

/**
 * The villas are at Agios Ioannis, not Agios Nikitas.
 *
 * The first draft took the village off the Ionian Dream Villas homepage,
 * where Agios Nikitas appears in a list of nearby places worth visiting —
 * not as the address. Their Booking listing settles it: the houses are 1.1 km
 * from Agios Ioannis beach, "over the Agios Ioannis Bay", looking at the long
 * strand and its windmills, at 38.828, 20.673. That is four kilometres from
 * Lefkada town, not twenty down the west coast.
 *
 * It is not a spelling correction. A whole section argued the pairing worked
 * *because* the villa was far away on the other side of the island, and the
 * truth is better: it is on the shore the boats do not sail, and it is ten
 * minutes from the pontoon.
 */
const SECTION = {
  en: {
    old: `<h2>Why Agios Nikitas, when the base is in Lefkada town</h2>
<p>Agios Nikitas sits on the west coast, which is the side of the island the boats do not go. The prevailing north-westerly makes that shore a lee, so a charter week runs east and south — down the channel, into the Inland Sea, out towards <a href="/locations/katomeri">Meganisi</a> and Ithaca. The west coast is where the long beaches are: Kathisma, Egremni, Porto Katsiki.</p>
<p>That is the point of pairing them. You spend one week seeing the parts of <a href="/locations/lef">Lefkada</a> that can only be reached by water, and the other seeing the parts that cannot.</p>`,
    new: `<h2>Why Agios Ioannis, four kilometres from the base</h2>
<p>The houses stand above the bay at Agios Ioannis, a kilometre up from the beach and about four from Lefkada town, looking down the long strand and its line of old windmills. That shore faces the open north-west, which is the side of the island the boats do not go: the prevailing wind makes it a lee, so a charter week runs east and south — down the channel, into the Inland Sea, out towards <a href="/locations/katomeri">Meganisi</a> and Ithaca. The west is where the long beaches are: Kathisma, Egremni, Porto Katsiki.</p>
<p>That is the point of pairing them, and the reason it is easy. You spend one week seeing the parts of <a href="/locations/lef">Lefkada</a> that can only be reached by water and the other seeing the parts that cannot — and the move from boat to house takes ten minutes, not a day.</p>`,
  },
  el: {
    old: `<h2>Γιατί Άγιος Νικήτας, αφού η βάση είναι στη Λευκάδα</h2>
<p>Ο Άγιος Νικήτας βρίσκεται στη δυτική ακτή, δηλαδή στην πλευρά του νησιού όπου δεν πηγαίνουν τα σκάφη. Ο επικρατών βορειοδυτικός κάνει εκείνη την ακτή υπήνεμη, οπότε μια εβδομάδα ναύλωσης τραβά ανατολικά και νότια — κάτω από τον δίαυλο, στην Έσω Θάλασσα, προς το <a href="/locations/katomeri">Μεγανήσι</a> και την Ιθάκη. Στη δύση είναι οι μεγάλες παραλίες: Κάθισμα, Εγκρεμνοί, Πόρτο Κατσίκι.</p>
<p>Αυτό ακριβώς είναι το νόημα του συνδυασμού. Τη μία εβδομάδα βλέπετε τη Λευκάδα που φτάνεις μόνο από τη θάλασσα, την άλλη εκείνη που δεν φτάνεις.</p>`,
    new: `<h2>Γιατί ο Άγιος Ιωάννης, τέσσερα χιλιόμετρα από τη βάση</h2>
<p>Τα σπίτια στέκουν πάνω από τον κόλπο του Αγίου Ιωάννη, ένα χιλιόμετρο πάνω από την παραλία και περίπου τέσσερα από τη Λευκάδα, με θέα τη μεγάλη αμμουδιά και τη σειρά από τους παλιούς ανεμόμυλους. Εκείνη η ακτή βλέπει στον ανοιχτό βορειοδυτικό, δηλαδή στην πλευρά του νησιού όπου δεν πηγαίνουν τα σκάφη: ο επικρατών άνεμος την κάνει υπήνεμη, οπότε μια εβδομάδα ναύλωσης τραβά ανατολικά και νότια — κάτω από τον δίαυλο, στην Έσω Θάλασσα, προς το <a href="/locations/katomeri">Μεγανήσι</a> και την Ιθάκη. Στη δύση είναι οι μεγάλες παραλίες: Κάθισμα, Εγκρεμνοί, Πόρτο Κατσίκι.</p>
<p>Αυτό ακριβώς είναι το νόημα του συνδυασμού, και ο λόγος που βγαίνει εύκολα. Τη μία εβδομάδα βλέπετε τη <a href="/locations/lef">Λευκάδα</a> που φτάνεις μόνο από τη θάλασσα, την άλλη εκείνη που δεν φτάνεις — και η μετάβαση από το σκάφος στο σπίτι κρατά δέκα λεπτά, όχι μια μέρα.</p>`,
  },
  de: {
    old: `<h2>Warum Agios Nikitas, wenn die Basis in Lefkada-Stadt liegt</h2>`,
    new: `<h2>Warum Agios Ioannis, vier Kilometer von der Basis</h2>`,
  },
}

const SIMPLE: Record<"en" | "el" | "de", [string, string][]> = {
  en: [
    ["in Agios Nikitas.", "at Agios Ioannis, just outside Lefkada town."],
    ["<h2>Three houses above Agios Nikitas</h2>", "<h2>Three houses above Agios Ioannis</h2>"],
  ],
  el: [
    ["στον Άγιο Νικήτα.", "στον Άγιο Ιωάννη, λίγο έξω από τη Λευκάδα."],
    ["<h2>Τρία σπίτια πάνω από τον Άγιο Νικήτα</h2>", "<h2>Τρία σπίτια πάνω από τον Άγιο Ιωάννη</h2>"],
  ],
  de: [
    ["in Agios Nikitas.", "in Agios Ioannis, gleich außerhalb von Lefkada-Stadt."],
    ["<h2>Drei Häuser oberhalb von Agios Nikitas</h2>", "<h2>Drei Häuser oberhalb von Agios Ioannis</h2>"],
    // The German section body keeps its argument; only the place and the distance change.
    ["Agios Nikitas liegt an der Westküste — also auf der Seite der Insel, zu der die Boote nicht fahren.",
     "Die Häuser stehen über der Bucht von Agios Ioannis, einen Kilometer oberhalb des Strandes und etwa vier von Lefkada-Stadt entfernt, mit Blick über den langen Strand und seine Reihe alter Windmühlen. Diese Küste liegt zum offenen Nordwesten — also auf der Seite der Insel, zu der die Boote nicht fahren."],
  ],
}

const TITLE = {
  en: "A week ashore, a week aboard: our family's villas at Agios Ioannis",
  el: "Μια εβδομάδα στη στεριά, μια εν πλω: οι βίλες της οικογένειάς μας στον Άγιο Ιωάννη",
  de: "Eine Woche an Land, eine an Bord: die Villen unserer Familie in Agios Ioannis",
}

const SHORT = {
  en: "<p>Ionian Dream Villas is run by the same family as IYC — three houses with private pools above Agios Ioannis, a few kilometres from our pontoon in Lefkada.</p>",
  el: "<p>Οι Ionian Dream Villas ανήκουν στην ίδια οικογένεια με την IYC — τρία σπίτια με ιδιωτική πισίνα πάνω από τον Άγιο Ιωάννη, λίγα χιλιόμετρα από την προβλήτα μας στη Λευκάδα.</p>",
  de: "<p>Ionian Dream Villas wird von derselben Familie geführt wie IYC — drei Häuser mit eigenem Pool oberhalb von Agios Ioannis, wenige Kilometer von unserem Steg in Lefkada.</p>",
}

async function main() {
  const a = await db.article.findUnique({ where: { slug: "a-week-ashore-a-week-aboard" } })
  if (!a) throw new Error("article missing")

  const description = { ...(a.description as Record<string, string>) }

  for (const lang of ["en", "el", "de"] as const) {
    let html = description[lang]
    const sec = SECTION[lang]
    if (sec) {
      if (!html.includes(sec.old)) throw new Error(`${lang}: section not found verbatim`)
      html = html.replace(sec.old, sec.new)
    }
    for (const [from, to] of SIMPLE[lang]) {
      if (!html.includes(from)) throw new Error(`${lang}: "${from.slice(0, 40)}" not found`)
      html = html.replace(from, to)
    }
    const left = (html.match(/Agios Nikitas|Άγιο[ςνυ]? Νικήτ\w*/g) ?? []).length
    if (left) throw new Error(`${lang}: ${left} mentions of the wrong village survived`)
    description[lang] = html
    console.log(`${lang}: corrected, 0 mentions of the old village left`)
  }

  await db.article.update({
    where: { id: a.id },
    data: {
      title: TITLE,
      shortDesc: SHORT,
      description,
      metaTitle: "A week ashore, a week aboard — our villas at Agios Ioannis",
      metaDesc:
        "Ionian Dream Villas is run by the same family as IYC: three houses with pools above Agios Ioannis, four kilometres from our base in Lefkada.",
    },
  })
  console.log("\ntitle, summary, body and meta updated in all three languages")
  await db.$disconnect()
}
main()

import "dotenv/config"
import { db } from "../lib/db"

/** The strings the public news surfaces ask for, in all three languages. */
const KEYS: { key: string; namespace: string; en: string; el: string; de: string }[] = [
  // Homepage section
  { key: "home.news.eyebrow", namespace: "home", en: "From the logbook", el: "Από το ημερολόγιο", de: "Aus dem Logbuch" },
  { key: "home.news.headingLead", namespace: "home", en: "Latest", el: "Τελευταία", de: "Neueste" },
  { key: "home.news.headingAccent", namespace: "home", en: "news", el: "νέα", de: "Nachrichten" },
  { key: "home.news.viewAll", namespace: "home", en: "All articles", el: "Όλα τα άρθρα", de: "Alle Artikel" },

  // News list page
  { key: "news.eyebrow", namespace: "news", en: "From the logbook", el: "Από το ημερολόγιο", de: "Aus dem Logbuch" },
  {
    key: "news.title",
    namespace: "news",
    en: "Latest news",
    el: "Τελευταία νέα",
    de: "Neueste Nachrichten",
  },
  {
    key: "news.lead",
    namespace: "news",
    en: "Winds, anchorages, boats and what a week aboard is actually like — written by the people who sail here.",
    el: "Άνεμοι, αγκυροβόλια, σκάφη και πώς είναι πραγματικά μια εβδομάδα εν πλω — γραμμένα από ανθρώπους που ταξιδεύουν εδώ.",
    de: "Winde, Ankerplätze, Boote und wie sich eine Woche an Bord wirklich anfühlt — geschrieben von denen, die hier segeln.",
  },
  { key: "news.filter.all", namespace: "news", en: "Everything", el: "Όλα", de: "Alles" },
  { key: "news.filter.taggedWith", namespace: "news", en: "Tagged", el: "Με ετικέτα", de: "Markiert mit" },
  { key: "news.filter.clear", namespace: "news", en: "Show everything", el: "Εμφάνιση όλων", de: "Alles anzeigen" },
  { key: "news.empty", namespace: "news", en: "Nothing published yet", el: "Δεν έχει δημοσιευτεί κάτι ακόμη", de: "Noch nichts veröffentlicht" },
  {
    key: "news.emptyFiltered",
    namespace: "news",
    en: "Nothing here yet under that heading",
    el: "Δεν υπάρχει κάτι ακόμη σε αυτή την κατηγορία",
    de: "Unter dieser Rubrik gibt es noch nichts",
  },

  // Card + article
  { key: "news.read", namespace: "news", en: "Read", el: "Διαβάστε", de: "Lesen" },
  { key: "news.minRead", namespace: "news", en: "min read", el: "λεπτά ανάγνωσης", de: "Min. Lesezeit" },
  { key: "news.tags", namespace: "news", en: "Tagged", el: "Ετικέτες", de: "Schlagwörter" },
  { key: "news.backToAll", namespace: "news", en: "All articles", el: "Όλα τα άρθρα", de: "Alle Artikel" },
  { key: "news.related", namespace: "news", en: "Keep reading", el: "Συνεχίστε την ανάγνωση", de: "Weiterlesen" },
]

async function main() {
  let added = 0
  let filled = 0

  for (const t of KEYS) {
    const existing = await db.siteTranslation.findUnique({ where: { key: t.key } })
    if (!existing) {
      await db.siteTranslation.create({ data: t })
      added++
      continue
    }
    /* Do not overwrite copy someone has edited — only fill blanks. */
    const patch: Record<string, string> = {}
    if (!existing.en.trim()) patch.en = t.en
    if (!existing.el.trim()) patch.el = t.el
    if (!existing.de.trim()) patch.de = t.de
    if (Object.keys(patch).length) {
      await db.siteTranslation.update({ where: { key: t.key }, data: patch })
      filled++
    }
  }

  // The hero copy on /news, editable in /admin/mottos.
  const slug = "news-from-the-logbook"
  const motto = await db.motto.findUnique({ where: { slug } })
  if (!motto) {
    await db.motto.create({
      data: {
        slug,
        category: "hero",
        heading: {
          en: "From the logbook",
          el: "Από το ημερολόγιο",
          de: "Aus dem Logbuch",
        },
        subheading: {
          en: "Winds, anchorages, boats and what a week aboard is actually like — written by the people who sail here.",
          el: "Άνεμοι, αγκυροβόλια, σκάφη και πώς είναι πραγματικά μια εβδομάδα εν πλω — γραμμένα από ανθρώπους που ταξιδεύουν εδώ.",
          de: "Winde, Ankerplätze, Boote und wie sich eine Woche an Bord wirklich anfühlt — geschrieben von denen, die hier segeln.",
        },
        subtext: {},
        isActive: true,
      },
    })
    console.log(`motto ${slug}: created`)
  } else {
    console.log(`motto ${slug}: already there`)
  }

  console.log(`translations: ${added} added, ${filled} had blanks filled, ${KEYS.length - added - filled} untouched`)
  await db.$disconnect()
}

main()

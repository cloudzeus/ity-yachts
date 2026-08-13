import "dotenv/config"
import { db } from "../lib/db"

/** The search form's remaining labels, which were hardcoded English. */
const KEYS = [
  { key: "search.berths", namespace: "search", en: "Berths", el: "Κλίνες", de: "Kojen" },
  { key: "search.cabins", namespace: "search", en: "Cabins", el: "Καμπίνες", de: "Kabinen" },
  { key: "search.length", namespace: "search", en: "Length", el: "Μήκος", de: "Länge" },
  { key: "search.any", namespace: "search", en: "Any", el: "Όλες", de: "Beliebig" },
  { key: "search.anyLength", namespace: "search", en: "Any length", el: "Κάθε μήκος", de: "Beliebige Länge" },
  { key: "search.under", namespace: "search", en: "Under", el: "Έως", de: "Bis" },
  { key: "search.metresShort", namespace: "search", en: "m", el: "μ", de: "m" },
  { key: "search.allTypes", namespace: "search", en: "All types", el: "Όλοι οι τύποι", de: "Alle Typen" },
  { key: "search.sailingYacht", namespace: "search", en: "Sailing yacht", el: "Ιστιοπλοϊκό", de: "Segelyacht" },
  { key: "search.catamaran", namespace: "search", en: "Catamaran", el: "Καταμαράν", de: "Katamaran" },
]

async function main() {
  let added = 0, filled = 0
  for (const t of KEYS) {
    const existing = await db.siteTranslation.findUnique({ where: { key: t.key } })
    if (!existing) { await db.siteTranslation.create({ data: t }); added++; continue }
    const patch: Record<string, string> = {}
    if (!existing.en.trim()) patch.en = t.en
    if (!existing.el.trim()) patch.el = t.el
    if (!existing.de.trim()) patch.de = t.de
    if (Object.keys(patch).length) { await db.siteTranslation.update({ where: { key: t.key }, data: patch }); filled++ }
  }
  console.log(`${added} added, ${filled} filled, ${KEYS.length - added - filled} untouched`)
  await db.$disconnect()
}
main()

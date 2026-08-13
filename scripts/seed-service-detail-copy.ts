import "dotenv/config"
import { db } from "../lib/db"

/** The labels on a single service page, which were hardcoded English. */
const KEYS = [
  { key: "services.detail.back", namespace: "services", en: "All services", el: "Όλες οι υπηρεσίες", de: "Alle Leistungen" },
  { key: "services.detail.about", namespace: "services", en: "About this service", el: "Σχετικά με την υπηρεσία", de: "Über diese Leistung" },
  { key: "services.detail.enquire", namespace: "services", en: "Ask us about this", el: "Ρωτήστε μας γι' αυτό", de: "Fragen Sie uns dazu" },
  { key: "services.detail.fleet", namespace: "services", en: "Browse the fleet", el: "Δείτε τον στόλο", de: "Zur Flotte" },
  { key: "services.detail.other", namespace: "services", en: "Other services", el: "Άλλες υπηρεσίες", de: "Weitere Leistungen" },
  {
    key: "services.detail.ctaTitle",
    namespace: "services",
    en: "Want this on your charter?",
    el: "Το θέλετε στη ναύλωσή σας;",
    de: "Möchten Sie das für Ihren Törn?",
  },
  {
    key: "services.detail.ctaBody",
    namespace: "services",
    en: "Tell us what you have in mind and we will arrange it before you arrive.",
    el: "Πείτε μας τι έχετε στο μυαλό σας και θα το κανονίσουμε πριν φτάσετε.",
    de: "Sagen Sie uns, was Ihnen vorschwebt — wir organisieren es, bevor Sie ankommen.",
  },
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
    const patch: Record<string, string> = {}
    if (!existing.en.trim()) patch.en = t.en
    if (!existing.el.trim()) patch.el = t.el
    if (!existing.de.trim()) patch.de = t.de
    if (Object.keys(patch).length) {
      await db.siteTranslation.update({ where: { key: t.key }, data: patch })
      filled++
    }
  }

  console.log(`${added} added, ${filled} had blanks filled, ${KEYS.length - added - filled} untouched`)
  await db.$disconnect()
}

main()

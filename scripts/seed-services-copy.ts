import "dotenv/config"
import { db } from "../lib/db"

/** The strings the rebuilt /services page asks for. */
const KEYS = [
    { key: "services.readMore", namespace: "services", en: "Read more", el: "Περισσότερα", de: "Mehr erfahren" },
  {
    key: "services.cta.title",
    namespace: "services",
    en: "Tell us what the week should feel like",
    el: "Πείτε μας πώς φαντάζεστε την εβδομάδα σας",
    de: "Sagen Sie uns, wie Ihre Woche sein soll",
  },
  {
    key: "services.cta.body",
    namespace: "services",
    en: "Write to us, or answer a few questions and we will put a plan together for you.",
    el: "Γράψτε μας ή απαντήστε σε λίγες ερωτήσεις και θα ετοιμάσουμε ένα πλάνο για εσάς.",
    de: "Schreiben Sie uns, oder beantworten Sie ein paar Fragen — wir stellen Ihnen einen Plan zusammen.",
  },
  { key: "services.cta.primary", namespace: "services", en: "Talk to us", el: "Μιλήστε μαζί μας", de: "Sprechen Sie mit uns" },
  { key: "services.cta.secondary", namespace: "services", en: "See the fleet", el: "Δείτε τον στόλο", de: "Zur Flotte" },
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
    /* Never overwrite copy someone has edited — only fill blanks. */
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

import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
async function main() {
  const all = await db.siteTranslation.findMany({
    select: { key: true, en: true, el: true, de: true },
    orderBy: { key: "asc" },
  })
  const untranslated = all.filter(t => !t.el || !t.de)
  const total = all.length
  console.log(`Total: ${total}, Untranslated: ${untranslated.length}`)
  
  // Show some samples of contact keys
  const contactKeys = all.filter(t => t.key.startsWith("contact."))
  console.log(`\nContact keys (${contactKeys.length}):`)
  for (const t of contactKeys) {
    console.log(`  ${t.key}: EN="${t.en?.substring(0,30)}" EL="${t.el?.substring(0,30)}" DE="${t.de?.substring(0,30)}"`)
  }
  
  const headerKeys = all.filter(t => t.key.startsWith("header."))
  console.log(`\nHeader keys (${headerKeys.length}):`)
  for (const t of headerKeys) {
    console.log(`  ${t.key}: EN="${t.en?.substring(0,30)}" EL="${t.el?.substring(0,30)}" DE="${t.de?.substring(0,30)}"`)
  }
  
  const heroKeys = all.filter(t => t.key.startsWith("home.hero"))
  console.log(`\nHero keys (${heroKeys.length}):`)
  for (const t of heroKeys) {
    console.log(`  ${t.key}: EN="${t.en?.substring(0,30)}" EL="${t.el?.substring(0,30)}" DE="${t.de?.substring(0,30)}"`)
  }
  
  await db.$disconnect()
}
main()

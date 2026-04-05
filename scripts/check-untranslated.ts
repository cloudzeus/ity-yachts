import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
async function main() {
  const untranslated = await db.siteTranslation.findMany({
    where: { OR: [{ el: "" }, { de: "" }] },
    select: { key: true, en: true, el: true, de: true },
    orderBy: { key: "asc" },
  })
  console.log(`\n${untranslated.length} keys missing Greek or German:\n`)
  for (const t of untranslated) {
    const missing = []
    if (!t.el) missing.push("EL")
    if (!t.de) missing.push("DE")
    console.log(`  ${t.key} — missing: ${missing.join(", ")}`)
  }
  await db.$disconnect()
}
main()

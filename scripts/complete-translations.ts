import "dotenv/config"
import { db } from "../lib/db"

/**
 * The last two content gaps the audit found.
 *
 * 1. The "Safety First" service had no German header or summary — a German
 *    reader hit an empty heading on a page about safety.
 * 2. The privacy policy existed only in English. It is not a separate document
 *    from the data-protection page: 82 of its 83 sentences are identical.
 *    So the German and Greek already exist and were simply never carried over
 *    — which is far safer than machine-translating legal text afresh.
 */
async function main() {
  // ── 1. Safety First, in German. Translated from the Greek, which is the
  //       fuller of the two written versions.
  const svc = await db.service.findFirst({ where: { slug: "safety-first" } })
  if (!svc) throw new Error("safety-first not found")
  const header = { ...(svc.header as Record<string, string>) }
  const shortDesc = { ...(svc.shortDesc as Record<string, string>) }
  header.de = "Sicherheit ist unser wichtigstes Anliegen"
  shortDesc.de =
    "Unser Protokoll »Sicherheit geht vor« ist das unsichtbare Fundament jedes Charters mit IYC Yachts " +
    "in den Ionischen Inseln. Es ist ein umfassender, nicht verhandelbarer Standard, der lange vor Ihrem " +
    "ersten Schritt an Bord beginnt. Jede Yacht unserer sorgfältig gepflegten Flotte wird strengen, " +
    "planmäßigen Kontrollen unterzogen und ist voll versichert — ein solides Fundament für Ihre Sicherheit."
  await db.service.update({ where: { id: svc.id }, data: { header, shortDesc } })
  console.log("safety-first: header.de and shortDesc.de written")

  // ── 2. Privacy policy in German and Greek, taken from the identical
  //       data-protection document rather than translated again.
  const row = await db.setting.findFirst({ where: { key: "legal" } })
  if (!row) throw new Error("legal setting missing")
  const value = row.value as { pages?: Record<string, unknown>[] }
  const pages = value.pages ?? []
  const source = pages.find((p) => p.slug === "data-protection")
  const target = pages.find((p) => p.slug === "privacy-policy")
  if (!source || !target) throw new Error("legal pages missing")

  const src = source.content as Record<string, string>
  const dst = target.content as Record<string, string>
  for (const lang of ["de", "el"] as const) {
    if (dst[lang]?.trim()) { console.log(`privacy-policy/${lang}: already present, left alone`); continue }
    if (!src[lang]?.trim()) { console.log(`privacy-policy/${lang}: no source to copy, SKIPPED`); continue }
    dst[lang] = src[lang]
    console.log(`privacy-policy/${lang}: ${src[lang].length} chars copied from data-protection`)
  }

  // Whole-value write: every other page and field goes back exactly as read.
  await db.setting.update({ where: { id: row.id }, data: { value: value as never } })
  await db.$disconnect()
}
main()

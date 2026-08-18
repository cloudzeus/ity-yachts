/**
 * Translate the room names that came out of Panotour.
 *
 * The tours only ever held English, and shouted it: SALOON, WC STERN 2. Across
 * all fifteen there are only about fifty distinct names, and they repeat from
 * boat to boat — so they are collected once, translated once, and written to a
 * dictionary the importer reads. Translating them per tour would pay for the
 * same forty-seven phrases fifteen times over.
 *
 * Sentence case is stored, not capitals. Greek in capitals has to lose its
 * accents to be correct, which is a display concern the viewer already handles;
 * a translation stored shouting cannot be un-shouted.
 *
 *   npx tsx scripts/translate-tour360.ts <archive-dir>
 */
import fs from "fs"
import path from "path"
import { translateBatch } from "@/lib/translate"

const dir = process.argv[2]
if (!dir || !fs.existsSync(dir)) {
  console.error("usage: tsx scripts/translate-tour360.ts <archive-dir>")
  process.exit(1)
}

const OUT = path.join(dir, "room-names.json")

async function main() {
  const names = new Set<string>()
  for (const d of fs.readdirSync(dir)) {
    const f = path.join(dir, d, "tour.json")
    if (!fs.existsSync(f)) continue
    for (const s of JSON.parse(fs.readFileSync(f, "utf8")).scenes as { title: string }[]) {
      if (s.title?.trim()) names.add(s.title.trim())
    }
  }

  const existing: Record<string, { en: string; el?: string; de?: string }> = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : {}

  const todo = [...names].filter((n) => !existing[n]?.el || !existing[n]?.de).sort()
  console.log(`${names.size} room names, ${todo.length} to translate`)
  if (!todo.length) return

  /* Sentence case first: the source is in capitals, and a translator handed
     SALOON returns ΣΑΛΟΝΙ — accented capitals in Greek, which is wrong, and
     nothing downstream can recover the lower-case form. */
  const source = todo.map((n) =>
    n.replace(/\b[A-Z]{2,}\b/g, (w) => w[0] + w.slice(1).toLowerCase())
  )

  /* Sixteen at a time, one language after the other. All forty-seven in one
     call came back truncated — the reasoning ceiling covers the thinking and
     the answer together — and asking for both languages at once put two
     requests on the provider in the same second and earned a 429. */
  const chunk = async (lang: string) => {
    const out: string[] = []
    for (let i = 0; i < source.length; i += 16) {
      const part = source.slice(i, i + 16)
      const got = await translateBatch(part, lang)
      if (got.length !== part.length) {
        throw new Error(`${lang}: asked for ${part.length} lines, got ${got.length}`)
      }
      out.push(...got)
    }
    return out
  }

  const el = await chunk("Greek")
  const de = await chunk("German")

  todo.forEach((n, i) => {
    existing[n] = { en: source[i], el: el[i], de: de[i] }
  })
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 1))

  for (const n of todo.slice(0, 12)) {
    console.log(`  ${n.padEnd(18)} ${existing[n].el?.padEnd(20)} ${existing[n].de}`)
  }
  console.log(`\nwrote ${OUT}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

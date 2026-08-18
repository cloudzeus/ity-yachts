/**
 * Attach the archived 360° tours to the yachts they belong to.
 *
 * Reads the manifests the mirror wrote beside the tiles and stores each one on
 * its yacht as `websiteTour360`. Nothing is invented here: the folders, the
 * levels and the room names all come from the krpano XML that shipped with the
 * tour, so what the visitor sees is what Panotour rendered.
 *
 * The tour folders are named after the shoot — 210925_maistros — and their
 * spelling drifted from the fleet: roxana/Roxane, sirios/Sirius,
 * electra/Elektra. Matching is on the slug with those three written down,
 * rather than fuzzy, so a wrong pairing is impossible rather than unlikely.
 *
 *   npx tsx scripts/import-tour360.ts <archive-dir> [--write]
 *
 * Without --write it reports what it would do and changes nothing.
 */
import fs from "fs"
import path from "path"
import { db } from "@/lib/db"

/** Tour slug → yacht name, only where the two genuinely differ. */
const ALIASES: Record<string, string> = {
  roxana: "Roxane",
  sirios: "Sirius",
  electra: "Elektra",
}

interface MirrorScene {
  id: string
  folder: string
  title: string
  tilesize: number
  levels: { level: string; size: number; grid: number }[]
  /** Written by scripts/retile-tour360.mjs; null when the scene could not be cut. */
  psv?: { grid: number; size: number; tile: number } | null
}

/** Room names in all three languages, written by translate-tour360.ts. */
function roomNames(dir: string): Record<string, { en: string; el?: string; de?: string }> {
  const f = path.join(dir, "room-names.json")
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {}
}

async function main() {
  const dir = process.argv[2]
  const write = process.argv.includes("--write")
  if (!dir || !fs.existsSync(dir)) {
    console.error("usage: tsx scripts/import-tour360.ts <archive-dir> [--write]")
    process.exit(1)
  }

  const names = roomNames(dir)
  const yachts = await db.nausysYacht.findMany({ select: { id: true, name: true } })
  const byName = new Map(yachts.map((y) => [y.name.toLowerCase(), y]))

  const tours = fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, "tour.json")))
    .sort()

  let matched = 0
  const unmatched: string[] = []

  for (const tour of tours) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, tour, "tour.json"), "utf8")) as {
      tour: string
      project: string
      scenes: MirrorScene[]
    }
    const slug = tour.replace(/^\d+_/, "")
    const wanted = (ALIASES[slug] || slug).toLowerCase()
    const yacht = byName.get(wanted)

    if (!yacht) {
      unmatched.push(`${tour} → no yacht called "${ALIASES[slug] || slug}"`)
      continue
    }

    /* Only scenes that are actually complete on disk — the re-cut grid the
       viewer reads, and the six whole faces it shows underneath while the
       tiles arrive. A tour with a room missing is still worth showing; a room
       that 404s in the viewer is not. */
    const scenes = meta.scenes
      .filter((s) => {
        if (!s.psv) return false
        const g = s.psv.grid - 1
        const last = path.join(dir, tour, s.folder, "psv", "5", `${g}_${g}.jpg`)
        const base = path.join(dir, tour, s.folder, "mobile", "0.jpg")
        return fs.existsSync(last) && fs.existsSync(base)
      })
      .map((s) => ({
        folder: s.folder,
        /* Panotour only ever held English, in capitals. The dictionary carries
           the sentence-case English alongside the Greek and German; where a
           name is missing from it the original is kept rather than blanked. */
        title: names[s.title] ?? { en: s.title },
        tilesize: s.tilesize,
        levels: s.levels,
        psv: s.psv,
      }))

    const dropped = meta.scenes.length - scenes.length
    console.log(
      `${yacht.name.padEnd(10)} ← ${tour}  ${scenes.length} scenes` +
        (dropped ? `  (${dropped} incomplete, skipped)` : "")
    )

    if (!scenes.length) continue
    matched++
    if (write) {
      await db.nausysYacht.update({
        where: { id: yacht.id },
        data: { websiteTour360: { base: tour, scenes } },
      })
    }
  }

  for (const u of unmatched) console.log(`  ${u}`)
  const without = yachts
    .filter((y) => !tours.some((t) => (ALIASES[t.replace(/^\d+_/, "")] || t.replace(/^\d+_/, "")).toLowerCase() === y.name.toLowerCase()))
    .map((y) => y.name)
  console.log(`\n${matched}/${tours.length} tours attached${write ? "" : " (dry run — pass --write)"}`)
  if (without.length) console.log(`no tour: ${without.join(", ")}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

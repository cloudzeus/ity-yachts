/**
 * Re-cut the krpano cube tiles onto a grid Photo Sphere Viewer will accept.
 *
 * Panotour rendered each cube face as a 7x7 or 6x6 grid of 512px tiles.
 * Photo Sphere Viewer refuses anything but a power of two — "Panorama nbTiles
 * must be power of 2" — so 7 and 6 are both out, and the levels below them are
 * 4x4, 3x3 and 2x2, which means the only grid that already fits is the 1024px
 * base. That is the resolution of the fallback image; showing it as the tour
 * would throw away three quarters of the detail that was shot.
 *
 * So the face is stitched back together at its full size and cut again into
 * 8x8. Nothing is resampled: 3584 divides into eight tiles of 448, 3072 into
 * eight of 384, and each output tile is a crop of the assembled face. The
 * photograph that comes out is the photograph that went in.
 *
 *   node scripts/retile-tour360.mjs <archive-dir> [tour ...]
 *
 * Writes {scene}/psv/{face}/{row}_{col}.jpg beside the originals and records
 * the new grid in tour.json. Re-runnable: finished scenes are skipped.
 */
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import sharp from "sharp"

const GRID = 8 // what Photo Sphere Viewer will take
const dir = process.argv[2]
if (!dir || !fs.existsSync(dir)) {
  console.error("usage: node scripts/retile-tour360.mjs <archive-dir> [tour ...]")
  process.exit(1)
}
const only = process.argv.slice(3)

/** Stitch one cube face from its krpano tiles. */
async function assemble(sceneDir, face, level, grid, tilesize, size) {
  const parts = []
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const p = path.join(sceneDir, String(face), level, `${row}_${col}.jpg`)
      if (!fs.existsSync(p)) return null
      parts.push({ input: p, left: col * tilesize, top: row * tilesize })
    }
  }
  /* The last row and column are short — 3584 is seven 512s exactly, but a
     6x6 grid of 512 covers 3072 and other tours crop the edge tile. Compose
     onto a canvas of the declared size and let the overflow fall off. */
  return sharp({
    create: { width: size, height: size, channels: 3, background: "#000" },
  })
    .composite(parts)
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
    .toBuffer()
}

async function retileScene(tourDir, scene) {
  const sceneDir = path.join(tourDir, scene.folder)
  const out = path.join(sceneDir, "psv")
  const top = scene.levels.reduce((a, b) => (b.size > a.size ? b : a))
  const tile = top.size / GRID
  if (!Number.isInteger(tile)) {
    console.log(`    ${scene.folder}: ${top.size} does not divide into ${GRID} — skipped`)
    return null
  }

  const last = path.join(out, "5", `${GRID - 1}_${GRID - 1}.jpg`)
  if (fs.existsSync(last)) return { grid: GRID, size: top.size, tile }

  for (let face = 0; face < 6; face++) {
    const buf = await assemble(sceneDir, face, top.level, top.grid, scene.tilesize, top.size)
    if (!buf) {
      console.log(`    ${scene.folder} face ${face}: tiles missing — scene skipped`)
      return null
    }
    const img = sharp(buf)
    fs.mkdirSync(path.join(out, String(face)), { recursive: true })
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        await img
          .clone()
          .extract({ left: col * tile, top: row * tile, width: tile, height: tile })
          .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
          .toFile(path.join(out, String(face), `${row}_${col}.jpg`))
      }
    }
  }
  return { grid: GRID, size: top.size, tile }
}

const tours = fs
  .readdirSync(dir)
  .filter((d) => fs.existsSync(path.join(dir, d, "tour.json")))
  .filter((d) => !only.length || only.includes(d))
  .sort()

for (const tour of tours) {
  const file = path.join(dir, tour, "tour.json")
  const meta = JSON.parse(fs.readFileSync(file, "utf8"))
  console.log(`${tour} (${meta.scenes.length} scenes)`)
  for (const scene of meta.scenes) {
    const psv = await retileScene(path.join(dir, tour), scene)
    scene.psv = psv // null when the scene could not be re-cut
    if (psv) console.log(`    ${scene.folder}: ${psv.size}px face, ${GRID}x${GRID} of ${psv.tile}px`)
  }
  fs.writeFileSync(file, JSON.stringify(meta, null, 1))
}
console.log(`done on ${os.cpus().length} cores`)

import "dotenv/config"
import { db } from "../lib/db"

async function main() {
  const rows = await db.media.findMany({
    where: { mimeType: { startsWith: "video" } },
    select: { id: true, name: true, path: true, url: true, size: true, optimizedAt: true, width: true, height: true },
    orderBy: { size: "desc" },
  })
  console.log(`${rows.length} video rows in the media table\n`)
  for (const r of rows) {
    console.log(`${(r.size / 1048576).toFixed(2).padStart(8)} MB  ${r.optimizedAt ? "opt " : "RAW "} ${r.width ?? "?"}x${r.height ?? "?"}  ${r.path}`)
  }
  await db.$disconnect()
}
main()

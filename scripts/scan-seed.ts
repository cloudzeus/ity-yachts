import { PrismaClient } from "@prisma/client"
import { readdir, readFile } from "fs/promises"
import path from "path"

const db = new PrismaClient()

async function collectFiles(dir: string, ext: string): Promise<string[]> {
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue
      results.push(...(await collectFiles(full, ext)))
    } else if (entry.name.endsWith(ext)) {
      results.push(full)
    }
  }
  return results
}

async function main() {
  const root = "/Volumes/EXTERNALSSD/iycyachts"
  const files = [
    ...(await collectFiles(path.join(root, "app"), ".tsx")),
    ...(await collectFiles(path.join(root, "components"), ".tsx")),
  ]
  
  const usedKeys = new Map<string, string>()
  const keyPattern = /\bt\(\s*["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?\s*\)/g
  
  for (const file of files) {
    const content = await readFile(file, "utf-8")
    let match
    while ((match = keyPattern.exec(content)) !== null) {
      const key = match[1]
      const fallback = match[2] || ""
      if (!usedKeys.has(key) || (!usedKeys.get(key) && fallback)) {
        usedKeys.set(key, fallback)
      }
    }
    keyPattern.lastIndex = 0
  }
  
  const dbTranslations = await db.siteTranslation.findMany({
    select: { key: true },
  })
  const dbKeys = new Set(dbTranslations.map((t) => t.key))
  
  const missingKeys = [...usedKeys.entries()].filter(([k]) => !dbKeys.has(k))
  let created = 0
  
  for (const [key, fallback] of missingKeys) {
    try {
      const namespace = key.includes(".") ? key.split(".")[0] : "common"
      await db.siteTranslation.create({
        data: { key, namespace, en: fallback, el: "", de: "" },
      })
      created++
    } catch {
      // skip duplicates
    }
  }
  
  const total = await db.siteTranslation.count()
  const untranslated = await db.siteTranslation.count({
    where: { OR: [{ el: "" }, { de: "" }] }
  })
  
  console.log(`Scanned ${files.length} files`)
  console.log(`Found ${usedKeys.size} t() keys in code`)
  console.log(`Created ${created} new keys`)
  console.log(`Total keys in DB: ${total}`)
  console.log(`Untranslated: ${untranslated}`)
  
  await db.$disconnect()
}

main()

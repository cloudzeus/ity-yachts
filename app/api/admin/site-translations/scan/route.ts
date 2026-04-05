import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { readdir, readFile } from "fs/promises"
import path from "path"

async function collectFiles(dir: string, ext: string): Promise<string[]> {
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue
      results.push(...(await collectFiles(full, ext)))
    } else if (entry.name.endsWith(ext)) {
      results.push(full)
    }
  }
  return results
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const root = process.cwd()
    const files = [
      ...(await collectFiles(path.join(root, "app"), ".tsx")),
      ...(await collectFiles(path.join(root, "components"), ".tsx")),
    ]

    // Extract all t("key", "fallback") calls from source
    // Two patterns: double-quoted and single-quoted, to handle apostrophes inside strings
    const usedKeys = new Map<string, string>() // key -> fallback text
    const dqPattern = /\bt\(\s*"([^"]+)"\s*(?:,\s*"([^"]+)")?\s*\)/g
    const sqPattern = /\bt\(\s*'([^']+)'\s*(?:,\s*'([^']+)')?\s*\)/g

    // Also match <LocaleText tKey="key" fallback="text" /> in server components
    const tKeyPattern = /tKey="([^"]+)"\s+fallback="([^"]+)"/g
    const tKeyNoFb = /tKey="([^"]+)"/g

    for (const file of files) {
      const content = await readFile(file, "utf-8")
      for (const keyPattern of [dqPattern, sqPattern, tKeyPattern]) {
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
      // tKey without fallback
      {
        let match
        while ((match = tKeyNoFb.exec(content)) !== null) {
          const key = match[1]
          if (!usedKeys.has(key)) usedKeys.set(key, "")
        }
        tKeyNoFb.lastIndex = 0
      }
    }

    // Get all DB keys
    const dbTranslations = await db.siteTranslation.findMany({
      select: { id: true, key: true, en: true, el: true, de: true },
    })

    const dbKeys = new Set(dbTranslations.map((t) => t.key))

    // Orphaned = in DB but not used in code
    const orphaned = dbTranslations
      .filter((t) => !usedKeys.has(t.key))
      .map((t) => ({ id: t.id, key: t.key, en: t.en }))

    // Missing = used in code but not in DB — auto-create them
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

    // Re-fetch after inserts
    const updatedTranslations = created > 0
      ? await db.siteTranslation.findMany({ select: { id: true, key: true, en: true, el: true, de: true } })
      : dbTranslations

    // Untranslated = in DB with English but missing el or de
    const untranslated = updatedTranslations.filter(
      (t) => t.en && (!t.el || !t.de)
    ).length

    return NextResponse.json({
      totalInCode: usedKeys.size,
      totalInDb: updatedTranslations.length,
      orphaned,
      missing: missingKeys.map(([k]) => k),
      created,
      untranslated,
      filesScanned: files.length,
    })
  } catch (error) {
    console.error("[POST /api/admin/site-translations/scan]", error)
    return NextResponse.json({ error: "Scan failed" }, { status: 500 })
  }
}

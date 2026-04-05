import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { translateBatch } from "@/lib/translate"
import { NextRequest, NextResponse } from "next/server"

const TABLE_MAP = {
  categories: "nausysYachtCategory",
  sailTypes: "nausysSailType",
  steeringTypes: "nausysSteeringType",
  equipmentCategories: "nausysEquipmentCategory",
  equipment: "nausysEquipment",
  services: "nausysService",
} as const

type TableKey = keyof typeof TABLE_MAP

/**
 * POST /api/admin/fleet/tables/translate-all
 * Body: { table: TableKey, lang: "el" | "de" }
 *
 * Finds all items where the target language field is empty,
 * batch-translates from English via DeepSeek, and updates the DB.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { table, lang } = (await req.json()) as { table: string; lang: string }

    if (!table || !TABLE_MAP[table as TableKey]) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 })
    }
    if (!lang || !["el", "de"].includes(lang)) {
      return NextResponse.json({ error: "Invalid language (el or de)" }, { status: 400 })
    }

    const modelName = TABLE_MAP[table as TableKey]
    const model = (db as any)[modelName]

    // Fetch all items
    const allItems: Array<{ id: number; name: Record<string, string> }> = await model.findMany({
      orderBy: { id: "asc" },
    })

    // Filter to items that have EN but are missing target lang
    const needsTranslation = allItems.filter((item) => {
      const name = item.name as Record<string, string> | null
      if (!name || !name.en) return false
      return !name[lang] || name[lang].trim() === ""
    })

    if (needsTranslation.length === 0) {
      return NextResponse.json({ translated: 0, message: "All items already have translations" })
    }

    // Batch translate in chunks of 40
    const CHUNK_SIZE = 40
    let totalTranslated = 0

    for (let i = 0; i < needsTranslation.length; i += CHUNK_SIZE) {
      const chunk = needsTranslation.slice(i, i + CHUNK_SIZE)
      const englishTexts = chunk.map((item) => (item.name as Record<string, string>).en)

      let translations: string[]
      try {
        translations = await translateBatch(englishTexts, lang, "en")
      } catch (err) {
        console.error(`[translate-all] Batch ${i / CHUNK_SIZE + 1} failed:`, err)
        continue
      }

      // Update each item
      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j]
        const translated = translations[j]
        if (!translated) continue

        const currentName = item.name as Record<string, string>
        try {
          await model.update({
            where: { id: item.id },
            data: {
              name: { ...currentName, [lang]: translated },
            },
          })
          totalTranslated++
        } catch (err) {
          console.error(`[translate-all] Failed to update item ${item.id}:`, err)
        }
      }
    }

    return NextResponse.json({ translated: totalTranslated, total: needsTranslation.length })
  } catch (error) {
    console.error("[POST /api/admin/fleet/tables/translate-all]", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}

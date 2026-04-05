import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { translate } from "@/lib/translate"
import { NextResponse } from "next/server"

type JsonTranslations = Record<string, string>

/** Translate a JSON field like { en: "...", el: "", de: "" } — fills missing langs */
async function translateJsonField(
  json: unknown
): Promise<{ updated: boolean; value: JsonTranslations }> {
  const obj = (json && typeof json === "object" ? json : {}) as JsonTranslations
  const en = obj.en || ""
  if (!en) return { updated: false, value: obj }

  let changed = false
  const result = { ...obj }

  for (const lang of ["el", "de"] as const) {
    if (!result[lang]) {
      try {
        result[lang] = await translate(en, lang, "en")
        changed = true
      } catch {
        // skip failures silently
      }
    }
  }

  return { updated: changed, value: result }
}

/** Translate multiple JSON fields on a record, returning only updated ones */
async function translateJsonFields(
  record: Record<string, unknown>,
  fields: string[]
): Promise<Record<string, JsonTranslations> | null> {
  const updates: Record<string, JsonTranslations> = {}
  let anyUpdated = false

  for (const field of fields) {
    const { updated, value } = await translateJsonField(record[field])
    if (updated) {
      updates[field] = value
      anyUpdated = true
    }
  }

  return anyUpdated ? updates : null
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stats = {
      labels: { translated: 0, failed: 0 },
      content: { translated: 0, failed: 0 },
      errors: [] as string[],
    }

    // ── 1. Site Translation labels (en/el/de columns) ──
    const untranslated = await db.siteTranslation.findMany({
      where: {
        en: { not: "" },
        OR: [{ el: "" }, { de: "" }],
      },
    })

    for (const item of untranslated) {
      try {
        const updates: { el?: string; de?: string } = {}
        if (!item.el) updates.el = await translate(item.en, "el", "en")
        if (!item.de) updates.de = await translate(item.en, "de", "en")

        await db.siteTranslation.update({
          where: { id: item.id },
          data: updates,
        })
        stats.labels.translated++
      } catch {
        stats.labels.failed++
        stats.errors.push(`label:${item.key}`)
      }
    }

    // ── 2. Page translations (menu labels + text components) ──
    const pages = await db.page.findMany({
      select: { id: true, name: true, translations: true },
    })
    for (const page of pages) {
      try {
        const updates = await translateJsonFields(
          { translations: page.translations },
          ["translations"]
        )
        if (updates) {
          await db.page.update({ where: { id: page.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`page:${page.name}`)
      }
    }

    // Text components
    const textComps = await db.textComponent.findMany({
      select: { id: true, key: true, translations: true },
    })
    for (const tc of textComps) {
      try {
        const updates = await translateJsonFields(
          { translations: tc.translations },
          ["translations"]
        )
        if (updates) {
          await db.textComponent.update({ where: { id: tc.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`text:${tc.key}`)
      }
    }

    // ── 3. Locations ──
    const locations = await db.location.findMany({
      select: { id: true, name: true, nameTranslations: true, shortDesc: true, description: true, prefecture: true },
    })
    for (const loc of locations) {
      try {
        const updates = await translateJsonFields(
          loc as Record<string, unknown>,
          ["nameTranslations", "shortDesc", "description", "prefecture"]
        )
        if (updates) {
          await db.location.update({ where: { id: loc.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`location:${loc.name}`)
      }
    }

    // ── 4. Itineraries ──
    const itineraries = await db.itinerary.findMany({
      select: { id: true, slug: true, name: true, shortDesc: true },
    })
    for (const itin of itineraries) {
      try {
        const updates = await translateJsonFields(
          itin as Record<string, unknown>,
          ["name", "shortDesc"]
        )
        if (updates) {
          await db.itinerary.update({ where: { id: itin.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`itinerary:${itin.slug}`)
      }
    }

    // Itinerary days
    const days = await db.itineraryDay.findMany({
      select: { id: true, dayNumber: true, itineraryId: true, description: true },
    })
    for (const day of days) {
      try {
        const updates = await translateJsonFields(
          day as Record<string, unknown>,
          ["description"]
        )
        if (updates) {
          await db.itineraryDay.update({ where: { id: day.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`day:${day.itineraryId}-${day.dayNumber}`)
      }
    }

    // Itinerary legs
    const legs = await db.itineraryLeg.findMany({
      select: { id: true, name: true, description: true },
    })
    for (const leg of legs) {
      try {
        const updates = await translateJsonFields(
          leg as Record<string, unknown>,
          ["name", "description"]
        )
        if (updates) {
          await db.itineraryLeg.update({ where: { id: leg.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`leg:${leg.id}`)
      }
    }

    // ── 5. Staff ──
    const staff = await db.staff.findMany({
      select: { id: true, name: true, city: true, department: true, position: true, bio: true },
    })
    for (const s of staff) {
      try {
        const updates = await translateJsonFields(
          s as Record<string, unknown>,
          ["city", "department", "position", "bio"]
        )
        if (updates) {
          await db.staff.update({ where: { id: s.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`staff:${s.name}`)
      }
    }

    // ── 6. Reviews ──
    const reviews = await db.review.findMany({
      select: { id: true, name: true, content: true },
    })
    for (const rev of reviews) {
      try {
        const updates = await translateJsonFields(
          rev as Record<string, unknown>,
          ["content"]
        )
        if (updates) {
          await db.review.update({ where: { id: rev.id }, data: updates })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`review:${rev.name}`)
      }
    }

    const totalTranslated = stats.labels.translated + stats.content.translated
    const totalFailed = stats.labels.failed + stats.content.failed

    return NextResponse.json({
      translated: totalTranslated,
      failed: totalFailed,
      labels: stats.labels,
      content: stats.content,
      errors: stats.errors.slice(0, 20),
    })
  } catch (error) {
    console.error("[POST /api/admin/site-translations/translate-all]", error)
    return NextResponse.json({ error: "Bulk translation failed" }, { status: 500 })
  }
}

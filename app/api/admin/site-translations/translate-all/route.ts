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

    // ── 6. Page hero sections ──
    const pagesWithHero = await db.page.findMany({
      select: { id: true, name: true, heroSection: true },
    })
    for (const p of pagesWithHero) {
      try {
        const hero = p.heroSection as Record<string, unknown> | null
        if (!hero) continue
        const fields = ["overSubheading", "heading", "subheading", "buttonText"]
        const updates = await translateJsonFields(hero, fields)
        if (updates) {
          await db.page.update({
            where: { id: p.id },
            data: { heroSection: { ...hero, ...updates } as object },
          })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`hero:${p.name}`)
      }
    }

    // ── 7. Page components (Skipper Academy, etc.) ──
    const pageComponents = await db.pageComponent.findMany({
      select: { id: true, type: true, name: true, props: true },
    })
    for (const comp of pageComponents) {
      try {
        const props = (comp.props || {}) as Record<string, unknown>
        let anyChanged = false
        const updatedProps = { ...props }

        // Helper to translate a single { en, el, de } object
        async function translateT(obj: unknown): Promise<{ changed: boolean; value: Record<string, string> }> {
          const t = (obj && typeof obj === "object" ? obj : {}) as Record<string, string>
          if (!t.en) return { changed: false, value: t }
          let changed = false
          const result = { ...t }
          for (const lang of ["el", "de"] as const) {
            if (!result[lang]) {
              try {
                result[lang] = await translate(t.en, lang, "en")
                changed = true
              } catch { /* skip */ }
            }
          }
          return { changed, value: result }
        }

        // Translate simple top-level { en, el, de } fields in nested objects
        async function translateNestedObj(key: string, fields: string[]) {
          const obj = (updatedProps[key] || {}) as Record<string, unknown>
          let objChanged = false
          const updated = { ...obj }
          for (const f of fields) {
            const { changed, value } = await translateT(obj[f])
            if (changed) { updated[f] = value; objChanged = true }
          }
          if (objChanged) { updatedProps[key] = updated; anyChanged = true }
        }

        // Translate arrays of { ..., title: T, description: T } etc.
        async function translateArray(key: string, fields: string[]) {
          const arr = (updatedProps[key] || []) as Record<string, unknown>[]
          if (!arr.length) return
          let arrChanged = false
          const updated = arr.map((item) => ({ ...item }))
          for (let i = 0; i < updated.length; i++) {
            for (const f of fields) {
              const { changed, value } = await translateT(updated[i][f])
              if (changed) { updated[i][f] = value; arrChanged = true }
            }
          }
          if (arrChanged) { updatedProps[key] = updated; anyChanged = true }
        }

        // Translate array of bare T objects (like curriculum, audience)
        async function translateTArray(parentKey: string, arrayKey: string) {
          const parent = (updatedProps[parentKey] || {}) as Record<string, unknown>
          const arr = (parent[arrayKey] || []) as Record<string, string>[]
          if (!arr.length) return
          let arrChanged = false
          const updated = [...arr]
          for (let i = 0; i < updated.length; i++) {
            const { changed, value } = await translateT(updated[i])
            if (changed) { updated[i] = value; arrChanged = true }
          }
          if (arrChanged) {
            updatedProps[parentKey] = { ...parent, [arrayKey]: updated }
            anyChanged = true
          }
        }

        // Value Proposition
        await translateNestedObj("valueProposition", ["headline", "subtext", "body"])
        // Features
        await translateArray("features", ["title", "description"])
        // Training Program
        await translateNestedObj("trainingProgram", ["headline", "body"])
        await translateTArray("trainingProgram", "curriculum")
        await translateTArray("trainingProgram", "audience")
        // Testimonials
        await translateArray("testimonials", ["location", "content"])
        // Stats
        await translateArray("stats", ["value", "label"])
        // CTA
        await translateNestedObj("cta", ["headline", "body", "primaryButton", "secondaryButton"])
        // Blessing
        await translateNestedObj("blessing", ["quote", "subtitle"])

        if (anyChanged) {
          await db.pageComponent.update({
            where: { id: comp.id },
            data: { props: updatedProps },
          })
          stats.content.translated++
        }
      } catch {
        stats.content.failed++
        stats.errors.push(`component:${comp.name || comp.type}`)
      }
    }

    // ── 8. Reviews ──
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

import { db } from "@/lib/db"

/**
 * NAUSYS catalogue names, surfaced in the Site Translations screen.
 *
 * These names live in their own tables — `nausys_equipment.name` and friends,
 * each a `{ en, el, de }` JSON column — not in `site_translations`. Copying
 * them across would create a second source of truth that the next NAUSYS sync
 * would immediately contradict, so instead they are read in place and given a
 * synthetic id that says where to write them back:
 *
 *     nausys:nausys_equipment:1234
 *
 * NAUSYS supplies English and German and never Greek, so this screen is the
 * only place the Greek for a piece of equipment can come from.
 */

export const CATALOGUE_PREFIX = "nausys:"

/** Tables exposed for editing, in the order they appear in the picker. */
export const CATALOGUE_SOURCES = [
  { table: "nausys_equipment_categories", namespace: "catalogue.equipmentCategory" },
  { table: "nausys_equipment", namespace: "catalogue.equipment" },
  { table: "nausys_services", namespace: "catalogue.service" },
  { table: "nausys_locations", namespace: "catalogue.location" },
  { table: "nausys_regions", namespace: "catalogue.region" },
  { table: "nausys_yacht_categories", namespace: "catalogue.yachtCategory" },
  { table: "nausys_sail_types", namespace: "catalogue.sailType" },
  { table: "nausys_steering_types", namespace: "catalogue.steeringType" },
] as const

const ALLOWED = new Set<string>(CATALOGUE_SOURCES.map((s) => s.table))

export interface CatalogueRow {
  id: string
  key: string
  namespace: string
  en: string
  el: string
  de: string
  readOnlyKey: true
}

function asI18n(value: unknown): { en: string; el: string; de: string } {
  const v = typeof value === "string" ? safeParse(value) : value
  const o = (v ?? {}) as Record<string, string>
  return { en: o.en ?? "", el: o.el ?? "", de: o.de ?? "" }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

/**
 * Only what the fleet actually uses. The full catalogue runs to ~1,100
 * equipment items across every charter company on NAUSYS; ours touches under a
 * hundred, and listing the rest would bury them.
 */
export async function loadCatalogueTranslations(): Promise<CatalogueRow[]> {
  const inUse: Record<string, string> = {
    nausys_equipment:
      "SELECT DISTINCT e.id, e.name FROM nausys_yacht_equipment ye JOIN nausys_equipment e ON e.id = ye.equipmentId",
    nausys_equipment_categories:
      "SELECT DISTINCT c.id, c.name FROM nausys_yacht_equipment ye JOIN nausys_equipment e ON e.id = ye.equipmentId JOIN nausys_equipment_categories c ON c.id = e.categoryId",
    nausys_services:
      "SELECT DISTINCT s.id, s.name FROM nausys_yacht_services ys JOIN nausys_services s ON s.id = ys.serviceId",
    nausys_locations:
      "SELECT DISTINCT l.id, l.name FROM nausys_charter_bases b JOIN nausys_locations l ON l.id = b.locationId",
    nausys_yacht_categories:
      "SELECT DISTINCT c.id, c.name FROM nausys_yachts y JOIN nausys_yacht_categories c ON c.id = y.categoryId",
  }

  const out: CatalogueRow[] = []
  for (const src of CATALOGUE_SOURCES) {
    const sql = inUse[src.table] ?? `SELECT id, name FROM ${src.table}`
    let rows: Array<{ id: number; name: unknown }> = []
    try {
      rows = await db.$queryRawUnsafe(sql)
    } catch {
      continue // a catalogue table that has never synced simply has nothing to show
    }
    for (const r of rows) {
      const t = asI18n(r.name)
      if (!t.en && !t.de && !t.el) continue
      out.push({
        id: `${CATALOGUE_PREFIX}${src.table}:${r.id}`,
        key: t.en || t.de || String(r.id),
        namespace: src.namespace,
        ...t,
        readOnlyKey: true,
      })
    }
  }
  return out.sort((a, b) =>
    a.namespace === b.namespace ? a.key.localeCompare(b.key) : a.namespace.localeCompare(b.namespace)
  )
}

export function parseCatalogueId(id: string): { table: string; rowId: number } | null {
  if (!id.startsWith(CATALOGUE_PREFIX)) return null
  const [, table, rawId] = id.split(":")
  const rowId = Number(rawId)
  // Guard the table name explicitly — it is interpolated into SQL below.
  if (!ALLOWED.has(table) || !Number.isInteger(rowId)) return null
  return { table, rowId }
}

/**
 * Write one locale back into the catalogue row, touching only that key so the
 * locales NAUSYS owns survive.
 */
export async function updateCatalogueTranslation(
  id: string,
  patch: { en?: string; el?: string; de?: string }
): Promise<boolean> {
  const target = parseCatalogueId(id)
  if (!target) return false

  const entries = (["en", "el", "de"] as const).filter((l) => patch[l] !== undefined)
  if (!entries.length) return true

  const sets = entries.map((l) => `'$.${l}', ?`).join(", ")
  const values = entries.map((l) => patch[l] ?? "")
  await db.$executeRawUnsafe(
    `UPDATE \`${target.table}\` SET name = JSON_SET(COALESCE(name, JSON_OBJECT()), ${sets}) WHERE id = ?`,
    ...values,
    target.rowId
  )
  return true
}

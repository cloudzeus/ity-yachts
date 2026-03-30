import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import {
  type NausysCredentials,
  type RawYacht,
  i18nToJson,
  parseNausysDate,
  fetchCategories,
  fetchYachtBuilders,
  fetchEngineBuilders,
  fetchYachtModels,
  fetchSailTypes,
  fetchSteeringTypes,
  fetchCountries,
  fetchRegions,
  fetchLocations,
  fetchCharterBases,
  fetchEquipmentCategories,
  fetchEquipment,
  fetchServices,
  fetchPriceMeasures,
  fetchDiscountItems,
  fetchSeasons,
  fetchAllYachts,
} from "./nausys-api"

type LogFn = (msg: string) => void

// ── Helpers ──

let cuidCounter = 0
function genId(): string {
  cuidCounter++
  return `sync_${Date.now().toString(36)}_${cuidCounter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL"
  if (typeof v === "boolean") return v ? "1" : "0"
  if (typeof v === "number") return String(v)
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}

async function batchUpsert(table: string, columns: string[], rows: unknown[][], updateCols?: string[]) {
  if (rows.length === 0) return
  const now = new Date()
  const allCols = [...columns, "createdAt", "updatedAt"]
  const uCols = updateCols ?? columns.filter((c) => c !== "id")
  const BATCH_SIZE = 200
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const values = batch.map((row) => `(${[...row, now, now].map(esc).join(",")})`).join(",\n")
    const onDup = [...uCols, "updatedAt"].map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ")
    await db.$executeRawUnsafe(
      `INSERT INTO \`${table}\` (${allCols.map((c) => `\`${c}\``).join(",")}) VALUES ${values} ON DUPLICATE KEY UPDATE ${onDup}`
    )
  }
}

// ── Catalogue sync functions ──

async function syncCategories(c: NausysCredentials, log: LogFn) {
  const items = await fetchCategories(c)
  await batchUpsert("nausys_yacht_categories", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} yacht categories`)
  return items.length
}

async function syncYachtBuilders(c: NausysCredentials, log: LogFn) {
  const items = await fetchYachtBuilders(c)
  await batchUpsert("nausys_yacht_builders", ["id", "name"], items.map((r) => [r.id, r.name]))
  log(`Synced ${items.length} yacht builders`)
  return items.length
}

async function syncEngineBuilders(c: NausysCredentials, log: LogFn) {
  const items = await fetchEngineBuilders(c)
  await batchUpsert("nausys_engine_builders", ["id", "name"], items.map((r) => [r.id, r.name]))
  log(`Synced ${items.length} engine builders`)
  return items.length
}

async function syncSailTypes(c: NausysCredentials, log: LogFn) {
  const items = await fetchSailTypes(c)
  await batchUpsert("nausys_sail_types", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} sail types`)
  return items.length
}

async function syncSteeringTypes(c: NausysCredentials, log: LogFn) {
  const items = await fetchSteeringTypes(c)
  await batchUpsert("nausys_steering_types", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} steering types`)
  return items.length
}

async function syncCountries(c: NausysCredentials, log: LogFn) {
  const items = await fetchCountries(c)
  await batchUpsert(
    "nausys_countries",
    ["id", "code", "code2", "name"],
    items.map((r) => [r.id, r.code ?? null, r.code2 ?? null, i18nToJson(r.name)])
  )
  log(`Synced ${items.length} countries`)
  return items.length
}

async function syncRegions(c: NausysCredentials, log: LogFn) {
  const items = await fetchRegions(c)
  await batchUpsert("nausys_regions", ["id", "name", "countryId"], items.map((r) => [r.id, i18nToJson(r.name), r.countryId]))
  log(`Synced ${items.length} regions`)
  return items.length
}

async function syncLocations(c: NausysCredentials, log: LogFn) {
  const items = await fetchLocations(c)
  await batchUpsert("nausys_locations", ["id", "name", "regionId"], items.map((r) => [r.id, i18nToJson(r.name), r.regionId ?? null]))
  log(`Synced ${items.length} locations`)
  return items.length
}

async function syncCharterBases(c: NausysCredentials, log: LogFn) {
  const items = await fetchCharterBases(c)
  await batchUpsert(
    "nausys_charter_bases",
    ["id", "locationId", "companyId", "checkInTime", "checkOutTime", "lat", "lon", "secondaryBase", "disabled"],
    items.map((r) => [
      r.id, r.locationId, r.companyId ?? null,
      r.checkInTime ?? null, r.checkOutTime ?? null,
      r.lat ?? null, r.lon ?? null,
      r.secondaryBase ?? false, r.disabled ?? false,
    ])
  )
  log(`Synced ${items.length} charter bases`)
  return items.length
}

async function syncEquipmentCategories(c: NausysCredentials, log: LogFn) {
  const items = await fetchEquipmentCategories(c)
  await batchUpsert("nausys_equipment_categories", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} equipment categories`)
  return items.length
}

async function syncEquipment(c: NausysCredentials, log: LogFn) {
  const items = await fetchEquipment(c)
  await batchUpsert(
    "nausys_equipment",
    ["id", "name", "categoryId"],
    items.map((r) => [r.id, i18nToJson(r.name), r.categoryId ?? null])
  )
  log(`Synced ${items.length} equipment items`)
  return items.length
}

async function syncServices(c: NausysCredentials, log: LogFn) {
  const items = await fetchServices(c)
  await batchUpsert(
    "nausys_services",
    ["id", "name", "depositInsurance"],
    items.map((r) => [r.id, i18nToJson(r.name), r.depositInsurance ?? false])
  )
  log(`Synced ${items.length} services`)
  return items.length
}

async function syncPriceMeasures(c: NausysCredentials, log: LogFn) {
  const items = await fetchPriceMeasures(c)
  await batchUpsert("nausys_price_measures", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} price measures`)
  return items.length
}

async function syncDiscountItems(c: NausysCredentials, log: LogFn) {
  const items = await fetchDiscountItems(c)
  await batchUpsert("nausys_discount_items", ["id", "name"], items.map((r) => [r.id, i18nToJson(r.name)]))
  log(`Synced ${items.length} discount items`)
  return items.length
}

async function syncSeasons(c: NausysCredentials, log: LogFn) {
  const items = await fetchSeasons(c)
  await batchUpsert(
    "nausys_seasons",
    ["id", "companyId", "season", "dateFrom", "dateTo", "defaultSeason", "locationsId"],
    items.map((r) => [
      r.id, r.charterCompanyId ?? null, r.season,
      parseNausysDate(r.from), parseNausysDate(r.to),
      r.defaultSeason ?? false, r.locationsId ?? [],
    ])
  )
  log(`Synced ${items.length} seasons`)
  return items.length
}

async function syncYachtModels(c: NausysCredentials, log: LogFn) {
  const items = await fetchYachtModels(c)
  await batchUpsert(
    "nausys_yacht_models",
    ["id", "name", "categoryId", "builderId", "loa", "beam", "draft", "cabins", "wc", "waterTank", "fuelTank", "displacement", "virtualLength"],
    items.map((r) => [
      r.id, r.name, r.yachtCategoryId, r.yachtBuilderId,
      r.loa ?? null, r.beam ?? null, r.draft ?? null,
      r.cabins ?? null, r.wc ?? null, r.waterTank ?? null,
      r.fuelTank ?? null, r.displacement ?? null, r.virtualLength ?? null,
    ])
  )
  log(`Synced ${items.length} yacht models`)
  return items.length
}

// ── Yacht sync ──

async function syncYachtRecord(y: RawYacht, modelCache: Map<number, { categoryId: number; builderId: number; loa: number | null }>) {
  const model = y.yachtModelId ? modelCache.get(y.yachtModelId) : null

  // Core yacht upsert via raw SQL — must include all non-nullable columns (Json @default fields have no MySQL default)
  await batchUpsert(
    "nausys_yachts",
    [
      "id", "name", "companyId", "baseId", "modelId", "categoryId", "builderId",
      "charterType", "crewedCharterType", "draft", "loa",
      "cabins", "cabinsCrew", "berthsCabin", "berthsSalon", "berthsCrew", "berthsTotal",
      "wc", "wcCrew", "showers", "showersCrew",
      "buildYear", "launchedYear", "engines", "enginePower",
      "fuelTank", "waterTank", "fuelConsumption",
      "numberOfRudderBlades", "maxSpeed", "cruisingSpeed",
      "sailTypeId", "steeringTypeId",
      "isPremium", "onSale", "needsOptionApproval", "canMakeBookingFixed", "registrationCertified",
      "deposit", "depositCurrency", "depositWhenInsured", "maxDiscount",
      "highlights", "highlightsTranslations", "noteTranslations",
      "mainPictureUrl", "picturesUrl",
      "websiteImages", "websiteVideos",
      "checkInTime", "checkOutTime", "flagsId", "lastSyncedAt",
    ],
    [[
      y.id, y.name, y.companyId ?? null, y.baseId ?? null,
      y.yachtModelId ?? null, model?.categoryId ?? null, model?.builderId ?? null,
      y.charterType ?? null, y.crewedCharterType ?? null,
      y.draft ?? null, model?.loa ?? null,
      y.cabins ?? null, y.cabinsCrew ?? null,
      y.berthsCabin ?? null, y.berthsSalon ?? null, y.berthsCrew ?? null, y.berthsTotal ?? null,
      y.wc ?? null, y.wcCrew ?? null, y.showers ?? null, y.showersCrew ?? null,
      y.buildYear ?? null, y.launchedYear ?? null,
      y.engines ?? null, y.enginePower ? Number(y.enginePower) : null,
      y.fuelTank ?? null, y.waterTank ?? null, y.fuelConsumption ?? null,
      y.numberOfRudderBlades ?? null, y.maxSpeed ?? null, y.crusingSpeed ?? null,
      y.sailTypeId ?? null, y.steeringTypeId ?? null,
      y.isPremium ?? false, y.onSale ?? false,
      y.needsOptionApproval ?? false, y.canMakeBookingFixed ?? false, y.registrationCertified ?? false,
      y.deposit ?? null, y.depositCurrency ?? null, y.depositWhenInsured ?? null, y.maxDiscount ?? null,
      y.highlights ?? null, i18nToJson(y.highlightsIntText), {},
      y.mainPictureUrl ?? null, y.picturesURL ?? [],
      [], [],
      y.checkInTime || null, y.checkOutTime || null, y.flagsId ?? [], new Date(),
    ]],
    // Don't overwrite admin-managed fields on update
    [
      "name", "companyId", "baseId", "modelId", "categoryId", "builderId",
      "charterType", "crewedCharterType", "draft", "loa",
      "cabins", "cabinsCrew", "berthsCabin", "berthsSalon", "berthsCrew", "berthsTotal",
      "wc", "wcCrew", "showers", "showersCrew",
      "buildYear", "launchedYear", "engines", "enginePower",
      "fuelTank", "waterTank", "fuelConsumption",
      "numberOfRudderBlades", "maxSpeed", "cruisingSpeed",
      "sailTypeId", "steeringTypeId",
      "isPremium", "onSale", "needsOptionApproval", "canMakeBookingFixed", "registrationCertified",
      "deposit", "depositCurrency", "depositWhenInsured", "maxDiscount",
      "highlights", "highlightsTranslations",
      "mainPictureUrl", "picturesUrl",
      "checkInTime", "checkOutTime", "flagsId", "lastSyncedAt",
    ]
  )

  const now = new Date()
  const ts = `${esc(now)},${esc(now)}` // createdAt, updatedAt

  // Delete + re-insert nested data in batch
  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_equipment WHERE yachtId = ${y.id}`)
  if ((y.standardYachtEquipment ?? []).length > 0) {
    const eqRows = (y.standardYachtEquipment ?? []).map((eq) =>
      `(${esc(genId())},${esc(y.id)},${esc(eq.equipmentId)},${esc(eq.quantity ?? 1)},${esc(eq.highlight ?? false)},${esc(i18nToJson(eq.comment))},${ts})`
    )
    await db.$executeRawUnsafe(
      `INSERT IGNORE INTO nausys_yacht_equipment (id, yachtId, equipmentId, quantity, highlight, comment, createdAt, updatedAt) VALUES ${eqRows.join(",")}`
    ).catch(() => {})
  }

  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_checkin_periods WHERE yachtId = ${y.id}`)
  if ((y.checkInPeriods ?? []).length > 0) {
    const cipRows = (y.checkInPeriods ?? []).map((p) =>
      `(${[
        genId(), y.id, parseNausysDate(p.dateFrom), parseNausysDate(p.dateTo),
        p.minimalReservationDuration ?? 7,
        p.checkInMonday, p.checkInTuesday, p.checkInWednesday, p.checkInThursday,
        p.checkInFriday, p.checkInSaturday, p.checkInSunday,
        p.checkOutMonday, p.checkOutTuesday, p.checkOutWednesday, p.checkOutThursday,
        p.checkOutFriday, p.checkOutSaturday, p.checkOutSunday,
        now, now,
      ].map(esc).join(",")})`
    )
    await db.$executeRawUnsafe(
      `INSERT INTO nausys_yacht_checkin_periods (id, yachtId, dateFrom, dateTo, minReservationDuration, checkInMonday, checkInTuesday, checkInWednesday, checkInThursday, checkInFriday, checkInSaturday, checkInSunday, checkOutMonday, checkOutTuesday, checkOutWednesday, checkOutThursday, checkOutFriday, checkOutSaturday, checkOutSunday, createdAt, updatedAt) VALUES ${cipRows.join(",")}`
    )
  }

  // Season-specific data
  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_prices WHERE yachtId = ${y.id}`)
  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_extra_equipment WHERE yachtId = ${y.id}`)
  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_services WHERE yachtId = ${y.id}`)
  await db.$executeRawUnsafe(`DELETE FROM nausys_yacht_seasons WHERE yachtId = ${y.id}`)

  const seasonRows: string[] = []
  const priceRows: string[] = []
  const extraEqRows: string[] = []
  const serviceRows: string[] = []

  for (const ssd of y.seasonSpecificData ?? []) {
    seasonRows.push(`(${[genId(), y.id, ssd.seasonId, ssd.baseId ?? null, ssd.locationId ?? null, ssd.regularDiscounts ?? [], now, now].map(esc).join(",")})`)

    for (const p of ssd.prices ?? []) {
      priceRows.push(`(${[
        genId(), p.id, y.id, parseNausysDate(p.dateFrom), parseNausysDate(p.dateTo),
        p.price, p.currency ?? "EUR", p.type === "DAILY" ? "DAILY" : "WEEKLY",
        p.locationsId ?? [], p.vatInPrice ?? null, now, now,
      ].map(esc).join(",")})`)
    }

    for (const eq of ssd.additionalYachtEquipment ?? []) {
      extraEqRows.push(`(${[
        genId(), eq.id, y.id, ssd.seasonId, eq.equipmentId, eq.quantity ?? 1,
        eq.price ?? null, eq.currency ?? "EUR", eq.priceMeasureId ?? null,
        eq.calculationType ?? null, eq.amount ?? null, eq.vatInPrice ?? null,
        i18nToJson(eq.comment), i18nToJson(eq.condition), now, now,
      ].map(esc).join(",")})`)
    }

    for (const sv of ssd.services ?? []) {
      serviceRows.push(`(${[
        genId(), sv.id, y.id, ssd.seasonId, sv.serviceId,
        sv.price ?? null, sv.currency ?? "EUR", sv.priceMeasureId ?? null,
        sv.calculationType ?? null, sv.obligatory ?? false,
        sv.amount ?? null, sv.vatInPrice ?? null, i18nToJson(sv.description), now, now,
      ].map(esc).join(",")})`)
    }
  }

  if (seasonRows.length > 0) {
    await db.$executeRawUnsafe(
      `INSERT IGNORE INTO nausys_yacht_seasons (id, yachtId, seasonId, baseId, locationId, regularDiscounts, createdAt, updatedAt) VALUES ${seasonRows.join(",")}`
    )
  }

  if (priceRows.length > 0) {
    await db.$executeRawUnsafe(
      `INSERT INTO nausys_yacht_prices (id, nausysId, yachtId, dateFrom, dateTo, price, currency, priceType, locationsId, vatInPrice, createdAt, updatedAt) VALUES ${priceRows.join(",")}`
    )
  }

  if (extraEqRows.length > 0) {
    await db.$executeRawUnsafe(
      `INSERT IGNORE INTO nausys_yacht_extra_equipment (id, nausysId, yachtId, seasonId, equipmentId, quantity, price, currency, priceMeasureId, calculationType, amount, vatInPrice, comment, \`condition\`, createdAt, updatedAt) VALUES ${extraEqRows.join(",")}`
    ).catch(() => {})
  }

  if (serviceRows.length > 0) {
    await db.$executeRawUnsafe(
      `INSERT IGNORE INTO nausys_yacht_services (id, nausysId, yachtId, seasonId, serviceId, price, currency, priceMeasureId, calculationType, obligatory, amount, vatInPrice, description, createdAt, updatedAt) VALUES ${serviceRows.join(",")}`
    ).catch(() => {})
  }
}

async function syncYachts(c: NausysCredentials, log: LogFn) {
  log("Fetching all yachts from NAUSYS...")
  const yachts = await fetchAllYachts(c)
  log(`Received ${yachts.length} yachts, syncing to database...`)

  // Pre-load model cache to avoid per-yacht queries
  const models = await db.nausysYachtModel.findMany({ select: { id: true, categoryId: true, builderId: true, loa: true } })
  const modelCache = new Map(models.map((m) => [m.id, m]))

  let synced = 0
  let failed = 0
  for (const yacht of yachts) {
    try {
      await syncYachtRecord(yacht, modelCache)
      synced++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[NAUSYS Sync] Failed yacht ${yacht.id} (${yacht.name}):`, msg)
      failed++
    }
  }

  log(`Synced ${synced} yachts${failed > 0 ? ` (${failed} failed)` : ""}`)
  return synced
}

// ── Sync step definitions ──

export interface SyncStep {
  key: string
  label: string
  wave: number
}

export const SYNC_STEPS: SyncStep[] = [
  // Wave 1 — no FK dependencies
  { key: "categories", label: "Yacht Categories", wave: 1 },
  { key: "yachtBuilders", label: "Yacht Builders", wave: 1 },
  { key: "engineBuilders", label: "Engine Builders", wave: 1 },
  { key: "sailTypes", label: "Sail Types", wave: 1 },
  { key: "steeringTypes", label: "Steering Types", wave: 1 },
  { key: "countries", label: "Countries", wave: 1 },
  { key: "equipmentCategories", label: "Equipment Categories", wave: 1 },
  { key: "services", label: "Services", wave: 1 },
  { key: "priceMeasures", label: "Price Measures", wave: 1 },
  { key: "discountItems", label: "Discount Items", wave: 1 },
  { key: "seasons", label: "Seasons", wave: 1 },
  // Wave 2 — depends on wave 1
  { key: "regions", label: "Regions", wave: 2 },
  { key: "equipment", label: "Equipment", wave: 2 },
  { key: "yachtModels", label: "Yacht Models", wave: 2 },
  // Wave 3
  { key: "locations", label: "Locations", wave: 3 },
  // Wave 4
  { key: "charterBases", label: "Charter Bases", wave: 4 },
  // Wave 5
  { key: "yachts", label: "Yachts", wave: 5 },
  // Wave 6 — images to Bunny CDN (handled separately in stream route)
  { key: "images", label: "Upload Images to CDN", wave: 6 },
]

const SYNC_FNS: Record<string, (c: NausysCredentials, log: LogFn) => Promise<number>> = {
  categories: syncCategories,
  yachtBuilders: syncYachtBuilders,
  engineBuilders: syncEngineBuilders,
  sailTypes: syncSailTypes,
  steeringTypes: syncSteeringTypes,
  countries: syncCountries,
  equipmentCategories: syncEquipmentCategories,
  services: syncServices,
  priceMeasures: syncPriceMeasures,
  discountItems: syncDiscountItems,
  seasons: syncSeasons,
  regions: syncRegions,
  equipment: syncEquipment,
  yachtModels: syncYachtModels,
  locations: syncLocations,
  charterBases: syncCharterBases,
  yachts: syncYachts,
}

// ── Main sync orchestrator ──

export interface SyncResult {
  status: "completed" | "failed"
  itemCount: number
  errorMsg?: string
  steps: string[]
}

export type SyncProgressFn = (key: string, status: "syncing" | "done" | "error", count?: number, error?: string) => void

export async function runFullSync(creds: NausysCredentials, onProgress?: SyncProgressFn): Promise<SyncResult> {
  const steps: string[] = []
  const log: LogFn = (msg) => {
    steps.push(msg)
    console.log(`[NAUSYS Sync] ${msg}`)
  }

  let totalItems = 0

  // Group steps by wave
  const waves = new Map<number, SyncStep[]>()
  for (const step of SYNC_STEPS) {
    if (!waves.has(step.wave)) waves.set(step.wave, [])
    waves.get(step.wave)!.push(step)
  }

  try {
    const waveNumbers = Array.from(waves.keys()).sort((a, b) => a - b)

    for (const waveNum of waveNumbers) {
      const waveSteps = waves.get(waveNum)!

      // Run all steps in this wave in parallel
      const results = await Promise.all(
        waveSteps.map(async (step) => {
          const fn = SYNC_FNS[step.key]
          onProgress?.(step.key, "syncing")
          try {
            const count = await fn(creds, log)
            onProgress?.(step.key, "done", count)
            return count
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            log(`Failed ${step.label}: ${msg}`)
            onProgress?.(step.key, "error", 0, msg)
            return 0
          }
        })
      )

      totalItems += results.reduce((a, b) => a + b, 0)
    }

    log(`Sync completed. Total items: ${totalItems}`)
    return { status: "completed", itemCount: totalItems, steps }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    log(`Sync failed: ${errorMsg}`)
    return { status: "failed", itemCount: totalItems, errorMsg, steps }
  }
}

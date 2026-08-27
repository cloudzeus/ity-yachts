import "server-only"
import { db } from "@/lib/db"

/**
 * What the last sync actually changed.
 *
 * The sync reported a number — 7,786 items one day and 7,789 the next — which
 * says something moved and nothing about what. A charter business needs the
 * other half of that sentence: a weekly rate went up, a skipper costs ten
 * euros more, a boat lost its air conditioning. Those are the things somebody
 * has already quoted a customer on.
 *
 * It works by fingerprint rather than by instrumenting the writes. The sync
 * replaces each yacht's prices, services and equipment with raw DELETE and
 * INSERT, so there is no natural place to observe an update — and threading
 * one through would put the reporting inside the machinery that does the
 * work, where a mistake would corrupt the data rather than the report. A
 * snapshot before and after is separate, cheap, and cannot damage anything.
 */

export interface YachtSnapshot {
  name: string
  loa: number | null
  cabins: number | null
  berths: number | null
  buildYear: number | null
  charterType: string | null
  /** "from|to|type" → price */
  prices: Record<string, number>
  /** "serviceId|seasonId" → "price|obligatory" */
  services: Record<string, string>
  /** equipmentId → quantity */
  equipment: Record<string, number>
  /** "equipmentId|seasonId" → price */
  extras: Record<string, number>
}

export type Snapshot = Record<number, YachtSnapshot>

export type ChangeKind =
  | "yacht-added"
  | "yacht-removed"
  | "detail"
  | "price"
  | "service"
  | "equipment"
  | "extra"

export interface Change {
  kind: ChangeKind
  yachtId: number
  yacht: string
  /** What moved — a field name, a date range, a service name. */
  what: string
  before?: string | null
  after?: string | null
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Everything worth watching, in one pass over five tables. */
export async function takeSnapshot(): Promise<Snapshot> {
  const [yachts, prices, services, equipment, extras] = await Promise.all([
    db.nausysYacht.findMany({
      select: {
        id: true, name: true, loa: true, cabins: true, berthsTotal: true,
        maxPersons: true, buildYear: true, charterType: true,
      },
    }),
    db.nausysYachtPrice.findMany({
      select: { yachtId: true, dateFrom: true, dateTo: true, price: true, priceType: true },
    }),
    db.nausysYachtService.findMany({
      select: { yachtId: true, serviceId: true, seasonId: true, price: true, obligatory: true },
    }),
    db.nausysYachtEquipment.findMany({ select: { yachtId: true, equipmentId: true, quantity: true } }),
    db.nausysYachtExtraEquipment.findMany({
      select: { yachtId: true, equipmentId: true, seasonId: true, price: true },
    }),
  ])

  const snap: Snapshot = {}
  for (const y of yachts) {
    snap[y.id] = {
      name: y.name,
      loa: y.loa != null ? Number(y.loa) : null,
      cabins: y.cabins ?? null,
      berths: y.berthsTotal ?? y.maxPersons ?? null,
      buildYear: y.buildYear ?? null,
      charterType: y.charterType ?? null,
      prices: {}, services: {}, equipment: {}, extras: {},
    }
  }
  for (const p of prices) {
    const s = snap[p.yachtId]
    if (s) s.prices[`${iso(p.dateFrom)}|${iso(p.dateTo)}|${p.priceType ?? ""}`] = Number(p.price) || 0
  }
  for (const v of services) {
    const s = snap[v.yachtId]
    if (s) s.services[`${v.serviceId}|${v.seasonId ?? ""}`] = `${Number(v.price) || 0}|${v.obligatory}`
  }
  for (const e of equipment) {
    const s = snap[e.yachtId]
    if (s) s.equipment[String(e.equipmentId)] = e.quantity ?? 1
  }
  for (const e of extras) {
    const s = snap[e.yachtId]
    if (s) s.extras[`${e.equipmentId}|${e.seasonId ?? ""}`] = Number(e.price) || 0
  }
  return snap
}

/** Names for the ids, so a change reads as English rather than as a key. */
async function labels() {
  const [equipment, services] = await Promise.all([
    db.nausysEquipment.findMany({ select: { id: true, name: true } }),
    db.nausysService.findMany({ select: { id: true, name: true } }),
  ])
  const pick = (n: unknown) => {
    const o = (n ?? {}) as Record<string, string>
    return o.en || o.el || o.de || ""
  }
  return {
    equipment: new Map(equipment.map((e) => [e.id, pick(e.name) || `#${e.id}`])),
    services: new Map(services.map((s) => [s.id, pick(s.name) || `#${s.id}`])),
  }
}

const money = (n: number) => `€${n.toFixed(2).replace(/\.00$/, "")}`

/** Human dates from the key a price is stored under. */
const period = (key: string) => {
  const [from, to] = key.split("|")
  return `${from} → ${to}`
}

/**
 * Compare two snapshots.
 *
 * Ordered so the expensive news comes first: boats appearing and leaving,
 * then money, then equipment. A sync that changes nothing returns nothing,
 * which is the common case and should read as silence rather than as a
 * report saying "0 changes" in six sections.
 */
export async function diffSnapshots(before: Snapshot, after: Snapshot): Promise<Change[]> {
  const { equipment: eqName, services: svcName } = await labels()
  const changes: Change[] = []

  for (const id of Object.keys(after).map(Number)) {
    if (!before[id]) {
      changes.push({ kind: "yacht-added", yachtId: id, yacht: after[id].name, what: "added to the fleet" })
    }
  }
  for (const id of Object.keys(before).map(Number)) {
    if (!after[id]) {
      changes.push({ kind: "yacht-removed", yachtId: id, yacht: before[id].name, what: "no longer in the fleet" })
    }
  }

  for (const id of Object.keys(after).map(Number)) {
    const a = after[id]
    const b = before[id]
    if (!b) continue
    const yacht = a.name

    // The boat itself
    const fields: [keyof YachtSnapshot, string][] = [
      ["name", "Name"], ["loa", "Length"], ["cabins", "Cabins"],
      ["berths", "Berths"], ["buildYear", "Year built"], ["charterType", "Charter type"],
    ]
    for (const [key, label] of fields) {
      if (String(b[key] ?? "") !== String(a[key] ?? "")) {
        changes.push({
          kind: "detail", yachtId: id, yacht, what: label,
          before: String(b[key] ?? "—"), after: String(a[key] ?? "—"),
        })
      }
    }

    // Weekly rates — the ones the office quotes
    for (const [key, price] of Object.entries(a.prices)) {
      const was = b.prices[key]
      if (was === undefined) {
        changes.push({ kind: "price", yachtId: id, yacht, what: period(key), before: null, after: money(price) })
      } else if (was !== price) {
        changes.push({ kind: "price", yachtId: id, yacht, what: period(key), before: money(was), after: money(price) })
      }
    }
    for (const key of Object.keys(b.prices)) {
      if (!(key in a.prices)) {
        changes.push({ kind: "price", yachtId: id, yacht, what: period(key), before: money(b.prices[key]), after: null })
      }
    }

    // Add-ons
    for (const [key, value] of Object.entries(a.services)) {
      const was = b.services[key]
      const name = svcName.get(Number(key.split("|")[0])) ?? key
      const show = (v: string) => {
        const [p, ob] = v.split("|")
        return `${money(Number(p))}${ob === "true" ? " (included)" : ""}`
      }
      if (was === undefined) {
        changes.push({ kind: "service", yachtId: id, yacht, what: name, before: null, after: show(value) })
      } else if (was !== value) {
        changes.push({ kind: "service", yachtId: id, yacht, what: name, before: show(was), after: show(value) })
      }
    }
    for (const key of Object.keys(b.services)) {
      if (!(key in a.services)) {
        const name = svcName.get(Number(key.split("|")[0])) ?? key
        changes.push({ kind: "service", yachtId: id, yacht, what: name, before: "offered", after: null })
      }
    }

    // What is on board
    for (const key of Object.keys(a.equipment)) {
      if (!(key in b.equipment)) {
        changes.push({ kind: "equipment", yachtId: id, yacht, what: eqName.get(Number(key)) ?? key, before: null, after: "fitted" })
      }
    }
    for (const key of Object.keys(b.equipment)) {
      if (!(key in a.equipment)) {
        changes.push({ kind: "equipment", yachtId: id, yacht, what: eqName.get(Number(key)) ?? key, before: "fitted", after: null })
      }
    }

    // Extras, which carry a price
    for (const [key, price] of Object.entries(a.extras)) {
      const was = b.extras[key]
      const name = eqName.get(Number(key.split("|")[0])) ?? key
      if (was === undefined) {
        changes.push({ kind: "extra", yachtId: id, yacht, what: name, before: null, after: money(price) })
      } else if (was !== price) {
        changes.push({ kind: "extra", yachtId: id, yacht, what: name, before: money(was), after: money(price) })
      }
    }
    for (const key of Object.keys(b.extras)) {
      if (!(key in a.extras)) {
        const name = eqName.get(Number(key.split("|")[0])) ?? key
        changes.push({ kind: "extra", yachtId: id, yacht, what: name, before: money(b.extras[key]), after: null })
      }
    }
  }

  const order: Record<ChangeKind, number> = {
    "yacht-added": 0, "yacht-removed": 1, detail: 2, price: 3, service: 4, extra: 5, equipment: 6,
  }
  return changes.sort((x, y) => order[x.kind] - order[y.kind] || x.yacht.localeCompare(y.yacht))
}

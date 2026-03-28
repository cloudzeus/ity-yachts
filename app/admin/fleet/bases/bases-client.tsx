"use client"

import { useState } from "react"
import {
  MapPin, ChevronDown, ChevronRight, Globe, Anchor,
  Clock, Ship, AlertCircle,
} from "lucide-react"

type IntlName = Record<string, string>

type Country = { id: number; code: string | null; code2: string | null; name: IntlName }
type Region = { id: number; name: IntlName; countryId: number }
type Location = { id: number; name: IntlName; regionId: number | null }
type Base = {
  id: number; locationId: number; companyId: number | null
  checkInTime: string | null; checkOutTime: string | null
  lat: number | null; lon: number | null
  secondaryBase: boolean; disabled: boolean
  disabledDate: string | null; openBaseDate: string | null; closedBaseDate: string | null
  location: { id: number; name: IntlName } | null
  _count: { yachts: number }
}

type Props = {
  data: {
    countries: Country[]
    regions: Region[]
    locations: Location[]
    bases: Base[]
  }
}

function lang(obj: IntlName | null | undefined, fallback = "—"): string {
  if (!obj) return fallback
  return obj.en || obj.el || obj.de || fallback
}

function StatusBadge({ disabled, secondary }: { disabled: boolean; secondary: boolean }) {
  if (disabled) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
        style={{ background: "rgba(211,47,47,0.12)", color: "#D32F2F", borderRadius: "var(--radius-xs)" }}
      >
        <AlertCircle className="size-3" /> Disabled
      </span>
    )
  }
  if (secondary) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium"
        style={{ background: "rgba(117,117,117,0.12)", color: "#626262", borderRadius: "var(--radius-xs)" }}
      >
        Secondary
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium"
      style={{ background: "rgba(45,106,79,0.12)", color: "#2D6A4F", borderRadius: "var(--radius-xs)" }}
    >
      Active
    </span>
  )
}

function BaseCard({ base }: { base: Base }) {
  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Anchor className="size-4" style={{ color: "var(--primary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>
            Base #{base.id}
          </span>
        </div>
        <StatusBadge disabled={base.disabled} secondary={base.secondaryBase} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {base.checkInTime && (
          <div className="flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
            <Clock className="size-3" /> Check-in: <span className="font-medium" style={{ color: "var(--on-surface)" }}>{base.checkInTime}</span>
          </div>
        )}
        {base.checkOutTime && (
          <div className="flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
            <Clock className="size-3" /> Check-out: <span className="font-medium" style={{ color: "var(--on-surface)" }}>{base.checkOutTime}</span>
          </div>
        )}
        {base.lat != null && base.lon != null && (
          <div className="flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
            <MapPin className="size-3" /> {base.lat.toFixed(4)}, {base.lon.toFixed(4)}
          </div>
        )}
        <div className="flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
          <Ship className="size-3" /> {base._count.yachts} yachts
        </div>
        {base.openBaseDate && (
          <div className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            Opens: {new Date(base.openBaseDate).toLocaleDateString()}
          </div>
        )}
        {base.closedBaseDate && (
          <div className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            Closes: {new Date(base.closedBaseDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}

export function BasesClient({ data }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  // Build hierarchy: Country > Region > Location > Bases
  const tree = data.countries
    .map((country) => {
      const countryRegions = data.regions.filter((r) => r.countryId === country.id)
      const regionNodes = countryRegions.map((region) => {
        const regionLocations = data.locations.filter((l) => l.regionId === region.id)
        const locationNodes = regionLocations.map((location) => ({
          location,
          bases: data.bases.filter((b) => b.locationId === location.id),
        }))
        return { region, locations: locationNodes }
      })

      // Locations without a region in this country (linked via base)
      const regionLocationIds = new Set(
        countryRegions.flatMap((r) => data.locations.filter((l) => l.regionId === r.id).map((l) => l.id))
      )
      const orphanLocations = data.locations
        .filter((l) => !regionLocationIds.has(l.id))
        .map((location) => ({
          location,
          bases: data.bases.filter((b) => b.locationId === location.id),
        }))
        .filter((ln) => ln.bases.length > 0)

      return { country, regions: regionNodes, orphanLocations }
    })
    .filter((c) =>
      c.regions.some((r) => r.locations.some((l) => l.bases.length > 0)) ||
      c.orphanLocations.length > 0
    )

  if (tree.length === 0 && data.bases.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3"
        style={{
          background: "var(--surface-container-lowest)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <Anchor className="size-10" style={{ color: "var(--outline-variant)" }} />
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          No charter bases yet. Sync from NAUSYS to import base data.
        </p>
      </div>
    )
  }

  // Also show unlinked bases (not in the tree)
  const linkedBaseIds = new Set(
    tree.flatMap((c) => [
      ...c.regions.flatMap((r) => r.locations.flatMap((l) => l.bases.map((b) => b.id))),
      ...c.orphanLocations.flatMap((l) => l.bases.map((b) => b.id)),
    ])
  )
  const unlinkedBases = data.bases.filter((b) => !linkedBaseIds.has(b.id))

  return (
    <div className="flex flex-col gap-3">
      {tree.map(({ country, regions, orphanLocations }) => {
        const countryKey = `country-${country.id}`
        const isOpen = expanded[countryKey] !== false // default open
        return (
          <div
            key={country.id}
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-ambient)",
              overflow: "hidden",
            }}
          >
            {/* Country header */}
            <button
              onClick={() => toggle(countryKey)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
            >
              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <Globe className="size-4" style={{ color: "var(--primary)" }} />
              <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                {lang(country.name)}
              </span>
              {country.code2 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5" style={{ background: "var(--surface-container)", borderRadius: "var(--radius-xs)", color: "var(--on-surface-variant)" }}>
                  {country.code2}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                {regions.map(({ region, locations }) => {
                  if (locations.every((l) => l.bases.length === 0)) return null
                  const regionKey = `region-${region.id}`
                  const regionOpen = expanded[regionKey] !== false
                  return (
                    <div key={region.id} className="ml-4">
                      <button
                        onClick={() => toggle(regionKey)}
                        className="flex items-center gap-2 w-full py-1.5 text-left"
                      >
                        {regionOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        <MapPin className="size-3.5" style={{ color: "var(--on-surface-variant)" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                          {lang(region.name)}
                        </span>
                      </button>

                      {regionOpen && (
                        <div className="ml-6 flex flex-col gap-2 mt-1">
                          {locations
                            .filter((l) => l.bases.length > 0)
                            .map(({ location, bases }) => (
                              <div key={location.id}>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: "var(--on-surface-variant)" }}>
                                  <Anchor className="size-3" />
                                  {lang(location.name)} ({bases.length} base{bases.length !== 1 ? "s" : ""})
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {bases.map((base) => (
                                    <BaseCard key={base.id} base={base} />
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Orphan locations */}
                {orphanLocations.length > 0 && (
                  <div className="ml-4">
                    {orphanLocations.map(({ location, bases }) => (
                      <div key={location.id} className="ml-6 mt-1">
                        <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: "var(--on-surface-variant)" }}>
                          <Anchor className="size-3" />
                          {lang(location.name)} ({bases.length} base{bases.length !== 1 ? "s" : ""})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {bases.map((base) => (
                            <BaseCard key={base.id} base={base} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Unlinked bases */}
      {unlinkedBases.length > 0 && (
        <div
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <div className="px-4 py-3">
            <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
              Other Bases
            </span>
          </div>
          <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {unlinkedBases.map((base) => (
              <BaseCard key={base.id} base={base} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

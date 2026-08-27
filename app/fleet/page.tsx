import type { Metadata } from "next"
import { metaStrings } from "@/lib/meta.server"
import { db } from "@/lib/db"
import { pageMeta } from "@/lib/seo"
import { yachtThumb } from "@/lib/yacht-images"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FleetListClient } from "./fleet-list-client"
import { getFleetRanges } from "@/lib/fleet-ranges.server"
import { yachtPath } from "@/lib/yacht-slug"

export const dynamic = "force-dynamic"

/* The old title and description named neither the place nor what is on offer,
   so the page competed for "our fleet" and nothing else. */
export async function generateMetadata(): Promise<Metadata> {
  const { m } = await metaStrings()
  return pageMeta({
  title: m("meta.fleet.title", "Charter Fleet Lefkada — Yachts & Catamarans"),
  description: m("meta.fleet.description", "Our charter fleet in Lefkada: sailing yachts and catamarans, 2 to 5 cabins, bareboat or skippered. Live availability and prices for the Ionian."),
  path: "/fleet",
})
}

export default async function FleetPage() {
  // Fetch filter options based only on yachts we actually have, plus initial yachts
  const [usedCategoryIds, usedBuilderIds, yachts, total, fleetComponent, fleetRanges] = await Promise.all([
    db.nausysYacht.findMany({ select: { categoryId: true }, distinct: ["categoryId"], where: { categoryId: { not: null } } }),
    db.nausysYacht.findMany({ select: { builderId: true }, distinct: ["builderId"], where: { builderId: { not: null } } }),
    db.nausysYacht.findMany({
      take: 12,
      /* Longest first, the order the client asks the API for and the one the
         customer asked for. This query renders the first page on the server
         and was left alphabetical, so the fleet arrived sorted by name and
         only re-sorted itself once somebody touched a filter. */
      orderBy: [{ loa: "desc" }, { name: "asc" }],
      include: {
        category: true,
        model: { include: { builder: true } },
        base: { include: { location: true } },
        builder: true,
        prices: {
          where: { priceType: "WEEKLY" },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    }),
    db.nausysYacht.count(),
    db.pageComponent.findFirst({
      where: { page: { slug: "fleet" }, type: "fleet-content", status: "active" },
      select: { props: true },
    }),
    getFleetRanges(),
  ])

  const catIds = usedCategoryIds.map((r) => r.categoryId!).filter(Boolean)
  const bldrIds = usedBuilderIds.map((r) => r.builderId!).filter(Boolean)

  // No charter-base query: the whole fleet lies on the one pontoon in Lefkas,
  // so a location filter offered 33 options of which 32 returned nothing.
  const [categories, builders] = await Promise.all([
    catIds.length ? db.nausysYachtCategory.findMany({ where: { id: { in: catIds } }, orderBy: { id: "asc" } }) : [],
    bldrIds.length ? db.nausysYachtBuilder.findMany({ where: { id: { in: bldrIds } }, orderBy: { name: "asc" } }) : [],
  ])

  // Transform for client
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: ((c.name as Record<string, string>)?.en || `Category ${c.id}`),
    nameTranslations: c.name as Record<string, string> | null,
  }))

  const builderOptions = builders
    .filter((b) => b.name)
    .map((b) => ({ id: b.id, name: b.name }))

  const yachtCards = yachts.map((y) => transformYacht(y))
  const fleetHero = ((fleetComponent?.props as Record<string, unknown> | null)?.hero ?? null) as Record<string, Record<string, string>> | null

  return (
    <>
      <SiteHeader />
      <FleetListClient
        initialYachts={yachtCards}
        initialTotal={total}
        categories={categoryOptions}
        builders={builderOptions}
        hero={fleetHero}
        ranges={fleetRanges}
      />
      <SiteFooter />
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformYacht(y: any) {
  const catNames = y.category?.name as Record<string, string> | undefined
  const categoryName = catNames?.en || "Yacht"

  const image = yachtThumb(y)

  const locNames = y.base?.location?.name as Record<string, string> | undefined
  const locationName = locNames?.en || ""

  const builderName = y.builder?.name || y.model?.builder?.name || ""
  const priceFrom = y.prices?.[0]?.price || 0

  return {
    id: y.id,
    name: y.name || y.model?.name || "Yacht",
    href: yachtPath(y),
    image,
    category: categoryName,
    categoryTranslations: catNames || null,
    loa: y.loa || 0,
    cabins: y.cabins || 0,
    berths: y.berthsTotal || y.maxPersons || 0,
    baseName: locationName,
    baseNameTranslations: locNames || null,
    builder: builderName,
    buildYear: y.buildYear || 0,
    priceFrom,
    charterType: y.charterType || "",
  }
}

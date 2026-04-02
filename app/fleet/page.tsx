import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FleetListClient } from "./fleet-list-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Our Fleet | IYC Yachts",
  description: "Browse our full fleet of yachts and catamarans available for charter.",
}

export default async function FleetPage() {
  // Fetch filter options based only on yachts we actually have, plus initial yachts
  const [usedCategoryIds, usedBaseIds, usedBuilderIds, yachts, total] = await Promise.all([
    db.nausysYacht.findMany({ select: { categoryId: true }, distinct: ["categoryId"], where: { categoryId: { not: null } } }),
    db.nausysYacht.findMany({ select: { baseId: true }, distinct: ["baseId"], where: { baseId: { not: null } } }),
    db.nausysYacht.findMany({ select: { builderId: true }, distinct: ["builderId"], where: { builderId: { not: null } } }),
    db.nausysYacht.findMany({
      take: 12,
      orderBy: { name: "asc" },
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
  ])

  const catIds = usedCategoryIds.map((r) => r.categoryId!).filter(Boolean)
  const bIds = usedBaseIds.map((r) => r.baseId!).filter(Boolean)
  const bldrIds = usedBuilderIds.map((r) => r.builderId!).filter(Boolean)

  const [categories, bases, builders] = await Promise.all([
    catIds.length ? db.nausysYachtCategory.findMany({ where: { id: { in: catIds } }, orderBy: { id: "asc" } }) : [],
    bIds.length ? db.nausysCharterBase.findMany({ where: { id: { in: bIds } }, include: { location: true }, orderBy: { id: "asc" } }) : [],
    bldrIds.length ? db.nausysYachtBuilder.findMany({ where: { id: { in: bldrIds } }, orderBy: { name: "asc" } }) : [],
  ])

  // Transform for client
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: ((c.name as Record<string, string>)?.en || `Category ${c.id}`),
  }))

  const baseOptions = bases.map((b) => ({
    id: b.id,
    name: b.location
      ? ((b.location.name as Record<string, string>)?.en || `Base ${b.id}`)
      : `Base ${b.id}`,
  }))

  const builderOptions = builders
    .filter((b) => b.name)
    .map((b) => ({ id: b.id, name: b.name }))

  const yachtCards = yachts.map((y) => transformYacht(y))

  return (
    <>
      <SiteHeader />
      <FleetListClient
        initialYachts={yachtCards}
        initialTotal={total}
        categories={categoryOptions}
        bases={baseOptions}
        builders={builderOptions}
      />
      <SiteFooter />
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformYacht(y: any) {
  const categoryName = y.category
    ? ((y.category.name as Record<string, string>)?.en || "Yacht")
    : "Yacht"

  const websiteImgs = y.websiteImages as Array<{ url: string }> | null
  const picturesArr = y.picturesUrl as string[] | null
  const image = websiteImgs?.[0]?.url || y.mainPictureUrl || picturesArr?.[0] || ""

  const locationName = y.base?.location
    ? ((y.base.location.name as Record<string, string>)?.en || "")
    : ""

  const builderName = y.builder?.name || y.model?.builder?.name || ""
  const priceFrom = y.prices?.[0]?.price || 0

  return {
    id: y.id,
    name: y.name || y.model?.name || "Yacht",
    image,
    category: categoryName,
    loa: y.loa || 0,
    cabins: y.cabins || 0,
    berths: y.berthsTotal || y.maxPersons || 0,
    baseName: locationName,
    builder: builderName,
    buildYear: y.buildYear || 0,
    priceFrom,
    charterType: y.charterType || "",
  }
}

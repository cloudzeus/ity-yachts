import { db } from "@/lib/db"
import { CatalogueClient } from "./catalogue-client"

export const metadata = { title: "Fleet Catalogue — IYC Admin" }

export default async function CataloguePage() {
  // Load all catalogue data in parallel
  const [
    categories, builders, engineBuilders, models,
    sailTypes, steeringTypes,
    equipmentCategories, equipment,
    services, priceMeasures, discountItems,
  ] = await Promise.all([
    db.nausysYachtCategory.findMany({ orderBy: { id: "asc" } }),
    db.nausysYachtBuilder.findMany({ orderBy: { name: "asc" } }),
    db.nausysEngineBuilder.findMany({ orderBy: { name: "asc" } }),
    db.nausysYachtModel.findMany({
      include: { category: true, builder: true },
      orderBy: { name: "asc" },
    }),
    db.nausysSailType.findMany({ orderBy: { id: "asc" } }),
    db.nausysSteeringType.findMany({ orderBy: { id: "asc" } }),
    db.nausysEquipmentCategory.findMany({ orderBy: { id: "asc" } }),
    db.nausysEquipment.findMany({
      include: { category: true },
      orderBy: { categoryId: "asc" },
    }),
    db.nausysService.findMany({ orderBy: { id: "asc" } }),
    db.nausysPriceMeasure.findMany({ orderBy: { id: "asc" } }),
    db.nausysDiscountItem.findMany({ orderBy: { id: "asc" } }),
  ])

  // Serialize Prisma JsonValue → plain objects for client component
  const data = JSON.parse(JSON.stringify({
    categories, builders, engineBuilders, models,
    sailTypes, steeringTypes, equipmentCategories, equipment,
    services, priceMeasures, discountItems,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Fleet Catalogue
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          NAUSYS reference data — categories, builders, equipment, services
        </p>
      </div>

      <CatalogueClient data={data} />
    </div>
  )
}

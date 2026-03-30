import { db } from "@/lib/db"
import { TablesClient } from "./tables-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Reference Tables — IYC Admin" }

export default async function TablesPage() {
  const [
    categories,
    yachtBuilders,
    engineBuilders,
    sailTypes,
    steeringTypes,
    equipmentCategories,
    equipment,
    services,
  ] = await Promise.all([
    db.nausysYachtCategory.count(),
    db.nausysYachtBuilder.count(),
    db.nausysEngineBuilder.count(),
    db.nausysSailType.count(),
    db.nausysSteeringType.count(),
    db.nausysEquipmentCategory.count(),
    db.nausysEquipment.count(),
    db.nausysService.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Reference Tables
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          Manage yacht categories, builders, equipment, and other lookup data
        </p>
      </div>

      <TablesClient
        counts={{
          categories,
          yachtBuilders,
          engineBuilders,
          sailTypes,
          steeringTypes,
          equipmentCategories,
          equipment,
          services,
        }}
      />
    </div>
  )
}

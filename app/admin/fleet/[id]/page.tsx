import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { YachtDetailClient } from "./yacht-detail-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const yacht = await db.nausysYacht.findUnique({
    where: { id: parseInt(id) },
    select: { name: true },
  })
  return { title: yacht ? `${yacht.name} — Fleet — IYC Admin` : "Yacht — IYC Admin" }
}

export default async function YachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const yachtId = parseInt(id)
  if (isNaN(yachtId)) notFound()

  const [yacht, models, bases, sailTypes, steeringTypes, engineBuilders, allEquipment, allServices, priceMeasures] =
    await Promise.all([
      db.nausysYacht.findUnique({
        where: { id: yachtId },
        include: {
          model: { include: { category: true, builder: true } },
          base: { include: { location: true } },
          builder: true,
          engineBuilder: true,
          equipment: {
            include: { equipment: { include: { category: true } } },
            orderBy: { equipment: { categoryId: "asc" } },
          },
          extraEquipment: { include: { equipment: true } },
          services: { include: { service: true } },
          cabinDefinitions: true,
          checkInPeriods: { orderBy: { dateFrom: "asc" } },
          crewMembers: true,
          seasons: { include: { season: true } },
          prices: { orderBy: { dateFrom: "asc" } },
        },
      }),
      db.nausysYachtModel.findMany({
        include: { category: true, builder: true },
        orderBy: { name: "asc" },
      }),
      db.nausysCharterBase.findMany({
        include: { location: true },
        orderBy: { id: "asc" },
      }),
      db.nausysSailType.findMany({ orderBy: { id: "asc" } }),
      db.nausysSteeringType.findMany({ orderBy: { id: "asc" } }),
      db.nausysEngineBuilder.findMany({ orderBy: { name: "asc" } }),
      db.nausysEquipment.findMany({
        include: { category: true },
        orderBy: { categoryId: "asc" },
      }),
      db.nausysService.findMany({ orderBy: { id: "asc" } }),
      db.nausysPriceMeasure.findMany({ orderBy: { id: "asc" } }),
    ])

  if (!yacht) notFound()

  // Single JSON.parse/stringify to strip Prisma types + serialize dates
  const data = JSON.parse(JSON.stringify({
    yacht,
    lookups: { models, bases, sailTypes, steeringTypes, engineBuilders, allEquipment, allServices, priceMeasures },
  }))

  return (
    <div className="flex flex-col gap-6">
      <YachtDetailClient yacht={data.yacht} lookups={data.lookups} />
    </div>
  )
}

import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { YachtDetailClient } from "./yacht-detail-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const yachtId = parseInt(id)
  if (isNaN(yachtId)) return { title: "Yacht Not Found" }

  const yacht = await db.nausysYacht.findUnique({
    where: { id: yachtId },
    select: { name: true, model: { select: { name: true } } },
  })

  return {
    title: yacht ? `${yacht.name || yacht.model?.name || "Yacht"} | IYC Yachts` : "Yacht Not Found",
  }
}

export default async function YachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const yachtId = parseInt(id)
  if (isNaN(yachtId)) notFound()

  const yacht = await db.nausysYacht.findUnique({
    where: { id: yachtId },
    include: {
      model: { include: { category: true, builder: true } },
      base: { include: { location: true } },
      builder: true,
      engineBuilder: true,
      category: true,
      equipment: { include: { equipment: { include: { category: true } } } },
      extraEquipment: { include: { equipment: true } },
      services: { include: { service: true } },
      cabinDefinitions: true,
      crewMembers: true,
      prices: { orderBy: { dateFrom: "asc" } },
      websiteAreas: { include: { region: { include: { country: true } } } },
    },
  })

  if (!yacht) notFound()

  // Transform for client
  const categoryName = yacht.category
    ? ((yacht.category.name as Record<string, string>)?.en || "Yacht")
    : "Yacht"

  const websiteImgs = yacht.websiteImages as Array<{ url: string; caption?: string }> | null
  const picturesArr = yacht.picturesUrl as string[] | null
  const allImages: string[] = []
  if (websiteImgs?.length) {
    allImages.push(...websiteImgs.map((img) => img.url))
  }
  if (yacht.mainPictureUrl) {
    if (!allImages.includes(yacht.mainPictureUrl)) allImages.push(yacht.mainPictureUrl)
  }
  if (picturesArr?.length) {
    for (const url of picturesArr) {
      if (!allImages.includes(url)) allImages.push(url)
    }
  }

  const locationName = yacht.base?.location
    ? ((yacht.base.location.name as Record<string, string>)?.en || "")
    : ""

  const builderName = yacht.builder?.name || yacht.model?.builder?.name || ""

  // Group equipment by category
  const equipmentByCategory: Record<string, { categoryName: string; items: string[] }> = {}
  for (const eq of yacht.equipment) {
    const catName = eq.equipment?.category
      ? ((eq.equipment.category.name as Record<string, string>)?.en || "Other")
      : "Other"
    const catId = eq.equipment?.category?.id?.toString() || "other"
    if (!equipmentByCategory[catId]) {
      equipmentByCategory[catId] = { categoryName: catName, items: [] }
    }
    const eqName = (eq.equipment?.name as Record<string, string>)?.en || ""
    if (eqName) {
      const label = eq.quantity && eq.quantity > 1 ? `${eqName} (x${eq.quantity})` : eqName
      equipmentByCategory[catId].items.push(label)
    }
  }

  // Services
  const services = yacht.services.map((s) => {
    const serviceName = (s.service?.name as Record<string, string>)?.en || "Service"
    return {
      name: serviceName,
      price: Number(s.price) || 0,
      currency: s.currency || "EUR",
      obligatory: s.obligatory || false,
    }
  })

  // Prices (weekly rates)
  const prices = yacht.prices.map((p) => ({
    dateFrom: p.dateFrom.toISOString(),
    dateTo: p.dateTo.toISOString(),
    price: Number(p.price) || 0,
    currency: p.currency || "EUR",
    priceType: p.priceType || "WEEKLY",
  }))

  // Highlights / description
  const highlightsT = yacht.highlightsTranslations as Record<string, string> | null
  const noteT = yacht.noteTranslations as Record<string, string> | null
  const description = highlightsT?.en || yacht.highlights || ""
  const note = noteT?.en || yacht.note || ""

  const yachtData = {
    id: yacht.id,
    name: yacht.name || yacht.model?.name || "Yacht",
    modelName: yacht.model?.name || "",
    category: categoryName,
    images: allImages,
    location: locationName,
    loa: yacht.loa,
    beam: yacht.beam,
    draft: yacht.draft,
    cabins: yacht.cabins,
    maxPersons: yacht.maxPersons,
    berthsTotal: yacht.berthsTotal,
    buildYear: yacht.buildYear,
    renewed: yacht.renewed,
    builder: builderName,
    hullColor: yacht.hullColor,
    engines: yacht.engines,
    enginePower: yacht.enginePower,
    engineBuilder: yacht.engineBuilder?.name || "",
    fuelType: yacht.fuelType,
    fuelConsumption: yacht.fuelConsumption,
    fuelTank: yacht.fuelTank,
    waterTank: yacht.waterTank,
    maxSpeed: yacht.maxSpeed,
    cruisingSpeed: yacht.cruisingSpeed,
    wc: yacht.wc,
    showers: yacht.showers,
    charterType: yacht.charterType,
    description,
    note,
    equipmentByCategory,
    services,
    prices,
    mastLength: yacht.mastLength,
    propulsionType: yacht.propulsionType,
  }

  return (
    <>
      <SiteHeader />
      <YachtDetailClient yacht={yachtData} />
      <SiteFooter />
    </>
  )
}

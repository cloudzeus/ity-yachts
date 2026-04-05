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

  // Pick a random active staff member for the enquire card
  const allStaff = await db.staff.findMany({
    where: { status: "active" },
    select: { name: true, position: true, image: true },
  })
  const staffRep = allStaff.length > 0
    ? allStaff[Math.floor(Math.random() * allStaff.length)]
    : null

  // Transform for client
  const catNames = yacht.category?.name as Record<string, string> | undefined
  const categoryName = catNames?.en || "Yacht"

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

  const locNames = yacht.base?.location?.name as Record<string, string> | undefined
  const locationName = locNames?.en || ""

  const builderName = yacht.builder?.name || yacht.model?.builder?.name || ""

  // Group equipment by category
  const equipmentByCategory: Record<string, { categoryName: string; categoryNameTranslations: Record<string, string> | null; items: Array<{ name: string; nameTranslations: Record<string, string> | null; quantity: number }> }> = {}
  for (const eq of yacht.equipment) {
    const eqCatNames = eq.equipment?.category?.name as Record<string, string> | undefined
    const catName = eqCatNames?.en || "Other"
    const catId = eq.equipment?.category?.id?.toString() || "other"
    if (!equipmentByCategory[catId]) {
      equipmentByCategory[catId] = { categoryName: catName, categoryNameTranslations: eqCatNames || null, items: [] }
    }
    const eqNames = eq.equipment?.name as Record<string, string> | undefined
    const eqName = eqNames?.en || ""
    if (eqName) {
      equipmentByCategory[catId].items.push({ name: eqName, nameTranslations: eqNames || null, quantity: eq.quantity || 1 })
    }
  }

  // Services
  const services = yacht.services.map((s) => {
    const serviceNames = s.service?.name as Record<string, string> | undefined
    const serviceName = serviceNames?.en || "Service"
    return {
      name: serviceName,
      nameTranslations: serviceNames || null,
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
    categoryTranslations: catNames || null,
    images: allImages,
    location: locationName,
    locationTranslations: locNames || null,
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
    descriptionTranslations: highlightsT,
    note,
    noteTranslations: noteT,
    equipmentByCategory,
    services,
    prices,
    mastLength: yacht.mastLength,
    propulsionType: yacht.propulsionType,
    staffRep: staffRep
      ? {
          name: staffRep.name,
          position: (staffRep.position as Record<string, string>)?.en || "",
          positionTranslations: staffRep.position as Record<string, string> | null,
          image: staffRep.image || "",
        }
      : null,
  }

  return (
    <>
      <SiteHeader />
      <YachtDetailClient yacht={yachtData} />
      <SiteFooter />
    </>
  )
}

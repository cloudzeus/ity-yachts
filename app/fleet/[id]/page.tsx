import type { Metadata } from "next"
import { db } from "@/lib/db"
import { yachtGallery, yachtThumb, yachtPlans } from "@/lib/yacht-images"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbLd, yachtLd } from "@/lib/structured-data"
import { localized, metaStrings } from "@/lib/meta.server"
import { en, metaDescription, metaTitle, pageMeta } from "@/lib/seo"
import { notFound, permanentRedirect } from "next/navigation"
import { getLocale } from "@/lib/translations.server"
import { withLocale } from "@/lib/locale"
import { yachtIdFromParam, yachtPath } from "@/lib/yacht-slug"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { YachtDetailClient } from "./yacht-detail-client"

export const dynamic = "force-dynamic"

/**
 * A yacht page carried only a title and inherited the site description, so
 * every boat in the fleet was offering search engines the same 39 characters
 * about an "enterprise management platform".
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const yachtId = yachtIdFromParam(id)
  if (yachtId === null) return { title: "Not found" }

  const yacht = await db.nausysYacht.findUnique({
    where: { id: yachtId },
    select: {
      name: true, buildYear: true, cabins: true, berthsTotal: true, maxPersons: true, loa: true,
      websiteImages: true, mainPictureUrl: true, picturesUrl: true, websiteTour360: true,
      model: { select: { name: true } },
      category: { select: { name: true } },
      base: { select: { location: { select: { name: true } } } },
    },
  })
  if (!yacht) return { title: "Not found" }

  const name = yacht.name || yacht.model?.name || "Yacht"
  const model = yacht.model?.name
  const { locale, m } = await metaStrings()
  const kind = localized(yacht.category?.name, locale, m("meta.yacht.kind", "Sailing yacht"))
  const place = localized(yacht.base?.location?.name, locale, "Lefkada")
  const berths = yacht.berthsTotal || yacht.maxPersons

  // Everything a search result needs to qualify the click: what it is, how big,
  // how many it sleeps, from where.
  const facts = [
    model && model !== name ? model : null,
    yacht.buildYear ? `${yacht.buildYear}` : null,
    yacht.loa ? `${yacht.loa} m` : null,
    yacht.cabins ? `${yacht.cabins} ${m("meta.yacht.cabins", "cabins")}` : null,
    berths ? `${berths} ${m("meta.yacht.guests", "guests")}` : null,
  ].filter(Boolean).join(" · ")

  const description = metaDescription(
    `${name} — ${kind.toLowerCase()}, ${place}. ${facts}. ${m("meta.yacht.descTail", "Bareboat or skippered, with IYC in the Ionian since 1979.")}`
  )

  return pageMeta({
    title: metaTitle(`${name}${model && model !== name ? ` ${model}` : ""} — ${m("meta.yacht.charterIn", "Charter")} ${place}`),
    description,
    /* The canonical is the slug form, whatever spelling was asked for — the
       stale and the bare-id addresses must not each claim to be the page. */
    path: yachtPath({ id: yachtId, name: yacht.name, model: yacht.model }),
    image: yachtThumb(yacht),
  })
}

export default async function YachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const yachtId = yachtIdFromParam(id)
  if (yachtId === null) notFound()

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
      // Booked periods mirrored from NAUSYS. Without these the calendar can
      // only ask "is there a price for this date", which is true all season
      // whether or not the boat is taken.
      availability: {
        where: { status: { in: ["BOOKED", "OPTION", "MAINTENANCE"] } },
        select: { dateFrom: true, dateTo: true, status: true },
        orderBy: { dateFrom: "asc" },
      },
      websiteAreas: { include: { region: { include: { country: true } } } },
    },
  })

  if (!yacht) notFound()

  /* One address per boat. A bare id, or the spelling from before a rename in
     NAUSYS, still finds her — and is then sent to the current one, so the
     search engines and the links people already hold converge on a single
     page instead of splitting its standing between several.

     The locale prefix has to be put back by hand: the proxy rewrites /el/…
     to /fleet/… before this runs, so a redirect written as-is would drop a
     Greek visitor into the English page. */
  const canonical = yachtPath(yacht)
  if (`/fleet/${id}` !== canonical) {
    permanentRedirect(withLocale(canonical, await getLocale()))
  }

  /* Who is shown as the person handling this enquiry.
     Only colleagues the admin has marked for it — it used to be any active
     employee, which put people who never deal with customers on the page.
     And the pick is by yacht id rather than at random: the page is dynamic,
     so a random choice handed a different face to the same visitor on every
     refresh, and to two people looking at the same boat together. */
  const advisors = await db.staff.findMany({
    where: { status: "active", showAsAdvisor: true },
    select: { name: true, position: true, image: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  const staffRep = advisors.length > 0 ? advisors[yachtId % advisors.length] : null

  // Transform for client
  const catNames = yacht.category?.name as Record<string, string> | undefined
  const categoryName = catNames?.en || "Yacht"

  // CDN only when it exists — this used to append the NAUSYS originals on top,
  // shipping every photograph twice.
  const allImages = yachtGallery(yacht)
  // Layout drawings, kept out of the photo carousel and given their own block.
  const planImages = yachtPlans(yacht)

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
    plans: planImages,
    /* The archived Panotour walkthrough, passed through as stored and read by
       the viewer — see lib/tour360.ts for why it survives at all. */
    tour360: yacht.websiteTour360 ?? null,
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
    availability: yacht.availability.map((a) => ({
      dateFrom: a.dateFrom.toISOString(),
      dateTo: a.dateTo.toISOString(),
      status: a.status,
    })),
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
      <JsonLd
        data={[
          yachtLd({
            name: yachtData.name,
            description: description || note || `${categoryName} for charter from ${locationName || "Lefkada"}, Greece.`,
            path: canonical,
            image: allImages[0] ?? null,
            model: yacht.model?.name ?? null,
            year: yacht.buildYear,
            cabins: yacht.cabins,
            berths: yacht.berthsTotal || yacht.maxPersons,
            loa: yacht.loa,
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Fleet", path: "/fleet" },
            { name: yachtData.name, path: canonical },
          ]),
        ]}
      />
      <SiteHeader />
      <YachtDetailClient yacht={yachtData} />
      <SiteFooter />
    </>
  )
}

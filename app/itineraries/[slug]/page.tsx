import { db } from "@/lib/db"
import { en, metaDescription, metaTitle, pageMeta } from "@/lib/seo"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbLd, tripLd } from "@/lib/structured-data"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ItineraryDetailClient } from "@/components/itinerary-detail-client"
import { getGoogleMapsKey } from "@/lib/maps-key"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const itinerary = await db.itinerary.findUnique({
    where: { slug },
    select: {
      name: true, metaTitle: true, metaDesc: true, defaultMedia: true,
      shortDesc: true, totalDays: true, totalMiles: true, startFrom: true,
    },
  })
  if (!itinerary) return { title: "Itinerary not found" }

  const name = en(itinerary.name, "Itinerary")

  /* metaDesc is optional and mostly empty, and the old code passed `undefined`
     straight through — so these pages shipped with no description at all.
     Build one from the route's own facts instead. */
  const facts = [
    itinerary.totalDays ? `${itinerary.totalDays} days` : null,
    itinerary.totalMiles ? `${itinerary.totalMiles} nautical miles` : null,
    itinerary.startFrom ? `from ${itinerary.startFrom}` : "from Lefkada",
  ].filter(Boolean).join(", ")

  const description = metaDescription(
    itinerary.metaDesc || `${en(itinerary.shortDesc)} ${name}: ${facts}. Day by day, with the anchorages and harbours along the way.`.trim()
  )

  return pageMeta({
    title: itinerary.metaTitle || metaTitle(`${name} — Ionian Route`),
    description,
    path: `/itineraries/${slug}`,
    image: itinerary.defaultMedia,
  })
}

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mapsKey = await getGoogleMapsKey()
  const itinerary = await db.itinerary.findUnique({
    where: { slug },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { legs: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!itinerary) notFound()

  const data = {
    name: itinerary.name as Record<string, string>,
    shortDesc: itinerary.shortDesc as Record<string, string>,
    startFrom: itinerary.startFrom,
    startLatitude: itinerary.startLatitude,
    startLongitude: itinerary.startLongitude,
    totalDays: itinerary.totalDays,
    totalMiles: itinerary.totalMiles,
    defaultMedia: itinerary.defaultMedia,
    defaultMediaType: itinerary.defaultMediaType,
    places: itinerary.places as Array<{ name: string; latitude: number; longitude: number }>,
    days: itinerary.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      description: day.description as Record<string, string>,
      legs: day.legs.map((leg) => ({
        id: leg.id,
        name: leg.name as Record<string, string>,
        description: leg.description as Record<string, string>,
        latitude: leg.latitude,
        longitude: leg.longitude,
        images: leg.images as string[],
        sortOrder: leg.sortOrder,
      })),
    })),
  }

  return (
    <main>
      <JsonLd
        data={[
          tripLd({
            name: en(itinerary.name, "Sailing route"),
            description: en(itinerary.shortDesc),
            path: `/itineraries/${slug}`,
            image: itinerary.defaultMedia,
            days: itinerary.totalDays,
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Itineraries", path: "/itineraries" },
            { name: en(itinerary.name, "Sailing route"), path: `/itineraries/${slug}` },
          ]),
        ]}
      />
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <ItineraryDetailClient itinerary={data} mapsKey={mapsKey} />
      </div>
      <SiteFooter />
    </main>
  )
}

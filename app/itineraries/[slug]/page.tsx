import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ItineraryDetailClient } from "@/components/itinerary-detail-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const itinerary = await db.itinerary.findUnique({ where: { slug }, select: { name: true, metaTitle: true, metaDesc: true, defaultMedia: true } })
  if (!itinerary) return { title: "Itinerary Not Found" }
  const name = (itinerary.name as Record<string, string>)?.en || "Itinerary"
  return {
    title: itinerary.metaTitle || `${name} — IYC Yachts`,
    description: itinerary.metaDesc || undefined,
    openGraph: {
      title: itinerary.metaTitle || name,
      description: itinerary.metaDesc || undefined,
      images: itinerary.defaultMedia ? [itinerary.defaultMedia] : undefined,
    },
  }
}

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <ItineraryDetailClient itinerary={data} />
      </div>
      <SiteFooter />
    </main>
  )
}

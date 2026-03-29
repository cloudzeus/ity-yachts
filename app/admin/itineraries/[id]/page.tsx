import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ItineraryEditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const itinerary = await db.itinerary.findUnique({ where: { id }, select: { name: true } })
  const name = itinerary ? (itinerary.name as Record<string, string>)?.en : null
  return { title: name ? `${name} — Itineraries — IYC Admin` : "Itinerary — IYC Admin" }
}

export default async function ItineraryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const itinerary = await db.itinerary.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          legs: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })

  if (!itinerary) notFound()

  return (
    <ItineraryEditorClient
      itinerary={{
        ...itinerary,
        name: (itinerary.name as Record<string, string>) ?? { en: "", el: "", de: "" },
        shortDesc: (itinerary.shortDesc as Record<string, string>) ?? { en: "", el: "", de: "" },
        places: (itinerary.places as Array<{ name: string; latitude: number; longitude: number }>) ?? [],
        days: itinerary.days.map((d) => ({
          ...d,
          description: (d.description as Record<string, string>) ?? { en: "", el: "", de: "" },
          legs: d.legs.map((l) => ({
            ...l,
            name: (l.name as Record<string, string>) ?? { en: "", el: "", de: "" },
            description: (l.description as Record<string, string>) ?? { en: "", el: "", de: "" },
            images: (l.images as string[]) ?? [],
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
          })),
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
        createdAt: itinerary.createdAt.toISOString(),
        updatedAt: itinerary.updatedAt.toISOString(),
      }}
    />
  )
}

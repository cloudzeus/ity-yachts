import { db } from "@/lib/db"
import { ItinerariesClient } from "./itineraries-client"

export const metadata = { title: "Itineraries — IYC Admin" }

export default async function ItinerariesPage() {
  const [itineraries, total] = await Promise.all([
    db.itinerary.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { _count: { select: { days: true } } },
    }),
    db.itinerary.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Itineraries
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total itineraries
          </p>
        </div>
      </div>

      <ItinerariesClient initialData={{
        itineraries: itineraries.map((it) => ({
          ...it,
          name: it.name as Record<string, string>,
          shortDesc: it.shortDesc as Record<string, string>,
          places: it.places as Array<{ name: string; latitude: number; longitude: number }>,
          _count: it._count,
          createdAt: it.createdAt.toISOString(),
          updatedAt: it.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}

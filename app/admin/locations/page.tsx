import { db } from "@/lib/db"
import { LocationsClient } from "./locations-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Locations — IYC Admin" }

export default async function LocationsPage() {
  const [locations, total] = await Promise.all([
    db.location.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.location.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Locations
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total locations
          </p>
        </div>
      </div>

      <LocationsClient initialData={{
        locations: locations.map((l) => ({
          ...l,
          nameTranslations: l.nameTranslations as Record<string, string>,
          shortDesc: l.shortDesc as Record<string, string>,
          description: l.description as Record<string, string>,
          prefecture: l.prefecture as Record<string, string>,
          images: l.images as string[],
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}

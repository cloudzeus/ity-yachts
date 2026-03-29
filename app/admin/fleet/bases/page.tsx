import { db } from "@/lib/db"
import { BasesClient } from "./bases-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Charter Bases — IYC Admin" }

export default async function BasesPage() {
  const [countries, regions, locations, bases] = await Promise.all([
    db.nausysCountry.findMany({ orderBy: { id: "asc" } }),
    db.nausysRegion.findMany({ orderBy: { id: "asc" } }),
    db.nausysLocation.findMany({ orderBy: { id: "asc" } }),
    db.nausysCharterBase.findMany({
      include: {
        location: true,
        _count: { select: { yachts: true } },
      },
      orderBy: { id: "asc" },
    }),
  ])

  // Serialize Prisma JsonValue → plain objects for client component
  const data = JSON.parse(JSON.stringify({ countries, regions, locations, bases }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Charter Bases
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          {bases.length} bases across {locations.length} locations in {countries.length} countries
        </p>
      </div>

      <BasesClient data={data} />
    </div>
  )
}

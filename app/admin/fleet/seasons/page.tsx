import { db } from "@/lib/db"
import { SeasonsClient } from "./seasons-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Seasons — IYC Admin" }

export default async function SeasonsPage() {
  const [seasons, yachtSeasons, totalYachts] = await Promise.all([
    db.nausysSeason.findMany({
      include: { _count: { select: { yachtSeasons: true } } },
      orderBy: { dateFrom: "asc" },
    }),
    db.nausysYachtSeason.findMany({
      include: {
        yacht: { select: { id: true, name: true } },
        season: { select: { id: true, season: true } },
      },
    }),
    db.nausysYacht.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Seasons
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          {seasons.length} seasons defined — {totalYachts} yachts in fleet
        </p>
      </div>

      <SeasonsClient
        data={{
          seasons: seasons.map((s) => ({
            id: s.id,
            season: s.season,
            companyId: s.companyId,
            dateFrom: s.dateFrom.toISOString(),
            dateTo: s.dateTo.toISOString(),
            defaultSeason: s.defaultSeason,
            locationsId: s.locationsId as number[],
            yachtCount: s._count.yachtSeasons,
          })),
          yachtSeasons: yachtSeasons.map((ys) => ({
            seasonId: ys.seasonId,
            yachtId: ys.yachtId,
            yachtName: ys.yacht.name,
          })),
          totalYachts,
        }}
      />
    </div>
  )
}

import { db } from "@/lib/db"
import { FleetClient } from "./fleet-client"

export const metadata = { title: "Fleet — IYC Admin" }

export default async function FleetPage() {
  const [yachts, total, lastSync] = await Promise.all([
    db.nausysYacht.findMany({
      include: {
        model: { include: { category: true, builder: true } },
        base: { include: { location: true } },
        _count: { select: { equipment: true, cabinDefinitions: true, prices: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    db.nausysYacht.count(),
    db.nausysSyncLog.findFirst({ orderBy: { startedAt: "desc" } }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Sailing Fleet
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} yachts synced from NAUSYS
          </p>
        </div>
      </div>

      <FleetClient
        initialData={{
          yachts: yachts.map((y) => ({
            ...y,
            highlightsTranslations: y.highlightsTranslations as Record<string, string>,
            noteTranslations: y.noteTranslations as Record<string, string>,
            picturesUrl: y.picturesUrl as string[],
            flagsId: y.flagsId as number[],
            lastSyncedAt: y.lastSyncedAt?.toISOString() ?? null,
            outOfFleetDate: y.outOfFleetDate?.toISOString() ?? null,
            createdAt: y.createdAt.toISOString(),
            updatedAt: y.updatedAt.toISOString(),
            model: y.model
              ? {
                  ...y.model,
                  category: y.model.category
                    ? { ...y.model.category, name: y.model.category.name as Record<string, string> }
                    : null,
                }
              : null,
            base: y.base
              ? {
                  ...y.base,
                  location: y.base.location
                    ? { ...y.base.location, name: y.base.location.name as Record<string, string> }
                    : null,
                }
              : null,
          })),
          total,
          lastSync: lastSync
            ? {
                id: lastSync.id,
                syncType: lastSync.syncType,
                status: lastSync.status,
                itemCount: lastSync.itemCount,
                startedAt: lastSync.startedAt.toISOString(),
                completedAt: lastSync.completedAt?.toISOString() ?? null,
              }
            : null,
        }}
      />
    </div>
  )
}

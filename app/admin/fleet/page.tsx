import { db } from "@/lib/db"
import { FleetClient } from "./fleet-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Fleet — IYC Admin" }

export default async function FleetPage() {
  const [total, lastSync] = await Promise.all([
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
        total={total}
        lastSync={
          lastSync
            ? {
                id: lastSync.id,
                syncType: lastSync.syncType,
                status: lastSync.status,
                itemCount: lastSync.itemCount,
                startedAt: lastSync.startedAt.toISOString(),
                completedAt: lastSync.completedAt?.toISOString() ?? null,
              }
            : null
        }
      />
    </div>
  )
}

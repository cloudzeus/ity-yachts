import { db } from "@/lib/db"
import { PricingClient } from "./pricing-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Fleet Pricing — IYC Admin" }

export default async function PricingPage() {
  const [prices, seasons, yachts] = await Promise.all([
    db.nausysYachtPrice.findMany({
      include: { yacht: { select: { id: true, name: true } } },
      orderBy: [{ yachtId: "asc" }, { dateFrom: "asc" }],
    }),
    db.nausysSeason.findMany({ orderBy: { dateFrom: "asc" } }),
    db.nausysYacht.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Fleet Pricing
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          {prices.length} pricing periods across {yachts.length} yachts — {seasons.length} seasons
        </p>
      </div>

      <PricingClient
        initialData={{
          prices: prices.map((p) => ({
            ...p,
            dateFrom: p.dateFrom.toISOString(),
            dateTo: p.dateTo.toISOString(),
            locationsId: p.locationsId as number[],
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
          seasons: seasons.map((s) => ({
            ...s,
            dateFrom: s.dateFrom.toISOString(),
            dateTo: s.dateTo.toISOString(),
            locationsId: s.locationsId as number[],
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          yachts,
        }}
      />
    </div>
  )
}

import { db } from "@/lib/db"
import { BookingsClient } from "./bookings-client"

export const metadata = { title: "Bookings — IYC Admin" }

export default async function BookingsPage() {
  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        yacht: { select: { name: true, model: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.booking.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Bookings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total bookings
          </p>
        </div>
      </div>

      <BookingsClient
        initialData={{
          bookings: bookings.map((b) => ({
            ...b,
            dateFrom: b.dateFrom.toISOString(),
            dateTo: b.dateTo.toISOString(),
            depositDueDate: b.depositDueDate?.toISOString() ?? null,
            balanceDueDate: b.balanceDueDate?.toISOString() ?? null,
            optionExpiresAt: b.optionExpiresAt?.toISOString() ?? null,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          })),
          total,
        }}
      />
    </div>
  )
}

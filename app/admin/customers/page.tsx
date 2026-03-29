import { db } from "@/lib/db"
import { CustomersClient } from "./customers-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Customers — IYC Admin" }

export default async function CustomersPage() {
  const [customers, total] = await Promise.all([
    db.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: { select: { bookings: true } },
      },
    }),
    db.customer.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Customers
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total customers
          </p>
        </div>
      </div>

      <CustomersClient initialData={{
        customers: customers.map((c) => ({
          ...c,
          certifications: c.certifications as string[],
          passportExpiry: c.passportExpiry?.toISOString() ?? null,
          dateOfBirth: c.dateOfBirth?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}

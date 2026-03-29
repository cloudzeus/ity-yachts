import { db } from "@/lib/db"
import { EnquiriesClient } from "./enquiries-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Enquiries — IYC Admin" }

export default async function EnquiriesPage() {
  const [enquiries, total] = await Promise.all([
    db.enquiry.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        assignedStaff: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.enquiry.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Enquiries
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total enquiries
          </p>
        </div>
      </div>

      <EnquiriesClient
        initialData={{
          enquiries: enquiries.map((e) => ({
            ...e,
            dateFrom: e.dateFrom?.toISOString() ?? null,
            dateTo: e.dateTo?.toISOString() ?? null,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
          })),
          total,
        }}
      />
    </div>
  )
}

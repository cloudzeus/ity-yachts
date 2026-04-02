import { db } from "@/lib/db"
import { ServicesClient } from "./services-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Services — IYC Admin" }

export default async function ServicesPage() {
  const [services, total] = await Promise.all([
    db.service.findMany({
      orderBy: { sortOrder: "asc" },
      take: 50,
    }),
    db.service.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Services
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total services — drag rows to reorder
          </p>
        </div>
      </div>

      <ServicesClient initialData={{
        services: services.map((s) => ({
          ...s,
          title: s.title as Record<string, string>,
          label: s.label as Record<string, string>,
          header: s.header as Record<string, string>,
          shortDesc: s.shortDesc as Record<string, string>,
          description: s.description as Record<string, string>,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}

import { db } from "@/lib/db"
import { StaffClient } from "./staff-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Company Staff — IYC Admin" }

export default async function StaffPage() {
  const [staff, total, users] = await Promise.all([
    db.staff.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 20,
    }),
    db.staff.count(),
    db.user.findMany({
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Company Staff
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} team members
          </p>
        </div>
      </div>

      <StaffClient
        initialData={{
          staff: staff.map((s) => ({
            ...s,
            city: s.city as Record<string, string>,
            department: s.department as Record<string, string>,
            position: s.position as Record<string, string>,
            bio: s.bio as Record<string, string>,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          total,
        }}
        users={users.map((u) => ({ id: u.id, name: u.name ?? "", email: u.email ?? "", image: u.image }))}
      />
    </div>
  )
}

import { db } from "@/lib/db"
import { UsersClient } from "./users-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Users — IYC Admin" }

export default async function UsersPage() {
  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    }),
    db.user.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total users
          </p>
        </div>
      </div>

      <UsersClient initialData={{ users: users.map(u => ({ ...u, emailVerified: u.emailVerified?.toISOString() ?? null, createdAt: u.createdAt.toISOString() })), total }} />
    </div>
  )
}

import { db } from "@/lib/db"
import { ContactsClient } from "./contacts-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "NAUSYS Contacts — IYC Admin" }

export default async function ContactsPage() {
  const [contacts, total] = await Promise.all([
    db.nausysContact.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    db.nausysContact.count(),
  ])

  const typeCounts = await db.nausysContact.groupBy({
    by: ["contactType"],
    _count: { id: true },
  })

  const typeMap: Record<string, number> = {}
  for (const t of typeCounts) {
    typeMap[t.contactType || "UNKNOWN"] = t._count.id
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            NAUSYS Contacts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} contacts synced via contacts2 API
          </p>
        </div>
      </div>

      <ContactsClient
        initialData={{
          contacts: contacts.map((c) => ({
            ...c,
            dateOfBirth: c.dateOfBirth?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          })),
          total,
          typeCounts: typeMap,
        }}
      />
    </div>
  )
}

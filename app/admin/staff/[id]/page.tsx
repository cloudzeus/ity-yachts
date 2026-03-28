import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { StaffEditorClient } from "./editor-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await db.staff.findUnique({ where: { id }, select: { name: true } })
  return { title: member ? `${member.name} — Staff — IYC Admin` : "Staff — IYC Admin" }
}

export default async function StaffEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [member, users, allStaff] = await Promise.all([
    db.staff.findUnique({ where: { id } }),
    db.user.findMany({
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
    }),
    db.staff.findMany({
      select: { department: true },
      where: { NOT: { department: { equals: {} } } },
    }),
  ])

  if (!member) notFound()

  // Collect unique departments from existing staff
  const existingDepartments: Record<string, string>[] = []
  const seen = new Set<string>()
  for (const s of allStaff) {
    const dept = s.department as Record<string, string>
    const key = dept?.en || ""
    if (key && !seen.has(key)) {
      seen.add(key)
      existingDepartments.push(dept)
    }
  }

  return (
    <StaffEditorClient
      member={{
        ...member,
        city: member.city as Record<string, string>,
        department: member.department as Record<string, string>,
        position: member.position as Record<string, string>,
        bio: member.bio as Record<string, string>,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      }}
      users={users.map((u) => ({ id: u.id, name: u.name ?? "", email: u.email ?? "", image: u.image }))}
      existingDepartments={existingDepartments}
    />
  )
}

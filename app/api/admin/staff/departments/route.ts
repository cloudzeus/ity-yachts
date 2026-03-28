import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const allStaff = await db.staff.findMany({
      select: { department: true },
    })

    // Collect unique departments by their English name
    const seen = new Set<string>()
    const departments: Record<string, string>[] = []

    for (const s of allStaff) {
      const dept = s.department as Record<string, string>
      if (dept?.en && !seen.has(dept.en)) {
        seen.add(dept.en)
        departments.push(dept)
      }
    }

    return NextResponse.json({ departments: departments.sort((a, b) => a.en.localeCompare(b.en)) })
  } catch (error) {
    console.error("[GET /api/admin/staff/departments]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

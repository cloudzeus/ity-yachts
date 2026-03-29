import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const staff = await db.staff.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        image: true,
        bio: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("[GET /api/staff]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

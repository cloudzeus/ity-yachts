import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const homepageOnly = searchParams.get("homepage") === "true"

    const where = {
      status: "published",
      ...(homepageOnly && { showOnHomepage: true }),
    }

    const services = await db.service.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error("[GET /api/services]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

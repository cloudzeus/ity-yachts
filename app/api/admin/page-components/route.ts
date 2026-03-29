import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get("pageId")

    const where = pageId ? { pageId } : {}

    const components = await db.pageComponent.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ components })
  } catch (error) {
    console.error("[GET /api/admin/page-components]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { pageId, type, name, props, dataSource, sortOrder } = body

    if (!pageId || !type) {
      return NextResponse.json({ error: "pageId and type are required" }, { status: 400 })
    }

    const component = await db.pageComponent.create({
      data: {
        pageId,
        type,
        name: name ?? "",
        props: props ?? {},
        dataSource: dataSource ?? {},
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ component }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/page-components]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

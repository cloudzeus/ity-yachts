import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const components = await db.textComponent.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ components })
  } catch (error) {
    console.error("[GET /api/admin/pages/[id]/text-components]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { key, translations } = await req.json()

    if (!key || !translations) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const component = await db.textComponent.create({
      data: {
        pageId: id,
        key,
        translations,
      },
    })

    return NextResponse.json({ component }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/pages/[id]/text-components]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

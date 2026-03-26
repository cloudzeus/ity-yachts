import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    })

    return NextResponse.json({ preferences: (user?.preferences as Record<string, unknown>) ?? {} })
  } catch (error) {
    console.error("[GET /api/user/preferences]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { key, value } = body

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 })
    }

    // Merge into existing preferences instead of overwriting all
    const existing = await db.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    })

    const current = (existing?.preferences as Record<string, unknown>) ?? {}
    const updated = { ...current, [key]: value }

    await db.user.update({
      where: { id: session.user.id },
      data: { preferences: updated },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[PUT /api/user/preferences]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

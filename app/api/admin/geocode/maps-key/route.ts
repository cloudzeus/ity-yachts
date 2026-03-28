import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
    if (!record) return NextResponse.json({ key: null })
    const keys = record.value as Record<string, string>

    return NextResponse.json({ key: keys.googleMapsKey || null })
  } catch {
    return NextResponse.json({ key: null })
  }
}

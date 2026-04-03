import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
    if (!record) return NextResponse.json({ key: null })
    const keys = record.value as Record<string, string>
    return NextResponse.json({ key: keys.googleMapsKey || null })
  } catch {
    return NextResponse.json({ key: null })
  }
}

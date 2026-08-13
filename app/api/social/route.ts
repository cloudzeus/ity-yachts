import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/** The social profiles that actually have a URL, for the footer. */
export async function GET() {
  try {
    const row = await db.setting.findUnique({ where: { key: "social" } })
    const raw = (row?.value ?? {}) as Record<string, string>
    const links = Object.entries(raw)
      .filter(([, url]) => typeof url === "string" && /^https?:\/\//i.test(url.trim()))
      .map(([network, url]) => ({ network, url: url.trim() }))
    return NextResponse.json({ links })
  } catch (error) {
    console.error("[GET /api/social]", error)
    return NextResponse.json({ links: [] })
  }
}

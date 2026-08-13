import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

/**
 * Photographs that know where they were taken.
 *
 * Read straight from our own table rather than from the CDN listing: the
 * published files carry no EXIF — the webp conversion drops it — so the
 * position only exists here.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  const media = await db.media.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      id: true, name: true, url: true, folder: true,
      latitude: true, longitude: true, capturedAt: true,
    },
  })

  return NextResponse.json({ media })
}

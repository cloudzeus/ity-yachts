import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

async function guard() {
  const session = await getSession()
  return session.user && ["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)
}

export async function GET(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const params = req.nextUrl.searchParams
  const status = params.get("status") ?? ""
  const q = (params.get("q") ?? "").trim()
  const format = params.get("format") ?? ""

  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {}),
  }

  /* A CSV export is what makes this list usable in a mail tool. Only confirmed
     addresses go out — a pending row is not consent. */
  if (format === "csv") {
    const rows = await db.newsletterSubscriber.findMany({
      where: { ...where, status: "subscribed" },
      orderBy: { confirmedAt: "desc" },
      select: { email: true, name: true, locale: true, confirmedAt: true, source: true },
    })
    const csv = [
      "email,name,locale,confirmed_at,source",
      ...rows.map((r) =>
        [r.email, r.name ?? "", r.locale, r.confirmedAt?.toISOString() ?? "", r.source]
          // Quote and escape, or a name with a comma shifts every column.
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [subscribers, counts] = await Promise.all([
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, email: true, name: true, locale: true, status: true,
        source: true, confirmedAt: true, unsubscribedAt: true, createdAt: true,
      },
    }),
    db.newsletterSubscriber.groupBy({ by: ["status"], _count: { status: true } }),
  ])

  return NextResponse.json({
    subscribers,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count.status])),
  })
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // A hard delete, for erasure requests. Unsubscribing marks; this removes.
  await db.newsletterSubscriber.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

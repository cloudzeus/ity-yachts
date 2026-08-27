import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * The kinds of boat we actually have, for the Fleet menu.
 *
 * Read from the fleet rather than written down: today that is sailing yachts
 * and one catamaran, and the day a motor yacht arrives on the pontoon the
 * menu grows on its own. A hard-coded pair would have to be remembered, and
 * would quietly be wrong the first time it was not.
 *
 * Categories with nothing in them are left out — a menu item that leads to an
 * empty fleet is worse than no menu item.
 */
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const grouped = await db.nausysYacht.groupBy({
      by: ["categoryId"],
      where: { categoryId: { not: null } },
      _count: true,
    })
    const ids = grouped.map((g) => g.categoryId).filter((id): id is number => id != null)
    if (!ids.length) return NextResponse.json({ categories: [] })

    const categories = await db.nausysYachtCategory.findMany({ where: { id: { in: ids } } })
    const countById = new Map(grouped.map((g) => [g.categoryId, g._count]))

    const out = categories
      .map((c) => ({
        id: c.id,
        name: (c.name ?? {}) as Record<string, string>,
        count: countById.get(c.id) ?? 0,
      }))
      // Most boats first: the sailing yachts are what most people came for.
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(
      { categories: out },
      /* The fleet changes when NAUSYS syncs, which is not often and never
         mid-visit. */
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch {
    // The menu falls back to a plain Fleet link, which is what it was before.
    return NextResponse.json({ categories: [] })
  }
}

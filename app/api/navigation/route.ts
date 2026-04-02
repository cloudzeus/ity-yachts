import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const pages = await db.page.findMany({
      where: {
        status: "published",
        showInMenu: true,
        centralMenu: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isHomePage: true,
        menuLabel: true,
        menuOrder: true,
        translations: true,
      },
      orderBy: { menuOrder: "asc" },
    })

    const navItems = pages.map((p) => {
      const translations = p.translations as Record<string, string> | null
      return {
        id: p.id,
        label: p.menuLabel || p.name,
        slug: p.slug,
        href: p.isHomePage ? "/" : `/${p.slug}`,
        isHomePage: p.isHomePage,
        menuOrder: p.menuOrder,
        translations: translations || {},
      }
    })

    return NextResponse.json({ items: navItems })
  } catch (error) {
    console.error("[GET /api/navigation]", error)
    return NextResponse.json({ items: [] })
  }
}

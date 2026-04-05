import { db } from "@/lib/db"
import { PagesClient } from "./pages-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Pages — IYC Admin" }

export default async function PagesPage() {
  const [pages, total] = await Promise.all([
    db.page.findMany({
      orderBy: { sortOrder: "asc" },
      take: 200,
      select: { id: true, name: true, slug: true, status: true, isHomePage: true, showInMenu: true, centralMenu: true, menuOrder: true, sortOrder: true, updatedAt: true },
    }),
    db.page.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Pages
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total pages
          </p>
        </div>
      </div>

      <PagesClient initialData={{
        pages: pages.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}

import { db } from "@/lib/db"
import { ArticlesClient } from "./articles-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Articles — IYC Admin" }

export default async function ArticlesPage() {
  const [articles, total] = await Promise.all([
    db.article.findMany({
      orderBy: { date: "desc" },
      take: 20,
    }),
    db.article.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          News &amp; Articles
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          {total} total articles
        </p>
      </div>

      <ArticlesClient
        initialData={{
          articles: articles.map((a) => ({
            ...a,
            title: a.title as Record<string, string>,
            category: a.category as Record<string, string>,
            shortDesc: a.shortDesc as Record<string, string>,
            description: a.description as Record<string, string>,
            media: a.media as string[],
            date: a.date.toISOString(),
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          })),
          total,
        }}
      />
    </div>
  )
}

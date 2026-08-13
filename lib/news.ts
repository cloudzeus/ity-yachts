import { db } from "@/lib/db"

/**
 * Published articles, shaped for the public pages.
 *
 * "Published" means the status says so *and* the publish date has arrived —
 * a piece dated next Tuesday is written, not out. Ordering is by that date,
 * newest first, with sortOrder breaking ties so an editor can pin one.
 */
export interface NewsCard {
  id: string
  slug: string
  title: Record<string, string>
  shortDesc: Record<string, string>
  media: string | null
  mediaType: string | null
  publishedAt: Date | null
  readMinutes: number | null
  author: string
  category: { slug: string; name: Record<string, string>; color: string | null } | null
  tags: { slug: string; name: Record<string, string> }[]
}

const liveNow = () => ({
  status: "published",
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
})

const SELECT = {
  id: true, slug: true, title: true, shortDesc: true,
  defaultMedia: true, defaultMediaType: true,
  publishedAt: true, date: true, readMinutes: true, author: true,
  categoryRef: { select: { slug: true, name: true, color: true } },
  tags: { select: { tag: { select: { slug: true, name: true } } } },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCard(a: any): NewsCard {
  return {
    id: a.id,
    slug: a.slug,
    title: (a.title ?? {}) as Record<string, string>,
    shortDesc: (a.shortDesc ?? {}) as Record<string, string>,
    media: a.defaultMedia,
    mediaType: a.defaultMediaType,
    // Fall back to `date` for anything written before publishedAt existed.
    publishedAt: a.publishedAt ?? a.date ?? null,
    readMinutes: a.readMinutes,
    author: a.author ?? "",
    category: a.categoryRef
      ? { slug: a.categoryRef.slug, name: a.categoryRef.name as Record<string, string>, color: a.categoryRef.color }
      : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: (a.tags ?? []).map((t: any) => ({ slug: t.tag.slug, name: t.tag.name as Record<string, string> })),
  }
}

export async function getLatestNews(take = 3): Promise<NewsCard[]> {
  const rows = await db.article.findMany({
    where: liveNow(),
    orderBy: [{ publishedAt: "desc" }, { date: "desc" }],
    take,
    select: SELECT,
  })
  return rows.map(toCard)
}

export async function getNewsList(opts: { category?: string; tag?: string } = {}) {
  const rows = await db.article.findMany({
    where: {
      ...liveNow(),
      ...(opts.category ? { categoryRef: { slug: opts.category } } : {}),
      ...(opts.tag ? { tags: { some: { tag: { slug: opts.tag } } } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { date: "desc" }],
    select: SELECT,
  })
  return rows.map(toCard)
}

/** Categories that have something to show — an empty filter is a dead end. */
export async function getNewsCategories() {
  const rows = await db.articleCategory.findMany({
    where: { status: "active", articles: { some: liveNow() } },
    orderBy: [{ sortOrder: "asc" }],
    select: { slug: true, name: true, color: true, _count: { select: { articles: true } } },
  })
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name as Record<string, string>,
    color: c.color,
    count: c._count.articles,
  }))
}

export async function getArticleBySlug(slug: string) {
  return db.article.findFirst({
    where: { slug, ...liveNow() },
    select: {
      ...SELECT,
      description: true,
      media: true,
      metaTitle: true,
      metaDesc: true,
    },
  })
}

/** Others in the same category, for the foot of an article. */
export async function getRelatedNews(articleId: string, categorySlug: string | null, take = 3) {
  const rows = await db.article.findMany({
    where: {
      ...liveNow(),
      id: { not: articleId },
      ...(categorySlug ? { categoryRef: { slug: categorySlug } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: SELECT,
  })
  if (rows.length) return rows.map(toCard)
  // Nothing else in that category — show the most recent instead of nothing.
  return getLatestNews(take).then((all) => all.filter((a) => a.id !== articleId).slice(0, take))
}

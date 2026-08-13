import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getArticleBySlug, getRelatedNews } from "@/lib/news"
import { ArticleBody } from "./article-body"
import { RelatedNews } from "./related-news"

export const dynamic = "force-dynamic"

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: "Not found — IYC Yachts" }

  const title = (article.title as Record<string, string>)?.en || "Article"
  const short = plain((article.shortDesc as Record<string, string>)?.en ?? "")

  return {
    title: article.metaTitle || `${title} — IYC Yachts`,
    description: article.metaDesc || short.slice(0, 155),
    openGraph: {
      title: article.metaTitle || title,
      description: article.metaDesc || short.slice(0, 155),
      type: "article",
      publishedTime: (article.publishedAt ?? article.date)?.toISOString(),
      images:
        article.defaultMedia && article.defaultMediaType !== "video"
          ? [{ url: article.defaultMedia }]
          : undefined,
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const related = await getRelatedNews(article.id, article.categoryRef?.slug ?? null, 3)

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        <ArticleBody
          article={{
            slug: article.slug,
            title: article.title as Record<string, string>,
            shortDesc: article.shortDesc as Record<string, string>,
            description: article.description as Record<string, string>,
            media: article.defaultMedia,
            mediaType: article.defaultMediaType,
            gallery: Array.isArray(article.media) ? (article.media as string[]) : [],
            publishedAt: (article.publishedAt ?? article.date)?.toISOString() ?? null,
            readMinutes: article.readMinutes,
            author: article.author ?? "",
            category: article.categoryRef
              ? {
                  slug: article.categoryRef.slug,
                  name: article.categoryRef.name as Record<string, string>,
                  color: article.categoryRef.color,
                }
              : null,
            tags: article.tags.map((t) => ({
              slug: t.tag.slug,
              name: t.tag.name as Record<string, string>,
            })),
          }}
        />

        <RelatedNews articles={related} />
      </div>

      <SiteFooter />
    </main>
  )
}

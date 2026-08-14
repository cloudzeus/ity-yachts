import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getArticleBySlug, getRelatedNews } from "@/lib/news"
import { JsonLd } from "@/components/json-ld"
import { articleLd, breadcrumbLd } from "@/lib/structured-data"
import { en, metaTitle, padDescription, pageMeta } from "@/lib/seo"
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

  return pageMeta({
    title: article.metaTitle || metaTitle(title),
    // A 90-character summary leaves half the snippet to Google's own guess.
    description: padDescription(
      article.metaDesc || short,
      "Written from our charter base in Lefkada, in the Ionian."
    ),
    path: `/news/${slug}`,
    image: article.defaultMediaType === "video" ? null : article.defaultMedia,
    type: "article",
    publishedTime: (article.publishedAt ?? article.date)?.toISOString(),
  })
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const related = await getRelatedNews(article.id, article.categoryRef?.slug ?? null, 3)

  return (
    <main>
      <JsonLd
        data={[
          articleLd({
            headline: en(article.title, "Article"),
            description: en(article.shortDesc),
            path: `/news/${slug}`,
            image: article.defaultMediaType === "video" ? null : article.defaultMedia,
            published: (article.publishedAt ?? article.date)?.toISOString() ?? null,
            modified: article.updatedAt.toISOString(),
            author: article.author || undefined,
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: en(article.title, "Article"), path: `/news/${slug}` },
          ]),
        ]}
      />
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

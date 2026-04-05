import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocaleText } from "@/components/locale-text"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, metaTitle: true, metaDesc: true, shortDesc: true, defaultMedia: true },
  })
  if (!article) return { title: "Article Not Found" }

  const title = (article.title as Record<string, string>)?.en || "Article"
  const shortDesc = (article.shortDesc as Record<string, string>)?.en || ""

  return {
    title: article.metaTitle || `${title} — IYC Yachts`,
    description: article.metaDesc || shortDesc || undefined,
    openGraph: {
      title: article.metaTitle || title,
      description: article.metaDesc || shortDesc || undefined,
      images: article.defaultMedia ? [article.defaultMedia] : undefined,
      type: "article",
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await db.article.findUnique({ where: { slug } })
  if (!article || article.status !== "published") notFound()

  const titleObj = article.title as Record<string, string>
  const categoryObj = article.category as Record<string, string>
  const shortDescObj = article.shortDesc as Record<string, string>
  const descriptionObj = article.description as Record<string, string>
  const titleEn = titleObj?.en || "Untitled"
  const media = article.media as string[]

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero */}
        {article.defaultMedia && (
          <section className="relative h-[50vh] min-h-[400px]">
            {article.defaultMediaType === "video" ? (
              <video
                src={article.defaultMedia}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={article.defaultMedia}
                alt={titleEn}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060c27] via-[#060c27]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-4xl mx-auto">
              {categoryObj?.en && (
                <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#83776d]/90 text-white mb-4">
                  <LocaleText translations={categoryObj} uppercase />
                </span>
              )}
              <h1
                className="text-3xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                <LocaleText translations={titleObj} fallback="Untitled" />
              </h1>
              <div className="flex items-center gap-4 mt-4 text-sm text-white/50">
                <time>
                  {new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </time>
                {article.author && <span><LocaleText tKey="news.by" fallback="By" /> {article.author}</span>}
              </div>
            </div>
          </section>
        )}

        {/* If no hero image, show text header */}
        {!article.defaultMedia && (
          <section className="pt-32 pb-8 px-6">
            <div className="max-w-4xl mx-auto">
              {categoryObj?.en && (
                <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#83776d]/90 text-white mb-4">
                  <LocaleText translations={categoryObj} uppercase />
                </span>
              )}
              <h1
                className="text-3xl md:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                <LocaleText translations={titleObj} fallback="Untitled" />
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <time>
                  {new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </time>
                {article.author && <span><LocaleText tKey="news.by" fallback="By" /> {article.author}</span>}
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm text-[#83776d] hover:text-[#83776d]/80 transition-colors mb-8"
            >
              <ArrowLeft className="size-4" />
              <LocaleText tKey="news.backToNews" fallback="Back to News" />
            </Link>

            {shortDescObj?.en && (
              <p className="text-xl leading-relaxed text-white/70 mb-10 border-l-2 border-[#83776d] pl-6">
                <LocaleText translations={shortDescObj} />
              </p>
            )}

            {descriptionObj?.en && (
              <LocaleText
                translations={descriptionObj}
                html
                className="prose prose-lg prose-invert max-w-none"
                style={{ color: "rgba(255,255,255,0.75)" }}
              />
            )}
          </div>
        </section>

        {/* Media Gallery */}
        {media.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map((url, i) => {
                const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i)
                return (
                  <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    {isVideo ? (
                      <video src={url} controls muted preload="metadata" className="w-full h-full object-cover" />
                    ) : (
                      <Image src={url} alt={`${titleEn} ${i + 1}`} fill className="object-cover !relative" sizes="(max-width: 768px) 50vw, 33vw" />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}

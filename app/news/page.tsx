import { db } from "@/lib/db"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocaleText } from "@/components/locale-text"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "News & Articles — IYC Yachts",
  description: "Latest news, sailing tips, and stories from Ionian Yacht Charter. Stay updated with our maritime world.",
  openGraph: {
    title: "News & Articles — IYC Yachts",
    description: "Latest news, sailing tips, and stories from Ionian Yacht Charter.",
  },
}

export default async function NewsListPage() {
  const articles = await db.article.findMany({
    where: { status: "published" },
    orderBy: { date: "desc" },
  })

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <span className="mb-4 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
              <LocaleText tKey="news.badge" fallback="Our Blog" uppercase />
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              <LocaleText tKey="news.title" fallback="News & Articles" />
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              <LocaleText tKey="news.subtitle" fallback="Sailing tips, destination guides, and stories from the Ionian Sea." />
            </p>
          </div>
        </section>

        {/* Articles grid */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            {articles.length === 0 ? (
              <p className="text-center text-white/40 py-20 text-lg"><LocaleText tKey="news.noArticles" fallback="No articles published yet. Check back soon." /></p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => {
                  const titleObj = article.title as Record<string, string>
                  const catObj = article.category as Record<string, string>
                  const shortObj = article.shortDesc as Record<string, string>
                  const titleEn = titleObj?.en || "Untitled"

                  return (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        {article.defaultMedia ? (
                          article.defaultMediaType === "video" ? (
                            <video
                              src={article.defaultMedia}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={article.defaultMedia}
                              alt={titleEn}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <span className="text-white/20 text-sm"><LocaleText tKey="news.noImage" fallback="No image" /></span>
                          </div>
                        )}
                        {catObj?.en && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#83776d]/90 text-white">
                            <LocaleText translations={catObj} uppercase />
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5">
                        <time className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
                          {new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </time>
                        <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#83776d] transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                          <LocaleText translations={titleObj} fallback="Untitled" />
                        </h2>
                        {shortObj?.en && (
                          <p className="text-sm text-white/50 line-clamp-3 flex-1">
                            <LocaleText translations={shortObj} />
                          </p>
                        )}
                        {article.author && (
                          <p className="text-[11px] text-white/30 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <LocaleText tKey="news.by" fallback="By" /> {article.author}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

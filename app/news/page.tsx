import { Metadata } from "next"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewsListClient } from "./news-list-client"
import { NewsHeroCopy } from "./news-hero-copy"
import { getNewsCategories, getNewsList } from "@/lib/news"
import { getMottoRaw } from "@/lib/mottos"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "News & Articles — IYC Yachts",
  description:
    "Sailing the Ionian out of Lefkada — winds, anchorages, boats and what a week aboard is actually like.",
}

const HERO =
  "https://iycweb.b-cdn.net/general/1786528737070-sailor-steering-wheel-on-sailboat-in-ocean-navigat-2026-03-25-03-56-36-utc.webp"

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>
}) {
  const { category, tag } = await searchParams

  const [articles, categories, motto] = await Promise.all([
    getNewsList({ category, tag }),
    getNewsCategories(),
    getMottoRaw("news-from-the-logbook"),
  ])

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Photographic hero under a single vertical gradient that ends in the
            page colour — the kit rules out the flat navy panel this replaces. */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: 520 }}>
          <Image src={HERO} alt="" fill priority className="object-cover" sizes="100vw" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,13,25,.60) 0%, rgba(4,13,25,.32) 42%, rgba(4,13,25,.52) 72%, var(--surface-page) 100%)",
            }}
          />
          <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 pb-36 pt-36 text-center md:pb-44 md:pt-44">
            <NewsHeroCopy motto={motto} />
          </div>
        </section>

        {/* No background and no negative margin here: a negative top margin on
            the first child collapses into the section, so an opaque fill would
            ride up and cut the hero gradient off mid-fade. */}
        <section className="relative w-full">
          <div className="mx-auto max-w-[1400px] px-6 pb-32 pt-4 md:px-10 md:pb-40">
            <NewsListClient
              articles={articles}
              categories={categories}
              activeCategory={category ?? null}
              activeTag={tag ?? null}
            />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

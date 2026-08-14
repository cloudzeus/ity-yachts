import type { Metadata } from "next"
import { metaStrings } from "@/lib/meta.server"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { StoryPage } from "./story-page"
import { pageMeta } from "@/lib/seo"

export const dynamic = "force-dynamic"

/**
 * "Our story".
 *
 * A static route rather than a page-builder page: the builder's blocks hold one
 * string each, and this story exists in three languages. The copy lives in the
 * page's text_components — editable and translatable — while which photograph
 * carries which chapter stays here, because that is layout, not content.
 */
const SLUG = "about-us"

async function loadStory() {
  const page = await db.page.findUnique({
    where: { slug: SLUG },
    select: {
      status: true,
      metaTitle: true,
      metaDesc: true,
      textComponents: { select: { key: true, translations: true } },
    },
  })
  if (!page || page.status !== "published") return null

  const copy: Record<string, Record<string, string>> = {}
  for (const c of page.textComponents) {
    copy[c.key] = (c.translations ?? {}) as Record<string, string>
  }
  return { page, copy }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadStory()
  if (!data) return {}
  const { m } = await metaStrings()
  return pageMeta({
    title: data.page.metaTitle || m("meta.about.title", "Our Story — Yacht Charter in Lefkada since 1979"),
    description:
      data.page.metaDesc ||
      m(
        "meta.about.description",
        "Two countries, one family, and the Ionian since 1979. How Ionische Yacht Charter came to be, told from our base in Lefkada."
      ),
    path: "/about-us",
  })
}

export default async function AboutUsPage() {
  const data = await loadStory()
  if (!data) notFound()

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <StoryPage copy={data.copy} />
      </div>

      <SiteFooter />
    </main>
  )
}

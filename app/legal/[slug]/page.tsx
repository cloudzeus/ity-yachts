import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { metaDescription, pageMeta, stripHtml } from "@/lib/seo"
import { LegalDocument } from "./legal-document"

export const dynamic = "force-dynamic"

export interface LegalPage {
  id: string
  slug: string
  title: Record<string, string>
  content: Record<string, string>
}

/**
 * The legal pages.
 *
 * They were written and translated in the admin and then had nowhere to go —
 * there was no public route, so the privacy policy the site is legally
 * required to show was not reachable from anywhere.
 */
export async function getLegalPages(): Promise<LegalPage[]> {
  const row = await db.setting.findUnique({ where: { key: "legal" } })
  const pages = ((row?.value as { pages?: LegalPage[] } | null)?.pages ?? []) as LegalPage[]
  // A page with no content in any language is a draft, not a page.
  return pages.filter((p) => p.slug && Object.values(p.content ?? {}).some((v) => v?.trim()))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = (await getLegalPages()).find((p) => p.slug === slug)
  if (!page) return { title: "Not found" }

  const title = page.title?.en || page.slug
  return pageMeta({
    title,
    description: metaDescription(
      stripHtml(page.content?.en) ||
        `${title} for IYC Ionische Yacht Charter — how we handle your data, and the terms our charters are run under.`
    ),
    path: `/legal/${slug}`,
  })
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pages = await getLegalPages()
  const page = pages.find((p) => p.slug === slug)
  if (!page) notFound()

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <LegalDocument
          page={page}
          others={pages.filter((p) => p.slug !== slug).map((p) => ({ slug: p.slug, title: p.title }))}
        />
      </div>
      <SiteFooter />
    </main>
  )
}

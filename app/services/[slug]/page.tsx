import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ServiceDetail } from "./service-detail"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbLd, serviceLd, webPageLd } from "@/lib/structured-data"
import { en, metaTitle, padDescription, pageMeta } from "@/lib/seo"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

const CARD = {
  id: true, slug: true, title: true, label: true, icon: true,
  shortDesc: true, defaultMedia: true, defaultMediaType: true,
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await db.service.findUnique({
    where: { slug },
    select: { title: true, shortDesc: true, defaultMedia: true, defaultMediaType: true },
  })
  if (!service) return {}

  const t = service.title as Record<string, string>
  const d = plain((service.shortDesc as Record<string, string>)?.en ?? "")

  return pageMeta({
    title: metaTitle(`${t.en ?? "Service"} — Charter Services, Lefkada`),
    description: padDescription(
      d || `${t.en ?? "Service"} for your charter from Lefkada.`,
      "Arranged before you arrive, by the family who have run this base since 1979."
    ),
    path: `/services/${slug}`,
    image: service.defaultMediaType === "video" ? null : service.defaultMedia,
  })
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params

  const [service, published] = await Promise.all([
    db.service.findUnique({ where: { slug } }),
    /* The whole published set, in order: a service page should say where it
       sits among the others, and offer the one on either side of it. */
    db.service.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
      select: CARD,
    }),
  ])

  if (!service || service.status !== "published") notFound()

  const index = published.findIndex((s) => s.slug === slug)
  const card = (s: (typeof published)[number] | undefined) =>
    s
      ? {
          id: s.id,
          slug: s.slug,
          title: s.title as Record<string, string>,
          label: s.label as Record<string, string>,
          shortDesc: s.shortDesc as Record<string, string>,
          media: s.defaultMedia,
          mediaType: s.defaultMediaType,
          icon: s.icon,
        }
      : null

  return (
    <main>
      <JsonLd
        data={[
          serviceLd({
            name: en(service.title, "Service"),
            description: en(service.shortDesc),
            path: `/services/${slug}`,
            image: service.defaultMediaType === "video" ? null : service.defaultMedia,
          }),
          webPageLd({
            name: en(service.title, "Service"),
            description: en(service.shortDesc),
            path: `/services/${slug}`,
            modified: service.updatedAt.toISOString(),
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: en(service.title, "Service"), path: `/services/${slug}` },
          ]),
        ]}
      />
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        <ServiceDetail
          service={{
            slug: service.slug,
            title: service.title as Record<string, string>,
            label: service.label as Record<string, string>,
            header: service.header as Record<string, string>,
            shortDesc: service.shortDesc as Record<string, string>,
            description: service.description as Record<string, string>,
            media: service.defaultMedia,
            mediaType: service.defaultMediaType,
            icon: service.icon,
            certification: (service.certification ?? null) as {
              logo?: string
              name?: Record<string, string>
              body?: Record<string, string>
            } | null,
          }}
          position={{ index: index + 1, total: published.length }}
          prev={card(index > 0 ? published[index - 1] : undefined)}
          next={card(index >= 0 && index < published.length - 1 ? published[index + 1] : undefined)}
          others={published.filter((s) => s.slug !== slug).slice(0, 3).map((s) => card(s)!)}
        />
      </div>

      <SiteFooter />
    </main>
  )
}

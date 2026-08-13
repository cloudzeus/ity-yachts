import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ServiceDetail } from "./service-detail"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await db.service.findUnique({
    where: { slug },
    select: { title: true, shortDesc: true, defaultMedia: true, defaultMediaType: true },
  })
  if (!service) return {}

  const t = service.title as Record<string, string>
  const d = plain((service.shortDesc as Record<string, string>)?.en ?? "")

  return {
    title: `${t.en ?? "Service"} — IYC Yachts`,
    description: d || undefined,
    openGraph: {
      title: t.en ?? "Service",
      description: d || undefined,
      images:
        service.defaultMedia && service.defaultMediaType !== "video"
          ? [{ url: service.defaultMedia }]
          : undefined,
    },
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params

  const [service, others] = await Promise.all([
    db.service.findUnique({ where: { slug } }),
    db.service.findMany({
      where: { status: "published", NOT: { slug } },
      orderBy: { sortOrder: "asc" },
      take: 3,
      select: {
        id: true, slug: true, title: true, label: true, icon: true,
        shortDesc: true, defaultMedia: true, defaultMediaType: true,
      },
    }),
  ])

  if (!service || service.status !== "published") notFound()

  return (
    <main>
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
          }}
          others={others.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title as Record<string, string>,
            label: s.label as Record<string, string>,
            shortDesc: s.shortDesc as Record<string, string>,
            media: s.defaultMedia,
            mediaType: s.defaultMediaType,
            icon: s.icon,
          }))}
        />
      </div>

      <SiteFooter />
    </main>
  )
}

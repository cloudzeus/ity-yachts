import { db } from "@/lib/db"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ServicesClient } from "./services-client"
import { pageMeta } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
  title: "Charter Services in Lefkada",
  description:
    "Everything around the boat: a skipper or hostess, provisioning, tailored routes, transfers and the paperwork. What we arrange before you reach Lefkada.",
  path: "/services",
  })
}

export default async function ServicesPage() {
  const [services, svcsComponent] = await Promise.all([
    db.service.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, slug: true, title: true, label: true, shortDesc: true,
        defaultMedia: true, defaultMediaType: true, icon: true, link: true,
      },
    }),
    /* The hero and closing copy are a page component, so they stay editable in
       the page builder rather than being frozen into this route. */
    db.pageComponent.findFirst({
      where: { page: { slug: "services" }, type: "services-content", status: "active" },
      select: { props: true },
    }),
  ])

  const props = svcsComponent?.props as Record<string, unknown> | null
  const hero = (props?.hero ?? null) as {
    badge?: Record<string, string>
    title?: Record<string, string>
    titleAccent?: Record<string, string>
    subtitle?: Record<string, string>
  } | null
  const cta = (props?.cta ?? null) as {
    title?: Record<string, string>
    description?: Record<string, string>
    primaryBtn?: Record<string, string>
    primaryLink?: string
    secondaryBtn?: Record<string, string>
    secondaryLink?: string
  } | null

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <ServicesClient
          services={services.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title as Record<string, string>,
            label: s.label as Record<string, string>,
            shortDesc: s.shortDesc as Record<string, string>,
            media: s.defaultMedia,
            mediaType: s.defaultMediaType,
            icon: s.icon,
            link: s.link,
          }))}
          hero={hero}
          cta={cta}
        />
      </div>

      <SiteFooter />
    </main>
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageRenderer } from "@/components/page-renderer"
import { PageComponentRenderer, getPageComponents } from "@/components/page-components"
import { LocaleText } from "@/components/locale-text"
import { PageSection } from "@/types/page"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await db.page.findUnique({
    where: { slug },
    select: { name: true, metaTitle: true, metaDesc: true, metaOgTitle: true, metaOgDesc: true, metaOgImage: true, metaRobots: true, metaCanonical: true },
  })

  if (!page) return {}

  return {
    title: page.metaTitle || `${page.name} | IYC Yachts`,
    description: page.metaDesc || undefined,
    openGraph: {
      title: page.metaOgTitle || page.metaTitle || page.name,
      description: page.metaOgDesc || page.metaDesc || undefined,
      images: page.metaOgImage ? [page.metaOgImage] : undefined,
    },
    robots: page.metaRobots || "index, follow",
    alternates: page.metaCanonical ? { canonical: page.metaCanonical } : undefined,
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params

  const page = await db.page.findUnique({
    where: { slug },
    include: {
      textComponents: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!page || page.status !== "published") {
    notFound()
  }

  const heroSection = page.heroSection as {
    heading?: Record<string, string>
    subheading?: Record<string, string>
    overSubheading?: Record<string, string>
    image?: string
    video?: string
  } | null

  const sections = (Array.isArray(page.content) ? page.content : []) as unknown as PageSection[]
  const pageComponents = await getPageComponents(page.id)

  const hasHero = heroSection && (heroSection.heading?.en || heroSection.image || heroSection.video)

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{
          background: "#060c27",
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <SiteHeader />

        {/* Hero Section */}
        {hasHero && (
          <section className="relative flex min-h-[500px] items-center pt-24" style={{ height: "70vh" }}>
            <div className="absolute inset-0">
              {heroSection.video ? (
                <video
                  src={heroSection.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : heroSection.image ? (
                <Image
                  src={heroSection.image}
                  alt={heroSection.heading?.en || page.name}
                  fill
                  className="object-cover object-center"
                  priority
                />
              ) : null}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, rgba(7,12,38,0.95) 0%, rgba(7,12,38,0.6) 50%, rgba(7,12,38,0) 100%)",
                  mixBlendMode: "multiply",
                }}
              />
            </div>
            <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
              <div className="max-w-3xl">
                {heroSection.overSubheading?.en && (
                  <span className="mb-6 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
                    <LocaleText translations={heroSection.overSubheading} uppercase />
                  </span>
                )}
                {heroSection.heading?.en && (
                  <h1
                    className="mb-6 text-5xl font-light leading-[1.1] text-white md:text-6xl lg:text-7xl"
                    style={{ textWrap: "balance" as never }}
                  >
                    <LocaleText translations={heroSection.heading} />
                  </h1>
                )}
                {heroSection.subheading?.en && (
                  <p className="max-w-2xl border-l-2 border-[#83776d] pl-6 text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                    <LocaleText translations={heroSection.subheading} />
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* If no hero, add spacing for the fixed header */}
        {!hasHero && <div className="pt-28" />}

        {/* Page Builder Sections */}
        {sections.length > 0 && (
          <div className="py-16">
            <PageRenderer sections={sections} />
          </div>
        )}

        {/* Dynamic Page Components */}
        {pageComponents.length > 0 && (
          <div className="py-16">
            <div className="mx-auto max-w-7xl px-6">
              <PageComponentRenderer components={pageComponents} />
            </div>
          </div>
        )}

        {/* If page has no content at all, show the page name */}
        {!hasHero && sections.length === 0 && pageComponents.length === 0 && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <h1 className="text-4xl font-light text-white">{page.name}</h1>
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}

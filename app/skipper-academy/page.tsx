import { Metadata } from "next"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SkipperAcademyClient } from "@/components/skipper-academy/skipper-academy-client"
import { COMPONENT_REGISTRY } from "@/lib/page-components"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "IYC Skipper Academy — Master the Art of Sailing",
  description:
    "Learn practical seamanship and gain confidence with experienced instructors in the idyllic Ionian Sea. Comprehensive skipper training combining maritime theory with real-world sailing experience.",
  openGraph: {
    title: "IYC Skipper Academy — Skipper Training in Greece",
    description:
      "Hands-on skipper training in Greece's stunning Ionian Islands. Expert instruction, certified knowledge, and real sailing experience.",
  },
}

export default async function SkipperAcademyPage() {
  const [page, component] = await Promise.all([
    db.page.findFirst({
      where: { slug: "skipper-academy" },
      select: { heroSection: true, id: true },
    }),
    db.pageComponent.findFirst({
      where: {
        page: { slug: "skipper-academy" },
        type: "skipper-academy",
        status: "active",
      },
      select: { props: true },
    }),
  ])

  const heroJson = page?.heroSection as {
    mediaUrl?: string
    mediaType?: "image" | "video"
    ctaMediaUrl?: string
    ctaMediaType?: "image" | "video"
  } | null

  const images = {
    heroImage: heroJson?.mediaUrl || null,
    heroMediaType: (heroJson?.mediaType || "image") as "image" | "video",
    ctaImage: heroJson?.ctaMediaUrl || null,
    ctaMediaType: (heroJson?.ctaMediaType || "image") as "image" | "video",
  }

  // Use admin-configured content or fall back to registry defaults
  const defaultProps = COMPONENT_REGISTRY["skipper-academy"]?.defaultProps ?? {}
  const content = (component?.props as Record<string, unknown>) ?? defaultProps

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
        <SkipperAcademyClient images={images} content={content} />
      </div>
      <SiteFooter />
    </main>
  )
}

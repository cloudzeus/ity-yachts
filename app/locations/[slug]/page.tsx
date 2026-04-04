import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocationDetailClient } from "@/components/locations/location-detail-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const location = await db.location.findUnique({
    where: { slug },
    select: { name: true, nameTranslations: true, metaTitle: true, metaDesc: true, shortDesc: true, defaultMedia: true },
  })
  if (!location) return { title: "Location Not Found" }

  const names = location.nameTranslations as Record<string, string>
  const name = names?.en || location.name
  const shortDesc = (location.shortDesc as Record<string, string>)?.en || ""

  return {
    title: location.metaTitle || `${name} — Destinations — IYC Yachts`,
    description: location.metaDesc || shortDesc || undefined,
    openGraph: {
      title: location.metaTitle || name,
      description: location.metaDesc || shortDesc || undefined,
      images: location.defaultMedia ? [location.defaultMedia] : undefined,
    },
  }
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const location = await db.location.findUnique({ where: { slug } })
  if (!location || location.status !== "published") notFound()

  const names = location.nameTranslations as Record<string, string>
  const name = names?.en || location.name
  const shortDesc = (location.shortDesc as Record<string, string>)?.en || ""
  const desc = (location.description as Record<string, string>)?.en || ""
  const pref = (location.prefecture as Record<string, string>)?.en || ""
  const city = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(location.city) ? "" : location.city
  const imgs = location.images as string[]

  const data = {
    name,
    slug: location.slug,
    shortDesc,
    description: desc,
    prefecture: pref,
    city,
    latitude: location.latitude,
    longitude: location.longitude,
    defaultMedia: location.defaultMedia,
    defaultMediaType: location.defaultMediaType,
    images: imgs,
  }

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <LocationDetailClient location={data} />
      </div>
      <SiteFooter />
    </main>
  )
}

import { db } from "@/lib/db"
import { en, metaDescription, metaTitle, pageMeta } from "@/lib/seo"
import { localized, metaStrings } from "@/lib/meta.server"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbLd, destinationLd, videoLd, webPageLd } from "@/lib/structured-data"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocationDetailClient } from "@/components/locations/location-detail-client"
import { getGoogleMapsKey } from "@/lib/maps-key"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const location = await db.location.findUnique({
    where: { slug },
    select: {
      name: true, nameTranslations: true, metaTitle: true, metaDesc: true,
      shortDesc: true, defaultMedia: true, prefecture: true,
    },
  })
  if (!location) return { title: "Location not found" }

  const { locale, m } = await metaStrings()
  const name = localized(location.nameTranslations, locale, location.name)
  const region = localized(location.prefecture, locale, "Ionian Islands")

  const description = metaDescription(
    (locale === "en" && location.metaDesc) ||
      `${localized(location.shortDesc, locale)} ${name}, ${region}. ${m("meta.location.descTail", "What to expect, where to anchor, and how far it is from our base in Lefkada.")}`.trim()
  )

  return pageMeta({
    // The place name alone competes with the whole travel industry; naming the
    // sea and the activity is what this business can actually win.
    title: (locale === "en" && location.metaTitle) || metaTitle(`${name} ${m("meta.location.suffix", "— Sailing the Ionian")}`),
    description,
    path: `/locations/${slug}`,
    image: location.defaultMedia,
  })
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mapsKey = await getGoogleMapsKey()
  const location = await db.location.findUnique({ where: { slug } })
  if (!location || location.status !== "published") notFound()

  const names = location.nameTranslations as Record<string, string>
  const city = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(location.city) ? "" : location.city
  const imgs = location.images as string[]

  const data = {
    name: names?.en || location.name,
    nameTranslations: location.nameTranslations as Record<string, string> | null,
    slug: location.slug,
    shortDesc: location.shortDesc as Record<string, string> | null,
    description: location.description as Record<string, string> | null,
    prefecture: location.prefecture as Record<string, string> | null,
    city,
    latitude: location.latitude,
    longitude: location.longitude,
    defaultMedia: location.defaultMedia,
    defaultMediaType: location.defaultMediaType,
    images: imgs,
  }

  return (
    <main>
      {/* TouristDestination with real coordinates: this is what an answer
          engine reads when asked where a place is and what is there. */}
      <JsonLd
        data={[
          destinationLd({
            name: en(location.nameTranslations, location.name),
            description: en(location.shortDesc),
            path: `/locations/${slug}`,
            image: location.defaultMedia,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
          /* Only when the hero really is a video, and only with the fields
             Google requires — partial markup is ineligible either way. */
          ...(location.defaultMediaType === "video" && location.defaultMedia
            ? [videoLd({
                name: `${en(location.nameTranslations, location.name)} from the air`,
                description: en(location.shortDesc),
                contentUrl: location.defaultMedia,
                thumbnailUrl: (Array.isArray(location.images) ? (location.images as string[])[0] : null) ?? null,
                uploadDate: location.updatedAt.toISOString(),
                pageUrl: `/locations/${slug}`,
              })]
            : []),
          webPageLd({
            name: en(location.nameTranslations, location.name),
            description: en(location.shortDesc),
            path: `/locations/${slug}`,
            modified: location.updatedAt.toISOString(),
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Destinations", path: "/locations" },
            { name: en(location.nameTranslations, location.name), path: `/locations/${slug}` },
          ]),
        ]}
      />
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <LocationDetailClient location={data} mapsKey={mapsKey} />
      </div>
      <SiteFooter />
    </main>
  )
}

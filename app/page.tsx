import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomepageClient } from "@/components/home/homepage-client"

export const dynamic = "force-dynamic"

export default async function Home() {
  // Fetch all homepage data in parallel
  const [homePage, locations, itineraries, yachts, reviews] = await Promise.all([
    db.page.findFirst({
      where: { isHomePage: true },
      select: { heroSection: true },
    }),
    db.location.findMany({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.itinerary.findMany({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.nausysYacht.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        model: true,
        base: { include: { location: true } },
      },
    }),
    db.review.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
  ])

  // Extract hero data from admin-configured page
  const heroJson = homePage?.heroSection as {
    overSubheading?: Record<string, string>
    heading?: Record<string, string>
    subheading?: Record<string, string>
  } | null

  const heroData = {
    overSubheading: heroJson?.overSubheading || { en: "Luxury Yacht Charters" },
    heading: heroJson?.heading || { en: "IONISCHE YACHT CHARTER" },
    subheading: heroJson?.subheading || { en: "Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers." },
  }

  // Transform data for client components — pass full translation objects
  const destinationData = locations.map((loc) => ({
    id: loc.id,
    name: (loc.nameTranslations as Record<string, string>)?.en || loc.name,
    nameT: loc.nameTranslations as Record<string, string> | null,
    slug: loc.slug,
    image: loc.defaultMedia || "",
    mediaType: loc.defaultMediaType || "image",
    shortDesc: loc.shortDesc as Record<string, string> | null,
    latitude: loc.latitude,
    longitude: loc.longitude,
    prefecture: loc.prefecture as Record<string, string> | null,
  }))

  const itineraryData = itineraries.map((it) => ({
    id: it.id,
    name: (it.name as Record<string, string>)?.en || "Untitled",
    nameT: it.name as Record<string, string> | null,
    slug: it.slug,
    image: it.defaultMedia || "",
    shortDesc: it.shortDesc as Record<string, string> | null,
    totalDays: it.totalDays,
    totalMiles: it.totalMiles,
    startFrom: it.startFrom,
  }))

  const yachtData = yachts.map((y) => {
    const catT = y.category?.name as Record<string, string> | undefined
    const websiteImgs = y.websiteImages as Array<{ url: string }> | null
    const picturesArr = y.picturesUrl as string[] | null
    const image = websiteImgs?.[0]?.url || y.mainPictureUrl || picturesArr?.[0] || ""
    const locT = y.base?.location?.name as Record<string, string> | undefined
    return {
      id: y.id,
      name: y.name || y.model?.name || "Yacht",
      slug: String(y.id),
      image,
      category: catT?.en || "Yacht",
      categoryT: catT || null,
      loa: y.loa || 0,
      cabins: y.cabins || 0,
      berths: y.berthsTotal || y.maxPersons || 0,
      baseName: locT?.en || (y.base?.id ? String(y.base.id) : ""),
      baseNameT: locT || null,
      priceFrom: 0,
      year: y.buildYear || undefined,
      rating: 4.8,
    }
  })

  const reviewData = reviews.map((r) => ({
    id: r.id,
    name: r.name,
    content: (r.content as Record<string, string>)?.en || "",
    contentT: r.content as Record<string, string> | null,
    rating: r.rating,
    image: r.image,
    date: r.date.toISOString(),
  }))

  return (
    <main>
      {/* Page content — clip-path lets the fixed footer reveal beneath */}
      <div
        className="relative z-10 min-h-screen"
        style={{
          background: "#060c27",
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <SiteHeader />
        <HomepageClient
          hero={heroData}
          destinations={destinationData}
          itineraries={itineraryData}
          yachts={yachtData}
          fleetYachts={yachtData}
          reviews={reviewData}
        />
      </div>

      {/* Sticky reveal footer */}
      <SiteFooter />
    </main>
  )
}

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
    overSubheading: heroJson?.overSubheading?.en || "Luxury Yacht Charters",
    heading: heroJson?.heading?.en || "IONISCHE YACHT CHARTER",
    subheading: heroJson?.subheading?.en || "Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers.",
  }

  // Transform data for client components
  const destinationData = locations.map((loc) => {
    const nameT = loc.nameTranslations as Record<string, string>
    const descT = loc.shortDesc as Record<string, string>
    const prefT = loc.prefecture as Record<string, string>
    return {
      id: loc.id,
      name: nameT?.en || loc.name,
      slug: loc.slug,
      image: loc.defaultMedia || "",
      mediaType: loc.defaultMediaType || "image",
      shortDesc: descT?.en || "",
      latitude: loc.latitude,
      longitude: loc.longitude,
      prefecture: prefT?.en || "",
    }
  })

  const itineraryData = itineraries.map((it) => {
    const nameT = it.name as Record<string, string>
    const descT = it.shortDesc as Record<string, string>
    return {
      id: it.id,
      name: nameT?.en || "Untitled",
      slug: it.slug,
      image: it.defaultMedia || "",
      shortDesc: descT?.en || "",
      totalDays: it.totalDays,
      totalMiles: it.totalMiles,
      startFrom: it.startFrom,
    }
  })

  const yachtData = yachts.map((y) => {
    const categoryName = y.category
      ? (y.category.name as Record<string, string>)?.en || "Yacht"
      : "Yacht"
    // Use website images first, fall back to NAUSYS main picture, then pictures array
    const websiteImgs = y.websiteImages as Array<{ url: string }> | null
    const picturesArr = y.picturesUrl as string[] | null
    const image = websiteImgs?.[0]?.url || y.mainPictureUrl || picturesArr?.[0] || ""
    const locationName = y.base?.location
      ? (y.base.location.name as Record<string, string>)?.en || ""
      : ""
    return {
      id: y.id,
      name: y.name || y.model?.name || "Yacht",
      slug: String(y.id),
      image,
      category: categoryName,
      loa: y.loa || 0,
      cabins: y.cabins || 0,
      berths: y.berthsTotal || y.maxPersons || 0,
      baseName: locationName || (y.base?.id ? String(y.base.id) : ""),
      priceFrom: 0,
      year: y.buildYear || undefined,
      rating: 4.8,
    }
  })

  const reviewData = reviews.map((r) => {
    const contentT = r.content as Record<string, string>
    return {
      id: r.id,
      name: r.name,
      content: contentT?.en || "",
      rating: r.rating,
      image: r.image,
      date: r.date.toISOString(),
    }
  })

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

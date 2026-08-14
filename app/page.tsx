import type { Metadata } from "next"
import { db } from "@/lib/db"
import { yachtThumb } from "@/lib/yacht-images"
import { JsonLd } from "@/components/json-ld"
import { faqLd } from "@/lib/structured-data"
import { en, pageMeta } from "@/lib/seo"
import { metaStrings } from "@/lib/meta.server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomepageClient } from "@/components/home/homepage-client"
import { getMottoRaw } from "@/lib/mottos"
import { getFleetRanges } from "@/lib/fleet-ranges.server"
import { getLatestNews } from "@/lib/news"
import { getHomepageFaqs } from "@/lib/faqs"

export const dynamic = "force-dynamic"

/**
 * The homepage had no metadata of its own, so it inherited the layout default
 * and told search engines this was a "Maritime enterprise management platform".
 */
export async function generateMetadata(): Promise<Metadata> {
  const { m } = await metaStrings()
  const meta = await pageMeta({
    title: m("meta.home.title", "Yacht Charter Lefkada — IYC Ionische Yacht Charter"),
    description: m(
      "meta.home.description",
      "Family-run yacht charter from Lefkada since 1979. Sailing yachts and catamarans in the Ionian, bareboat or with a skipper — Greek warmth, German order."
    ),
    path: "/",
  })
  /* Absolute, or the layout template appends the brand a second time. The
     canonical and og:url come from pageMeta, so they follow the real domain
     instead of a build-time guess. */
  return { ...meta, title: { absolute: m("meta.home.title", "Yacht Charter Lefkada — IYC Ionische Yacht Charter") } }
}

export default async function Home() {
  // Fetch all homepage data in parallel
  const [homePage, locations, itineraries, yachts, reviews, staff, motto, fleetRanges, latestNews, faqs] = await Promise.all([
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
    /* The whole fleet, not a slice of ten. The carousel counts what it is
       given, so a cap here made it announce "1 / 10" for a fleet of
       eighteen — and eight boats were unreachable from the homepage. */
    db.nausysYacht.findMany({
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
    db.staff.findMany({
      where: { status: "active" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, position: true, city: true, bio: true, image: true },
    }),
    getMottoRaw("hero-greek-soul-german-precision"),
    getFleetRanges(),
    getLatestNews(3),
    getHomepageFaqs(),
  ])

  // Extract hero data from admin-configured page
  const heroJson = homePage?.heroSection as {
    overSubheading?: Record<string, string>
    heading?: Record<string, string>
    subheading?: Record<string, string>
  } | null

  /* The stored hero is `{ en: "", el: "", de: "" }` — an object, so `||` never
     reached the fallback and the homepage rendered no headline at all. Treat an
     all-empty set as absent, and fall back to the saved motto so the flagship
     line lives in one editable place rather than hardcoded here. */
  const filled = (v?: Record<string, string> | null) =>
    v && Object.values(v).some((x) => x?.trim()) ? v : null

  const mottoHeading = filled(motto?.heading as Record<string, string> | undefined)
  const mottoSub = filled(motto?.subheading as Record<string, string> | undefined)

  const heroData = {
    overSubheading:
      filled(heroJson?.overSubheading) ?? { en: "Sailing Greece since 1979", el: "Στην Ελλάδα από το 1979", de: "In Griechenland seit 1979" },
    heading:
      filled(heroJson?.heading) ?? mottoHeading ?? { en: "IONISCHE YACHT CHARTER" },
    subheading:
      filled(heroJson?.subheading) ?? mottoSub ?? { en: "Bespoke yacht charters and luxury maritime experiences crafted for the most discerning travellers." },
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
    const image = yachtThumb(y)
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
    }
  })

  const staffData = staff.map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position as Record<string, string> | null,
    city: s.city as Record<string, string> | null,
    bio: s.bio as Record<string, string> | null,
    image: s.image,
  }))

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
      {/* Describes the section rendered further down the page. Structured data
          for content a reader cannot see is against Google's guidelines — and
          an answer engine will not cite what is missing from the body either. */}
      {faqs.length > 0 && (
        <JsonLd data={faqLd(faqs.map((f) => ({ question: en(f.question), answer: en(f.answer) })))} />
      )}

      {/* Page content — clip-path lets the fixed footer reveal beneath */}
      <div
        className="relative z-10 min-h-screen"
        style={{
          background: "var(--surface-page)",
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
          staff={staffData}
          fleetRanges={fleetRanges}
          news={latestNews}
          faqs={faqs}
        />
      </div>

      {/* Sticky reveal footer */}
      <SiteFooter />
    </main>
  )
}

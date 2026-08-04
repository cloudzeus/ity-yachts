import { db } from "@/lib/db"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocationsGrid } from "@/components/locations/locations-grid"
import { LocaleText } from "@/components/locale-text"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Destinations — IYC Yachts",
  description:
    "Explore our charter destinations across the Ionian Sea. Discover the perfect sailing location for your next yacht charter adventure.",
  openGraph: {
    title: "Destinations — IYC Yachts",
    description: "Explore our charter destinations across the Ionian Sea.",
  },
}

export default async function LocationsListPage() {
  const [locations, locComponent] = await Promise.all([
    db.location.findMany({ where: { status: "published" }, orderBy: { updatedAt: "desc" } }),
    db.pageComponent.findFirst({
      where: { page: { slug: "locations" }, type: "locations-content", status: "active" },
      select: { props: true },
    }),
  ])

  const locHero = ((locComponent?.props as Record<string, unknown> | null)?.hero ?? null) as {
    badge?: Record<string, string>; title?: Record<string, string>; subtitle?: Record<string, string>
  } | null

  const mapped = locations.map((loc) => {
    const names = loc.nameTranslations as Record<string, string>
    return {
      id: loc.id,
      name: names?.en || loc.name,
      nameTranslations: loc.nameTranslations as Record<string, string> | null,
      slug: loc.slug,
      image: loc.defaultMedia,
      imageType: loc.defaultMediaType,
      shortDesc: loc.shortDesc as Record<string, string> | null,
      prefecture: loc.prefecture as Record<string, string> | null,
      city: /[\u0370-\u03FF\u1F00-\u1FFF]/.test(loc.city) ? "" : loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }
  })

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="mb-4 inline-block rounded-full border border-[#0077B6]/30 bg-[#0077B6]/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0077B6] backdrop-blur-sm">
                  {locHero?.badge
                    ? <LocaleText translations={locHero.badge} fallback="Charter Destinations" uppercase />
                    : <LocaleText tKey="locations.badge" fallback="Charter Destinations" uppercase />}
                </span>
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: "#fff" }}
                >
                  {locHero?.title
                    ? <LocaleText translations={locHero.title} fallback="Discover the Ionian Sea" />
                    : <LocaleText tKey="locations.title" fallback="Discover the Ionian Sea" />}
                </h1>
              </div>
              <p className="text-base text-white/50 max-w-md md:text-right leading-relaxed md:pb-1">
                {locHero?.subtitle
                  ? <LocaleText translations={locHero.subtitle} fallback="Explore Lefkada and the Ionian islands — from secluded turquoise bays to vibrant seaside harbours." />
                  : <LocaleText tKey="locations.subtitle" fallback="Explore Lefkada and the Ionian islands — from secluded turquoise bays to vibrant seaside harbours." />}
              </p>
            </div>

            {/* Decorative divider */}
            <div className="mt-10 mb-2 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#0077B6]/30 to-transparent" />
              <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">
                {mapped.length} destination{mapped.length !== 1 ? "s" : ""}
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-[#0077B6]/30 to-transparent" />
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="pb-28 px-6">
          <div className="max-w-7xl mx-auto">
            <LocationsGrid locations={mapped} />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

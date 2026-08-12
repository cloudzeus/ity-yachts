import { db } from "@/lib/db"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocationsGrid } from "@/components/locations/locations-grid"
import Image from "next/image"
import { MapPin } from "lucide-react"
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

  // The first destination doubles as the page's hero image.
  const featured = mapped[0] ?? null
  // …and is therefore dropped from the grid below, so it isn't shown twice.
  const rest = featured ? mapped.slice(1) : mapped

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero — the top destination carries the page header */}
        <section
          className="relative flex min-h-[68vh] items-end overflow-hidden px-6 pt-40 pb-12"
          style={{ background: "var(--surface-inverse)" }}
        >
          {featured?.image &&
            (featured.imageType === "video" || /\.(mp4|webm|mov)$/i.test(featured.image) ? (
              <video
                src={featured.image}
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={featured.image}
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="100vw"
                className="object-cover"
                data-parallax="0.32"
              />
            ))}
          {/* Deep-sea scrim so the header type stays legible on any photograph */}
          <div className="absolute inset-0" style={{ background: "var(--scrim-hero)" }} />

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="mb-4 inline-block rounded-full border border-white/35 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  {locHero?.badge
                    ? <LocaleText translations={locHero.badge} fallback="Charter Destinations" uppercase />
                    : <LocaleText tKey="locations.badge" fallback="Charter Destinations" uppercase />}
                </span>
                
                  {locHero?.title
                    ? <LocaleText translations={locHero.title} fallback="Discover the Ionian Sea" />
                    : <LocaleText tKey="locations.title" fallback="Discover the Ionian Sea" />}
                
              </div>
              <p className="text-base text-white/50 max-w-md md:text-right leading-relaxed md:pb-1">
                {locHero?.subtitle
                  ? <LocaleText translations={locHero.subtitle} fallback="Explore Lefkada and the Ionian islands — from secluded turquoise bays to vibrant seaside harbours." />
                  : <LocaleText tKey="locations.subtitle" fallback="Explore Lefkada and the Ionian islands — from secluded turquoise bays to vibrant seaside harbours." />}
              </p>
            </div>

            {featured && (
              <div className="mt-8 flex items-center gap-2 text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <LocaleText translations={featured.nameTranslations} fallback={featured.name} />
                </span>
              </div>
            )}

            {/* Decorative divider */}
            <div className="mt-10 mb-2 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-white/30 to-transparent" />
              <span className="text-[10px] font-mono text-white/70 tracking-widest uppercase">
                {mapped.length} destination{mapped.length !== 1 ? "s" : ""}
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-white/30 to-transparent" />
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="pb-28 px-6">
          <div className="max-w-7xl mx-auto">
            <LocationsGrid locations={rest} />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

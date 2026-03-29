import { db } from "@/lib/db"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Destinations — IYC Yachts",
  description: "Explore our charter destinations across the Ionian Sea. Discover the perfect sailing location for your next yacht charter adventure.",
  openGraph: {
    title: "Destinations — IYC Yachts",
    description: "Explore our charter destinations across the Ionian Sea.",
  },
}

export default async function LocationsListPage() {
  const locations = await db.location.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <span className="mb-4 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
              Charter Destinations
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Our Destinations
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Discover the most beautiful sailing destinations in the Ionian Sea and beyond.
            </p>
          </div>
        </section>

        {/* Locations grid */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            {locations.length === 0 ? (
              <p className="text-center text-white/40 py-20 text-lg">No destinations available yet. Check back soon.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {locations.map((location) => {
                  const names = location.nameTranslations as Record<string, string>
                  const shortDesc = (location.shortDesc as Record<string, string>)?.en || ""
                  const pref = (location.prefecture as Record<string, string>)?.en || ""
                  const name = names?.en || location.name

                  return (
                    <Link
                      key={location.id}
                      href={`/locations/${location.slug}`}
                      className="group flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {/* Image */}
                      <div className="relative h-56 overflow-hidden">
                        {location.defaultMedia ? (
                          location.defaultMediaType === "video" ? (
                            <video
                              src={location.defaultMedia}
                              muted playsInline preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={location.defaultMedia}
                              alt={name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <span className="text-white/20 text-sm">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5">
                        <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-[#83776d] transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                          {name}
                        </h2>
                        {(pref || location.city) && (
                          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
                            {[pref, location.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {shortDesc && (
                          <p className="text-sm text-white/50 line-clamp-3">
                            {shortDesc}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

import { db } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sailing Itineraries — IYC Yachts",
  description: "Explore our curated sailing itineraries across the Greek islands and beyond.",
}

export default async function ItinerariesListPage() {
  const itineraries = await db.itinerary.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { days: true } } },
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
              Explore Routes
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Sailing Itineraries
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Discover hand-crafted sailing routes through the most beautiful destinations in Greece.
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            {itineraries.length === 0 ? (
              <p className="text-center text-white/40 py-20 text-lg">
                No itineraries available yet. Check back soon!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {itineraries.map((it) => {
                  const name = it.name as Record<string, string>
                  const shortDesc = it.shortDesc as Record<string, string>
                  return (
                    <Link
                      key={it.id}
                      href={`/itineraries/${it.slug}`}
                      className="group flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {it.defaultMedia ? (
                        <div className="relative h-56 overflow-hidden">
                          <Image
                            src={it.defaultMedia}
                            alt={name.en || "Itinerary"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="h-56 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <span className="text-white/20 text-sm">No image</span>
                        </div>
                      )}
                      <div className="flex flex-col flex-1 p-5">
                        <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-[#83776d] transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                          {name.en || "Untitled"}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          {it.startFrom && <span>From {it.startFrom}</span>}
                          {it.totalDays > 0 && <span>{it.totalDays} days</span>}
                          {it.totalMiles > 0 && <span>{it.totalMiles} nm</span>}
                        </div>
                        {shortDesc.en && (
                          <p className="text-sm mt-3 line-clamp-3 text-white/50">
                            {shortDesc.en}
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

import { db } from "@/lib/db"
import Link from "next/link"
import { Metadata } from "next"

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
    <main className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section
        className="relative py-24 px-6 md:px-12 text-center"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Sailing Itineraries
        </h1>
        <p className="text-lg text-white/80 mt-4 max-w-2xl mx-auto">
          Discover hand-crafted sailing routes through the most beautiful destinations in Greece.
        </p>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {itineraries.length === 0 ? (
          <p className="text-center text-lg" style={{ color: "var(--on-surface-variant)" }}>
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
                  className="group rounded-xl overflow-hidden transition-shadow hover:shadow-xl"
                  style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
                >
                  {it.defaultMedia ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={it.defaultMedia}
                        alt={name.en || "Itinerary"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                      <svg className="size-12 opacity-30" style={{ color: "var(--on-surface-variant)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                      {name.en || "Untitled"}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      {it.startFrom && <span>From {it.startFrom}</span>}
                      {it.totalDays > 0 && <span>{it.totalDays} days</span>}
                      {it.totalMiles > 0 && <span>{it.totalMiles} nm</span>}
                    </div>
                    {shortDesc.en && (
                      <p className="text-sm mt-3 line-clamp-3" style={{ color: "var(--on-surface-variant)" }}>
                        {shortDesc.en}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

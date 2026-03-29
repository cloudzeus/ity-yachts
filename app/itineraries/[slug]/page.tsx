import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const itinerary = await db.itinerary.findUnique({ where: { slug }, select: { name: true, metaTitle: true, metaDesc: true, defaultMedia: true } })
  if (!itinerary) return { title: "Itinerary Not Found" }
  const name = (itinerary.name as Record<string, string>)?.en || "Itinerary"
  return {
    title: itinerary.metaTitle || `${name} — IYC Yachts`,
    description: itinerary.metaDesc || undefined,
    openGraph: {
      title: itinerary.metaTitle || name,
      description: itinerary.metaDesc || undefined,
      images: itinerary.defaultMedia ? [itinerary.defaultMedia] : undefined,
    },
  }
}

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const itinerary = await db.itinerary.findUnique({
    where: { slug },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { legs: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!itinerary || itinerary.status !== "published") notFound()

  const name = itinerary.name as Record<string, string>
  const shortDesc = itinerary.shortDesc as Record<string, string>
  const places = itinerary.places as Array<{ name: string; latitude: number; longitude: number }>

  return (
    <main className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        {itinerary.defaultMedia ? (
          itinerary.defaultMediaType === "video" ? (
            <video
              src={itinerary.defaultMedia}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={itinerary.defaultMedia}
              alt={name.en || "Itinerary"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--gradient-ocean)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {name.en || "Untitled Itinerary"}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-white/80">
            {itinerary.startFrom && <span>From {itinerary.startFrom}</span>}
            {itinerary.totalDays > 0 && <span>{itinerary.totalDays} Days</span>}
            {itinerary.totalMiles > 0 && <span>{itinerary.totalMiles} Nautical Miles</span>}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        {shortDesc.en && (
          <p className="text-xl leading-relaxed mb-8" style={{ color: "var(--on-surface-variant)" }}>
            {shortDesc.en}
          </p>
        )}

        {/* Places overview */}
        {places.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {places.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ background: "rgba(0,99,153,0.08)", color: "var(--secondary)", border: "1px solid rgba(0,99,153,0.15)" }}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {p.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Day-by-day itinerary */}
      {itinerary.days.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
            Day-by-Day Itinerary
          </h2>

          <div className="flex flex-col gap-0">
            {itinerary.days.map((day, dayIdx) => {
              const legs = day.legs
              const dayDesc = day.description as Record<string, string>
              return (
                <div key={day.id} className="relative">
                  {/* Timeline line */}
                  {dayIdx < itinerary.days.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px" style={{ background: "var(--outline-variant)" }} />
                  )}

                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="flex items-center justify-center size-10 rounded-full shrink-0 text-sm font-bold text-white"
                      style={{ background: "var(--gradient-ocean)" }}
                    >
                      {day.dayNumber}
                    </div>
                    <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                      Day {day.dayNumber}
                    </h3>
                  </div>

                  {/* Day description */}
                  {dayDesc.en && (
                    <p className="ml-14 text-sm leading-relaxed mb-6" style={{ color: "var(--on-surface-variant)" }}>
                      {dayDesc.en}
                    </p>
                  )}

                  {/* Legs */}
                  <div className="ml-14 flex flex-col gap-8 pb-10">
                    {legs.map((leg) => {
                      const legName = leg.name as Record<string, string>
                      const legDesc = leg.description as Record<string, string>
                      const legImages = leg.images as string[]

                      return (
                        <div key={leg.id}>
                          {legName.en && (
                            <h4 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>
                              {legName.en}
                            </h4>
                          )}
                          {legDesc.en && (
                            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--on-surface-variant)" }}>
                              {legDesc.en}
                            </p>
                          )}
                          {legImages.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {legImages.map((url, i) => (
                                <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden">
                                  <img src={url} alt={`${legName.en || "Leg"} ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Map */}
      {itinerary.startLatitude && itinerary.startLongitude && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${itinerary.startLongitude - 0.5}%2C${itinerary.startLatitude - 0.3}%2C${itinerary.startLongitude + 0.5}%2C${itinerary.startLatitude + 0.3}&layer=mapnik&marker=${itinerary.startLatitude}%2C${itinerary.startLongitude}`}
              className="w-full h-64 md:h-96 border-0"
              loading="lazy"
            />
          </div>
        </section>
      )}
    </main>
  )
}

import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const location = await db.location.findUnique({ where: { slug }, select: { name: true, metaTitle: true, metaDesc: true, defaultMedia: true } })
  if (!location) return { title: "Location Not Found" }
  return {
    title: location.metaTitle || `${location.name} — IYC Yachts`,
    description: location.metaDesc || undefined,
    openGraph: {
      title: location.metaTitle || location.name,
      description: location.metaDesc || undefined,
      images: location.defaultMedia ? [location.defaultMedia] : undefined,
    },
  }
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const location = await db.location.findUnique({ where: { slug } })
  if (!location || location.status !== "published") notFound()

  const names = location.nameTranslations as Record<string, string>
  const shortDesc = location.shortDesc as Record<string, string>
  const desc = location.description as Record<string, string>
  const pref = location.prefecture as Record<string, string>
  const imgs = location.images as string[]

  return (
    <main>
      {/* Hero */}
      {location.defaultMedia && (
        <section className="relative h-[50vh] min-h-[400px]">
          {location.defaultMediaType === "video" ? (
            <video
              src={location.defaultMedia}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={location.defaultMedia}
              alt={names.en || location.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {names.en || location.name}
            </h1>
            {pref.en && (
              <p className="text-lg text-white/80 mt-2">{pref.en}{location.city ? `, ${location.city}` : ""}</p>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        {shortDesc.en && (
          <p className="text-xl leading-relaxed mb-8" style={{ color: "var(--on-surface-variant)" }}>
            {shortDesc.en}
          </p>
        )}

        {desc.en && (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: desc.en }} />
        )}
      </section>

      {/* Image Gallery */}
      {imgs.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imgs.map((url, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden">
                <img src={url} alt={`${names.en || location.name} ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      {location.latitude && location.longitude && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.05}%2C${location.latitude - 0.03}%2C${location.longitude + 0.05}%2C${location.latitude + 0.03}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
              className="w-full h-64 md:h-96 border-0"
              loading="lazy"
            />
          </div>
        </section>
      )}
    </main>
  )
}

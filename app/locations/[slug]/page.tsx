import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const location = await db.location.findUnique({
    where: { slug },
    select: { name: true, nameTranslations: true, metaTitle: true, metaDesc: true, shortDesc: true, defaultMedia: true },
  })
  if (!location) return { title: "Location Not Found" }

  const names = location.nameTranslations as Record<string, string>
  const name = names?.en || location.name
  const shortDesc = (location.shortDesc as Record<string, string>)?.en || ""

  return {
    title: location.metaTitle || `${name} — Destinations — IYC Yachts`,
    description: location.metaDesc || shortDesc || undefined,
    openGraph: {
      title: location.metaTitle || name,
      description: location.metaDesc || shortDesc || undefined,
      images: location.defaultMedia ? [location.defaultMedia] : undefined,
    },
  }
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const location = await db.location.findUnique({ where: { slug } })
  if (!location || location.status !== "published") notFound()

  const names = location.nameTranslations as Record<string, string>
  const name = names?.en || location.name
  const shortDesc = (location.shortDesc as Record<string, string>)?.en || ""
  const desc = (location.description as Record<string, string>)?.en || ""
  const pref = (location.prefecture as Record<string, string>)?.en || ""
  const imgs = location.images as string[]

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

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
              <Image
                src={location.defaultMedia}
                alt={name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060c27] via-[#060c27]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
              <div className="max-w-4xl mx-auto">
                <h1
                  className="text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                >
                  {name}
                </h1>
                {(pref || location.city) && (
                  <p className="text-lg text-white/70 mt-2">
                    {[pref, location.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* If no hero, text header */}
        {!location.defaultMedia && (
          <section className="pt-32 pb-8 px-6">
            <div className="max-w-4xl mx-auto">
              <h1
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {name}
              </h1>
              {(pref || location.city) && (
                <p className="text-lg text-white/70">
                  {[pref, location.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Content */}
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-sm text-[#83776d] hover:text-[#83776d]/80 transition-colors mb-8"
            >
              <ArrowLeft className="size-4" />
              All Destinations
            </Link>

            {shortDesc && (
              <p className="text-xl leading-relaxed text-white/70 mb-10 border-l-2 border-[#83776d] pl-6">
                {shortDesc}
              </p>
            )}

            {desc && (
              <div
                className="prose prose-lg prose-invert max-w-none"
                style={{ color: "rgba(255,255,255,0.75)" }}
                dangerouslySetInnerHTML={{ __html: desc }}
              />
            )}
          </div>
        </section>

        {/* Image Gallery */}
        {imgs.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-16">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imgs.map((url, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Image
                    src={url}
                    alt={`${name} ${i + 1}`}
                    fill
                    className="object-cover !relative"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Map */}
        {location.latitude && location.longitude && (
          <section className="max-w-4xl mx-auto px-6 pb-20">
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.05}%2C${location.latitude - 0.03}%2C${location.longitude + 0.05}%2C${location.latitude + 0.03}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                className="w-full h-64 md:h-96 border-0"
                loading="lazy"
              />
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}

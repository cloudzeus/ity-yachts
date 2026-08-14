import { db } from "@/lib/db"
import { metaStrings } from "@/lib/meta.server"
import { pageMeta } from "@/lib/seo"
import Link from "@/components/locale-link"
import Image from "next/image"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnswerBlock } from "@/components/answer-block"
import { LocaleText } from "@/components/locale-text"
import { getMottoRaw } from "@/lib/mottos"
import { RouteCardsMotion } from "@/components/itineraries/route-cards-motion"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await metaStrings()
  return pageMeta({
  title: m("meta.itineraries.title", "Ionian Sailing Routes from Lefkada"),
  description: m("meta.itineraries.description", "Week-long sailing routes out of Lefkada, day by day: distances, anchorages and harbours through Meganisi, Ithaca, Kefalonia and the Inland Sea."),
  path: "/itineraries",
})
}

export default async function ItinerariesListPage() {
  const [itineraries, itinComponent, motto] = await Promise.all([
    db.itinerary.findMany({
      // where: { status: "published" }, // TODO: re-enable after testing
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { days: true } }, days: { select: { _count: { select: { legs: true } } } } },
    }),
    db.pageComponent.findFirst({
      where: { page: { slug: "itineraries" }, type: "itineraries-content", status: "active" },
      select: { props: true },
    }),
    // Falls back to the page's own copy if the motto is ever removed.
    getMottoRaw("itineraries-chart-your-own"),
  ])

  const mottoHeading = (motto?.heading ?? null) as Record<string, string> | null
  const mottoSub = (motto?.subheading ?? null) as Record<string, string> | null
  const mottoEyebrow = (motto?.subtext ?? null) as Record<string, string> | null

  const itinHero = ((itinComponent?.props as Record<string, unknown> | null)?.hero ?? null) as {
    badge?: Record<string, string>; title?: Record<string, string>; subtitle?: Record<string, string>
  } | null

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Hero — photographic, under the kit's single vertical gradient that
            resolves into the page. The copy is a saved motto, so the same line
            can be reused elsewhere and edited in one place. */}
        <section className="relative overflow-hidden px-6 pt-36 pb-32" style={{ background: "var(--surface-page)" }}>
          <Image
            src="https://iycweb.b-cdn.net/general/1786438819714-friends-enjoying-a-sunny-boat-trip-with-drinks-2026-03-25-02-44-25-utc.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_38%]"
            data-parallax="0.16"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,13,25,.60) 0%, rgba(4,13,25,.34) 45%, var(--surface-page) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span
              className="mb-5 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm"
              style={{
                border: "1px solid rgba(246,206,145,0.42)",
                background: "rgba(226,150,60,0.16)",
                color: "var(--iyc-sun-300)",
              }}
            >
              {mottoEyebrow
                ? <LocaleText translations={mottoEyebrow} fallback="Every itinerary" uppercase />
                : <LocaleText tKey="itineraries.badge" fallback="Explore Routes" uppercase />}
            </span>

            <h1
              className="mb-4 text-3xl font-bold text-white md:text-[2.6rem] md:leading-[1.1]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              
                {mottoHeading
                  ? <LocaleText translations={mottoHeading} fallback="Routes drawn by people who sail them." />
                  : <LocaleText tKey="itineraries.title" fallback="Sailing Itineraries" />}
              
            </h1>

            <p
              className="mx-auto max-w-lg text-[15px] md:text-base"
              style={{
                color: "var(--iyc-sand-200)",
                textShadow: "0 1px 3px rgba(4,13,25,.55), 0 1px 14px rgba(4,13,25,.34)",
              }}
            >
              {mottoSub
                ? <LocaleText translations={mottoSub} fallback="Follow one exactly, or use it as the first draft of your own." />
                : <LocaleText tKey="itineraries.subtitle" fallback="Discover hand-crafted sailing routes through the most beautiful destinations in Greece." />}
            </p>
          </div>
        </section>

      <AnswerBlock
        eyebrowKey="answer.eyebrow"
        eyebrowFallback="In short"
        bodyKey="answer.itineraries"
        bodyFallback={"Each route here starts and finishes on our own pontoon in Lefkada and is built around a week aboard. Most legs run two to four hours, which leaves the rest of the day for swimming rather than sailing. Treat them as drafts: we redraw any of them around your dates, your crew and the wind."}
        container="mx-auto w-full max-w-6xl px-6"
        spacing="pt-20 pb-6 md:pt-24"
      />

        {/* Routes — two per row, not three. With a handful of itineraries a
            three-column grid leaves a ragged empty cell and shrinks each card
            to a thumbnail; wide editorial cards let the figures that decide a
            charter (length, distance, stops, where it calls) sit on the card
            instead of behind a click. */}
        <section className="relative z-10 px-6 pt-16 pb-20">
          <div className="mx-auto max-w-6xl">
            {itineraries.length === 0 ? (
              <div
                className="rounded-[var(--iyc-radius-lg)] px-6 py-20 text-center"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}
              >
                <p className="text-lg" style={{ color: "var(--text-muted)" }}>
                  <LocaleText tKey="itineraries.noResults" fallback="No itineraries available yet. Check back soon!" />
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                {itineraries.map((it) => {
                  const name = it.name as Record<string, string>
                  const shortDesc = it.shortDesc as Record<string, string>
                  const stops = it.days.reduce((n, d) => n + d._count.legs, 0)
                  const ports = [...new Set(((it.places as { name: string }[]) ?? []).map((p) => p.name))]
                  const isVideo =
                    it.defaultMediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(it.defaultMedia ?? "")

                  return (
                    <Link
                      key={it.id}
                      href={`/itineraries/${it.slug}`}
                      data-route-card
                      className="group flex flex-col overflow-hidden will-change-transform"
                      style={{
                        background: "var(--surface-card)",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "var(--iyc-radius-lg)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div data-route-card-inner className="flex flex-1 flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {it.defaultMedia ? (
                          isVideo ? (
                            <video
                              src={it.defaultMedia}
                              muted
                              autoPlay
                              loop
                              playsInline
                              preload="metadata"
                              aria-label={name.en || "Itinerary"}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <Image
                              src={it.defaultMedia}
                              alt={name.en || "Itinerary"}
                              fill
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          )
                        ) : (
                          <div className="absolute inset-0" style={{ background: "var(--gradient-ocean)" }} />
                        )}

                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0"
                          style={{ height: "58%", background: "var(--scrim-photo)" }}
                        />

                        {it.startFrom && (
                          <span
                            className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                            style={{ background: "var(--action-accent)", color: "var(--text-on-accent)" }}
                          >
                            <LocaleText tKey="itineraries.from" fallback="From" /> {it.startFrom}
                          </span>
                        )}

                        <h2
                          className="absolute inset-x-0 bottom-0 p-5 text-xl font-bold text-white md:text-2xl"
                          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                        >
                          <LocaleText translations={name} fallback="Untitled" />
                        </h2>
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        {/* The three figures a charter is chosen on, tabular so
                            they line up between cards. */}
                        <div
                          className="mb-4 grid grid-cols-3 gap-3 border-b pb-4"
                          style={{ borderColor: "var(--border-hairline)" }}
                        >
                          {[
                            [String(it.totalDays), <LocaleText key="d" tKey="itineraries.days" fallback="days" uppercase />],
                            [`${it.totalMiles}`, "nm"],
                            [String(stops), <LocaleText key="s" tKey="itineraries.stops" fallback="stops" uppercase />],
                          ].map(([v, l], i) => (
                            <div key={i}>
                              <div
                                className="iyc-mono text-lg font-bold leading-none"
                                style={{ color: "var(--text-heading)" }}
                              >
                                {v}
                              </div>
                              <div
                                className="mt-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: "var(--text-subtle)" }}
                              >
                                {l}
                              </div>
                            </div>
                          ))}
                        </div>

                        {shortDesc && (
                          <p className="mb-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            <LocaleText translations={shortDesc} />
                          </p>
                        )}

                        {ports.length > 0 && (
                          <p className="mb-5 text-xs leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                            {ports.join(" · ")}
                          </p>
                        )}

                        <span
                          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3"
                          style={{ color: "var(--text-link)" }}
                        >
                          <LocaleText tKey="itineraries.viewRoute" fallback="See the route day by day" />
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          <RouteCardsMotion />
        </section>

        {/* Why this sea — the page ended after the cards, which on a listing of
            two routes reads as an unfinished page. This is the brochure's own
            account of the sailing area, and it is what a first-time charterer
            is actually weighing. */}
        <section className="relative overflow-hidden px-6 py-20" style={{ background: "var(--surface-page)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "url(/brand/topographic.svg)",
              backgroundSize: "1400px auto",
              backgroundPosition: "center",
              opacity: 0.3,
              maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--action-accent)" }}
              >
                <LocaleText tKey="itineraries.area.eyebrow" fallback="The sailing area" uppercase />
              </span>
              <h2
                className="mt-3 text-2xl font-bold md:text-3xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}
              >
                
                  <LocaleText tKey="itineraries.area.title" fallback="Why the Ionian is an easy sea to learn on" />
                
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                ["itineraries.area.wind", "The Maistros, not the Meltemi",
                 "A fair-weather north-westerly that wakes late morning and rarely passes 5 Bft, then falls asleep with the sun."],
                ["itineraries.area.shelter", "Never far from shelter",
                 "The islands lie parallel to the mainland coast. Hardly a point in the Ionian is more than 30 nautical miles from a protected harbour."],
                ["itineraries.area.distances", "Short hops between anchorages",
                 "Most legs run two to four hours, which leaves the rest of the day for swimming rather than sailing."],
              ].map(([key, title, body]) => (
                <div
                  key={key}
                  className="p-6"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "var(--iyc-radius-lg)",
                  }}
                >
                  <h3
                    className="mb-2 text-base font-bold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                  >
                    <LocaleText tKey={`${key}.title`} fallback={title} />
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <LocaleText tKey={`${key}.body`} fallback={body} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing ask */}
        <section className="px-6 pb-24" style={{ background: "var(--surface-page)" }}>
          <div
            className="mx-auto grid max-w-5xl overflow-hidden md:grid-cols-[1.15fr_1fr]"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--iyc-radius-lg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="flex flex-col justify-center p-9 md:p-11">
              <span
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--action-accent)" }}
              >
                <LocaleText tKey="itineraries.cta.eyebrow" fallback="None of these quite right?" uppercase />
              </span>
              <h2
                className="mb-4 text-2xl font-bold md:text-3xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-heading)" }}
              >
                
                  <LocaleText tKey="itineraries.cta.title" fallback="Tell us where you want to wake up." />
                
              </h2>
              <p className="mb-7 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                <LocaleText
                  tKey="itineraries.cta.body"
                  fallback="We have sailed this water since 1979. Give us your dates and your crew, and we will draw the route around them."
                />
              </p>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--action-accent)",
                    color: "var(--text-on-accent)",
                    borderRadius: "var(--iyc-radius-sm)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <LocaleText tKey="itineraries.cta.plan" fallback="Plan my route" />
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/fleet"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  style={{ color: "var(--text-link)" }}
                >
                  <LocaleText tKey="itineraries.cta.fleet" fallback="Browse our fleet" />
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            <div className="relative min-h-[220px]">
              <Image
                src="https://iycweb.b-cdn.net/general/1786528737083-rope-on-the-winch-of-a-white-yacht-in-the-sea-yach-2026-03-24-23-08-01-utc.webp"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 440px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 hidden w-24 md:block"
                style={{ background: "linear-gradient(to right, var(--surface-card), transparent)" }}
              />
            </div>
          </div>
        </section>

      </div>

      <SiteFooter />
    </main>
  )
}

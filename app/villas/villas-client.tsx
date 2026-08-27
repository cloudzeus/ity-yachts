"use client"

import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import { VILLAS, VILLAS_HERO, VILLAS_URL } from "@/lib/villas"

/**
 * A week ashore, offered to people who came for a week afloat.
 *
 * The page is short on purpose. Every villa here links to its own page on the
 * villas site, which is where the plans, the galleries and the availability
 * live; repeating any of that would mean maintaining a second villa website,
 * and the first rate change would make it a lying one.
 */
export function VillasClient() {
  const { t, tUpper } = useTranslations()

  /**
   * One line, not a grid of icons.
   *
   * Four icons in a two-by-two block sat directly under a photograph and
   * competed with it — the card ended up with two things asking to be looked
   * at first. Set as a single quiet line of middots it reads in one pass and
   * lets the picture do the work it is there for.
   */
  const spec = (v: (typeof VILLAS)[number]) => [
    `${v.bedrooms} ${t("villas.bedrooms", "bedrooms")}`,
    `${v.guests} ${t("villas.guests", "guests")}`,
    `${v.size} m²`,
    t("villas.poolPrivate", "private pool"),
  ]

  return (
    <main style={{ background: "var(--surface-page)", color: "var(--text-heading)" }}>
      {/* ── Opening ─────────────────────────────────────────────────────────
          Dark, as everywhere else on this site: the header is transparent
          until you scroll, and a light band at the top hides the logo. */}
      <section className="relative w-full overflow-hidden" style={{ background: "var(--surface-inverse)" }}>
        <Image
          src={VILLAS_HERO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.45 }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(5,17,31,.75) 0%, rgba(5,17,31,.55) 45%, var(--surface-inverse) 100%)" }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 pt-32 pb-16 md:px-10 md:pt-44 md:pb-24">
          <p
            className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--iyc-sun-500)" }}
          >
            <span aria-hidden="true" className="h-px w-8" style={{ background: "var(--iyc-sun-500)" }} />
            {tUpper("villas.eyebrow", "Our villas")}
          </p>
          <h1
            className="max-w-3xl text-4xl font-semibold leading-[1.06] md:text-6xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--iyc-sand-50)" }}
          >
            {t("villas.title", "Three houses, a few minutes from the water")}
          </h1>
          <p
            className="mt-6 max-w-[58ch] text-base leading-relaxed md:text-lg"
            style={{ color: "var(--iyc-sand-200)" }}
          >
            {t(
              "villas.intro",
              "Maria, who runs our base, built three villas on the quiet edge of Lefkada. Guests take them for a few days either side of a charter — or instead of one, when the plan is to stay still."
            )}
          </p>
        </div>
      </section>

      {/* ── The three ───────────────────────────────────────────────────── */}
      <section className="w-full px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1400px]">
          {/* Restraint first, then rhythm.

              The card had a border, a shadow, a lift, an image zoom and a gold
              bar drawing itself across the top — five effects arguing at once,
              which is what made it read as a template rather than as a house
              worth a week of somebody's summer.

              What is left is the photograph, an index, a bilingual name and
              four facts. The middle column is dropped half a step so the three
              are a composition rather than a row of equals; the eye moves
              across them instead of scanning a table. It only applies where
              there are three abreast — stacked on a phone, an offset is just a
              gap. */}
          <ul className="grid list-none grid-cols-1 gap-12 p-0 md:grid-cols-3 md:gap-8">
            {VILLAS.map((v, i) => (
              <li key={v.key} className={i === 1 ? "md:mt-16" : undefined}>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col"
                >
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--iyc-radius-md)]"
                    style={{ background: "var(--surface-sunken)" }}
                  >
                    <Image
                      src={v.image}
                      alt={`${v.name} — ${t("villas.imageAlt", "villa on Lefkada with a private pool")}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                  </div>

                  {/* The index moved out of the photograph. Over the bottom of
                      a picture it sat on whatever happened to be there —
                      water in one, foliage in another — and was legible in
                      neither. Here it is a fixed part of the type. */}
                  <div
                    className="mt-6 flex items-baseline gap-4 border-t pt-4"
                    style={{ borderColor: "var(--border-hairline)" }}
                  >
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xs font-semibold tabular-nums tracking-[0.2em]"
                      style={{ color: "var(--iyc-sun-600)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2
                      className="min-w-0 text-2xl font-semibold leading-none md:text-[1.75rem]"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                    >
                      {v.name}
                      {/* The Greek is the same name, so it sits with it rather
                          than under it as a second, quieter title. */}
                      <span className="ml-2.5 text-base font-normal" style={{ color: "var(--text-subtle)" }}>
                        {v.greek}
                      </span>
                    </h2>
                  </div>

                  <ul className="mt-4 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
                    {spec(v).map((f, n) => (
                      <li key={f} className="flex items-center gap-3">
                        {n > 0 && (
                          <span
                            aria-hidden="true"
                            className="h-3 w-px"
                            style={{ background: "var(--border-hairline)" }}
                          />
                        )}
                        <span
                          className="text-[11px] uppercase tracking-[0.1em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {removeGreekTonos(f)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <span
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: "var(--text-link)" }}
                  >
                    <span
                      className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 ease-out group-hover:bg-[length:100%_1px] motion-reduce:transition-none"
                      style={{ backgroundImage: "linear-gradient(currentColor, currentColor)" }}
                    >
                      {t("villas.view", "View the villa")}
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Everything else lives on their own site, and saying so plainly is
              better than pretending this page is the whole story. */}
          <div
            className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[var(--iyc-radius-md)] p-6"
            style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}
          >
            <p className="max-w-[60ch] text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
              {t(
                "villas.moreBody",
                "Floor plans, full galleries and availability are on the villas' own site. Seven nights minimum, all year."
              )}
            </p>
            <a
              href={VILLAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none"
              style={{ background: "var(--iyc-ionian-600)", color: "#fff" }}
            >
              {t("villas.moreCta", "See all three villas")}
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

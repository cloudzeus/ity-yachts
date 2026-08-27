"use client"

import Image from "next/image"
import { ArrowUpRight, BedDouble, Users, Ruler, Waves } from "lucide-react"
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
  const { t, tUpper, locale } = useTranslations()

  const facts = (v: (typeof VILLAS)[number]) => [
    { icon: BedDouble, label: t("villas.bedrooms", "Bedrooms"), value: String(v.bedrooms) },
    { icon: Users, label: t("villas.guests", "Guests"), value: String(v.guests) },
    { icon: Ruler, label: t("villas.size", "Size"), value: `${v.size} m²` },
    { icon: Waves, label: t("villas.pool", "Pool"), value: t("villas.poolPrivate", "Private") },
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
          <ul className="grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3 md:gap-6">
            {VILLAS.map((v) => (
              <li key={v.key}>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--iyc-radius-md)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-hairline)",
                    boxShadow: "0 1px 2px rgba(4,13,25,0.04)",
                  }}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={v.image}
                      alt={`${v.name} — ${t("villas.imageAlt", "villa on Lefkada with a private pool")}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                      style={{ background: "var(--iyc-sun-500)" }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2
                        className="text-2xl font-semibold leading-tight"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                      >
                        {v.name}
                      </h2>
                      {/* The Greek name is how the house is known locally, and
                          it is not translated — it is the name. */}
                      <span className="text-sm" style={{ color: "var(--text-subtle)" }}>
                        {v.greek}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                      {facts(v).map((f) => (
                        <div key={f.label} className="flex items-center gap-2">
                          <f.icon
                            className="size-4 shrink-0"
                            style={{ color: "var(--iyc-sun-600)" }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <dt
                              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                              style={{ color: "var(--text-subtle)" }}
                            >
                              {removeGreekTonos(f.label)}
                            </dt>
                            <dd className="m-0 text-sm font-medium" style={{ color: "var(--text-body)" }}>
                              {f.value}
                            </dd>
                          </span>
                        </div>
                      ))}
                    </dl>

                    <div
                      className="mt-auto flex items-baseline justify-between gap-3 border-t pt-4"
                      style={{ borderColor: "var(--border-hairline)", marginTop: "1.5rem" }}
                    >
                      <span>
                        <span
                          className="block text-[10px] font-semibold uppercase tracking-[0.12em]"
                          style={{ color: "var(--text-subtle)" }}
                        >
                          {removeGreekTonos(t("villas.from", "From"))}
                        </span>
                        <span
                          className="text-lg font-semibold tabular-nums"
                          style={{ color: "var(--text-heading)", fontFamily: "var(--font-display)" }}
                        >
                          €{v.fromPrice.toLocaleString(locale)}
                          <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                            {" "}
                            / {t("villas.week", "week")}
                          </span>
                        </span>
                      </span>
                      <ArrowUpRight
                        className="size-5 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: "var(--text-link)" }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
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

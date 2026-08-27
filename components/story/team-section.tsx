"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

/**
 * The people, on the page about the family.
 *
 * The old site had this and the new one lost it, which for a business whose
 * whole argument is "a family, not a corporation" is the wrong thing to
 * mislay. A visitor deciding between charter companies is choosing who hands
 * them the keys.
 *
 * Photographs and roles come from the staff records the office already keeps,
 * so nobody maintains a second copy of the team here — a face changes in
 * /admin and it changes on this page.
 */

export interface TeamMember {
  name: string
  position: string
  image: string
  bio: string
}

export function TeamSection({ members }: { members: TeamMember[] }) {
  const { t, tUpper } = useTranslations()
  if (!members.length) return null

  return (
    <section className="relative w-full" style={{ background: "var(--surface-page)" }}>
      <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
        <div className="mb-14 max-w-3xl">
          <span
            className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--iyc-sun-600)" }}
          >
            {tUpper("story.team.eyebrow", "Our team")}
          </span>
          <h2
            className="text-3xl font-semibold leading-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
          >
            {t("story.team.heading", "The people who hand you the keys")}
          </h2>

          <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed" style={{ color: "var(--text-body)" }}>
            <p>
              {t(
                "story.team.lead",
                "Base manager Maria Ramisch — a Greek mother, a German father — speaks German, Greek and English. She has lived on Lefkada for many years and knows the most beautiful bays and the best tavernas; as a local, her tips are worth more than any guidebook."
              )}{" "}
              {/* The villas are hers, and saying so is more useful than hiding
                  it: guests routinely want a few days on land either side. */}
              <a
                href="https://www.ionian-dream-villas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium underline underline-offset-4 transition-colors"
                style={{ color: "var(--text-link)" }}
              >
                {t("story.team.villas", "She has also built three holiday homes on the edge of Lefkada")}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
              {/* Explicit: a leading space inside the string is trimmed at the
                  element boundary, so the dash sat against the link. */}
              {" "}
              {t("story.team.villasTail", "— ideal for extending your holiday ashore.")}
            </p>
            <p>
              {t(
                "story.team.thomas",
                "For questions and bookings, speak to Thomas Ramisch — Maria's brother, and our office in Germany."
              )}
            </p>
          </div>
        </div>

        {/* Portraits, deliberately small.

            The photographs the office holds are 160×160 for two of the four
            and 281×179 for a third. A card 330px wide was enlarging them two
            and four times over, which is what made them look poor — the
            layout was fine and the pixels were not there. Held to about 200px
            they are shown at close to their real size and look sharp.

            Square, too: three of the four sources are square or nearly so, and
            a 4:5 portrait crop was cutting faces to invent height that the
            file never had. Better photographs would let this grow again. */}
        {/* Left-aligned, not centred. The heading and the paragraphs above
            start at the page gutter, and a centred grid put the first card
            125px to the right of them — two competing left edges in one
            section, which is what read as crooked. */}
        <ul className="grid max-w-[880px] list-none grid-cols-2 gap-5 p-0 sm:gap-6 lg:grid-cols-4">
          {members.map((m) => (
            <li key={`${m.name}-${m.position}`}>
              <article
                className="group flex h-full flex-col overflow-hidden rounded-[var(--iyc-radius-md)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-hairline)",
                  boxShadow: "0 1px 2px rgba(4,13,25,0.04)",
                }}
              >
                <div className="relative aspect-square w-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={`${m.name}, ${m.position}`}
                      fill
                      sizes="(max-width: 1024px) 45vw, 210px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-3xl font-semibold"
                      style={{ color: "var(--text-subtle)", fontFamily: "var(--font-display)" }}
                    >
                      {m.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3
                    className="text-base font-semibold leading-tight"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                  >
                    {m.name}
                  </h3>
                  <p
                    className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--iyc-sun-600)" }}
                  >
                    {removeGreekTonos(m.position)}
                  </p>
                  {m.bio && (
                    <p className="mt-2.5 text-xs leading-relaxed" style={{ color: "var(--text-body)" }}>
                      {m.bio}
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>

      </div>
    </section>
  )
}

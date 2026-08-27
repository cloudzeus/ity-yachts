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
    <section
      aria-labelledby="team-heading"
      className="relative w-full"
      style={{ background: "var(--surface-page)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
        <header className="mb-14 max-w-3xl">
          <p
            className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--iyc-sun-600)" }}
          >
            {/* A short rule rather than an icon: it belongs to the type, and
                the page already carries enough photography. */}
            <span aria-hidden="true" className="h-px w-8" style={{ background: "var(--iyc-sun-500)" }} />
            {tUpper("story.team.eyebrow", "Our team")}
          </p>
          <h2
            id="team-heading"
            className="text-3xl font-semibold leading-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
          >
            {t("story.team.heading", "The people who hand you the keys")}
          </h2>

          {/* One idea to a block.

              This was a single paragraph carrying three: who Maria is, what
              she knows, and the villas — with the villas as a long underlined
              run through the middle of it. At ninety-six characters a line it
              was half again the sixty to seventy-five a paragraph can hold,
              so it read as a wall with a scar across it. The measure is now
              capped and the two asides have been lifted out, each with its own
              heading, which is what they always were. */}
          <p
            className="mt-6 max-w-[62ch] text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-body)" }}
          >
            {t(
              "story.team.lead",
              "Base manager Maria Ramisch — a Greek mother, a German father — speaks German, Greek and English. She has lived on Lefkada for many years and knows the most beautiful bays and the best tavernas; as a local, her tips are worth more than any guidebook."
            )}
          </p>

          <div className="mt-8 grid max-w-[62ch] gap-4 sm:max-w-none sm:grid-cols-2 sm:gap-5">
            <aside
              className="rounded-[var(--iyc-radius-sm)] p-5"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}
            >
              <h3
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--iyc-sun-600)" }}
              >
                <span aria-hidden="true" className="h-px w-4 shrink-0" style={{ background: "var(--iyc-sun-500)" }} />
                {tUpper("story.team.villasHeading", "A few days on land")}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
                {t(
                  "story.team.villas",
                  "Maria has built three holiday homes on the edge of Lefkada — ideal either side of a charter."
                )}
              </p>
              <a
                href="https://www.ionian-dream-villas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--text-link)" }}
              >
                ionian-dream-villas.com
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
            </aside>

            <aside
              className="rounded-[var(--iyc-radius-sm)] p-5"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}
            >
              <h3
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--iyc-sun-600)" }}
              >
                <span aria-hidden="true" className="h-px w-4 shrink-0" style={{ background: "var(--iyc-sun-500)" }} />
                {tUpper("story.team.bookingsHeading", "Questions and bookings")}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
                {t(
                  "story.team.thomas",
                  "Speak to Thomas Ramisch — Maria's brother, and our office in Germany."
                )}
              </p>
            </aside>
          </div>
        </header>

        {/* Horizontal cards, two across.

            The first version stacked a portrait over the biography in a 200px
            column and the text came out at twenty-eight characters a line —
            half the sixty to seventy-five a paragraph wants, so every
            sentence broke into six ragged fragments. Turning the card on its
            side gives the words about fifty characters and costs the
            photograph nothing: at 112px it is still inside the 160px the
            files actually contain, which is the constraint that set the size
            in the first place. */}
        <ul className="grid max-w-[1000px] list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 md:gap-6">
          {members.map((m) => (
            <li key={`${m.name}-${m.position}`}>
              <article
                className="group flex h-full gap-4 overflow-hidden rounded-[var(--iyc-radius-md)] p-4 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none sm:gap-5 sm:p-5"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-hairline)",
                  boxShadow: "0 1px 2px rgba(4,13,25,0.04)",
                }}
              >
                <div
                  className="relative size-24 shrink-0 overflow-hidden rounded-[var(--iyc-radius-sm)] sm:size-28"
                  style={{ background: "var(--surface-sunken)" }}
                >
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={`${m.name}, ${m.position}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-2xl font-semibold"
                      style={{ color: "var(--text-subtle)", fontFamily: "var(--font-display)" }}
                    >
                      {m.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h3
                    className="text-base font-semibold leading-tight sm:text-lg"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                  >
                    {m.name}
                  </h3>
                  {/* The role is not a heading — it describes the person named
                      above, so it stays a paragraph and takes its emphasis
                      from the accent and the rule beside it. */}
                  <p
                    className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--iyc-sun-600)" }}
                  >
                    <span aria-hidden="true" className="h-px w-4 shrink-0" style={{ background: "var(--iyc-sun-500)" }} />
                    {removeGreekTonos(m.position)}
                  </p>
                  {m.bio && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
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

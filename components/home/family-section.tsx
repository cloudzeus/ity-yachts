"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export interface FamilyMember {
  id: string
  name: string
  position: Record<string, string> | null
  city: Record<string, string> | null
  bio: Record<string, string> | null
  image: string | null
}

/** Initials for the members who have no photograph on file yet. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

/**
 * The family — two offices, one business.
 *
 * Fed from the staff table, so the copy and photographs stay editable in
 * /admin/staff rather than being frozen into the markup.
 */
export function FamilySection({ members }: { members: FamilyMember[] }) {
  const { t, tUpper, locale } = useTranslations()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fam-row",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".fam-grid", start: "top 85%" },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [members])

  if (!members.length) return null

  const r = (v: Record<string, string> | null) => (v ? v[locale] || v.en || "" : "")

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: "var(--surface-sunken)" }}
    >
      <div
        data-parallax="0.4"
        className="absolute top-0 left-0 w-[520px] h-[520px] rounded-full pointer-events-none z-0"
        style={{ background: "var(--iyc-sand-200)", filter: "blur(120px)", opacity: 0.6, transform: "translate(-30%, -20%)" }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-20 md:py-24">
        <div className="mb-14 max-w-[860px]">
          <span className="label-sm mb-3 block" style={{ color: "var(--iyc-taupe-500)" }}>
            {tUpper("home.family.eyebrow", "The family")}
          </span>
          <h2 className="section-heading" style={{ color: "var(--text-heading)" }}>
            <span className="font-light">{t("home.family.headingLead", "Two offices,")}</span>{" "}
            <span className="font-extrabold" style={{ color: "var(--iyc-ionian-600)" }}>
              {t("home.family.headingAccent", "one business")}
            </span>
          </h2>
        </div>

        <div className="fam-grid grid grid-cols-1 gap-x-12 gap-y-2 md:grid-cols-2">
          {members.map((m, i) => {
            const role = r(m.position)
            const city = r(m.city)
            return (
              <div
                key={m.id}
                className="fam-row flex items-start gap-5 py-6"
                style={{
                  opacity: 0,
                  // Rows separate from each other, but the first row of each
                  // column has nothing above it to separate from.
                  borderTop: i > 1 ? "1px solid var(--border-hairline)" : "none",
                }}
              >
                <span
                  className="relative grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-full"
                  style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
                >
                  {m.image ? (
                    <Image src={m.image} alt={m.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span
                      className="text-lg font-light"
                      style={{ fontFamily: "var(--font-display)", color: "var(--iyc-ionian-600)" }}
                    >
                      {initials(m.name)}
                    </span>
                  )}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="text-lg"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                    >
                      {m.name}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--iyc-ionian-600)" }}
                    >
                      {/* Set uppercase — Greek capitals carry no accent. */}
                      {removeGreekTonos([role, city].filter(Boolean).join(" · "))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {r(m.bio)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

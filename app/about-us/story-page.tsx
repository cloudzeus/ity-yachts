"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "@/components/locale-link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "@/lib/use-translations"
import { TeamSection } from "@/components/story/team-section"
import { removeGreekTonos } from "@/lib/greek-utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type Copy = Record<string, Record<string, string>>

type StaffRow = { name: string; position: unknown; image: string | null; bio: unknown }

export function StoryPage({ copy, staff = [] }: { copy: Copy; staff?: StaffRow[] }) {
  const { locale } = useTranslations()
  const rootRef = useRef<HTMLDivElement>(null)

  /** A translated field off a staff record, in the reader's language. */
  const pick = (field: unknown) => {
    const o = (field ?? {}) as Record<string, string>
    return (o[locale] || o.en || o.el || o.de || "").trim()
  }
  const team = staff
    .map((m) => ({
      name: m.name,
      position: pick(m.position),
      image: m.image ?? "",
      bio: pick(m.bio),
    }))
    /* Somebody with neither a photograph nor a role is a placeholder record,
       not a colleague to put on the page. */
    .filter((m) => m.image || m.position)

  /** A stored string, in the reader's language. */
  const c = (key: string, fallback = "") => {
    const v = copy[key]
    return v?.[locale]?.trim() || v?.en?.trim() || fallback
  }

  /** A stored photograph. Images carry a url, not a language. */
  const img = (key: string) => copy[key]?.url?.trim() || ""

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".story-rise").forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 34 },
          {
            opacity: 1, y: 0, duration: 0.75, ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 90%" },
          }
        )
      })
    }, el)
    return () => ctx.revert()
  }, [locale])

  return (
    <div ref={rootRef}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 540 }}>
        {img("story.hero.image") && (
          <Image src={img("story.hero.image")} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,13,25,.62) 0%, rgba(4,13,25,.34) 40%, rgba(4,13,25,.55) 74%, var(--surface-page) 100%)",
          }}
        />
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center px-6 pb-36 pt-36 text-center md:pb-44 md:pt-44">
          <span
            className="mb-6 inline-block rounded-[var(--iyc-radius-sm)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.88)" }}
          >
            {removeGreekTonos(c("story.eyebrow", "Since 1979"))}
          </span>

          <h1
            className="text-[clamp(2.4rem,5vw,4rem)] font-light leading-[1.06] text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
          >
            {c("story.title", "Our story")}
          </h1>

          <p
            className="mt-6 max-w-[34ch] text-[1.15rem] font-light leading-relaxed md:text-[1.35rem]"
            style={{ color: "rgba(255,255,255,0.94)", fontFamily: "var(--font-display)", textWrap: "balance" }}
          >
            {c("story.subtitle")}
          </p>
        </div>
      </section>

      {/* ── Lead + the three figures ─────────────────────────────────────── */}
      <section className="relative w-full">
        <div className="mx-auto max-w-[720px] px-6">
          <div
            className="iyc-prose story-rise text-[1.12rem] leading-[1.75]"
            style={{ color: "var(--text-body)" }}
            dangerouslySetInnerHTML={{ __html: c("story.lead") }}
          />

          <div
            className="story-rise mt-12 grid grid-cols-3 gap-6 py-8"
            style={{ borderTop: "1px solid var(--border-hairline)", borderBottom: "1px solid var(--border-hairline)" }}
          >
            <Fact value="1979" label={c("story.fact.1.label")} />
            <Fact value={c("story.fact.2.value", "2")} label={c("story.fact.2.label")} />
            <Fact value={c("story.fact.3.value", "3")} label={c("story.fact.3.label")} />
          </div>
        </div>
      </section>

      {/* ── The chapters ─────────────────────────────────────────────────── */}
      <Chapter n={1} side="right" c={c} img={img} drift="0.14" />
      <Chapter n={2} side="left" c={c} img={img} drift="0.18" tone="sunken" />
      <Chapter n={3} side="right" c={c} img={img} drift="0.12" />

      {/* A break in the rhythm: the canal goes full width and the words sit on
          the left of it, where the water is calmest. */}
      <Band
        image={img("story.4.image")}
        caption={c("story.4.caption")}
        heading={c("story.4.heading")}
        body={c("story.4.body")}
      />

      <Chapter n={5} side="left" c={c} img={img} drift="0.16" />
      <Chapter n={6} side="right" c={c} img={img} drift="0.2" tone="sunken" />
      <Chapter n={7} side="left" c={c} img={img} drift="0.14" />

      {/* ── The team ─────────────────────────────────────────────────────
          Before the closing paragraph: the page has just told the family's
          story, and this is who that family is now. */}
      <TeamSection members={team} />

      {/* ── Sailing with friends ─────────────────────────────────────────── */}
      <section className="relative w-full">
        {/* The photograph sits above the words rather than behind them: this is
            the closing paragraph of the page and it has to be readable. */}
        {img("story.closing.image") && (
          <figure className="relative m-0 h-[280px] w-full overflow-hidden md:h-[380px]">
            <Image src={img("story.closing.image")} alt="" fill sizes="100vw" className="object-cover" />
            <figcaption
              className="absolute bottom-4 right-5 text-[11px] uppercase tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.82)", textShadow: "0 1px 8px rgba(4,13,25,.7)" }}
            >
              {removeGreekTonos(c("story.closing.caption"))}
            </figcaption>
          </figure>
        )}

        <div style={{ background: "linear-gradient(158deg, var(--iyc-ionian-800), var(--iyc-ionian-900))" }}>
          <div className="mx-auto max-w-[680px] px-6 py-20 text-center md:py-24">
            <h2
              className="story-rise mb-7 text-[clamp(1.9rem,3.6vw,2.8rem)] font-light leading-[1.1] text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em" }}
            >
              {c("story.closing.heading", "Sailing with friends")}
            </h2>

            <div
              className="iyc-prose iyc-prose--plain story-rise text-left text-[1.02rem] leading-[1.75]"
              style={{ color: "rgba(255,255,255,0.86)" }}
              dangerouslySetInnerHTML={{ __html: c("story.closing.body") }}
            />

            <p
              className="story-rise mx-auto mt-10 max-w-[32ch] text-[1.25rem] font-light leading-snug text-white md:text-[1.45rem]"
              style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
            >
              {c("story.closing.welcome")}
            </p>

            <Link
              href="/fleet"
              className="story-rise mt-9 inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-8 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
            >
              {c("story.closing.cta", "Come and sail with us")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-[clamp(1.8rem,4vw,2.4rem)] font-light leading-none"
        style={{ fontFamily: "var(--font-display)", color: "var(--iyc-ionian-600)" }}
      >
        {value}
      </div>
      <div className="mt-2.5 text-[0.7rem] uppercase leading-snug tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
        {removeGreekTonos(label)}
      </div>
    </div>
  )
}

function Chapter({
  n, side, c, img, tone = "page", drift = "0.16",
}: {
  n: number
  /** Which side the photograph takes from `lg` up. */
  side: "left" | "right"
  c: (key: string, fallback?: string) => string
  img: (key: string) => string
  tone?: "page" | "sunken"
  drift?: string
}) {
  const src = img(`story.${n}.image`)
  const caption = c(`story.${n}.caption`)

  const media = src ? (
    <figure className="m-0">
      <div
        data-parallax={drift}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-[4/5]"
        style={{ background: "var(--surface-sunken)", boxShadow: "var(--shadow-md)" }}
      >
        <Image src={src} alt="" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
          {removeGreekTonos(caption)}
        </figcaption>
      )}
    </figure>
  ) : null

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: tone === "sunken" ? "var(--surface-sunken)" : "var(--surface-page)" }}
    >
      <div className="story-rise mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        {/* On one column the photograph always leads, whichever side it takes
            on a wide screen — opening a chapter with its picture reads better
            on a phone than opening with a wall of text. */}
        <div className={side === "left" ? "lg:order-1" : "lg:order-2"}>{media}</div>
        <div className={side === "left" ? "lg:order-2" : "lg:order-1"}>
          <div className="max-w-[36rem]">
            <h2
              className="mb-5 text-[clamp(1.55rem,2.6vw,2.15rem)] font-light leading-[1.18]"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
            >
              {c(`story.${n}.heading`)}
            </h2>
            <div
              className="iyc-prose iyc-prose--plain text-[1.01rem] leading-[1.75]"
              style={{ color: "var(--text-body)" }}
              dangerouslySetInnerHTML={{ __html: c(`story.${n}.body`) }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Band({
  image, caption, heading, body,
}: {
  image: string
  caption: string
  heading: string
  body: string
}) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-[480px] w-full">
        {image && <Image src={image} alt="" fill sizes="100vw" className="object-cover" />}
        {/* Angled, because the words sit left — the cover has to be heaviest there. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(4,13,25,.92) 0%, rgba(4,13,25,.78) 42%, rgba(4,13,25,.40) 100%)" }}
        />
        <div className="relative mx-auto flex max-w-[1280px] items-center px-6 py-20 md:px-10 md:py-24">
          <div className="story-rise max-w-[40rem]">
            <h2
              className="mb-5 text-[clamp(1.65rem,3vw,2.4rem)] font-light leading-[1.15] text-white"
              style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
            >
              {heading}
            </h2>
            <div
              className="iyc-prose iyc-prose--plain text-[1.01rem] leading-[1.75]"
              style={{ color: "rgba(255,255,255,0.88)" }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        </div>
        {caption && (
          <span
            className="absolute bottom-4 right-5 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,0.75)", textShadow: "0 1px 8px rgba(4,13,25,.7)" }}
          >
            {removeGreekTonos(caption)}
          </span>
        )}
      </div>
    </section>
  )
}

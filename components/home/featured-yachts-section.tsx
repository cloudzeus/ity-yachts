"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Anchor, Users, DoorOpen, Ruler, ArrowRight } from "lucide-react"
import { TextReveal, StaggerReveal } from "./scroll-animations"

interface FeaturedYacht {
  id: number
  name: string
  slug: string
  image: string
  category: string
  loa: number
  cabins: number
  berths: number
  baseName: string
  priceFrom?: number
}

export function FeaturedYachtsSection({ yachts }: { yachts: FeaturedYacht[] }) {
  if (yachts.length === 0) return null

  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden"
      style={{ background: "#070c26" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <TextReveal>
              <span className="label-sm mb-3 block" style={{ color: "var(--secondary-light)" }}>
                Fleet
              </span>
            </TextReveal>
            <TextReveal delay={0.1}>
              <h2
                className="text-4xl md:text-6xl font-bold text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                }}
              >
                Featured Yachts
              </h2>
            </TextReveal>
          </div>
          <TextReveal delay={0.2}>
            <Link
              href="/fleet"
              className="inline-flex items-center gap-2 text-sm font-semibold mt-4 md:mt-0 transition-colors hover:gap-3"
              style={{ color: "var(--secondary-light)", fontFamily: "var(--font-display)" }}
            >
              Browse full fleet
              <ArrowRight className="w-4 h-4" />
            </Link>
          </TextReveal>
        </div>

        {/* Yacht Grid - Mouse scale pairs */}
        <div className="space-y-6">
          {Array.from({ length: Math.ceil(yachts.length / 2) }, (_, rowIdx) => {
            const pair = yachts.slice(rowIdx * 2, rowIdx * 2 + 2)
            return <YachtPairRow key={rowIdx} yachts={pair} reversed={rowIdx % 2 === 1} />
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Yacht Pair Row with Mouse-Scale Effect ─────────────────────────── */

function YachtPairRow({
  yachts,
  reversed,
}: {
  yachts: FeaturedYacht[]
  reversed: boolean
}) {
  const firstRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)
  let xPercent = reversed ? 100 : 0
  let currentXPercent = reversed ? 100 : 0
  const speed = 0.12

  const handleMouseMove = (e: React.MouseEvent) => {
    xPercent = (e.clientX / window.innerWidth) * 100

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(animate)
    }
  }

  const animate = () => {
    const delta = xPercent - currentXPercent
    currentXPercent += delta * speed

    const firstWidth = 66.66 - currentXPercent * 0.33
    const secondWidth = 33.33 + currentXPercent * 0.33

    if (firstRef.current) firstRef.current.style.width = `${firstWidth}%`
    if (secondRef.current) secondRef.current.style.width = `${secondWidth}%`

    if (Math.round(xPercent) !== Math.round(currentXPercent)) {
      rafId.current = requestAnimationFrame(animate)
    } else {
      rafId.current = null
    }
  }

  if (yachts.length === 1) {
    return (
      <TextReveal>
        <YachtCard yacht={yachts[0]} />
      </TextReveal>
    )
  }

  return (
    <TextReveal>
      <div
        onMouseMove={handleMouseMove}
        className="flex gap-4 h-[400px] md:h-[500px]"
      >
        <div
          ref={firstRef}
          className="relative overflow-hidden rounded-md"
          style={{ width: reversed ? "33.33%" : "66.66%" }}
        >
          <YachtCardInner yacht={yachts[0]} />
        </div>
        {yachts[1] && (
          <div
            ref={secondRef}
            className="relative overflow-hidden rounded-md"
            style={{ width: reversed ? "66.66%" : "33.33%" }}
          >
            <YachtCardInner yacht={yachts[1]} />
          </div>
        )}
      </div>
    </TextReveal>
  )
}

function YachtCard({ yacht }: { yacht: FeaturedYacht }) {
  return (
    <Link
      href={`/fleet/${yacht.slug || yacht.id}`}
      className="group block relative rounded-md overflow-hidden h-[400px] md:h-[500px]"
    >
      <YachtCardInner yacht={yacht} />
    </Link>
  )
}

function YachtCardInner({ yacht }: { yacht: FeaturedYacht }) {
  return (
    <Link
      href={`/fleet/${yacht.slug || yacht.id}`}
      className="group block relative w-full h-full"
    >
      {/* Image */}
      {yacht.image ? (
        <Image
          src={yacht.image}
          alt={yacht.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="w-full h-full" style={{ background: "var(--gradient-ocean)" }} />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,10,30,0.8) 0%, rgba(0,10,30,0.2) 50%, transparent 70%)",
        }}
      />

      {/* Category badge */}
      <div className="absolute top-4 left-4 z-10">
        <span
          className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm text-white"
          style={{ background: "rgba(0, 99, 153, 0.8)", backdropFilter: "blur(8px)" }}
        >
          {yacht.category}
        </span>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 z-10">
        <h3
          className="text-xl md:text-2xl font-bold text-white mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {yacht.name}
        </h3>

        <div className="flex flex-wrap items-center gap-4 text-white/70 text-xs">
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            <span>{yacht.loa}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5" />
            <span>{yacht.cabins} cabins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{yacht.berths} guests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5" />
            <span>{yacht.baseName}</span>
          </div>
        </div>

        {yacht.priceFrom !== undefined && yacht.priceFrom > 0 && (
          <div className="mt-3 text-sm text-white/90">
            From{" "}
            <span className="font-bold text-white">
              €{yacht.priceFrom.toLocaleString()}
            </span>
            <span className="text-white/50"> / week</span>
          </div>
        )}
      </div>
    </Link>
  )
}

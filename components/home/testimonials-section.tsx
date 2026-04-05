"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { TextReveal } from "./scroll-animations"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ReviewItem {
  id: string
  name: string
  content: string
  rating: number
  image?: string | null
  date: string
}

export function TestimonialsSection({ reviews }: { reviews: ReviewItem[] }) {
  const { t } = useTranslations()
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trackRef.current) return
    gsap.to(trackRef.current, {
      x: -current * 100 + "%",
      duration: 0.6,
      ease: "power3.out",
    })
  }, [current])

  if (reviews.length === 0) return null

  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden"
      style={{ background: "var(--primary)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <TextReveal>
              <span className="label-sm mb-3 block" style={{ color: "var(--secondary-light)" }}>
                {t("home.testimonials.badge", "Testimonials")}
              </span>
            </TextReveal>
            <TextReveal delay={0.1}>
              <h2
                className="text-4xl md:text-6xl font-bold text-white"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {t("home.testimonials.title", "What Our Guests Say")}
              </h2>
            </TextReveal>
          </div>

          {reviews.length > 1 && (
            <div className="flex gap-3 mt-6 md:mt-0">
              <button
                onClick={() => setCurrent((p) => Math.max(0, p - 1))}
                disabled={current === 0}
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrent((p) => Math.min(reviews.length - 1, p + 1))}
                disabled={current === reviews.length - 1}
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex will-change-transform" style={{ width: `${reviews.length * 100}%` }}>
            {reviews.map((review) => (
              <div
                key={review.id}
                className="px-2"
                style={{ width: `${100 / reviews.length}%` }}
              >
                <div
                  className="rounded-md p-8 md:p-12"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <Quote className="w-10 h-10 text-[#0077B6]/40 mb-6" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? "fill-[#FFB703] text-[#FFB703]"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  <p
                    className="text-lg md:text-xl text-white/80 leading-relaxed mb-8"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &ldquo;{review.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4">
                    {review.image && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                        <Image
                          src={review.image}
                          alt={review.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div>
                      <div
                        className="font-semibold text-white"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {review.name}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(review.date).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-[#0077B6] w-6"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

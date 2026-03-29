"use client"

import { Headset, Route, ShieldCheck, Utensils, Sparkles, Waves } from "lucide-react"
import { TextReveal, StaggerReveal, AnimatedCounter } from "./scroll-animations"

const SERVICES = [
  {
    icon: Route,
    title: "Custom Routes",
    desc: "Tailor-made itineraries crafted to your preferences, from secluded coves to vibrant harbours.",
  },
  {
    icon: Headset,
    title: "24/7 Concierge",
    desc: "Dedicated support before, during, and after your charter. We handle every detail.",
  },
  {
    icon: Utensils,
    title: "Gourmet Catering",
    desc: "Private chefs and curated dining experiences featuring the finest Mediterranean cuisine.",
  },
  {
    icon: ShieldCheck,
    title: "Safety First",
    desc: "Fully insured vessels, certified crew, and rigorous safety protocols on every voyage.",
  },
  {
    icon: Sparkles,
    title: "Luxury Amenities",
    desc: "Water toys, spa treatments, and premium entertainment systems aboard every yacht.",
  },
  {
    icon: Waves,
    title: "Flexible Booking",
    desc: "Bareboat or crewed, day charter or week-long — book on your terms with easy modifications.",
  },
]

const STATS = [
  { value: 500, suffix: "+", label: "Yachts Available" },
  { value: 50, suffix: "+", label: "Destinations" },
  { value: 15, suffix: "K+", label: "Happy Guests" },
  { value: 20, suffix: "+", label: "Years Experience" },
]

export function ServicesSection() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-12" style={{ background: "var(--surface)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 pb-24"
          style={{ borderBottom: "1px solid var(--outline-variant)" }}
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-16">
          <TextReveal>
            <span className="label-sm mb-3 block" style={{ color: "var(--secondary)" }}>
              Services
            </span>
          </TextReveal>
          <TextReveal delay={0.1}>
            <h2
              className="text-4xl md:text-6xl font-bold max-w-3xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Everything You Need for the Perfect Charter
            </h2>
          </TextReveal>
        </div>

        {/* Services Grid */}
        <StaggerReveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08}>
          {SERVICES.map((service, i) => {
            const Icon = service.icon
            return (
              <div
                key={i}
                className="group p-8 rounded-md transition-all duration-300 hover:shadow-lg"
                style={{
                  background: "var(--surface-container-lowest)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center mb-5 transition-colors"
                  style={{ background: "rgba(0, 99, 153, 0.08)" }}
                >
                  <Icon className="w-6 h-6" style={{ color: "var(--secondary)" }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                >
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                  {service.desc}
                </p>
              </div>
            )
          })}
        </StaggerReveal>
      </div>
    </section>
  )
}

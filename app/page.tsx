import Link from "next/link"
import { Ship, Calendar, Users, Shield } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HeroSection } from "@/components/hero-section"

export default function Home() {
  return (
    <main>
      {/* Page content — clip-path lets the fixed footer reveal beneath */}
      <div
        className="relative z-10 min-h-screen"
        style={{
          background: "#060c27",
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <SiteHeader />

        {/* Hero */}
        <HeroSection />

        {/* Features */}
        <section className="px-6 md:px-12 py-24" style={{ background: "var(--surface)" }}>
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold mb-12 text-center"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Platform Features
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  icon: Ship,
                  title: "Fleet Management",
                  desc: "Comprehensive yacht inventory and status tracking",
                },
                {
                  icon: Calendar,
                  title: "Smart Booking",
                  desc: "Intuitive scheduling and reservation system",
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  desc: "Multi-role access with granular permissions",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  desc: "Advanced authentication and data protection",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-md"
                  style={{
                    background: "var(--surface-container-lowest)",
                    boxShadow: "var(--shadow-ambient)",
                  }}
                >
                  <feature.icon
                    className="w-8 h-8 mb-3"
                    style={{ color: "var(--secondary)" }}
                  />
                  <h3
                    className="font-semibold mb-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--primary)",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Sticky reveal footer */}
      <SiteFooter />
    </main>
  )
}

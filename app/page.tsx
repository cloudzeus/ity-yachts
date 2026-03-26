import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ship, Calendar, Users, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface)" }}>
      {/* Navigation */}
      <nav
        className="flex h-16 items-center justify-between px-6 md:px-12"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(196,198,207,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center"
            style={{
              background: "var(--gradient-ocean)",
              borderRadius: "var(--radius-xs)",
            }}
          >
            <span
              className="text-xs font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--tertiary-fixed)",
              }}
            >
              IYC
            </span>
          </div>
          <span
            className="font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--primary)",
            }}
          >
            IYC Yachts
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Sign In
          </Link>
          <a
            href="/admin"
            className="text-sm font-semibold text-white px-4 py-2 rounded-sm transition-all"
            style={{
              background: "var(--gradient-ocean)",
            }}
          >
            Admin
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-12 py-20">
        <div className="w-full max-w-2xl text-center">
          <div
            className="inline-block px-3 py-1.5 mb-6"
            style={{
              background: "rgba(0,99,153,0.08)",
              borderRadius: "var(--radius-xs)",
            }}
          >
            <span className="label-sm" style={{ color: "var(--secondary)" }}>
              Maritime Excellence
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--primary)",
              letterSpacing: "-0.02em",
            }}
          >
            The Precise Navigator for Yacht Bookings
          </h1>

          <p
            className="text-lg mb-8 max-w-xl mx-auto"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Enterprise-grade yacht management and booking platform designed for the maritime industry. Experience institutional trust and digital sophistication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button
                className="px-6 py-3 text-white font-semibold rounded-sm transition-all"
                style={{ background: "var(--gradient-ocean)" }}
              >
                Get Started
              </button>
            </Link>
            <button
              className="px-6 py-3 font-semibold rounded-sm transition-colors"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--primary)",
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="px-6 md:px-12 py-20"
        style={{ background: "var(--surface-container-low)" }}
      >
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

      {/* Footer */}
      <footer
        className="px-6 md:px-12 py-8 text-center text-sm"
        style={{ color: "var(--on-surface-variant)" }}
      >
        <p>© 2026 IYC Yachts. Maritime enterprise management platform.</p>
      </footer>
    </div>
  )
}

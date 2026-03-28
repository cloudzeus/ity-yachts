import Link from "next/link"
import { Ship, Calendar, Users, Shield } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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
        <section className="relative flex min-h-screen items-center justify-center px-6 md:px-12">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2940&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060c27]/60 via-[#060c27]/40 to-[#060c27]" />

          <div className="relative z-10 w-full max-w-3xl text-center">
            <div className="mb-6 inline-block rounded-sm border border-white/15 px-4 py-1.5">
              <span
                className="text-xs font-semibold uppercase tracking-widest text-white/60"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Luxury Yacht Charters
              </span>
            </div>

            <h1
              className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              Navigate the World
              <br />
              in Unmatched Luxury
            </h1>

            <p
              className="mx-auto mb-10 max-w-xl text-lg text-white/60"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Discover hand-selected yachts and bespoke itineraries crafted for
              the most discerning travellers. Your voyage begins here.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/start-planning"
                className="bg-white px-8 py-3.5 text-sm font-semibold transition-all hover:bg-white/90"
                style={{
                  borderRadius: "6px",
                  color: "#060c27",
                  fontFamily: "var(--font-display)",
                }}
              >
                Start Planning
              </Link>
              <Link
                href="/fleet"
                className="border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                style={{ borderRadius: "6px", fontFamily: "var(--font-display)" }}
              >
                Explore Fleet
              </Link>
            </div>
          </div>
        </section>

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

import type { Metadata } from "next"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Star,
  FileText,
  Flag,
  CreditCard,
  Calendar,
  Car,
  Phone,
  MessageSquare,
  RefreshCw,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | IYC - Ionian Yacht Charter",
  description:
    "Greek hospitality meets German thoroughness. Experience the ultimate sailing adventure with our exclusive fleet of modern sailing yachts.",
}

/* ─── Stats shown in the floating bar ──────────────────────────────────── */
const stats = [
  {
    icon: <Star className="h-6 w-6 fill-current" />,
    value: "5 Star",
    label: "Comfort",
  },
  { value: "45", label: "Years of Experience" },
  { value: "6", label: "Motivated Employees" },
  { value: "17", label: "Modern Sailing Yachts", accent: true },
]

/* ─── Team cards ───────────────────────────────────────────────────────── */
const team = [
  {
    name: "Hannes & Thomas",
    role: "IYC Founders",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop",
    bio: "The visionaries who started it all in 1979, bringing together a passion for sailing and uncompromising standards.",
  },
  {
    name: "Maria Ramisch",
    role: "Base Manager",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop",
    bio: "Perfectly embodies our dual philosophy with roots in both Germany and Greece.",
    link: { label: "Holiday Homes", href: "http://www.ionian-dream-villas.com" },
  },
  {
    name: "Thomas Ramisch",
    role: "Rep. Office Germany",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop",
    bio: "Your primary contact in Germany. Always ready to assist with any questions and information regarding your booking.",
  },
  {
    name: "Elena",
    role: "Office Manager",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop",
    bio: "Ensuring everything runs smoothly behind the scenes, from paperwork to port coordination, making your arrival seamless.",
  },
]

/* ─── Service items ────────────────────────────────────────────────────── */
const services = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Charter Contracts",
    text: "Officially approved charter contracts are already in place upon your arrival.",
  },
  {
    icon: <Flag className="h-5 w-5" />,
    title: "Greek Flag",
    text: "All sailing vessels sail under the Greek flag, equipped per strict Greek Maritime Law No. 438.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Security Deposit",
    text: "Easy security deposit processing in Greece (e.g., conveniently by credit card).",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Flexible Handover",
    text: "Yacht handover on Saturday or, in the pre- and post-season, also on Tuesday by arrangement.",
  },
  {
    icon: <Car className="h-5 w-5" />,
    title: "Airport Transfers",
    text: "Comfortable taxi pick-up from the airport can be easily arranged upon request.",
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: "Continuous Support",
    text: "Dedicated support before, during, and after your entire sailing trip.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "No Clearing Needed",
    text: "Thanks to Greece's EU status, the tedious clearing in and out at ports is completely bypassed.",
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    title: "Relaxed Return",
    text: "Return of the yacht on Friday or Monday evening with a subsequent free overnight stay on board.",
  },
]

export default function AboutPage() {
  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{
          background: "#060c27",
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <SiteHeader />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative flex min-h-[600px] items-center pt-24" style={{ height: "85vh" }}>
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1544146036-7c98020526a0?q=80&w=2602&auto=format&fit=crop"
              alt="Sailing Yacht in the Ionian Sea"
              fill
              className="object-cover object-center"
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(7,12,38,0.95) 0%, rgba(7,12,38,0.6) 50%, rgba(7,12,38,0) 100%)",
                mixBlendMode: "multiply",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
            <div className="max-w-3xl">
              <span className="mb-6 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
                Est. 1979
              </span>
              <h1 className="mb-6 text-5xl font-light leading-[1.1] text-white md:text-6xl lg:text-7xl" style={{ textWrap: "balance" as never }}>
                Ionian Yacht Charter
                <br />
                <span className="mt-2 block text-4xl font-bold text-[#83776d] md:text-5xl lg:text-6xl">
                  Sailing the Ionian Sea
                </span>
              </h1>
              <p className="max-w-2xl border-l-2 border-[#83776d] pl-6 text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                Greek hospitality meets German thoroughness. Experience the ultimate sailing
                adventure with our exclusive fleet of modern sailing yachts.
              </p>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ─────────────────────────────────────────────── */}
        <div className="relative z-20 mx-auto -mt-16 mb-24 max-w-7xl px-6 sm:-mt-24">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl shadow-[#070c26]/5">
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 md:grid-cols-4 md:divide-y-0">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center justify-center p-8 text-center transition-colors hover:bg-gray-50"
                >
                  {s.icon && <div className="mb-3 text-[#83776d]">{s.icon}</div>}
                  <span
                    className={`mb-1 text-3xl font-bold transition-transform duration-300 group-hover:scale-105 ${
                      i === 0 ? "text-3xl" : "text-4xl"
                    } ${s.accent ? "text-[#83776d]" : "text-[#070c26]"}`}
                  >
                    {s.value}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-gray-500">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Philosophy ────────────────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
              {/* Text */}
              <div className="space-y-8 lg:col-span-5">
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#83776d]">
                    Our Philosophy
                  </h2>
                  <h3 className="mb-6 text-4xl font-light" style={{ color: "#070c26" }}>
                    Hospitable and
                    <br />
                    <span className="font-bold">Reliable</span>
                  </h3>
                  <div className="mb-8 h-1 w-20 bg-[#83776d]" />
                </div>

                <div className="space-y-4 text-lg font-light leading-relaxed text-gray-600">
                  <p>
                    You can expect Greek hospitality and German thoroughness, as well as the
                    willingness and time to cater to the charter guest&apos;s wishes.
                  </p>
                  <p>
                    Reliability and expert knowledge in the maintenance and care of the vessels
                    are a matter of course for us. We are dedicated exclusively to sailing boats,
                    ensuring our passion and expertise remain focused on providing the purest
                    sailing experience.
                  </p>
                </div>
              </div>

              {/* Image + quote card */}
              <div className="relative lg:col-span-7">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1505533542167-8c89838bb19e?q=80&w=2070&auto=format&fit=crop"
                    alt="Sailing Boat Details"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[#070c26]/20" />
                </div>

                {/* Glass quote card */}
                <div
                  className="absolute -bottom-10 -left-10 z-10 w-[calc(100%+20px)] rounded-2xl p-8 shadow-2xl shadow-[#070c26]/20 md:-left-16 md:bottom-10 md:w-[480px]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <svg
                    className="mb-6 h-10 w-10 text-[#83776d] opacity-80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="mb-6 text-lg font-light leading-relaxed text-white">
                    &ldquo;An evaluation of a survey conducted by Yacht magazine No.&nbsp;7/2003
                    confirmed this reliability when comparing renowned charter bases. All surveyed
                    customers would charter with us again; not a single guest reported any serious
                    defects.&rdquo;
                  </p>
                  <div className="flex items-center gap-4 border-t border-white/20 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#83776d] font-bold text-white">
                      Y
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: "#ffffff" }}>Yacht Magazine</h4>
                      <span className="text-sm text-white/60">Issue No. 7/2003</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Team ──────────────────────────────────────────────────── */}
        <section className="relative py-24" style={{ background: "#070c26" }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#83776d" }}>
                  The People Behind IYC
                </h2>
                <h3 className="text-4xl font-light md:text-5xl" style={{ color: "#ffffff" }}>
                  Meet Our <span className="font-bold" style={{ color: "#83776d" }}>Team</span>
                </h3>
              </div>
              <p className="max-w-xl text-lg font-light text-gray-400 md:text-right">
                Dedicated professionals committed to ensuring your sailing adventure in the
                Ionian Sea is nothing short of extraordinary.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070c26] via-[#070c26]/50 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
                  </div>
                  <div className="absolute inset-0 flex translate-y-4 flex-col justify-end p-8 transition-transform duration-300 ease-out group-hover:translate-y-0">
                    <h4 className="mb-1 text-2xl font-bold" style={{ color: "#ffffff" }}>{member.name}</h4>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#83776d]">
                      {member.role}
                    </p>
                    <div className="h-0 overflow-hidden opacity-0 transition-all delay-100 duration-300 ease-out group-hover:h-auto group-hover:opacity-100">
                      <div className="mt-1 border-t border-white/20 pt-3 text-sm font-light leading-relaxed text-gray-300">
                        <p>{member.bio}</p>
                        {member.link && (
                          <a
                            href={member.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 font-medium text-[#83776d] transition-colors hover:text-white"
                          >
                            {member.link.label}
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Formalities / Services ────────────────────────────────── */}
        <section className="relative overflow-hidden py-24" style={{ background: "#070c26" }}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="mb-16 max-w-3xl">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#83776d" }}>
                Hassle-Free Experience
              </h2>
              <h3 className="mb-6 text-4xl font-light" style={{ color: "#ffffff" }}>
                We&apos;ll take care of the
                <br />
                <span className="font-bold">formalities</span> for you.
              </h3>
              <p className="text-lg font-light text-gray-400">
                Due to Greece&apos;s full EU membership, the procedure of clearing in and out at
                Greek ports is no longer necessary. Focus on your sailing journey while we handle
                the rest.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
              {services.map((svc) => (
                <div key={svc.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#83776d]/30 bg-[#83776d]/10 text-[#83776d]">
                    {svc.icon}
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium" style={{ color: "#ffffff" }}>{svc.title}</h4>
                    <p className="text-sm font-light leading-relaxed text-gray-400">{svc.text}</p>
                  </div>
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

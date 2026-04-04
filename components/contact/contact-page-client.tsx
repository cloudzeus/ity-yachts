"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Mail, Phone, MapPin, Send, Clock, Anchor,
  Globe, ArrowRight, CheckCircle2, Loader2,
  MessageSquare, Users, Ship, ChevronDown,
} from "lucide-react"
import { TeamGrid, type StaffMember } from "@/components/page-components/team-grid"

gsap.registerPlugin(ScrollTrigger)

interface ContactPageClientProps {
  staff: StaffMember[]
}

const offices = [
  {
    id: "germany",
    label: "Munich Office",
    flag: "🇩🇪",
    person: "Thomas Ramisch",
    address: "Mozartstr. 8, D-80336 München",
    country: "Germany",
    phone: "+49 160 99279870",
    email: "info@iyc.de",
    hours: "Mon – Fri: 09:00 – 18:00 CET",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2662.5!2d11.5596!3d48.1351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDA4JzA2LjQiTiAxMcKwMzMnMzQuNiJF!5e0!3m2!1sen!2sde!4v1",
    coords: { lat: 48.1351, lng: 11.5596 },
  },
  {
    id: "greece",
    label: "Lefkada Base",
    flag: "🇬🇷",
    person: "Maria Ramisch",
    address: "PF Panagou 22, GR-31100 Lefkada",
    country: "Greece",
    phone: "+30 26450 26393",
    mobile: "+30 6932 637171",
    email: "maria@iyc.de",
    hours: "Mon – Sat: 08:00 – 20:00 EEST (Season)",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12500!2d20.7069!3d38.8337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDUwJzAxLjMiTiAyMMKwNDInMjQuOCJF!5e0!3m2!1sen!2sgr!4v1",
    coords: { lat: 38.8337, lng: 20.7069 },
  },
]

const subjects = [
  { value: "charter", label: "Charter Enquiry", icon: Ship },
  { value: "general", label: "General Question", icon: MessageSquare },
  { value: "group", label: "Group / Corporate", icon: Users },
  { value: "other", label: "Something Else", icon: Globe },
]

export function ContactPageClient({ staff }: ContactPageClientProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [activeOffice, setActiveOffice] = useState("germany")
  const heroRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const officesRef = useRef<HTMLDivElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from("[data-hero-text]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.3,
      })

      // Stats counter animation
      gsap.from("[data-stat]", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.8,
      })

      // Form section reveal
      if (formRef.current) {
        gsap.from(formRef.current.querySelectorAll("[data-form-reveal]"), {
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 80%",
          },
          y: 50,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        })
      }

      // Offices reveal
      if (officesRef.current) {
        gsap.from(officesRef.current.querySelectorAll("[data-office-card]"), {
          scrollTrigger: {
            trigger: officesRef.current,
            start: "top 80%",
          },
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        })
      }

      // Team reveal
      if (teamRef.current) {
        gsap.from(teamRef.current.querySelectorAll("[data-team-card]"), {
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top 80%",
          },
          y: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        })
      }
    })

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subject: subjects.find((s) => s.value === form.subject)?.label || form.subject,
        }),
      })

      if (!res.ok) throw new Error("Failed")
      setStatus("sent")
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" })
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }

  const selectedOffice = offices.find((o) => o.id === activeOffice)!

  return (
    <>
      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #0077B6, transparent 70%)" }} />
          <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] rounded-full opacity-[0.02]"
            style={{ background: "radial-gradient(circle, #A7EDFF, transparent 70%)" }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span data-hero-text className="mb-4 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d] backdrop-blur-sm">
            Get In Touch
          </span>
          <h1
            data-hero-text
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Let&apos;s Plan Your
            <span className="block mt-1" style={{ background: "linear-gradient(135deg, #0077B6, #A7EDFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Perfect Charter
            </span>
          </h1>
          <p data-hero-text className="text-lg text-white/50 max-w-xl mx-auto mb-12">
            Whether you have a question, want to book a yacht, or just want to say hello —
            our family team is here for you since 1979.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { num: "45+", label: "Years of Experience" },
              { num: "2", label: "Offices Worldwide" },
              { num: "24h", label: "Response Time" },
            ].map((stat) => (
              <div key={stat.label} data-stat className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.num}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/30 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <div className="flex flex-col items-center gap-2 text-white/20">
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── CONTACT FORM + INFO SPLIT ─── */}
      <section ref={formRef} className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">

            {/* Left: Form (3 cols) */}
            <div data-form-reveal className="lg:col-span-3">
              <div className="rounded-xl p-8 md:p-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {status === "sent" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(0,119,182,0.15)" }}>
                      <CheckCircle2 className="h-8 w-8 text-[#0077B6]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
                      Message Sent!
                    </h3>
                    <p className="text-white/50 max-w-sm mb-8">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="text-sm text-[#0077B6] hover:text-[#A7EDFF] transition-colors flex items-center gap-2"
                    >
                      Send another message <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        Send Us a Message
                      </h2>
                      <p className="text-sm text-white/40">All fields marked with * are required</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Subject selector */}
                      <div data-form-reveal>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 block">
                          What can we help with?
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {subjects.map((s) => {
                            const Icon = s.icon
                            const active = form.subject === s.value
                            return (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, subject: s.value }))}
                                className="flex flex-col items-center gap-2 rounded-lg px-3 py-4 text-xs transition-all duration-200"
                                style={{
                                  background: active ? "rgba(0,119,182,0.15)" : "rgba(255,255,255,0.02)",
                                  border: `1px solid ${active ? "rgba(0,119,182,0.4)" : "rgba(255,255,255,0.06)"}`,
                                  color: active ? "#A7EDFF" : "rgba(255,255,255,0.4)",
                                }}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{s.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Name row */}
                      <div data-form-reveal className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">First Name *</label>
                          <input
                            type="text"
                            required
                            value={form.firstName}
                            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#0077B6]/50"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Last Name</label>
                          <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#0077B6]/50"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            placeholder="Smith"
                          />
                        </div>
                      </div>

                      {/* Email + Phone */}
                      <div data-form-reveal className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Email *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#0077B6]/50"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Phone</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#0077B6]/50"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            placeholder="+49 160 ..."
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div data-form-reveal>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Message *</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                          className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none resize-none transition-all duration-200 focus:ring-1 focus:ring-[#0077B6]/50"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          placeholder="Tell us about your dream charter, ask us anything..."
                        />
                      </div>

                      {/* Submit */}
                      <div data-form-reveal className="flex items-center gap-4 pt-2">
                        <button
                          type="submit"
                          disabled={status === "sending"}
                          className="group relative inline-flex items-center gap-2.5 rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#0077B6]/20 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #006399, #002147)" }}
                        >
                          {status === "sending" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              Send Message
                            </>
                          )}
                        </button>
                        {status === "error" && (
                          <span className="text-sm text-red-400">Something went wrong. Please try again.</span>
                        )}
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Right: Quick contact cards (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Direct contact card */}
              <div data-form-reveal className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-5">Direct Contact</h3>
                <div className="space-y-4">
                  <a href="mailto:info@iyc.de" className="group flex items-start gap-3 text-white/60 hover:text-white transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Mail className="h-4 w-4 text-[#0077B6]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">info@iyc.de</div>
                      <div className="text-xs text-white/30">General enquiries</div>
                    </div>
                  </a>
                  <a href="mailto:bookings@iyc.de" className="group flex items-start gap-3 text-white/60 hover:text-white transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Anchor className="h-4 w-4 text-[#0077B6]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">bookings@iyc.de</div>
                      <div className="text-xs text-white/30">Charter bookings</div>
                    </div>
                  </a>
                  <a href="tel:+4916099279870" className="group flex items-start gap-3 text-white/60 hover:text-white transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Phone className="h-4 w-4 text-[#0077B6]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">+49 160 99279870</div>
                      <div className="text-xs text-white/30">Munich office</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Office hours card */}
              <div data-form-reveal className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-5">Office Hours</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Clock className="h-4 w-4 text-[#0077B6]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80">Munich</div>
                      <div className="text-xs text-white/40">Mon – Fri: 09:00 – 18:00 CET</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Clock className="h-4 w-4 text-[#0077B6]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80">Lefkada</div>
                      <div className="text-xs text-white/40">Mon – Sat: 08:00 – 20:00 EEST</div>
                      <div className="text-[10px] text-white/25 mt-0.5">Charter season: April – October</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family badge */}
              <div data-form-reveal className="rounded-xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(0,99,153,0.1), rgba(0,33,71,0.15))", border: "1px solid rgba(0,119,182,0.15)" }}>
                <div className="text-3xl mb-2">⚓</div>
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Family Business Since 1979
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  German-Greek family operation with deep roots in the Ionian Sea.
                  Personal service, not a call center.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OFFICES SECTION ─── */}
      <section ref={officesRef} className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="mb-3 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d]">
              Our Offices
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Two Offices, One Family
            </h2>
          </div>

          {/* Office toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {offices.map((office) => (
                <button
                  key={office.id}
                  onClick={() => setActiveOffice(office.id)}
                  className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-300"
                  style={{
                    background: activeOffice === office.id ? "linear-gradient(135deg, #006399, #002147)" : "transparent",
                    color: activeOffice === office.id ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <span className="mr-2">{office.flag}</span>
                  {office.label}
                </button>
              ))}
            </div>
          </div>

          {/* Office details card */}
          <div data-office-card className="grid md:grid-cols-2 gap-6">
            {/* Info */}
            <div className="rounded-xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ background: "rgba(0,119,182,0.1)" }}>
                  {selectedOffice.flag}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {selectedOffice.label}
                  </h3>
                  <p className="text-xs text-white/40">{selectedOffice.person}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#0077B6] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm text-white/70">{selectedOffice.address}</div>
                    <div className="text-xs text-white/30">{selectedOffice.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#0077B6] shrink-0" />
                  <a href={`tel:${selectedOffice.phone.replace(/\s/g, "")}`} className="text-sm text-white/70 hover:text-white transition-colors">
                    {selectedOffice.phone}
                  </a>
                </div>
                {selectedOffice.mobile && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#0077B6] shrink-0" />
                    <a href={`tel:${selectedOffice.mobile.replace(/\s/g, "")}`} className="text-sm text-white/70 hover:text-white transition-colors">
                      {selectedOffice.mobile} <span className="text-white/30 text-xs">(Mobile)</span>
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#0077B6] shrink-0" />
                  <a href={`mailto:${selectedOffice.email}`} className="text-sm text-white/70 hover:text-white transition-colors">
                    {selectedOffice.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#0077B6] shrink-0" />
                  <span className="text-sm text-white/70">{selectedOffice.hours}</span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div data-office-card className="rounded-xl overflow-hidden h-[320px]" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <iframe
                key={selectedOffice.id}
                src={selectedOffice.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${selectedOffice.label} location`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEAM SECTION ─── */}
      {staff.length > 0 && (
        <section ref={teamRef} className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="mb-3 inline-block rounded-full border border-[#83776d]/30 bg-[#070c26]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#83776d]">
                Our Team
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                Meet the People Behind IYC
              </h2>
            </div>

            <div data-team-card>
              <TeamGrid
                staff={staff}
                columns={staff.length <= 3 ? staff.length as 2 | 3 : 4}
                variant="minimal"
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BANNER ─── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #006399, #002147)", border: "1px solid rgba(167,237,255,0.1)" }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #A7EDFF, transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #fff, transparent 70%)", transform: "translate(-30%, 30%)" }} />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                Ready to Set Sail?
              </h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Browse our fleet and find the perfect yacht for your Ionian adventure.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/fleet"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#002147] transition-all hover:bg-white/90 hover:shadow-lg"
                >
                  Explore Fleet <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/locations"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  View Destinations
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

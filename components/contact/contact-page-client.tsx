"use client"

import Image from "next/image"
import Link from "@/components/locale-link"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Mail, Phone, MapPin, Send, Clock, Anchor, PlaneLanding,
  Globe, ArrowRight, CheckCircle2, Loader2,
  MessageSquare, Users, Ship, ChevronDown,
} from "lucide-react"
import { TeamGrid, type StaffMember } from "@/components/page-components/team-grid"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

gsap.registerPlugin(ScrollTrigger)

type T = Record<string, string>

interface ContactPageClientProps {
  staff: StaffMember[]
  content?: Record<string, unknown> | null
}

interface OfficeData {
  id: string
  label: string
  flag: string
  person: string
  address: string
  country: string
  phone: string
  mobile?: string
  email: string
  hours: string
  mapUrl: string
  coords?: { lat: number; lng: number }
}

const DEFAULT_OFFICES: OfficeData[] = [
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
    email: "Lefkas@iyc.de",
    hours: "Mon – Sat: 08:00 – 20:00 EEST (Season)",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12500!2d20.7069!3d38.8337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDUwJzAxLjMiTiAyMMKwNDInMjQuOCJF!5e0!3m2!1sen!2sgr!4v1",
    coords: { lat: 38.8337, lng: 20.7069 },
  },
]

const subjectDefs = [
  { value: "charter", labelKey: "contact.subject.charter", labelFallback: "Charter Enquiry", icon: Ship },
  { value: "general", labelKey: "contact.subject.general", labelFallback: "General Question", icon: MessageSquare },
  { value: "group", labelKey: "contact.subject.group", labelFallback: "Group / Corporate", icon: Users },
  { value: "other", labelKey: "contact.subject.other", labelFallback: "Something Else", icon: Globe },
]

export function ContactPageClient({ staff, content }: ContactPageClientProps) {
  const { t, tUpper, locale } = useTranslations()
  const subjects = subjectDefs.map((s) => ({ ...s, label: t(s.labelKey, s.labelFallback) }))

  // Resolve content from PageComponent props, falling back to hardcoded defaults
  const hero = (content?.hero || {}) as { badge?: T; title?: T; titleAccent?: T; subtitle?: T }
  const stats = (content?.stats as Array<{ num: string; label: T }> | undefined) || null
  const offices: OfficeData[] = (content?.offices as OfficeData[] | undefined) || DEFAULT_OFFICES
  const familyBadge = (content?.familyBadge || {}) as { title?: T; description?: T }
  const cta = (content?.cta || {}) as { title?: T; description?: T; primaryBtn?: T; primaryLink?: string; secondaryBtn?: T; secondaryLink?: string }

  function r(field: T | undefined, fallback: string) {
    if (!field) return fallback
    return field[locale] || field.en || fallback
  }

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

  const selectedOffice = offices.find((o) => o.id === activeOffice) ?? offices[0]!

  return (
    <>
      {/* ─── HERO ─── */}
      {/* Photographic hero, per the design kit: the picture carries the page
          under one vertical gradient that resolves into the ivory below. It
          was a flat --surface-inverse panel dressed with radial blurs and a
          grid overlay — the "capsule" the kit rules out. */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pt-32 pb-40" style={{ background: "var(--surface-page)" }}>
        <Image
          src="https://iycweb.b-cdn.net/general/1786438820966-people-sailing-on-yacht-during-sunny-day-2026-01-05-06-15-48-utc.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%]"
          data-parallax="0.16"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,13,25,.62) 0%, rgba(4,13,25,.34) 45%, var(--surface-page) 100%)",
          }}
        />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span
            data-hero-text
            className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm"
            style={{
              border: "1px solid rgba(246,206,145,0.42)",
              background: "rgba(226,150,60,0.16)",
              color: "var(--iyc-sun-300)",
            }}
          >
            {removeGreekTonos(r(hero.badge, tUpper("contact.badge", "Get In Touch")).toUpperCase())}
          </span>
          <h1
            data-hero-text
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {r(hero.title, t("contact.title", "Let's Plan Your"))}
            {" "}
            <span className="block mt-1" style={{ color: "var(--iyc-sun-300)" }}>
              {r(hero.titleAccent, t("contact.titleAccent", "Perfect Charter"))}
            </span>
          </h1>
          <p
            data-hero-text
            className="mx-auto mb-12 max-w-xl text-lg"
            style={{
              color: "var(--iyc-sand-200)",
              textShadow: "0 1px 3px rgba(4,13,25,.55), 0 1px 14px rgba(4,13,25,.34)",
            }}
          >
            {r(hero.subtitle, t("contact.subtitle", "Whether you have a question, want to book a yacht, or just want to say hello — our family team is here for you since 1979."))}
          </p>

          {/* The question that comes before every other one. It sits above the
              stats because somebody on this page is usually working out
              whether they can get here at all. */}
          <div className="mb-12 flex justify-center">
            <Link
              href="/getting-here"
              className="group inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300"
              style={{
                background: "color-mix(in srgb, var(--iyc-sand-50) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--iyc-sand-50) 25%, transparent)",
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              <PlaneLanding className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("contact.gettingHere", "Flights to Preveza & transfers")}
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {(stats ?? [
              { num: "45+", label: { en: tUpper("contact.stat.experience", "Years of Experience") } },
              { num: "2", label: { en: tUpper("contact.stat.offices", "Offices Worldwide") } },
              { num: "24h", label: { en: tUpper("contact.stat.response", "Response Time") } },
            ]).map((stat) => (
              <div key={stat.num} data-stat className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.num}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--iyc-sand-200)" }}>
                  {removeGreekTonos(r(stat.label, ""))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <div className="flex flex-col items-center gap-2" style={{ color: "var(--iyc-sand-300)" }}>
            <span className="text-[10px] uppercase tracking-widest">{removeGreekTonos(tUpper("contact.scroll", "Scroll"))}</span>
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
              <div className="rounded-xl p-8 md:p-10" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-hairline)" }}>
                {status === "sent" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--iyc-ionian-50)" }}>
                      <CheckCircle2 className="h-8 w-8 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-heading)] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                      {t("contact.form.sent", "Message Sent!")}
                    </h3>
                    <p className="text-[var(--text-muted)] max-w-sm mb-8">
                      {t("contact.form.sentDesc", "Thank you for reaching out. We'll get back to you within 24 hours.")}
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="text-sm text-[var(--iyc-ionian-500)] hover:text-[var(--iyc-ionian-100)] transition-colors flex items-center gap-2"
                    >
                      {t("contact.form.sendAnother", "Send another message")} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        {t("contact.form.heading", "Send Us a Message")}
                      </h2>
                      <p className="text-sm text-[var(--text-subtle)]">{t("contact.form.required", "All fields marked with * are required")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Subject selector */}
                      <div data-form-reveal>
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-3 block">
                          {tUpper("contact.form.helpWith", "What can we help with?")}
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
                                  background: active ? "var(--iyc-ionian-50)" : "var(--surface-sunken)",
                                  border: `1px solid ${active ? "var(--iyc-ionian-500)" : "var(--border-hairline)"}`,
                                  color: active ? "var(--iyc-ionian-700)" : "var(--text-muted)",
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
                          <label htmlFor="contact-first-name" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 block">{tUpper("contact.form.firstName", "First Name")} *</label>
                          <input
                            type="text"
                            required
                            value={form.firstName}
                            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                            className="w-full rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--text-link)]"
                            style={{ background: "var(--surface-card)", border: "1px solid var(--border-input)" }}
                            id="contact-first-name"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-last-name" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 block">{tUpper("contact.form.lastName", "Last Name")}</label>
                          <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                            className="w-full rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--text-link)]"
                            style={{ background: "var(--surface-card)", border: "1px solid var(--border-input)" }}
                            id="contact-last-name"
                            placeholder="Smith"
                          />
                        </div>
                      </div>

                      {/* Email + Phone */}
                      <div data-form-reveal className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 block">{tUpper("contact.form.email", "Email")} *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--text-link)]"
                            style={{ background: "var(--surface-card)", border: "1px solid var(--border-input)" }}
                            id="contact-email"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 block">{tUpper("contact.form.phone", "Phone")}</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--text-link)]"
                            style={{ background: "var(--surface-card)", border: "1px solid var(--border-input)" }}
                            id="contact-phone"
                            placeholder="+49 160 ..."
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div data-form-reveal>
                        <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 block">{tUpper("contact.form.message", "Message")} *</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                          className="w-full resize-none rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--text-link)]"
                          style={{ background: "var(--surface-card)", border: "1px solid var(--border-input)" }}
                          id="contact-message"
                            placeholder={t("contact.form.messagePlaceholder", "Tell us about your dream charter, ask us anything...")}
                        />
                      </div>

                      {/* Submit */}
                      <div data-form-reveal className="flex items-center gap-4 pt-2">
                        <button
                          type="submit"
                          disabled={status === "sending"}
                          className="group relative inline-flex items-center gap-2.5 rounded-[var(--iyc-radius-sm)] px-8 py-3.5 text-sm font-semibold transition-all duration-300 hover:shadow-[var(--shadow-md)] active:scale-[0.985] disabled:opacity-50"
                          style={{ background: "var(--action-accent)", color: "var(--text-on-accent)" }}
                        >
                          {status === "sending" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("contact.form.sending", "Sending...")}
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              {t("contact.form.send", "Send Message")}
                            </>
                          )}
                        </button>
                        {status === "error" && (
                          <span className="text-sm text-red-400">{t("contact.form.error", "Something went wrong. Please try again.")}</span>
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
              <div data-form-reveal className="rounded-xl p-6" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-hairline)" }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">{tUpper("contact.directContact", "Direct Contact")}</h3>
                <div className="space-y-4">
                  <a href="mailto:info@iyc.de" className="group flex items-start gap-3 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Mail className="h-4 w-4 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-body)] group-hover:text-[var(--text-heading)] transition-colors">info@iyc.de</div>
                      <div className="text-xs text-[var(--text-subtle)]">{t("contact.generalEnquiries", "General enquiries")}</div>
                    </div>
                  </a>
                  <a href="mailto:bookings@iyc.de" className="group flex items-start gap-3 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Anchor className="h-4 w-4 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-body)] group-hover:text-[var(--text-heading)] transition-colors">bookings@iyc.de</div>
                      <div className="text-xs text-[var(--text-subtle)]">{t("contact.charterBookings", "Charter bookings")}</div>
                    </div>
                  </a>
                  <a href="tel:+4916099279870" className="group flex items-start gap-3 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Phone className="h-4 w-4 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-body)] group-hover:text-[var(--text-heading)] transition-colors">+49 160 99279870</div>
                      <div className="text-xs text-[var(--text-subtle)]">{t("contact.munichOffice", "Munich office")}</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Office hours card */}
              <div data-form-reveal className="rounded-xl p-6" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-hairline)" }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">{tUpper("contact.officeHours", "Office Hours")}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Clock className="h-4 w-4 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-body)]">Munich</div>
                      <div className="text-xs text-[var(--text-subtle)]">Mon – Fri: 09:00 – 18:00 CET</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,119,182,0.1)" }}>
                      <Clock className="h-4 w-4 text-[var(--iyc-ionian-500)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-body)]">Lefkada</div>
                      <div className="text-xs text-[var(--text-subtle)]">Mon – Sat: 08:00 – 20:00 EEST</div>
                      <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">{t("contact.charterSeason", "Charter season: April – October")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family badge */}
              <div data-form-reveal className="rounded-xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(0,99,153,0.1), rgba(46,44,40,0.15))", border: "1px solid var(--iyc-ionian-50)" }}>
                <div className="text-3xl mb-2">⚓</div>
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {r(familyBadge.title, t("contact.familyBusiness", "Family Business Since 1979"))}
                </h3>
                <p className="text-xs text-[var(--text-subtle)] leading-relaxed">
                  {r(familyBadge.description, t("contact.familyDesc", "German-Greek family operation with deep roots in the Ionian Sea. Personal service, not a call center."))}
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
            <span className="mb-3 inline-block rounded-full border border-[var(--border-default)] bg-[var(--surface-sunken)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)]">
              {tUpper("contact.offices.badge", "Our Offices")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              {t("contact.offices.title", "Two Offices, One Family")}
            </h2>
          </div>

          {/* Office toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg p-1" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}>
              {offices.filter(Boolean).map((office) => (
                <button
                  key={office.id}
                  onClick={() => setActiveOffice(office.id)}
                  className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-300"
                  style={{
                    background: activeOffice === office.id ? "linear-gradient(135deg, var(--iyc-ionian-600), var(--iyc-ionian-800))" : "transparent",
                    color: activeOffice === office.id ? "#fff" : "var(--text-muted)",
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
            <div className="rounded-xl p-8" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-hairline)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ background: "rgba(0,119,182,0.1)" }}>
                  {selectedOffice.flag}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-display)" }}>
                    {selectedOffice.label}
                  </h3>
                  <p className="text-xs text-[var(--text-subtle)]">{selectedOffice.person}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[var(--iyc-ionian-500)] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm text-[var(--text-body)]">{selectedOffice.address}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{selectedOffice.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[var(--iyc-ionian-500)] shrink-0" />
                  <a href={`tel:${selectedOffice.phone.replace(/\s/g, "")}`} className="text-sm text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors">
                    {selectedOffice.phone}
                  </a>
                </div>
                {selectedOffice.mobile && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[var(--iyc-ionian-500)] shrink-0" />
                    <a href={`tel:${selectedOffice.mobile.replace(/\s/g, "")}`} className="text-sm text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors">
                      {selectedOffice.mobile} <span className="text-[var(--text-subtle)] text-xs">({t("contact.mobile", "Mobile")})</span>
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[var(--iyc-ionian-500)] shrink-0" />
                  <a href={`mailto:${selectedOffice.email}`} className="text-sm text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors">
                    {selectedOffice.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[var(--iyc-ionian-500)] shrink-0" />
                  <span className="text-sm text-[var(--text-body)]">{selectedOffice.hours}</span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div data-office-card className="rounded-xl overflow-hidden h-[320px]" style={{ border: "1px solid var(--border-hairline)" }}>
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
              <span className="mb-3 inline-block rounded-full border border-[var(--border-default)] bg-[var(--surface-sunken)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)]">
                {tUpper("contact.team.badge", "Our Team")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {t("contact.team.title", "Meet the People Behind IYC")}
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
          {/* Split, not washed. A single overlay could either let the rope and
              winch read or let the type read, never both: dark enough for white
              copy buried the picture, light enough to see it left the ink
              floating. Giving each its own half settles the argument. */}
          <div
            className="relative grid overflow-hidden rounded-[var(--iyc-radius-lg)] border border-[var(--border-hairline)] md:grid-cols-[1fr_1fr]"
            style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="relative min-h-[220px] md:min-h-[300px]">
              <Image
                src="https://iycweb.b-cdn.net/general/1786513674472-red-rope-and-metal-winch-on-white-sailboat-2026-03-16-04-26-06-utc.webp"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
              />
              {/* Only where the picture meets the panel, so the seam is a fade
                  rather than a cut. */}
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 hidden w-24 md:block"
                style={{ background: "linear-gradient(to right, transparent, var(--surface-card))" }}
              />
            </div>

            <div className="p-10 text-center md:p-12 md:text-left">
              <h2
                className="mb-3 text-2xl font-bold md:text-3xl"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                  color: "var(--text-heading)",
                }}
              >
                {r(cta.title, t("contact.cta.title", "Ready to Set Sail?"))}
              </h2>
              <p
                className="mb-8 max-w-md md:mx-0"
                style={{ color: "var(--text-muted)" }}
              >
                {r(cta.description, t("contact.cta.desc", "Browse our fleet and find the perfect yacht for your Ionian adventure."))}
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                <a
                  href={cta.primaryLink || "/fleet"}
                  className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                  style={{
                    background: "var(--action-accent)",
                    color: "var(--text-on-accent)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {r(cta.primaryBtn, t("contact.cta.exploreFleet", "Explore Fleet"))} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={cta.secondaryLink || "/locations"}
                  className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold transition-all hover:bg-black/[0.04]"
                  style={{
                    border: "1px solid var(--border-input)",
                    color: "var(--text-heading)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {r(cta.secondaryBtn, t("contact.cta.viewDestinations", "View Destinations"))}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

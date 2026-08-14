import type { Metadata } from "next"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbLd, faqLd } from "@/lib/structured-data"
import { pageMeta, en } from "@/lib/seo"
import { getAllFaqs } from "@/lib/faqs"
import { FaqList } from "./faq-list"

export const dynamic = "force-dynamic"

const HERO =
  "https://iycweb.b-cdn.net/general/1786528738613-hand-of-man-captain-stands-at-the-helm-and-control-2026-03-20-02-05-13-utc.webp"

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: "Chartering in Lefkada — Your Questions Answered",
    description:
      "Licences, getting to Lefkada, when to sail, what a charter includes, one-way trips and the floating bridge — answered plainly by the people who run the base.",
    path: "/faq",
  })
}

export default async function FaqPage() {
  const faqs = await getAllFaqs()

  return (
    <main>
      {/* The schema describes what is on the page, not instead of it. */}
      <JsonLd
        data={[
          faqLd(faqs.map((f) => ({ question: en(f.question), answer: en(f.answer) }))),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Questions", path: "/faq" },
          ]),
        ]}
      />

      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        <section className="relative w-full overflow-hidden" style={{ minHeight: 420 }}>
          <Image src={HERO} alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,13,25,.62) 0%, rgba(4,13,25,.34) 40%, rgba(4,13,25,.55) 74%, var(--surface-page) 100%)",
            }}
          />
          <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 pb-32 pt-32 text-center md:pb-36 md:pt-40">
            <h1
              className="text-[clamp(2.1rem,4.4vw,3.25rem)] font-light leading-[1.08] text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
            >
              Chartering in Lefkada, answered
            </h1>
            <p className="mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
              What people ask us before they book — licences, getting here, when to sail, and what a
              week actually costs.
            </p>
          </div>
        </section>

        <FaqList faqs={faqs} />
      </div>

      <SiteFooter />
    </main>
  )
}

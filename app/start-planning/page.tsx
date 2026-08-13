import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PlanAgent } from "@/components/plan/plan-agent"
import { PlanIntro } from "@/components/plan/plan-intro"
import { getMottoRaw } from "@/lib/mottos"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Plan your voyage | IYC Yachts",
  description:
    "Tell us when, who is coming and how you like to sail. We answer personally with the boat that fits.",
}

const HERO =
  "https://iycweb.b-cdn.net/general/1786438820966-people-sailing-on-yacht-during-sunny-day-2026-01-05-06-15-48-utc.webp"

export default async function PlanPage() {
  const motto = await getMottoRaw("plan-your-voyage")

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />

        {/* Compact photographic hero — the conversation is the page, so the
            hero introduces it and gets out of the way. */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: 380 }}>
          <Image src={HERO} alt="" fill priority className="object-cover" sizes="100vw" />
          {/* Both ends, not bottom-heavy: the copy sits in the middle. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,13,25,.62) 0%, rgba(4,13,25,.34) 42%, rgba(4,13,25,.55) 72%, var(--surface-page) 100%)",
            }}
          />
          <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 pb-24 pt-32 text-center md:pt-36">
            <PlanIntro motto={motto} />
          </div>
        </section>

        <section className="relative w-full" style={{ background: "var(--surface-page)" }}>
          <div className="mx-auto -mt-16 max-w-[840px] px-6 pb-24">
            <PlanAgent />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}

import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewsletterResult } from "./newsletter-result"

export const dynamic = "force-dynamic"

/* Where confirm and unsubscribe land. Not somewhere to be found in search. */
export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
}

export default async function NewsletterStatePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>
}) {
  const { state } = await searchParams

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "var(--surface-page)", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <NewsletterResult state={state ?? ""} />
      </div>
      <SiteFooter />
    </main>
  )
}

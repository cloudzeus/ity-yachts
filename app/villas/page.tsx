import type { Metadata } from "next"
import { metaStrings } from "@/lib/meta.server"
import { pageMeta } from "@/lib/seo"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { VillasClient } from "./villas-client"

/**
 * The villas, for guests who want a few days on land.
 *
 * A short page that ends at somebody else's site, which is unusual enough to
 * be worth saying: the villas have their own, and it is better at selling
 * them than a second copy here would ever be. What this page is for is the
 * connection — that they belong to the same family who run the base — which
 * is the one thing their site cannot tell a charter guest.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await metaStrings()
  return pageMeta({
    title: m("meta.villas.title", "Our Villas on Lefkada — Ionian Dream Villas"),
    description: m(
      "meta.villas.description",
      "Three villas with private pools a few minutes from the water on Lefkada, built and run by the family behind IYC. Ideal either side of a charter."
    ),
    path: "/villas",
  })
}

export default function VillasPage() {
  return (
    <>
      <SiteHeader />
      <VillasClient />
      <SiteFooter />
    </>
  )
}

import type { Metadata } from "next"
import { metaStrings } from "@/lib/meta.server"
import { pageMeta } from "@/lib/seo"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { flightsByCountry } from "@/lib/flights"
import { db } from "@/lib/db"
import { asTransfers } from "@/lib/transfers"
import { GettingHereClient } from "./getting-here-client"

/**
 * How to reach the pontoon.
 *
 * Every guest arrives by air into Preveza and then has forty minutes of
 * questions nobody had answered: which airlines fly there, on what days, and
 * how you cover the last twenty kilometres. The office answered it in a PDF
 * redrawn once a year — correct in January and stale by August.
 *
 * The schedules are read from what the daily job stored, so the page costs
 * nothing to serve and cannot be broken by an API outage. The transfers are
 * ours; no flight service knows them, and they are the reason to have a page
 * rather than a link to Skyscanner.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await metaStrings()
  return pageMeta({
    title: m("meta.gettingHere.title", "Getting to Lefkada — Flights to Preveza & Transfers"),
    description: m(
      "meta.gettingHere.description",
      "Direct flights to Preveza (PVK) by country and day, and how to cover the last 20 minutes to our pontoon in Lefkada. Updated daily from airline schedules."
    ),
    path: "/getting-here",
  })
}

export default async function GettingHerePage() {
  const [countries, row] = await Promise.all([
    flightsByCountry(),
    db.setting.findUnique({ where: { key: "transfers" } }),
  ])
  const transfers = asTransfers(row?.value)
  return (
    <>
      <SiteHeader />
      <GettingHereClient countries={countries} transfers={transfers} />
      <SiteFooter />
    </>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSiteSettings } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

/**
 * Leaving the list.
 *
 * One click from the link in any email, with no sign-in and no questions — an
 * unsubscribe that asks the reader to log in or explain themselves is not an
 * unsubscribe. The row is kept and marked, rather than deleted, so the address
 * is not accidentally re-added by an old import.
 */
export async function GET(req: NextRequest) {
  const site = await getSiteSettings()
  const token = req.nextUrl.searchParams.get("token")?.trim()

  const back = (state: string) =>
    NextResponse.redirect(`${site.siteUrl}/newsletter?state=${state}`, { status: 303 })

  if (!token) return back("invalid")

  const subscriber = await db.newsletterSubscriber.findUnique({ where: { token } })
  if (!subscriber) return back("invalid")

  if (subscriber.status !== "unsubscribed") {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "unsubscribed", unsubscribedAt: new Date() },
    })
  }

  return back("unsubscribed")
}

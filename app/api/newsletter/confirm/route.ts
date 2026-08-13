import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendMail } from "@/lib/mail"
import { getSiteSettings } from "@/lib/site-settings"
import { welcomeEmail } from "@/lib/newsletter-email"

export const dynamic = "force-dynamic"

/**
 * The second half of the double opt-in.
 *
 * Following this link is the moment consent exists — before it, the address is
 * only a claim somebody typed into a form.
 */
export async function GET(req: NextRequest) {
  const site = await getSiteSettings()
  const token = req.nextUrl.searchParams.get("token")?.trim()

  const back = (state: string) =>
    NextResponse.redirect(`${site.siteUrl}/newsletter?state=${state}`, { status: 303 })

  if (!token) return back("invalid")

  const subscriber = await db.newsletterSubscriber.findUnique({ where: { token } })
  if (!subscriber) return back("invalid")

  // Following the link twice is not an error — say the same thing.
  if (subscriber.status === "subscribed") return back("confirmed")

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "subscribed", confirmedAt: new Date(), unsubscribedAt: null },
  })

  const locale = (["en", "el", "de"].includes(subscriber.locale) ? subscriber.locale : "en") as "en" | "el" | "de"
  const mail = welcomeEmail(
    locale,
    `${site.siteUrl}/fleet`,
    `${site.siteUrl}/api/newsletter/unsubscribe?token=${subscriber.token}`
  )

  try {
    await sendMail({ to: subscriber.email, subject: mail.subject, html: mail.html, text: mail.text })
  } catch (error) {
    // They are on the list; a failed welcome is not worth failing the confirm.
    console.error("[newsletter] welcome send failed", error)
  }

  return back("confirmed")
}

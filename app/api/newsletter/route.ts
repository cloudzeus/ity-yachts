import { createHash, randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendMail } from "@/lib/mail"
import { getSiteSettings } from "@/lib/site-settings"
import { confirmEmail } from "@/lib/newsletter-email"

export const dynamic = "force-dynamic"

const LOCALES = ["en", "el", "de"] as const
type Locale = (typeof LOCALES)[number]

/* Deliberately permissive: the confirmation email is the real check on whether
   an address exists, so a clever regex only rejects valid unusual addresses. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Proof of opt-in without keeping an address we would then have to protect. */
const hashIp = (ip: string) =>
  createHash("sha256").update(`${ip}:${process.env.NEXTAUTH_SECRET ?? "iyc"}`).digest("hex").slice(0, 32)

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string; locale?: string; source?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }

  /* A honeypot the form keeps hidden. Bots fill everything; people cannot see
     it. Answer 200 so a bot learns nothing from the response. */
  if (body.website) return NextResponse.json({ ok: true })

  const email = (body.email ?? "").trim().toLowerCase()
  if (!LOOKS_LIKE_EMAIL.test(email)) {
    return NextResponse.json({ error: "email" }, { status: 400 })
  }

  const locale: Locale = LOCALES.includes(body.locale as Locale) ? (body.locale as Locale) : "en"
  const name = (body.name ?? "").trim().slice(0, 120) || null
  const source = (body.source ?? "footer").slice(0, 64)

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || ""
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 255)

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } })

  /* Already confirmed: say the same thing as for a new sign-up. Confirming or
     denying who is on the list would leak it to anyone with a guess. */
  if (existing?.status === "subscribed") {
    return NextResponse.json({ ok: true, already: true })
  }

  // A fresh token each time, so an old link in an old inbox stops working.
  const token = randomBytes(24).toString("hex")

  const subscriber = existing
    ? await db.newsletterSubscriber.update({
        where: { email },
        data: { token, locale, name: name ?? existing.name, status: "pending", source, ipHash: ip ? hashIp(ip) : null, userAgent, unsubscribedAt: null },
      })
    : await db.newsletterSubscriber.create({
        data: { email, name, locale, token, status: "pending", source, ipHash: ip ? hashIp(ip) : null, userAgent },
      })

  const site = await getSiteSettings()
  const confirmUrl = `${site.siteUrl}/api/newsletter/confirm?token=${subscriber.token}`
  const mail = confirmEmail(locale, confirmUrl)

  try {
    await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text })
  } catch (error) {
    console.error("[newsletter] confirmation send failed", error)
    // The row stays pending; the address is not on the list either way.
    return NextResponse.json({ error: "send" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

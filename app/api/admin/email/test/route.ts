import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { sendMail } from "@/lib/mail"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { to } = await req.json()
    if (!to) return NextResponse.json({ error: "Missing 'to' address" }, { status: 400 })

    await sendMail({
      to,
      subject: "IYC Yachts — Test Email",
      html: `<p>This is a test email sent from your <strong>IYC Yachts</strong> admin panel to confirm Mailgun is configured correctly.</p>`,
      text: "This is a test email sent from your IYC Yachts admin panel to confirm Mailgun is configured correctly.",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

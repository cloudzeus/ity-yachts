import { db } from "@/lib/db"

interface MailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

interface EmailSettings {
  mailgunApiKey: string
  mailgunDomain: string
  mailgunRegion: "us" | "eu"
  fromName: string
  fromEmail: string
}

async function getEmailSettings(): Promise<EmailSettings> {
  const record = await db.setting.findUnique({ where: { key: "email" } })
  if (!record) throw new Error("Email settings not configured")
  const s = record.value as Record<string, string>
  if (!s.mailgunApiKey || !s.mailgunDomain) {
    throw new Error("Mailgun API key and domain are required")
  }
  return {
    mailgunApiKey: s.mailgunApiKey,
    mailgunDomain: s.mailgunDomain,
    mailgunRegion: (s.mailgunRegion as "us" | "eu") || "eu",
    fromName: s.fromName || "IYC Yachts",
    fromEmail: s.fromEmail || `noreply@${s.mailgunDomain}`,
  }
}

export async function sendMail(options: MailOptions): Promise<void> {
  const config = await getEmailSettings()

  const to = Array.isArray(options.to) ? options.to.join(",") : options.to
  const from = `${config.fromName} <${config.fromEmail}>`

  const body = new URLSearchParams()
  body.set("from", from)
  body.set("to", to)
  body.set("subject", options.subject)
  if (options.html) body.set("html", options.html)
  if (options.text) body.set("text", options.text)
  if (options.replyTo) body.set("h:Reply-To", options.replyTo)

  const credentials = Buffer.from(`api:${config.mailgunApiKey}`).toString("base64")

  const apiBase = config.mailgunRegion === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net"

  const res = await fetch(
    `https://${apiBase}/v3/${config.mailgunDomain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mailgun error ${res.status}: ${err}`)
  }
}

import { db } from "@/lib/db"
import { sendMail } from "@/lib/mail"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, subject, message } = body

    if (!firstName || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Find or create customer
    let customer = await db.customer.findFirst({ where: { email } })
    if (!customer) {
      customer = await db.customer.create({
        data: {
          firstName,
          lastName: lastName || "",
          email,
          phone: phone || null,
        },
      })
    }

    // Create enquiry with contact form source
    const enquiry = await db.enquiry.create({
      data: {
        customerId: customer.id,
        status: "NEW",
        notes: `[Contact Form]\nSubject: ${subject || "General Enquiry"}\n\n${message}`,
        source: "WEBSITE",
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    })

    // Send confirmation email to customer
    await sendMail({
      to: email,
      subject: "Thank you for contacting IYC Yachts",
      replyTo: "info@iyc.de",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5F1E9;">
          <div style="background: #05111F; padding: 32px 24px; text-align: center;">
            <img src="https://iycweb.b-cdn.net/IYC_LOGO_TRANS_white.svg" alt="IYC Yachts" height="48" />
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #05111F; font-size: 20px; margin: 0 0 16px;">Thank you, ${firstName}!</h2>
            <p style="color: #6B5F57; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              We've received your message and our team will get back to you shortly.
            </p>
            <div style="background: #fff; border-radius: 8px; padding: 20px; border: 1px solid #EBE4D8;">
              <p style="color: #6B5F57; font-size: 13px; margin: 0 0 8px;"><strong>Subject:</strong> ${subject || "General Enquiry"}</p>
              <p style="color: #6B5F57; font-size: 13px; margin: 0; white-space: pre-wrap;"><strong>Message:</strong> ${message}</p>
            </div>
            <p style="color: #6B5F57; font-size: 14px; line-height: 1.6; margin: 16px 0 0;">
              In the meantime, feel free to explore our <a href="https://iyc.de/fleet" style="color: #0B6099;">yacht fleet</a> or
              browse our <a href="https://iyc.de/locations" style="color: #0B6099;">destinations</a>.
            </p>
          </div>
          <div style="padding: 24px; text-align: center; border-top: 1px solid #EBE4D8;">
            <p style="color: #999; font-size: 12px; margin: 0;">IYC Ionische Yacht Charter · info@iyc.de · +49 160 99279870</p>
          </div>
        </div>
      `,
    })

    // Send notification to admin team
    await sendMail({
      to: ["info@iyc.de"],
      subject: `New Contact: ${subject || "General Enquiry"} — ${firstName} ${lastName || ""}`.trim(),
      replyTo: email,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #05111F; padding: 24px; color: #fff;">
            <h2 style="margin: 0; font-size: 18px;">New Contact Form Submission</h2>
          </div>
          <div style="padding: 24px; background: #fff;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #999; width: 100px;">Name</td><td style="padding: 8px 0; color: #2E2C28;">${firstName} ${lastName || ""}</td></tr>
              <tr><td style="padding: 8px 0; color: #999;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0B6099;">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #999;">Phone</td><td style="padding: 8px 0; color: #2E2C28;">${phone}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #999;">Subject</td><td style="padding: 8px 0; color: #2E2C28;">${subject || "General Enquiry"}</td></tr>
              <tr><td style="padding: 8px 0; color: #999; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #2E2C28; white-space: pre-wrap;">${message}</td></tr>
            </table>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ enquiry, message: "Message sent successfully" })
  } catch (error) {
    console.error("[POST /api/contact]", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

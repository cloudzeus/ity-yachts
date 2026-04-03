import { db } from "@/lib/db"
import { sendMail } from "@/lib/mail"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      firstName, lastName, email, phone,
      yachtId, yachtName, checkIn, checkOut,
      guests, estimatedPrice, currency, notes,
    } = body

    if (!firstName || !email || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "First name, email, check-in and check-out dates are required" },
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

    // Create enquiry
    const enquiry = await db.enquiry.create({
      data: {
        customerId: customer.id,
        status: "NEW",
        dateFrom: new Date(checkIn),
        dateTo: new Date(checkOut),
        guests: guests ? parseInt(guests) : null,
        budget: estimatedPrice ? parseFloat(estimatedPrice) : null,
        currency: currency || "EUR",
        notes: notes
          ? `Yacht: ${yachtName || yachtId}\n${notes}`
          : `Yacht: ${yachtName || yachtId}`,
        source: "WEBSITE",
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    })

    // Format dates for email
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    })

    const priceDisplay = estimatedPrice
      ? `${currency === "EUR" ? "\u20AC" : currency}${Number(estimatedPrice).toLocaleString("de-DE")}`
      : "On request"

    // Send confirmation email to customer
    const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="background:#070c26;padding:32px 32px 24px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">IYC Yachts</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Quote Request Confirmation</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 20px;color:#070c26;font-size:15px;line-height:1.6;">
          Dear ${firstName},
        </p>
        <p style="margin:0 0 24px;color:#444;font-size:14px;line-height:1.6;">
          Thank you for your interest! We have received your quote request and our team will get back to you shortly.
        </p>
        <div style="background:#f7f7f5;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#84776e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Yacht</td>
              <td style="padding:8px 0;color:#070c26;font-size:14px;font-weight:600;text-align:right;">${yachtName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#84776e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Check-in</td>
              <td style="padding:8px 0;color:#070c26;font-size:14px;text-align:right;">${fmtDate(checkIn)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#84776e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Check-out</td>
              <td style="padding:8px 0;color:#070c26;font-size:14px;text-align:right;">${fmtDate(checkOut)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#84776e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Guests</td>
              <td style="padding:8px 0;color:#070c26;font-size:14px;text-align:right;">${guests || "N/A"}</td>
            </tr>
            <tr style="border-top:1px solid #e5e5e0;">
              <td style="padding:12px 0 8px;color:#84776e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Estimated Price</td>
              <td style="padding:12px 0 8px;color:#070c26;font-size:18px;font-weight:700;text-align:right;">${priceDisplay}</td>
            </tr>
          </table>
        </div>
        ${notes ? `<div style="background:#f0f7ff;border-radius:8px;padding:16px;margin-bottom:24px;"><p style="margin:0;color:#0055a9;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Your Notes</p><p style="margin:0;color:#444;font-size:14px;line-height:1.5;">${notes}</p></div>` : ""}
        <p style="margin:0;color:#888;font-size:13px;line-height:1.5;">
          Our charter specialist will contact you within 24 hours. If you have any urgent questions, feel free to reply to this email.
        </p>
      </div>
      <div style="padding:20px 32px;background:#f7f7f5;border-top:1px solid #eee;">
        <p style="margin:0;color:#aaa;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} IYC Yachts. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`

    // Send notification email to admin team
    const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="background:#0055a9;padding:32px 32px 24px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">New Quote Request</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">From ${firstName} ${lastName || ""}</p>
      </div>
      <div style="padding:32px;">
        <div style="background:#f7f7f5;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#070c26;font-size:14px;font-weight:600;">Customer Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Name</td>
              <td style="padding:6px 0;color:#070c26;font-size:14px;text-align:right;">${firstName} ${lastName || ""}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Email</td>
              <td style="padding:6px 0;color:#070c26;font-size:14px;text-align:right;"><a href="mailto:${email}" style="color:#0055a9;">${email}</a></td>
            </tr>
            ${phone ? `<tr><td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Phone</td><td style="padding:6px 0;color:#070c26;font-size:14px;text-align:right;"><a href="tel:${phone}" style="color:#0055a9;">${phone}</a></td></tr>` : ""}
          </table>
        </div>
        <div style="background:#f7f7f5;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#070c26;font-size:14px;font-weight:600;">Booking Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Yacht</td>
              <td style="padding:6px 0;color:#070c26;font-size:14px;font-weight:600;text-align:right;">${yachtName || yachtId}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Dates</td>
              <td style="padding:6px 0;color:#070c26;font-size:14px;text-align:right;">${fmtDate(checkIn)} &mdash; ${fmtDate(checkOut)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#84776e;font-size:12px;font-weight:600;">Guests</td>
              <td style="padding:6px 0;color:#070c26;font-size:14px;text-align:right;">${guests || "N/A"}</td>
            </tr>
            <tr style="border-top:1px solid #e5e5e0;">
              <td style="padding:12px 0 6px;color:#84776e;font-size:12px;font-weight:600;">Estimated Price</td>
              <td style="padding:12px 0 6px;color:#070c26;font-size:18px;font-weight:700;text-align:right;">${priceDisplay}</td>
            </tr>
          </table>
        </div>
        ${notes ? `<div style="background:#fff8e1;border-radius:8px;padding:16px;margin-bottom:20px;"><p style="margin:0;color:#b8860b;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Customer Notes</p><p style="margin:0;color:#444;font-size:14px;line-height:1.5;">${notes}</p></div>` : ""}
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/enquiries" style="display:block;text-align:center;background:#0055a9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View in Admin Panel</a>
      </div>
    </div>
  </div>
</body>
</html>`

    // Send emails (non-blocking - don't fail the request if email fails)
    const adminEmails = process.env.TEAMS_BOOKING_EMAILS?.split(",").map(e => e.trim()).filter(Boolean) || []

    Promise.all([
      sendMail({
        to: email,
        subject: `Quote Request Received - ${yachtName || "IYC Yachts"}`,
        html: customerHtml,
      }),
      adminEmails.length > 0
        ? sendMail({
            to: adminEmails,
            subject: `New Quote Request: ${yachtName} - ${firstName} ${lastName || ""}`,
            html: adminHtml,
            replyTo: email,
          })
        : Promise.resolve(),
    ]).catch((err) => console.error("[Enquiry email error]", err))

    return NextResponse.json({ enquiry, message: "Quote request submitted successfully" }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/enquiries]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

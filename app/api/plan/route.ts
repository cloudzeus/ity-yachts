import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendMail } from "@/lib/mail"
import { buildPlanBrief } from "@/lib/plan-brief"
import { customerEmail, teamEmail, textVersion } from "@/lib/plan-email"
import { crewSize, validate, type PlanAnswers } from "@/lib/plan-wizard"

export const dynamic = "force-dynamic"

/** A date the model supplied — never trusted enough to hand straight to Prisma. */
function dateBound(iso?: string): Date | null {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Close of the planning conversation: save it, brief it, send it.
 *
 * The enquiry is written before anything else happens. A brief that fails to
 * generate, or a mail server that is down, must never cost us the request —
 * both are best-effort, and the row is already in the admin either way.
 */
export async function POST(req: NextRequest) {
  let enquiryId: string | null = null

  try {
    const answers = (await req.json()) as PlanAnswers

    const missing = validate(answers)
    if (missing) {
      return NextResponse.json({ error: "incomplete", field: missing }, { status: 400 })
    }

    const email = answers.email.trim().toLowerCase()

    let customer = await db.customer.findFirst({ where: { email } })
    if (!customer) {
      customer = await db.customer.create({
        data: {
          firstName: answers.firstName.trim(),
          lastName: (answers.lastName || "").trim(),
          email,
          phone: answers.phone?.trim() || undefined,
        },
      })
    } else if (answers.phone && !customer.phone) {
      customer = await db.customer.update({
        where: { id: customer.id },
        data: { phone: answers.phone.trim() },
      })
    }

    const enquiry = await db.enquiry.create({
      data: {
        customerId: customer.id,
        status: "NEW",
        source: "WIZARD",
        /* A window fills the date columns with its outer bounds, so the admin
           list and its date filters work for it too. `wizard.timing` is what
           says whether those are the charter itself or the span around it. */
        dateFrom: dateBound(answers.timing === "exact" ? answers.dateFrom : answers.windowFrom),
        dateTo: dateBound(answers.timing === "exact" ? answers.dateTo : answers.windowTo),
        guests: crewSize(answers) || null,
        preferredCategory: answers.boatKind === "either" ? null : answers.boatKind,
        budget: answers.budgetTo ?? answers.budgetFrom ?? null,
        currency: "EUR",
        notes: answers.notes?.trim() || null,
        wizard: answers as unknown as object,
      },
    })
    enquiryId = enquiry.id

    // Best-effort from here. Everything below can fail without losing the request.
    const brief = await buildPlanBrief(answers).catch(() => null)
    if (brief) {
      await db.enquiry
        .update({
          where: { id: enquiry.id },
          data: {
            aiBrief: [
              brief.summary,
              brief.shortlist.length ? "\nFits: " + brief.shortlist.map((s) => `${s.yacht} — ${s.why}`).join("; ") : "",
              brief.suggests.length ? "\nIdeas: " + brief.suggests.join("; ") : "",
              brief.asks.length ? "\nConfirm: " + brief.asks.join("; ") : "",
            ].filter(Boolean).join("\n").trim(),
          },
        })
        .catch(() => {})
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || ""
    const adminUrl = `${base}/admin/enquiries/${enquiry.id}`
    const team = (process.env.TEAMS_BOOKING_EMAILS || "")
      .split(",").map((e) => e.trim()).filter(Boolean)

    const safeBrief = brief ?? { summary: "", shortlist: [], suggests: [], asks: [], generated: false }
    const name = `${answers.firstName} ${answers.lastName || ""}`.trim()

    await Promise.allSettled([
      team.length
        ? sendMail({
            to: team,
            subject: `Planning request — ${name}, ${crewSize(answers)} aboard`,
            html: teamEmail(answers, safeBrief, adminUrl),
            text: textVersion(answers, safeBrief),
            replyTo: email,
          })
        : Promise.resolve(),
      sendMail({
        to: [email],
        subject: "Your sailing plan — Ionische Yacht Charter",
        html: customerEmail(answers),
      }),
    ])

    return NextResponse.json({ ok: true, id: enquiry.id })
  } catch (err) {
    console.error("[plan]", err)
    // If the row was written, the request is not lost — say so.
    if (enquiryId) return NextResponse.json({ ok: true, id: enquiryId, partial: true })
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}

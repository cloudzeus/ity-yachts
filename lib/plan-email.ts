import "server-only"
import type { PlanBrief } from "@/lib/plan-brief"
import { crewSize, type PlanAnswers } from "@/lib/plan-wizard"

/* Answer codes are stored, not prose, so the admin and the emails can label
   them however they like. These are the English labels for the emails. */
const LABEL: Record<string, string> = {
  exact: "Fixed dates", window: "Anywhere in a span", months: "Certain months", unsure: "Not decided yet",
  week: "One week", tendays: "Ten days", twoweeks: "Two weeks", longer: "Longer than two weeks",
  bareboat: "Bareboat — we sail her ourselves", skippered: "With a skipper",
  crewed: "Fully crewed", advise: "Would like advice",
  "licensed-experienced": "Licensed, sails regularly", "licensed-rusty": "Licensed, out of practice",
  "no-licence": "No licence", "never-sailed": "Never sailed before",
  monohull: "Sailing yacht", catamaran: "Catamaran", either: "No preference",
  family: "Family holiday", friends: "Friends", couple: "Couple", corporate: "Company trip", other: "Other",
  email: "Email", phone: "Phone", whatsapp: "WhatsApp",
  comfort: "Comfort", recent: "A recent boat", "easy-handling": "Easy to handle",
  space: "Space aboard", watertoys: "Water toys", aircon: "Air conditioning", budget: "Keeping the cost down",
  provisioning: "Provisioning", transfer: "Airport transfer", skipper: "Skipper",
  hostess: "Hostess", sup: "SUP", outboard: "Outboard", wifi: "Wi-Fi", accommodation: "A room on land",
  lefkada: "Lefkada", meganisi: "Meganisi", ithaca: "Ithaca", kefalonia: "Kefalonia",
  "kalamos-kastos": "Kalamos & Kastos", "paxos-antipaxos": "Paxos & Antipaxos", corfu: "Corfu",
}

const L = (k?: string) => (k ? LABEL[k] ?? k : "—")
const LS = (v?: string[]) => (v && v.length ? v.map(L).join(", ") : "—")

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

const fmtDate = (iso?: string) =>
  iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }) : "—"

const fmtMonth = (m: string) => {
  const [y, mo] = m.split("-")
  return new Date(Date.UTC(Number(y), Number(mo) - 1, 1))
    .toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
}

function when(a: PlanAnswers) {
  if (a.timing === "exact") return `${fmtDate(a.dateFrom)} — ${fmtDate(a.dateTo)}`
  /* A window is the span they can sail inside, not the charter itself. The
     length is printed alongside by both callers, so it is not repeated here. */
  if (a.timing === "window") {
    return `Anywhere between ${fmtDate(a.windowFrom)} and ${fmtDate(a.windowTo)}`
  }
  if (a.timing === "months") return a.months.map(fmtMonth).join(", ")
  return "Not decided yet"
}

function money(a: PlanAnswers) {
  if (!a.budgetFrom && !a.budgetTo) return "Not stated"
  const f = (n?: number) => (n ? "€" + n.toLocaleString("de-DE") : "")
  const range = a.budgetFrom && a.budgetTo ? `${f(a.budgetFrom)} – ${f(a.budgetTo)}` : f(a.budgetFrom || a.budgetTo)
  return range + (a.budgetFlexible ? " (flexible)" : "") + " per week"
}

const SHELL = (title: string, inner: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F1E9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#05111F;">
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">
  <div style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 14px rgba(5,17,31,.07);">
${inner}
  </div>
  <p style="text-align:center;color:#84776e;font-size:12px;margin:20px 0 0;">
    Ionische Yacht Charter · P. F. Panagou 22, GR-31100 Lefkada · iyc.wwa.gr
  </p>
</div></body></html>`

const header = (eyebrow: string, title: string) => `
    <div style="background:linear-gradient(158deg,#0A4A76,#05111F);padding:28px 32px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.66);">${esc(eyebrow)}</div>
      <div style="font-size:23px;font-weight:300;color:#ffffff;margin-top:6px;">${esc(title)}</div>
    </div>`

const row = (k: string, v: string) => `
        <tr>
          <td style="padding:9px 0;width:38%;vertical-align:top;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#84776e;">${esc(k)}</td>
          <td style="padding:9px 0;vertical-align:top;font-size:15px;color:#05111F;">${esc(v)}</td>
        </tr>`

const section = (title: string, rows: string) => `
      <div style="padding:22px 32px;border-top:1px solid #EFE9DE;">
        <div style="font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#0A4A76;margin-bottom:6px;">${esc(title)}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>
      </div>`

/**
 * Everything the crew told us, laid out the same way in both emails.
 *
 * Two headings change voice: the team reads about "them", the customer reads
 * about themselves. Third person in the customer's own confirmation reads as
 * though it were written about someone else.
 */
function answerSections(a: PlanAnswers, voice: "team" | "customer" = "team") {
  const sailingTitle = voice === "team" ? "How they want to sail" : "How you want to sail"
  const wordsTitle = voice === "team" ? "In their own words" : "What you told us"

  return (
    section("When", row("Timing", L(a.timing)) + row("Dates", when(a)) + row("Length of charter", L(a.duration)) +
      row("Flexible", a.flexible ? "Yes — can shift to find the right boat" : "No")) +
    section("Who is coming", row("Adults", String(a.adults)) +
      (a.children ? row("Children", `${a.children}${a.childAges ? ` (ages ${a.childAges})` : ""}`) : "") +
      row("Total aboard", String(crewSize(a))) + row("Occasion", L(a.occasion))) +
    section(sailingTitle, row("Crewing", L(a.crewMode)) + row("Experience", L(a.experience))) +
    section("The boat", row("Type", L(a.boatKind)) + (a.cabins ? row("Cabins wanted", String(a.cabins)) : "") +
      row("What matters", LS(a.priorities))) +
    section("Where", row("Areas", LS(a.regions))) +
    section("Budget", row("Per week", money(a))) +
    (a.extras.length ? section("Extras", row("Asked for", LS(a.extras))) : "") +
    (a.notes ? section(wordsTitle,
      `<tr><td colspan="2" style="padding:6px 0;font-size:15px;line-height:1.6;color:#05111F;white-space:pre-wrap;">${esc(a.notes)}</td></tr>`) : "")
  )
}

/** To the team: the brief first, then every answer underneath. */
export function teamEmail(a: PlanAnswers, brief: PlanBrief, adminUrl: string) {
  const list = (items: string[]) =>
    items.map((i) => `<li style="margin-bottom:5px;">${esc(i)}</li>`).join("")

  const briefBlock = `
      <div style="padding:22px 32px;background:#F7FAFC;border-top:1px solid #EFE9DE;">
        <div style="font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#0A4A76;">
          Brief${brief.generated ? "" : " (written from the answers — AI unavailable)"}
        </div>
        ${brief.summary ? `<p style="margin:10px 0 0;font-size:15px;line-height:1.65;">${esc(brief.summary)}</p>` : ""}
        ${brief.shortlist.length ? `
        <div style="margin-top:16px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#84776e;">Boats that fit</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-collapse:collapse;">
          ${brief.shortlist.map((s) => `
          <tr><td style="padding:7px 0;font-size:15px;">
            <b>${esc(s.yacht)}</b><span style="color:#5A6B7B;"> — ${esc(s.why)}</span>
          </td></tr>`).join("")}
        </table>` : ""}
        ${brief.suggests.length ? `<div style="margin-top:16px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#84776e;">Ideas</div>
          <ul style="margin:6px 0 0;padding-left:18px;font-size:15px;line-height:1.6;">${list(brief.suggests)}</ul>` : ""}
        ${brief.asks.length ? `<div style="margin-top:16px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#84776e;">Confirm on the first reply</div>
          <ul style="margin:6px 0 0;padding-left:18px;font-size:15px;line-height:1.6;">${list(brief.asks)}</ul>` : ""}
      </div>`

  return SHELL(
    "New planning request",
    header("New planning request", `${a.firstName} ${a.lastName}`.trim()) +
      section("Contact",
        row("Email", a.email) + (a.phone ? row("Phone", a.phone) : "") +
        row("Prefers", L(a.contactPreference)) + row("Writes in", a.locale.toUpperCase())) +
      briefBlock +
      answerSections(a) +
      `<div style="padding:24px 32px 30px;">
        <a href="${esc(adminUrl)}" style="display:block;text-align:center;background:#0A4A76;color:#ffffff;padding:13px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Open in the admin</a>
      </div>`
  )
}

/** To the customer: what we understood, so a mistake is obvious immediately. */
export function customerEmail(a: PlanAnswers) {
  return SHELL(
    "We have your plan",
    header("Ionische Yacht Charter", `Thank you, ${a.firstName}`) +
      `<div style="padding:24px 32px 4px;font-size:15px;line-height:1.65;color:#05111F;">
        <p style="margin:0 0 12px;">We have your planning request and one of us — Maria in Lefkada or Thomas in Munich — will write to you personally, usually within a day.</p>
        <p style="margin:0;color:#5A6B7B;">Here is what we noted. If anything is wrong, simply reply to this email and tell us.</p>
      </div>` +
      answerSections(a, "customer") +
      `<div style="padding:20px 32px 30px;font-size:14px;line-height:1.65;color:#5A6B7B;">
        We do not take bookings online. We read every request and answer it ourselves.
      </div>`
  )
}

/** Plain text, for clients that will not render HTML. */
export function textVersion(a: PlanAnswers, brief: PlanBrief) {
  return [
    `Planning request — ${a.firstName} ${a.lastName}`.trim(),
    `${a.email}${a.phone ? " · " + a.phone : ""}`,
    "",
    brief.summary,
    "",
    `When: ${when(a)} (${L(a.duration)}${a.flexible ? ", flexible" : ""})`,
    `Crew: ${a.adults} adults${a.children ? `, ${a.children} children` : ""} — ${L(a.occasion)}`,
    `Sailing: ${L(a.crewMode)}, ${L(a.experience)}`,
    `Boat: ${L(a.boatKind)}${a.cabins ? `, ${a.cabins} cabins` : ""} — ${LS(a.priorities)}`,
    `Areas: ${LS(a.regions)}`,
    `Budget: ${money(a)}`,
    a.extras.length ? `Extras: ${LS(a.extras)}` : "",
    a.notes ? `\nNotes: ${a.notes}` : "",
  ].filter(Boolean).join("\n")
}

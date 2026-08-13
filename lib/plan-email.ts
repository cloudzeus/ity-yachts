import "server-only"
import type { PlanBrief } from "@/lib/plan-brief"
import { crewSize, type PlanAnswers } from "@/lib/plan-wizard"

/**
 * The two emails a planning conversation produces.
 *
 * The customer's copy is written in the language they used. Answers are stored
 * as codes, not prose, precisely so that a Greek conversation does not come
 * back as an English confirmation with their own words stranded inside an
 * English row — "ages 8 και 11 χρονών".
 *
 * The team's copy stays English: it carries an English brief from the model,
 * and the desk works across three languages anyway.
 */

type Loc = "en" | "el" | "de"

const loc = (l?: string): Loc => (l === "el" || l === "de" ? l : "en")

/* Every label, in all three languages. Codes are the keys the wizard stores. */
const D: Record<string, [string, string, string]> = {
  // sections
  "s.when": ["When", "Πότε", "Wann"],
  "s.who": ["Who is coming", "Ποιοι έρχεστε", "Wer mitkommt"],
  "s.sail.you": ["How you want to sail", "Πώς θέλετε να ταξιδέψετε", "Wie Sie segeln möchten"],
  "s.sail.them": ["How they want to sail", "How they want to sail", "How they want to sail"],
  "s.boat": ["The boat", "Το σκάφος", "Das Boot"],
  "s.where": ["Where", "Πού", "Wohin"],
  "s.budget": ["Budget", "Προϋπολογισμός", "Budget"],
  "s.extras": ["Extras", "Έξτρα", "Extras"],
  "s.words.you": ["What you told us", "Όσα μας είπατε", "Was Sie uns gesagt haben"],
  "s.words.them": ["In their own words", "In their own words", "In their own words"],
  "s.contact": ["Contact", "Contact", "Contact"],

  // rows
  "r.timing": ["Timing", "Χρονικά", "Zeitrahmen"],
  "r.dates": ["Dates", "Ημερομηνίες", "Termine"],
  "r.duration": ["Length of charter", "Διάρκεια ναύλωσης", "Dauer des Törns"],
  "r.flexible": ["Flexible", "Ευελιξία", "Flexibel"],
  "r.adults": ["Adults", "Ενήλικες", "Erwachsene"],
  "r.children": ["Children", "Παιδιά", "Kinder"],
  "r.total": ["Total aboard", "Σύνολο επιβαινόντων", "Insgesamt an Bord"],
  "r.occasion": ["Occasion", "Αφορμή", "Anlass"],
  "r.crewing": ["Crewing", "Πλήρωμα", "Besatzung"],
  "r.experience": ["Experience", "Εμπειρία", "Erfahrung"],
  "r.type": ["Type", "Τύπος", "Typ"],
  "r.cabins": ["Cabins wanted", "Καμπίνες που θέλετε", "Gewünschte Kabinen"],
  "r.matters": ["What matters", "Τι μετράει", "Worauf es ankommt"],
  "r.areas": ["Areas", "Περιοχές", "Reviere"],
  "r.perweek": ["Per week", "Ανά εβδομάδα", "Pro Woche"],
  "r.asked": ["Asked for", "Ζητήσατε", "Gewünscht"],

  // timing
  exact: ["Fixed dates", "Συγκεκριμένες ημερομηνίες", "Feste Termine"],
  window: ["Anywhere in a span", "Οποτεδήποτε μέσα σε ένα διάστημα", "Irgendwann in einem Zeitraum"],
  months: ["Certain months", "Συγκεκριμένοι μήνες", "Bestimmte Monate"],
  unsure: ["Not decided yet", "Δεν έχει αποφασιστεί ακόμα", "Noch nicht entschieden"],

  // duration
  week: ["One week", "Μία εβδομάδα", "Eine Woche"],
  tendays: ["Ten days", "Δέκα ημέρες", "Zehn Tage"],
  twoweeks: ["Two weeks", "Δύο εβδομάδες", "Zwei Wochen"],
  longer: ["Longer than two weeks", "Πάνω από δύο εβδομάδες", "Länger als zwei Wochen"],

  // crew mode
  bareboat: ["Bareboat — we sail her ourselves", "Χωρίς πλήρωμα — ταξιδεύετε μόνοι σας", "Bareboat — Sie segeln selbst"],
  skippered: ["With a skipper", "Με κυβερνήτη", "Mit Skipper"],
  crewed: ["Fully crewed", "Με πλήρες πλήρωμα", "Mit voller Crew"],
  advise: ["Would like advice", "Θέλετε τη συμβουλή μας", "Möchten Beratung"],

  // experience
  "licensed-experienced": ["Licensed, sails regularly", "Με δίπλωμα, ταξιδεύετε τακτικά", "Mit Schein, segelt regelmäßig"],
  "licensed-rusty": ["Licensed, out of practice", "Με δίπλωμα, χωρίς πρόσφατη εξάσκηση", "Mit Schein, aus der Übung"],
  "no-licence": ["No licence", "Χωρίς δίπλωμα", "Ohne Schein"],
  "never-sailed": ["Never sailed before", "Χωρίς προηγούμενη εμπειρία", "Noch nie gesegelt"],

  // boat
  monohull: ["Sailing yacht", "Ιστιοπλοϊκό", "Segelyacht"],
  catamaran: ["Catamaran", "Καταμαράν", "Katamaran"],
  either: ["No preference", "Χωρίς προτίμηση", "Keine Präferenz"],

  // occasion
  family: ["Family holiday", "Οικογενειακές διακοπές", "Familienurlaub"],
  friends: ["Friends", "Παρέα φίλων", "Freunde"],
  couple: ["Couple", "Ζευγάρι", "Paar"],
  corporate: ["Company trip", "Εταιρικό ταξίδι", "Firmenreise"],
  other: ["Other", "Άλλο", "Sonstiges"],

  // priorities
  comfort: ["Comfort", "Άνεση", "Komfort"],
  recent: ["A recent boat", "Πρόσφατο σκάφος", "Ein neueres Boot"],
  "easy-handling": ["Easy to handle", "Εύκολος χειρισμός", "Einfach zu handhaben"],
  space: ["Space aboard", "Χώρος στο σκάφος", "Platz an Bord"],
  watertoys: ["Water toys", "Θαλάσσια παιχνίδια", "Wasserspielzeug"],
  aircon: ["Air conditioning", "Κλιματισμός", "Klimaanlage"],
  budget: ["Keeping the cost down", "Συγκράτηση κόστους", "Kosten im Rahmen halten"],

  // extras
  provisioning: ["Provisioning", "Εφόδια", "Proviant"],
  transfer: ["Airport transfer", "Μεταφορά από το αεροδρόμιο", "Flughafentransfer"],
  skipper: ["Skipper", "Κυβερνήτης", "Skipper"],
  instructor: ["Sailing instructor", "Εκπαιδευτής ιστιοπλοΐας", "Segellehrer"],
  hostess: ["Hostess", "Συνοδός", "Hostess"],
  weathersms: ["Weather by SMS", "Δελτίο καιρού με SMS", "Wetter per SMS"],
  sup: ["SUP", "SUP", "SUP"],
  outboard: ["Outboard", "Εξωλέμβια", "Außenborder"],
  blister: ["Blister", "Μπαλόνι", "Blister"],
  accommodation: ["A room on land", "Διαμονή στη στεριά", "Unterkunft an Land"],

  // regions
  lefkada: ["Lefkada", "Λευκάδα", "Lefkada"],
  meganisi: ["Meganisi", "Μεγανήσι", "Meganisi"],
  ithaca: ["Ithaca", "Ιθάκη", "Ithaka"],
  kefalonia: ["Kefalonia", "Κεφαλονιά", "Kefalonia"],
  "kalamos-kastos": ["Kalamos & Kastos", "Κάλαμος και Καστός", "Kalamos & Kastos"],
  "paxos-antipaxos": ["Paxos & Antipaxos", "Παξοί και Αντίπαξοι", "Paxos & Antipaxos"],
  corfu: ["Corfu", "Κέρκυρα", "Korfu"],

  // contact preference
  email: ["Email", "Email", "E-Mail"],
  phone: ["Phone", "Τηλέφωνο", "Telefon"],
  whatsapp: ["WhatsApp", "WhatsApp", "WhatsApp"],

  // prose
  "p.yes": ["Yes — can shift to find the right boat", "Ναι — μπορείτε να μετακινηθείτε για το σωστό σκάφος", "Ja — für das richtige Boot verschiebbar"],
  "p.no": ["No", "Όχι", "Nein"],
  "p.none": ["Not stated", "Δεν δηλώθηκε", "Nicht angegeben"],
  "p.flexible": ["flexible", "ευέλικτο", "flexibel"],
  "p.ages": ["ages", "ηλικίες", "Alter"],
  "p.thanks": ["Thank you", "Σας ευχαριστούμε", "Vielen Dank"],
  "p.intro": [
    "We have your planning request and one of us — Maria in Lefkada or Thomas in Munich — will write to you personally, usually within a day.",
    "Λάβαμε το αίτημά σας και κάποιος από εμάς — η Μαρία στη Λευκάδα ή ο Τόμας στο Μόναχο — θα σας γράψει προσωπικά, συνήθως μέσα σε μία ημέρα.",
    "Wir haben Ihre Anfrage erhalten, und einer von uns — Maria auf Lefkada oder Thomas in München — schreibt Ihnen persönlich, meist innerhalb eines Tages.",
  ],
  "p.check": [
    "Here is what we noted. If anything is wrong, simply reply to this email and tell us.",
    "Ορίστε τι κρατήσαμε. Αν κάτι δεν είναι σωστό, απαντήστε απλώς σε αυτό το email και πείτε μας.",
    "Das haben wir notiert. Sollte etwas nicht stimmen, antworten Sie einfach auf diese E-Mail.",
  ],
  "p.nobooking": [
    "We do not take bookings online. We read every request and answer it ourselves.",
    "Δεν δεχόμαστε κρατήσεις online. Διαβάζουμε κάθε αίτημα και απαντάμε οι ίδιοι.",
    "Wir nehmen keine Onlinebuchungen an. Wir lesen jede Anfrage und beantworten sie selbst.",
  ],
  "p.subject": [
    "Your sailing plan — Ionische Yacht Charter",
    "Το ταξίδι σας — Ionische Yacht Charter",
    "Ihr Törn — Ionische Yacht Charter",
  ],
  "p.perweek": ["per week", "ανά εβδομάδα", "pro Woche"],
  "p.anywhere": ["Anywhere between {a} and {b}", "Οποτεδήποτε μεταξύ {a} και {b}", "Jederzeit zwischen {a} und {b}"],
}

const IDX: Record<Loc, 0 | 1 | 2> = { en: 0, el: 1, de: 2 }
const T = (key: string, l: Loc) => D[key]?.[IDX[l]] ?? D[key]?.[0] ?? key
const TS = (v: string[] | undefined, l: Loc) => (v && v.length ? v.map((k) => T(k, l)).join(", ") : "—")

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

const INTL: Record<Loc, string> = { en: "en-GB", el: "el-GR", de: "de-DE" }

const fmtDate = (iso: string | undefined, l: Loc) =>
  iso
    ? new Date(iso + "T00:00:00Z").toLocaleDateString(INTL[l], {
        weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      })
    : "—"

const fmtMonth = (m: string, l: Loc) => {
  const [y, mo] = m.split("-")
  return new Date(Date.UTC(Number(y), Number(mo) - 1, 1))
    .toLocaleDateString(INTL[l], { month: "long", year: "numeric", timeZone: "UTC" })
}

function when(a: PlanAnswers, l: Loc) {
  if (a.timing === "exact") return `${fmtDate(a.dateFrom, l)} — ${fmtDate(a.dateTo, l)}`
  /* The span they can sail inside, not the charter itself. The length is
     printed on its own row, so it is not repeated here. */
  if (a.timing === "window") {
    return T("p.anywhere", l)
      .replace("{a}", fmtDate(a.windowFrom, l))
      .replace("{b}", fmtDate(a.windowTo, l))
  }
  if (a.timing === "months") return a.months.map((m) => fmtMonth(m, l)).join(", ")
  return T("unsure", l)
}

function money(a: PlanAnswers, l: Loc) {
  if (!a.budgetFrom && !a.budgetTo) return T("p.none", l)
  const f = (n?: number) => (n ? "€" + n.toLocaleString("de-DE") : "")
  const range = a.budgetFrom && a.budgetTo ? `${f(a.budgetFrom)} – ${f(a.budgetTo)}` : f(a.budgetFrom || a.budgetTo)
  return `${range}${a.budgetFlexible ? ` (${T("p.flexible", l)})` : ""} ${T("p.perweek", l)}`
}

const SHELL = (title: string, lang: Loc, inner: string) => `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
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

/** Everything the crew told us, in the language of whoever is reading. */
function answerSections(a: PlanAnswers, l: Loc, voice: "team" | "customer") {
  const you = voice === "customer"
  return (
    section(T("s.when", l),
      row(T("r.timing", l), T(a.timing, l)) +
      row(T("r.dates", l), when(a, l)) +
      row(T("r.duration", l), T(a.duration, l)) +
      row(T("r.flexible", l), a.flexible ? T("p.yes", l) : T("p.no", l))) +
    section(T("s.who", l),
      row(T("r.adults", l), String(a.adults)) +
      (a.children ? row(T("r.children", l), `${a.children}${a.childAges ? ` (${T("p.ages", l)} ${a.childAges})` : ""}`) : "") +
      row(T("r.total", l), String(crewSize(a))) +
      row(T("r.occasion", l), T(a.occasion, l))) +
    section(T(you ? "s.sail.you" : "s.sail.them", l),
      row(T("r.crewing", l), T(a.crewMode, l)) + row(T("r.experience", l), T(a.experience, l))) +
    section(T("s.boat", l),
      row(T("r.type", l), T(a.boatKind, l)) +
      (a.cabins ? row(T("r.cabins", l), String(a.cabins)) : "") +
      row(T("r.matters", l), TS(a.priorities, l))) +
    section(T("s.where", l), row(T("r.areas", l), TS(a.regions, l))) +
    section(T("s.budget", l), row(T("r.perweek", l), money(a, l))) +
    (a.extras.length ? section(T("s.extras", l), row(T("r.asked", l), TS(a.extras, l))) : "") +
    (a.notes ? section(T(you ? "s.words.you" : "s.words.them", l),
      `<tr><td colspan="2" style="padding:6px 0;font-size:15px;line-height:1.6;color:#05111F;white-space:pre-wrap;">${esc(a.notes)}</td></tr>`) : "")
  )
}

/** To the team: the brief first, then every answer. Always English. */
export function teamEmail(a: PlanAnswers, brief: PlanBrief, adminUrl: string) {
  const l: Loc = "en"
  const list = (items: string[]) => items.map((i) => `<li style="margin-bottom:5px;">${esc(i)}</li>`).join("")

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

  return SHELL("New planning request", l,
    header("New planning request", `${a.firstName} ${a.lastName}`.trim()) +
      section("Contact",
        row("Email", a.email) + (a.phone ? row("Phone", a.phone) : "") +
        row("Prefers", T(a.contactPreference, l)) + row("Writes in", loc(a.locale).toUpperCase())) +
      briefBlock +
      answerSections(a, l, "team") +
      `<div style="padding:24px 32px 30px;">
        <a href="${esc(adminUrl)}" style="display:block;text-align:center;background:#0A4A76;color:#ffffff;padding:13px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Open in the admin</a>
      </div>`)
}

/** To the customer: their own language, or the confirmation cannot be checked. */
export function customerEmail(a: PlanAnswers) {
  const l = loc(a.locale)
  /* Greek would need the vocative to take a name here — «Γιάννη», not
     «Γιάννης» — and names cannot be declined reliably, so Greek thanks
     without one. */
  const title = l === "el" ? T("p.thanks", l) : `${T("p.thanks", l)}, ${a.firstName}`

  return SHELL(T("p.subject", l), l,
    header("Ionische Yacht Charter", title) +
      `<div style="padding:24px 32px 4px;font-size:15px;line-height:1.65;color:#05111F;">
        <p style="margin:0 0 12px;">${esc(T("p.intro", l))}</p>
        <p style="margin:0;color:#5A6B7B;">${esc(T("p.check", l))}</p>
      </div>` +
      answerSections(a, l, "customer") +
      `<div style="padding:20px 32px 30px;font-size:14px;line-height:1.65;color:#5A6B7B;">
        ${esc(T("p.nobooking", l))}
      </div>`)
}

/** Subject line for the customer's copy, in their language. */
export function customerSubject(a: PlanAnswers) {
  return T("p.subject", loc(a.locale))
}

/** Plain text for the team, for clients that will not render HTML. */
export function textVersion(a: PlanAnswers, brief: PlanBrief) {
  const l: Loc = "en"
  return [
    `Planning request — ${a.firstName} ${a.lastName}`.trim(),
    `${a.email}${a.phone ? " · " + a.phone : ""}`,
    "",
    brief.summary,
    "",
    `When: ${when(a, l)} (${T(a.duration, l)}${a.flexible ? ", flexible" : ""})`,
    `Crew: ${a.adults} adults${a.children ? `, ${a.children} children` : ""} — ${T(a.occasion, l)}`,
    `Sailing: ${T(a.crewMode, l)}, ${T(a.experience, l)}`,
    `Boat: ${T(a.boatKind, l)}${a.cabins ? `, ${a.cabins} cabins` : ""} — ${TS(a.priorities, l)}`,
    `Areas: ${TS(a.regions, l)}`,
    `Budget: ${money(a, l)}`,
    a.extras.length ? `Extras: ${TS(a.extras, l)}` : "",
    a.notes ? `\nNotes: ${a.notes}` : "",
  ].filter(Boolean).join("\n")
}

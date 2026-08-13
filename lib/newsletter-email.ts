/**
 * The two newsletter emails, in the language the reader signed up in.
 *
 * The confirmation email is the consent record: it has to say plainly what
 * they are agreeing to, who is asking, and how to get out — and it must not
 * look like a marketing email, because somebody who did not sign up needs to
 * be able to ignore it safely.
 */

type Locale = "en" | "el" | "de"

const D: Record<string, [string, string, string]> = {
  confirmSubject: [
    "Please confirm your email address",
    "Επιβεβαιώστε το email σας",
    "Bitte bestätigen Sie Ihre E-Mail-Adresse",
  ],
  confirmHeading: [
    "One more click",
    "Ένα ακόμη κλικ",
    "Nur noch ein Klick",
  ],
  confirmBody: [
    "Somebody — we hope you — asked to receive news from IYC Ionische Yacht Charter in Lefkada. Confirm below and we will add you to the list. A few emails a year: what the season looks like, new boats, and what is worth knowing before you sail here.",
    "Κάποιος — ελπίζουμε εσείς — ζήτησε να λαμβάνει νέα από την IYC Ionische Yacht Charter στη Λευκάδα. Επιβεβαιώστε παρακάτω και θα σας προσθέσουμε στη λίστα. Λίγα email τον χρόνο: πώς προβλέπεται η σεζόν, νέα σκάφη και όσα αξίζει να ξέρετε πριν ταξιδέψετε εδώ.",
    "Jemand — hoffentlich Sie — möchte Neuigkeiten von IYC Ionische Yacht Charter in Lefkada erhalten. Bestätigen Sie unten, und wir nehmen Sie in die Liste auf. Ein paar E-Mails im Jahr: wie die Saison aussieht, neue Boote, und was man wissen sollte, bevor man hier segelt.",
  ],
  confirmButton: [
    "Yes, add me to the list",
    "Ναι, προσθέστε με στη λίστα",
    "Ja, in die Liste eintragen",
  ],
  confirmIgnore: [
    "If this was not you, ignore this email. Nothing happens until you click, and we will not write again.",
    "Αν δεν το ζητήσατε εσείς, αγνοήστε αυτό το email. Δεν γίνεται τίποτα αν δεν πατήσετε το κουμπί και δεν θα σας ξαναγράψουμε.",
    "Waren Sie das nicht, ignorieren Sie diese E-Mail einfach. Ohne Klick passiert nichts, und wir schreiben nicht erneut.",
  ],

  welcomeSubject: [
    "You are on the list — welcome",
    "Είστε στη λίστα — καλώς ήρθατε",
    "Sie sind dabei — willkommen",
  ],
  welcomeHeading: [
    "Welcome aboard",
    "Καλώς ήρθατε",
    "Willkommen an Bord",
  ],
  welcomeBody: [
    "That is done. You will hear from us a few times a year, from the base in Lefkada — never more than that, and never from anyone else. You can leave at any time using the link at the foot of every email.",
    "Έγινε. Θα έχετε νέα μας λίγες φορές τον χρόνο, από τη βάση στη Λευκάδα — ποτέ περισσότερο, και ποτέ από κάποιον άλλον. Μπορείτε να διαγραφείτε όποτε θέλετε από τον σύνδεσμο στο τέλος κάθε email.",
    "Erledigt. Sie hören ein paar Mal im Jahr von uns, von der Basis in Lefkada — nicht öfter, und nie von jemand anderem. Sie können sich jederzeit über den Link am Ende jeder E-Mail abmelden.",
  ],
  welcomeCta: ["Look at the fleet", "Δείτε τον στόλο", "Zur Flotte"],
  unsubscribe: ["Unsubscribe", "Διαγραφή", "Abmelden"],
  signoff: ["Maria and Thomas", "Η Μαρία και ο Θωμάς", "Maria und Thomas"],
}

const idx: Record<Locale, number> = { en: 0, el: 1, de: 2 }
const tr = (key: string, locale: Locale) => D[key]?.[idx[locale]] ?? D[key]?.[0] ?? ""

const NAVY = "#0B3A5C"
const ACCENT = "#E2963C"

function shell(locale: Locale, heading: string, inner: string, footer: string) {
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f2ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:26px 32px;">
          <div style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em;">IYC Ionische Yacht Charter</div>
          <div style="color:rgba(255,255,255,.66);font-size:12px;margin-top:3px;">Lefkada · Greece</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#12212e;">${heading}</h1>
          ${inner}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #e8e4da;color:#7b8892;font-size:12px;line-height:1.6;">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function confirmEmail(locale: Locale, confirmUrl: string) {
  const inner = `
    <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d4d59;">${tr("confirmBody", locale)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${ACCENT};border-radius:8px;">
      <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${tr("confirmButton", locale)}</a>
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#7b8892;">${tr("confirmIgnore", locale)}</p>`

  return {
    subject: tr("confirmSubject", locale),
    html: shell(locale, tr("confirmHeading", locale), inner,
      `IYC Ionische Yacht Charter · Filippa Panagou 22, Lefkada 31100, Greece`),
    text: `${tr("confirmBody", locale)}\n\n${confirmUrl}\n\n${tr("confirmIgnore", locale)}`,
  }
}

export function welcomeEmail(locale: Locale, fleetUrl: string, unsubscribeUrl: string) {
  const inner = `
    <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d4d59;">${tr("welcomeBody", locale)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${ACCENT};border-radius:8px;">
      <a href="${fleetUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${tr("welcomeCta", locale)}</a>
    </td></tr></table>
    <p style="margin:26px 0 0;font-size:15px;color:#3d4d59;">${tr("signoff", locale)}</p>`

  return {
    subject: tr("welcomeSubject", locale),
    html: shell(locale, tr("welcomeHeading", locale), inner,
      `IYC Ionische Yacht Charter · Filippa Panagou 22, Lefkada 31100, Greece<br>
       <a href="${unsubscribeUrl}" style="color:#7b8892;">${tr("unsubscribe", locale)}</a>`),
    text: `${tr("welcomeBody", locale)}\n\n${fleetUrl}\n\n${tr("unsubscribe", locale)}: ${unsubscribeUrl}`,
  }
}

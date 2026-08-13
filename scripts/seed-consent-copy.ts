import "dotenv/config"
import { db } from "../lib/db"

/** Consent, newsletter and legal copy, in all three languages. */
const KEYS = [
  { key: "consent.title", namespace: "consent", en: "Cookies on this site", el: "Cookies σε αυτόν τον ιστότοπο", de: "Cookies auf dieser Website" },
  { key: "consent.body", namespace: "consent",
    en: "We use what the site needs to work. With your agreement we would also like to measure how the site is used, load maps, and see whether our advertising reaches the right people.",
    el: "Χρησιμοποιούμε όσα χρειάζεται ο ιστότοπος για να λειτουργεί. Με τη συγκατάθεσή σας θα θέλαμε επίσης να μετράμε πώς χρησιμοποιείται, να φορτώνουμε χάρτες και να βλέπουμε αν οι διαφημίσεις μας φτάνουν στους σωστούς ανθρώπους.",
    de: "Wir verwenden, was die Website zum Funktionieren braucht. Mit Ihrer Zustimmung möchten wir außerdem messen, wie die Seite genutzt wird, Karten laden und sehen, ob unsere Werbung die richtigen Menschen erreicht." },
  { key: "consent.readMore", namespace: "consent", en: "How we handle your data", el: "Πώς διαχειριζόμαστε τα δεδομένα σας", de: "Wie wir mit Ihren Daten umgehen" },
  { key: "consent.acceptAll", namespace: "consent", en: "Accept all", el: "Αποδοχή όλων", de: "Alle akzeptieren" },
  { key: "consent.rejectAll", namespace: "consent", en: "Reject all", el: "Απόρριψη όλων", de: "Alle ablehnen" },
  { key: "consent.manage", namespace: "consent", en: "Choose", el: "Επιλογή", de: "Auswählen" },
  { key: "consent.prefsTitle", namespace: "consent", en: "Your cookie choices", el: "Οι επιλογές σας για τα cookies", de: "Ihre Cookie-Einstellungen" },
  { key: "consent.save", namespace: "consent", en: "Save my choices", el: "Αποθήκευση επιλογών", de: "Auswahl speichern" },
  { key: "consent.close", namespace: "consent", en: "Close", el: "Κλείσιμο", de: "Schließen" },
  { key: "consent.settings", namespace: "consent", en: "Cookie settings", el: "Ρυθμίσεις cookies", de: "Cookie-Einstellungen" },

  { key: "consent.necessary.title", namespace: "consent", en: "Strictly necessary", el: "Απολύτως απαραίτητα", de: "Unbedingt erforderlich" },
  { key: "consent.necessary.body", namespace: "consent",
    en: "Keeps you signed in, remembers your language, and carries an enquiry through to us. The site cannot work without these, so they cannot be switched off.",
    el: "Σας κρατούν συνδεδεμένους, θυμούνται τη γλώσσα σας και μεταφέρουν το αίτημά σας σε εμάς. Ο ιστότοπος δεν λειτουργεί χωρίς αυτά, γι' αυτό δεν απενεργοποιούνται.",
    de: "Halten Sie angemeldet, merken sich Ihre Sprache und leiten Ihre Anfrage an uns weiter. Ohne sie funktioniert die Seite nicht, deshalb lassen sie sich nicht abschalten." },
  { key: "consent.analytics.title", namespace: "consent", en: "Analytics", el: "Στατιστικά", de: "Statistik" },
  { key: "consent.analytics.body", namespace: "consent",
    en: "Tells us which pages people read and where they leave, so we can improve them. We never see who you are.",
    el: "Μας δείχνουν ποιες σελίδες διαβάζονται και πού φεύγει ο κόσμος, ώστε να τις βελτιώσουμε. Δεν βλέπουμε ποτέ ποιος είστε.",
    de: "Zeigen uns, welche Seiten gelesen werden und wo Besucher abspringen, damit wir sie verbessern können. Wer Sie sind, sehen wir nie." },
  { key: "consent.marketing.title", namespace: "consent", en: "Advertising", el: "Διαφήμιση", de: "Werbung" },
  { key: "consent.marketing.body", namespace: "consent",
    en: "Lets us measure whether an advert reached the right person, and stop showing you one you have already acted on.",
    el: "Μας επιτρέπουν να μετρήσουμε αν μια διαφήμιση έφτασε στον σωστό άνθρωπο και να σταματήσουμε να σας δείχνουμε κάτι που ήδη κάνατε.",
    de: "Damit können wir messen, ob eine Anzeige die richtige Person erreicht hat — und Ihnen keine mehr zeigen, auf die Sie längst reagiert haben." },
  { key: "consent.maps.title", namespace: "consent", en: "Maps", el: "Χάρτες", de: "Karten" },
  { key: "consent.maps.body", namespace: "consent",
    en: "Loads Google Maps on our destination and route pages. Google sets its own cookies when a map loads, so we ask first.",
    el: "Φορτώνουν τους χάρτες Google στις σελίδες προορισμών και διαδρομών. Η Google βάζει δικά της cookies όταν φορτώνει ένας χάρτης, γι' αυτό ρωτάμε πρώτα.",
    de: "Laden Google Maps auf unseren Reiseziel- und Routenseiten. Google setzt beim Laden einer Karte eigene Cookies, deshalb fragen wir vorher." },

  { key: "consent.gate.title", namespace: "consent", en: "{item} is switched off", el: "Οι {item} είναι απενεργοποιημένοι", de: "{item} ist deaktiviert" },
  { key: "consent.gate.body", namespace: "consent",
    en: "Loading it lets Google set cookies in your browser, so we do not do it without asking.",
    el: "Η φόρτωσή του επιτρέπει στην Google να βάλει cookies στο πρόγραμμα περιήγησής σας, γι' αυτό δεν το κάνουμε χωρίς να ρωτήσουμε.",
    de: "Beim Laden setzt Google Cookies in Ihrem Browser — das tun wir nicht ungefragt." },
  { key: "consent.gate.allow", namespace: "consent", en: "Allow and load", el: "Αποδοχή και φόρτωση", de: "Erlauben und laden" },
  { key: "consent.gate.settings", namespace: "consent", en: "Cookie settings", el: "Ρυθμίσεις cookies", de: "Cookie-Einstellungen" },
  { key: "consent.gate.mapTitle", namespace: "consent", en: "The map", el: "Ο χάρτης", de: "Die Karte" },

  { key: "newsletter.subscribe", namespace: "newsletter", en: "Subscribe", el: "Εγγραφή", de: "Abonnieren" },
  { key: "newsletter.checkInbox", namespace: "newsletter",
    en: "Almost there — click the link in the email we just sent.",
    el: "Σχεδόν έτοιμο — πατήστε τον σύνδεσμο στο email που μόλις στείλαμε.",
    de: "Fast geschafft — klicken Sie auf den Link in der E-Mail, die wir gerade gesendet haben." },
  { key: "newsletter.badEmail", namespace: "newsletter", en: "That does not look like an email address.", el: "Αυτό δεν μοιάζει με διεύθυνση email.", de: "Das sieht nicht nach einer E-Mail-Adresse aus." },
  { key: "newsletter.failed", namespace: "newsletter", en: "That did not go through. Please try again in a moment.", el: "Δεν στάλθηκε. Δοκιμάστε ξανά σε λίγο.", de: "Das hat nicht geklappt. Bitte versuchen Sie es gleich noch einmal." },
  { key: "newsletter.consentNote", namespace: "newsletter",
    en: "A few emails a year. You can leave at any time, and we never pass your address on.",
    el: "Λίγα email τον χρόνο. Μπορείτε να διαγραφείτε όποτε θέλετε και δεν δίνουμε ποτέ τη διεύθυνσή σας σε τρίτους.",
    de: "Ein paar E-Mails im Jahr. Sie können sich jederzeit abmelden, und wir geben Ihre Adresse nie weiter." },
  { key: "newsletter.confirmed.title", namespace: "newsletter", en: "You are on the list", el: "Είστε στη λίστα", de: "Sie sind dabei" },
  { key: "newsletter.confirmed.body", namespace: "newsletter",
    en: "Thank you. You will hear from us a few times a year, from the base in Lefkada. Every email has a one-click way out at the foot of it.",
    el: "Ευχαριστούμε. Θα έχετε νέα μας λίγες φορές τον χρόνο, από τη βάση στη Λευκάδα. Κάθε email έχει σύνδεσμο διαγραφής με ένα κλικ στο τέλος.",
    de: "Danke. Sie hören ein paar Mal im Jahr von uns, von der Basis in Lefkada. Jede E-Mail hat unten einen Abmeldelink mit einem Klick." },
  { key: "newsletter.unsubscribed.title", namespace: "newsletter", en: "You have been removed", el: "Διαγραφήκατε", de: "Sie wurden abgemeldet" },
  { key: "newsletter.unsubscribed.body", namespace: "newsletter",
    en: "That is done — we will not write again. If it was a mistake, you can sign up again from the foot of any page.",
    el: "Έγινε — δεν θα σας ξαναγράψουμε. Αν ήταν λάθος, μπορείτε να εγγραφείτε ξανά από το τέλος οποιασδήποτε σελίδας.",
    de: "Erledigt — wir schreiben nicht mehr. War es ein Versehen, können Sie sich unten auf jeder Seite erneut eintragen." },
  { key: "newsletter.invalid.title", namespace: "newsletter", en: "That link is no longer valid", el: "Ο σύνδεσμος δεν ισχύει πια", de: "Dieser Link ist nicht mehr gültig" },
  { key: "newsletter.invalid.body", namespace: "newsletter",
    en: "It may have been used already, or replaced by a newer one. Sign up again from the foot of any page and we will send a fresh link.",
    el: "Μπορεί να έχει ήδη χρησιμοποιηθεί ή να αντικαταστάθηκε από νεότερο. Εγγραφείτε ξανά από το τέλος οποιασδήποτε σελίδας και θα στείλουμε καινούριο.",
    de: "Vielleicht wurde er schon benutzt oder durch einen neueren ersetzt. Tragen Sie sich unten auf jeder Seite erneut ein, dann senden wir einen frischen Link." },
  { key: "newsletter.backHome", namespace: "newsletter", en: "Back to the site", el: "Επιστροφή στον ιστότοπο", de: "Zurück zur Website" },

  { key: "legal.eyebrow", namespace: "legal", en: "Legal", el: "Νομικά", de: "Rechtliches" },
  { key: "legal.notTranslated", namespace: "legal",
    en: "This document has not been translated yet, so it is shown in English.",
    el: "Το κείμενο δεν έχει μεταφραστεί ακόμη, γι' αυτό εμφανίζεται στα αγγλικά.",
    de: "Dieses Dokument ist noch nicht übersetzt und wird daher auf Englisch angezeigt." },
]

async function main() {
  let added = 0, filled = 0
  for (const t of KEYS) {
    const existing = await db.siteTranslation.findUnique({ where: { key: t.key } })
    if (!existing) { await db.siteTranslation.create({ data: t }); added++; continue }
    const patch: Record<string, string> = {}
    if (!existing.en.trim()) patch.en = t.en
    if (!existing.el.trim()) patch.el = t.el
    if (!existing.de.trim()) patch.de = t.de
    if (Object.keys(patch).length) { await db.siteTranslation.update({ where: { key: t.key }, data: patch }); filled++ }
  }
  console.log(`${added} added, ${filled} filled, ${KEYS.length - added - filled} untouched`)
  await db.$disconnect()
}
main()

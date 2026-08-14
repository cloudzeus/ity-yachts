/**
 * Topic headings for the answers page.
 *
 * Deliberately separate from lib/faqs.ts: that file reads the database, and a
 * client component importing a value from it drags the Prisma adapter into
 * the browser bundle. Types erase at compile time, so `import type` is safe
 * there — a constant is not.
 */
export const TOPIC_LABELS: Record<string, { en: string; el: string; de: string }> = {
  general: { en: "Sailing the Ionian", el: "Ιστιοπλοΐα στο Ιόνιο", de: "Segeln im Ionischen Meer" },
  licence: { en: "Licences and qualifications", el: "Διπλώματα και προσόντα", de: "Scheine und Qualifikationen" },
  "getting-here": { en: "Getting to Lefkada", el: "Πώς φτάνετε στη Λευκάδα", de: "Anreise nach Lefkada" },
  season: { en: "Weather and season", el: "Καιρός και σεζόν", de: "Wetter und Saison" },
  booking: { en: "Booking and prices", el: "Κρατήσεις και τιμές", de: "Buchung und Preise" },
  onboard: { en: "On board", el: "Εν πλω", de: "An Bord" },
}

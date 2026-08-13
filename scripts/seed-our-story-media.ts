import "dotenv/config"
import { db } from "../lib/db"

/**
 * The photographs for "Our story", and the caption under each one.
 *
 * They live in the database rather than the route so they can be changed in
 * /admin/story. An image row stores { url } — a photograph has no language.
 */
const CDN = "https://iycweb.b-cdn.net"

const IMAGES: Record<string, string> = {
  // Lefkada from the water — the island the whole story is about.
  "story.hero.image": `${CDN}/locations/1786615801662-lefkada-greece-ionian-sea-2026-03-10-22-31-26-utc.webp`,
  "story.1.image": `${CDN}/locations/1786615783910-gialos-beach-in-lefkada-ionian-island-greece-2026-03-09-22-33-45-utc.webp`,
  // The only portrait frame in the library, and it belongs in a tall column.
  "story.2.image": `${CDN}/locations/1786615798675-famous-beach-in-lefkada-greece-2026-03-10-22-32-00-utc.webp`,
  "story.3.image": `${CDN}/locations/1786615784760-the-ionian-sea-in-lefkada-greece-2026-03-19-02-15-35-utc.webp`,
  // The Lefkada canal: the way in and out of the base, and wide enough for a band.
  "story.4.image": `${CDN}/itineraries/1774614903354-lefkas-kanal.webp`,
  "story.5.image": `${CDN}/locations/1786615790855-aerial-view-of-vasiliki-beach-windsurfing-lefkada-2026-03-20-00-19-56-utc.webp`,
  "story.6.image": `${CDN}/locations/1786615784603-beautiful-summer-coast-porto-katsiki-beach-on-ioni-2026-03-25-23-45-04-utc.webp`,
  "story.7.image": `${CDN}/locations/1786615790975-beautiful-summer-lefkada-coast-stony-beach-greece-2026-03-26-00-52-02-utc.webp`,
  "story.closing.image": `${CDN}/locations/1786615791981-aerial-view-of-egremni-beach-lefkada-island-greece-2026-03-19-23-59-31-utc.webp`,
}

/* Naming the place turns a photograph from decoration into part of the story. */
const CAPTIONS: Record<string, { en: string; el: string; de: string }> = {
  "story.1.caption": { en: "Gialos, Lefkada", el: "Γιαλός, Λευκάδα", de: "Gialos, Lefkada" },
  "story.2.caption": { en: "The west coast of Lefkada", el: "Η δυτική ακτή της Λευκάδας", de: "Die Westküste von Lefkada" },
  "story.3.caption": { en: "The Ionian off Lefkada", el: "Το Ιόνιο ανοιχτά της Λευκάδας", de: "Das Ionische Meer vor Lefkada" },
  "story.4.caption": { en: "The Lefkada canal", el: "Ο δίαυλος της Λευκάδας", de: "Der Kanal von Lefkada" },
  "story.5.caption": { en: "Vasiliki, Lefkada", el: "Βασιλική, Λευκάδα", de: "Vasiliki, Lefkada" },
  "story.6.caption": { en: "Porto Katsiki, Lefkada", el: "Πόρτο Κατσίκι, Λευκάδα", de: "Porto Katsiki, Lefkada" },
  "story.7.caption": { en: "The Lefkada coast", el: "Η ακτή της Λευκάδας", de: "Die Küste von Lefkada" },
  "story.closing.caption": { en: "Egremni, Lefkada", el: "Εγκρεμνοί, Λευκάδα", de: "Egremni, Lefkada" },
}

async function main() {
  const page = await db.page.findUnique({ where: { slug: "about-us" }, select: { id: true } })
  if (!page) throw new Error("about-us page not found")

  for (const [key, url] of Object.entries(IMAGES)) {
    await db.textComponent.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      create: { pageId: page.id, key, translations: { url } },
      update: { translations: { url } },
    })
  }

  for (const [key, translations] of Object.entries(CAPTIONS)) {
    await db.textComponent.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      create: { pageId: page.id, key, translations },
      update: { translations },
    })
  }

  console.log(`${Object.keys(IMAGES).length} photographs, ${Object.keys(CAPTIONS).length} captions`)
  await db.$disconnect()
}

main()

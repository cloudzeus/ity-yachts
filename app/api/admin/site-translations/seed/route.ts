import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

const SEED_TRANSLATIONS = [
  // Header
  { key: "header.startPlanning", namespace: "header", en: "Start Planning" },
  { key: "header.nav.destinations", namespace: "header", en: "Destinations" },
  { key: "header.nav.fleet", namespace: "header", en: "Fleet" },
  { key: "header.nav.experiences", namespace: "header", en: "Experiences" },
  { key: "header.nav.about", namespace: "header", en: "About" },
  { key: "header.nav.contact", namespace: "header", en: "Contact" },

  // Hero
  { key: "home.hero.title", namespace: "home", en: "Discover the World by Sea" },
  { key: "home.hero.subtitle", namespace: "home", en: "Bespoke yacht charters and luxury maritime experiences across the world's most coveted destinations." },
  { key: "home.hero.cta.planning", namespace: "home", en: "Start Planning" },
  { key: "home.hero.cta.fleet", namespace: "home", en: "Explore Fleet" },

  // Footer
  { key: "footer.tagline", namespace: "footer", en: "Bespoke yacht charters and luxury maritime experiences across the world's most coveted destinations." },
  { key: "footer.destinations", namespace: "footer", en: "Destinations" },
  { key: "footer.company", namespace: "footer", en: "Company" },
  { key: "footer.stayUpdated", namespace: "footer", en: "Stay Updated" },
  { key: "footer.helpSupport.title", namespace: "footer", en: "Help & Support" },
  { key: "footer.helpSupport.desc", namespace: "footer", en: "Talk to our team to solve any problem and any issue" },
  { key: "footer.callService", namespace: "footer", en: "Call Customer Service" },
  { key: "footer.whatsappService", namespace: "footer", en: "WhatsApp Customer Service" },
  { key: "footer.whatsappCta", namespace: "footer", en: "Click and start" },
  { key: "footer.copyright", namespace: "footer", en: "© 2026 IYC Yachts. All rights reserved." },
  { key: "footer.craftedForSea", namespace: "footer", en: "Crafted for the sea" },
  { key: "footer.emailPlaceholder", namespace: "footer", en: "Your email" },

  // Footer nav links
  { key: "footer.nav.mediterranean", namespace: "footer", en: "Mediterranean" },
  { key: "footer.nav.caribbean", namespace: "footer", en: "Caribbean" },
  { key: "footer.nav.southeastAsia", namespace: "footer", en: "Southeast Asia" },
  { key: "footer.nav.northernEurope", namespace: "footer", en: "Northern Europe" },
  { key: "footer.nav.middleEast", namespace: "footer", en: "Middle East" },
  { key: "footer.nav.aboutUs", namespace: "footer", en: "About Us" },
  { key: "footer.nav.ourFleet", namespace: "footer", en: "Our Fleet" },
  { key: "footer.nav.experiences", namespace: "footer", en: "Experiences" },
  { key: "footer.nav.careers", namespace: "footer", en: "Careers" },
  { key: "footer.nav.press", namespace: "footer", en: "Press" },

  // Search modal
  { key: "search.title", namespace: "search", en: "What are you looking for?" },
  { key: "search.placeholder", namespace: "search", en: "Search yachts, destinations, experiences..." },
  { key: "search.quickLinks", namespace: "search", en: "Quick Links" },
  { key: "search.link.sailingYachts", namespace: "search", en: "Sailing Yachts" },
  { key: "search.link.motorYachts", namespace: "search", en: "Motor Yachts" },
  { key: "search.link.catamarans", namespace: "search", en: "Catamarans" },
  { key: "search.link.luxury", namespace: "search", en: "Luxury Charters" },
  { key: "search.link.mediterranean", namespace: "search", en: "Mediterranean" },
  { key: "search.link.caribbean", namespace: "search", en: "Caribbean" },
]

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let created = 0
    let skipped = 0

    for (const t of SEED_TRANSLATIONS) {
      const existing = await db.siteTranslation.findUnique({ where: { key: t.key } })
      if (existing) {
        skipped++
        continue
      }
      await db.siteTranslation.create({
        data: { key: t.key, namespace: t.namespace, en: t.en, el: "", de: "" },
      })
      created++
    }

    return NextResponse.json({ created, skipped, total: SEED_TRANSLATIONS.length })
  } catch (error) {
    console.error("[POST /api/admin/site-translations/seed]", error)
    return NextResponse.json({ error: "Seed failed" }, { status: 500 })
  }
}

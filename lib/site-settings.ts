import "server-only"
import { db } from "@/lib/db"

/**
 * The company's own details, from the settings the admin edits.
 *
 * These were hardcoded in the SEO layer, which meant a change of address,
 * phone number or domain needed a deploy — and the domain in particular is
 * the one value that, if wrong, points every canonical link on the site at
 * somebody else's website.
 *
 * The fallbacks below are the values that were previously in code. They only
 * apply where a settings field is blank, so nothing regresses if the settings
 * have not been filled in yet.
 */

export interface SiteSettings {
  name: string
  legalName: string
  siteUrl: string
  founded: string
  logo: string
  email: string
  bookingEmail: string
  vatId: string
  phones: string[]
  address: { street: string; locality: string; region: string; postalCode: string; country: string }
  geo: { latitude: number; longitude: number } | null
  /** Profile URLs, for the entity graph. */
  sameAs: string[]
}

const FALLBACK = {
  name: "IYC Ionische Yacht Charter",
  legalName: "Ionische Yacht Charter",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://iyc.de",
  founded: "1979",
  logo: "https://iycweb.b-cdn.net/branding/1774606363287-iyc-logo-trans-blue.webp",
  email: "info@iyc.de",
  bookingEmail: "bookings@iyc.de",
  street: "Filippa Panagou 22",
  locality: "Lefkada",
  region: "Ionian Islands",
  postalCode: "31100",
  country: "GR",
  latitude: 38.7065734,
  longitude: 20.6416779,
}

type CompanySetting = Partial<{
  name: string; legalName: string; siteUrl: string; founded: string
  address: string; street: string; locality: string; region: string
  postalCode: string; country: string; latitude: string; longitude: string
  phones: string[]; vat: string; gemi: string
  bookingEmail: string; companyEmail: string; logoUrl: string
}>

type SocialSetting = Record<string, string>

const pick = (value: string | undefined | null, fallback: string) =>
  value && value.trim() ? value.trim() : fallback

const num = (value: string | undefined, fallback: number) => {
  const n = Number.parseFloat((value ?? "").trim())
  return Number.isFinite(n) ? n : fallback
}

export async function getSiteSettings(): Promise<SiteSettings> {
  let company: CompanySetting = {}
  let social: SocialSetting = {}

  /* Never let a settings read take a page down — metadata and structured data
     are decoration on a page that must still render. */
  try {
    const rows = await db.setting.findMany({ where: { key: { in: ["company", "social"] } } })
    for (const row of rows) {
      if (row.key === "company") company = (row.value ?? {}) as CompanySetting
      if (row.key === "social") social = (row.value ?? {}) as SocialSetting
    }
  } catch {
    // fall through to the defaults below
  }

  return {
    name: pick(company.name, FALLBACK.name),
    legalName: pick(company.legalName, FALLBACK.legalName),
    siteUrl: pick(company.siteUrl, FALLBACK.siteUrl).replace(/\/$/, ""),
    founded: pick(company.founded, FALLBACK.founded),
    logo: pick(company.logoUrl, FALLBACK.logo),
    email: pick(company.companyEmail, FALLBACK.email),
    bookingEmail: pick(company.bookingEmail, FALLBACK.bookingEmail),
    vatId: pick(company.vat, ""),
    phones: (company.phones ?? []).map((p) => p.trim()).filter(Boolean),
    address: {
      street: pick(company.street, FALLBACK.street),
      locality: pick(company.locality, FALLBACK.locality),
      region: pick(company.region, FALLBACK.region),
      postalCode: pick(company.postalCode, FALLBACK.postalCode),
      country: pick(company.country, FALLBACK.country),
    },
    geo: {
      latitude: num(company.latitude, FALLBACK.latitude),
      longitude: num(company.longitude, FALLBACK.longitude),
    },
    // Only real URLs: an empty field would otherwise claim a broken profile.
    sameAs: Object.values(social).filter((v) => typeof v === "string" && /^https?:\/\//i.test(v.trim())),
  }
}

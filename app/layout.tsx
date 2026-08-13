import type { Metadata } from "next"
import { Manrope, Inter, Commissioner, IBM_Plex_Mono } from "next/font/google"
import { TranslationProvider } from "@/lib/use-translations"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Parallax } from "@/components/parallax"
import { RevealFailsafe } from "@/components/reveal-failsafe"
import { PlanLauncher } from "@/components/plan/plan-launcher"
import { JsonLd } from "@/components/json-ld"
import { organizationLd, webSiteLd } from "@/lib/structured-data"
import { DEFAULT_OG_IMAGE } from "@/lib/seo"
import { getSiteSettings } from "@/lib/site-settings"
import { HtmlLang } from "@/components/html-lang"
import { ConsentProvider } from "@/components/consent/consent-provider"
import { CookieBanner } from "@/components/consent/cookie-banner"
import { GatedScripts } from "@/components/consent/gated-scripts"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// Neither Manrope nor Inter ships Greek glyphs. Commissioner does, and is
// stacked behind both so Greek copy falls back to it instead of a system face.
const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin", "greek"],
  display: "swap",
})

// Specs, prices and coordinates — always tabular. Latin only: Google Fonts
// ships no Greek subset for IBM Plex Mono, and this face only ever sets
// numerals and units.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/**
 * The site defaults.
 *
 * These previously described an admin platform — "Maritime enterprise
 * management platform" — which is what every page without its own metadata was
 * telling search engines the business does.
 *
 * `metadataBase` matters as much: without it Next cannot make og:image and
 * canonical absolute, and relative URLs in those are simply ignored.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: "Yacht Charter Lefkada, Greece — IYC Ionische Yacht Charter",
    template: "%s | IYC Yachts",
  },
  description:
    "Sailing yacht and catamaran charter from Lefkada in the Ionian, family-run since 1979. Bareboat or skippered, with a German office and a Greek base.",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.siteUrl }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: site.siteUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    alternateLocale: ["el_GR", "de_DE"],
    url: site.siteUrl,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE] },
  formatDetection: { telephone: true, address: true, email: true },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteSettings()

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${commissioner.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The business and the site, declared once. Everything else on the
            site points at these two @ids rather than restating them. */}
        <JsonLd data={[organizationLd(site), webSiteLd(site)]} />

        <SmoothScroll />
        <Parallax />
        <RevealFailsafe />
        <TranslationProvider>
          {/* Keeps <html lang> honest when the reader switches language. */}
          <HtmlLang />

          {/* Wraps everything, so any page can ask what the visitor allowed. */}
          <ConsentProvider>
            {children}
            {/* Mounted once here, so the conversation survives navigation. */}
            <PlanLauncher />
            <CookieBanner />
            {/* Nothing here reaches the page before a choice is made. */}
            <GatedScripts gaId={site.analytics.gaId} metaPixelId={site.analytics.metaPixelId} />
          </ConsentProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}

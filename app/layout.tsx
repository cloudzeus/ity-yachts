import type { Metadata } from "next"
import { Manrope, Inter, Commissioner, IBM_Plex_Mono } from "next/font/google"
import { TranslationProvider } from "@/lib/use-translations"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Parallax } from "@/components/parallax"
import { RevealFailsafe } from "@/components/reveal-failsafe"
import { PlanLauncher } from "@/components/plan/plan-launcher"
import { JsonLd } from "@/components/json-ld"
import { localBusinessLd, organizationLd, webSiteLd } from "@/lib/structured-data"
import { DEFAULT_OG_IMAGE } from "@/lib/seo"
import { getSiteSettings, isCanonicalHost } from "@/lib/site-settings"
import { getDictionary, getLocale } from "@/lib/translations.server"
import { HREFLANG } from "@/lib/locale"
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
  const canonical = await isCanonicalHost()
  return {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: "Yacht Charter Lefkada, Greece — IYC Ionische Yacht Charter",
    /* "IYC Yachts" is declared as an alternateName in the Organization
       schema, so the short suffix is still the same entity. Spelling the
       full name here would put every inner title at ~78 characters, well
       past where Google truncates. The homepage title carries it in full. */
    template: "%s | IYC Yachts",
  },
  description:
    "Sailing yacht and catamaran charter from Lefkada in the Ionian, family-run since 1979. Bareboat or skippered, with a German office and a Greek base.",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.siteUrl }],
  creator: site.name,
  publisher: site.name,
  /* Only the declared domain is allowed into the index. A staging copy
     answering "index, follow" is how the wrong host becomes the entity a
     search engine learns, and unpicking that afterwards is far harder than
     preventing it. With no domain configured nothing is indexable, which
     fails safe. */
  robots: canonical
    ? {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
  alternates: { canonical: site.siteUrl },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteSettings()
  /* Resolved from the URL by the proxy, so the markup is in the reader's
     language before a single byte of JavaScript runs. */
  const locale = await getLocale()
  const dictionary = await getDictionary(locale)

  return (
    <html
      lang={HREFLANG[locale]}
      className={`${manrope.variable} ${inter.variable} ${commissioner.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Every photograph and video on the site comes from this one host, so
            opening the connection early saves a round trip on first paint. */}
        <link rel="preconnect" href="https://iycweb.b-cdn.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://iycweb.b-cdn.net" />
        <meta name="theme-color" content="#05111F" />
        {/* Declared here rather than in metadata: a page that sets its own
            `alternates` replaces the layout's, and the feed would vanish from
            every page that does. Aggregators and AI crawlers look for this
            before they look for a sitemap. */}
        <link rel="alternate" type="application/rss+xml" title={`${site.name} — news`} href="/feed.xml" />
        {/* The plain-text brief for answer engines — see app/llms.txt. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* The business and the site, declared once. Everything else on the
            site points at these two @ids rather than restating them. */}
        <JsonLd data={[organizationLd(site), localBusinessLd(site), webSiteLd(site)]} />

        <SmoothScroll />
        <Parallax />
        <RevealFailsafe />
        <TranslationProvider locale={locale} dictionary={dictionary}>
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

import { ORG, SITE_URL, absolute, stripHtml } from "@/lib/seo"
import type { SiteSettings } from "@/lib/site-settings"

/**
 * JSON-LD for the site.
 *
 * There was none anywhere, which costs twice over: classic search loses rich
 * results and knowledge-panel signals, and generative engines lose the clean
 * facts they prefer to cite. Everything here hangs off two stable @ids — the
 * organisation and the website — so the graph resolves as one entity instead
 * of a new nameless business on every page.
 */

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

type Json = Record<string, unknown>

/**
 * The business itself, as a local business with a real address and real
 * coordinates. This is what carries "yacht charter near Lefkada" and what an
 * answer engine reads when asked where the company is.
 */
/**
 * The organisation.
 *
 * `@type` is a plain string, not an array. An audit of the deploy reported
 * "no Organization schema" and "no LocalBusiness schema" on a page that
 * carried both — because plenty of parsers only match `@type` when it is a
 * single value. The local business is emitted as its own node below and
 * pointed back here, which every parser reads.
 */
export function organizationLd(s: SiteSettings): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${s.siteUrl}/#organization`,
    name: s.name,
    legalName: s.legalName,
    alternateName: [...ORG.alternateName],
    url: s.siteUrl,
    logo: { "@type": "ImageObject", url: s.logo },
    image: s.logo,
    foundingDate: s.founded,
    ...(s.vatId ? { vatID: s.vatId } : {}),
    email: s.email,
    ...(s.phones.length ? { telephone: s.phones[0] } : {}),
    priceRange: "€€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.street,
      addressLocality: s.address.locality,
      addressRegion: s.address.region,
      postalCode: s.address.postalCode,
      addressCountry: s.address.country,
    },
    ...(s.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: s.geo.latitude, longitude: s.geo.longitude } }
      : {}),
    /* Where charters actually go, so "Ionian" and the islands attach to the
       business rather than only to individual pages. */
    areaServed: [
      { "@type": "Place", name: "Ionian Sea" },
      { "@type": "Place", name: "Lefkada" },
      { "@type": "Place", name: "Ithaca" },
      { "@type": "Place", name: "Kefalonia" },
      { "@type": "Place", name: "Meganisi" },
      { "@type": "Place", name: "Paxos" },
      { "@type": "Place", name: "Zakynthos" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "reservations",
        email: s.bookingEmail,
        ...(s.phones.length ? { telephone: s.phones[0] } : {}),
        areaServed: ["GR", "DE", "AT", "CH"],
        availableLanguage: ["English", "Greek", "German"],
      },
      // A second number, when one is configured, is the German office.
      ...(s.phones.length > 1
        ? [{
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: s.phones[1],
            areaServed: "DE",
            availableLanguage: ["German", "English"],
          }]
        : []),
    ],
    ...(s.sameAs.length ? { sameAs: s.sameAs } : {}),
    knowsLanguage: ["en", "el", "de"],
    /* What the business is actually authoritative on. Answer engines use this
       to decide whether a source is worth citing on a given subject. */
    knowsAbout: [
      "Yacht charter",
      "Bareboat charter",
      "Skippered charter",
      "Catamaran charter",
      "Sailing in the Ionian Sea",
      "Lefkada",
      "Sailing instruction",
      "Deutscher Segler-Verband certification",
      "Mediterranean seamanship",
    ],
  }
}

/**
 * The base as a place of business, as its own node.
 *
 * This is what carries "yacht charter near Lefkada" and what an answer engine
 * reads when asked where the company is.
 */
export function localBusinessLd(s: SiteSettings): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${s.siteUrl}/#base`,
    name: s.name,
    url: s.siteUrl,
    image: s.logo,
    email: s.bookingEmail,
    ...(s.phones.length ? { telephone: s.phones[0] } : {}),
    priceRange: "€€€",
    currenciesAccepted: "EUR",
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.street,
      addressLocality: s.address.locality,
      addressRegion: s.address.region,
      postalCode: s.address.postalCode,
      addressCountry: s.address.country,
    },
    ...(s.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: s.geo.latitude, longitude: s.geo.longitude } }
      : {}),
    parentOrganization: { "@id": `${s.siteUrl}/#organization` },
    areaServed: { "@type": "Place", name: "Ionian Sea, Greece" },
  }
}

/** The site, so a sitelinks search box can attach to it. */
export function webSiteLd(s: SiteSettings): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${s.siteUrl}/#website`,
    url: s.siteUrl,
    name: s.name,
    publisher: { "@id": `${s.siteUrl}/#organization` },
    inLanguage: ["en", "el", "de"],
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${s.siteUrl}/fleet?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }
}

/** The trail to this page. Google renders it in place of the raw URL. */
export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  }
}

export function articleLd({
  headline, description, path, image, published, modified, author,
}: {
  headline: string
  description: string
  path: string
  image?: string | null
  published?: string | null
  modified?: string | null
  author?: string
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: headline.slice(0, 110),
    description: stripHtml(description),
    mainEntityOfPage: { "@type": "WebPage", "@id": absolute(path) },
    ...(image ? { image: [image] } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: author ? { "@type": "Person", name: author } : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
  }
}

export function serviceLd({
  name, description, path, image,
}: {
  name: string
  description: string
  path: string
  image?: string | null
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description: stripHtml(description),
    url: absolute(path),
    ...(image ? { image } : {}),
    provider: { "@id": ORG_ID },
    serviceType: "Yacht charter service",
    areaServed: { "@type": "Place", name: "Ionian Sea, Greece" },
  }
}

/** A destination. TouristDestination is what AI answers about places read. */
export function destinationLd({
  name, description, path, image, latitude, longitude,
}: {
  name: string
  description: string
  path: string
  image?: string | null
  latitude?: number | null
  longitude?: number | null
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name,
    description: stripHtml(description),
    url: absolute(path),
    ...(image ? { image } : {}),
    ...(latitude != null && longitude != null
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
    includesAttraction: { "@type": "TouristAttraction", name },
    touristType: ["Sailing", "Yacht charter"],
    isPartOf: { "@type": "Place", name: "Ionian Islands, Greece" },
  }
}

export function tripLd({
  name, description, path, image, days,
}: {
  name: string
  description: string
  path: string
  image?: string | null
  days?: number | null
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description: stripHtml(description),
    url: absolute(path),
    ...(image ? { image } : {}),
    provider: { "@id": ORG_ID },
    departureTime: undefined,
    itinerary: { "@type": "ItemList", numberOfItems: days ?? undefined },
    touristType: ["Sailing", "Yacht charter"],
  }
}

/**
 * A video, so it can be found and described rather than ignored.
 *
 * `uploadDate` is required by Google and `thumbnailUrl` all but required —
 * without them the markup is present but ineligible, which is worse than
 * absent because it reads as done.
 */
export function videoLd({
  name, description, contentUrl, thumbnailUrl, uploadDate, pageUrl,
}: {
  name: string
  description: string
  contentUrl: string
  thumbnailUrl?: string | null
  uploadDate: string
  pageUrl: string
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description: stripHtml(description) || name,
    contentUrl,
    ...(thumbnailUrl ? { thumbnailUrl: [thumbnailUrl] } : {}),
    uploadDate,
    /* No embedUrl: that field means a player, and the page is a page. The
       @id ties the video to where it is shown without overstating it. */
    "@id": `${absolute(pageUrl)}#video`,
    inLanguage: "en",
  }
}

/**
 * The page itself, carrying when its content last changed.
 *
 * Freshness is judged on `dateModified`, and nothing else on these pages
 * carried one — Service and TouristDestination have no such property, so the
 * date has to live on the WebPage node. The value is the record's own
 * updatedAt, so it moves when the content moves and not before.
 */
export function webPageLd({
  name, description, path, published, modified,
}: {
  name: string
  description?: string
  path: string
  published?: string | null
  modified?: string | null
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absolute(path)}#webpage`,
    name,
    ...(description ? { description: stripHtml(description) } : {}),
    url: absolute(path),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    isPartOf: { "@id": SITE_ID },
    inLanguage: "en",
  }
}

/** A yacht in the fleet, as something that can actually be booked. */
export function yachtLd({
  name, description, path, image, model, year, cabins, berths, loa,
}: {
  name: string
  description: string
  path: string
  image?: string | null
  model?: string | null
  year?: number | null
  cabins?: number | null
  berths?: number | null
  loa?: number | null
}): Json {
  const specs: Json[] = []
  if (cabins) specs.push({ "@type": "PropertyValue", name: "Cabins", value: cabins })
  if (berths) specs.push({ "@type": "PropertyValue", name: "Berths", value: berths })
  if (loa) specs.push({ "@type": "PropertyValue", name: "Length overall", value: loa, unitCode: "MTR" })

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: stripHtml(description),
    url: absolute(path),
    ...(image ? { image: [image] } : {}),
    ...(model ? { model } : {}),
    ...(year ? { productionDate: String(year) } : {}),
    category: "Yacht charter",
    brand: { "@id": ORG_ID },
    ...(specs.length ? { additionalProperty: specs } : {}),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
      url: absolute(path),
      seller: { "@id": ORG_ID },
      areaServed: { "@type": "Place", name: "Lefkada, Greece" },
    },
  }
}

/**
 * Questions and answers, for featured snippets and voice.
 *
 * Answer engines lift these almost verbatim, so each answer has to stand on
 * its own without the page around it.
 */
export function faqLd(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(i.answer) },
    })),
  }
}

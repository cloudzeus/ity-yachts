import type { MetadataRoute } from "next"
import { getSiteSettings } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

/**
 * The web app manifest.
 *
 * Not about installability for a charter site — it is the file a browser and
 * several crawlers read for the site's name, colours and icons, and its
 * absence reads as an unfinished front end.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSiteSettings()

  return {
    name: site.name,
    short_name: "IYC",
    description:
      "Family-run yacht charter from Lefkada in the Ionian since 1979. Sailing yachts and catamarans, bareboat or with a skipper.",
    start_url: "/",
    display: "standalone",
    // The page ground and the deep navy the header sits on.
    background_color: "#FBF9F5",
    theme_color: "#05111F",
    lang: "en",
    categories: ["travel", "sports"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/brand/iyc-logo-navy.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }
}

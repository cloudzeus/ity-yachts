import { db } from "@/lib/db"
import { SiteFooterView } from "./site-footer-view"
import type { LegalLink } from "@/lib/use-legal-pages"
import type { SocialLink } from "@/lib/use-social-links"

/**
 * The footer, with its data read on the server.
 *
 * The legal and social links used to be fetched in an effect, which meant
 * they existed only after hydration — so no crawler ever saw them, and an
 * audit duly reported the site had no privacy policy link. Reading them here
 * puts them in the HTML on every page.
 */
export async function SiteFooter() {
  let legalPages: LegalLink[] = []
  let socialLinks: SocialLink[] = []
  let reviewLinks: { label: string; url: string }[] = []

  /* The footer is on every page; a settings read that fails must not be able
     to take one down. */
  try {
    const [legalRow, socialRow] = await Promise.all([
      db.setting.findUnique({ where: { key: "legal" } }),
      db.setting.findUnique({ where: { key: "social" } }),
    ])

    legalPages = ((legalRow?.value as { pages?: { slug: string; title: Record<string, string>; content: Record<string, string> }[] } | null)?.pages ?? [])
      .filter((p) => p.slug && Object.values(p.content ?? {}).some((v) => v?.trim()))
      .map((p) => ({ slug: p.slug, title: p.title }))

    const socialValue = (socialRow?.value ?? {}) as Record<string, string>
    /* Review platforms are kept out of the icon row: they are a sentence a
       reader acts on ("read what people wrote"), not a logo they recognise. */
    reviewLinks = ([
      ["google", "Google"],
      ["tripadvisor", "Tripadvisor"],
    ] as const)
      .map(([key, label]) => ({ label, url: (socialValue[key] ?? "").trim() }))
      .filter((r) => /^https?:\/\//i.test(r.url))

    socialLinks = Object.entries((socialRow?.value ?? {}) as Record<string, string>)
      .filter(([, url]) => typeof url === "string" && /^https?:\/\//i.test(url.trim()))
      .map(([network, url]) => ({ network, url: url.trim() }))
  } catch (error) {
    console.error("[SiteFooter]", error)
  }

  return <SiteFooterView legalPages={legalPages} socialLinks={socialLinks} reviewLinks={reviewLinks} />
}

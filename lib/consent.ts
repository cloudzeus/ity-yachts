/**
 * Cookie consent.
 *
 * The rules this is built to, which are the ones that matter for a business
 * selling into Greece and Germany:
 *
 *   — nothing but strictly necessary storage runs before a choice is made;
 *   — refusing is exactly as easy as accepting, one click, same prominence;
 *   — no box is pre-ticked;
 *   — the choice can be changed or withdrawn at any time;
 *   — the record is versioned, so a change of policy asks again rather than
 *     silently inheriting consent given to something else.
 */

export const CONSENT_COOKIE = "iyc-consent"

/** Bump when the categories or what they cover changes. Re-prompts everyone. */
export const CONSENT_VERSION = 1

/** A year is the usual maximum; after that we ask again either way. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365

export const CATEGORIES = ["necessary", "analytics", "marketing", "maps"] as const
export type Category = (typeof CATEGORIES)[number]

export interface Consent {
  v: number
  /** ISO date the choice was made — part of the record, not decoration. */
  at: string
  necessary: true
  analytics: boolean
  marketing: boolean
  maps: boolean
}

/** No box pre-ticked. `necessary` is true because it cannot be switched off. */
export const DENY_ALL: Omit<Consent, "v" | "at"> = {
  necessary: true,
  analytics: false,
  marketing: false,
  maps: false,
}

export const ALLOW_ALL: Omit<Consent, "v" | "at"> = {
  necessary: true,
  analytics: true,
  marketing: true,
  maps: true,
}

export function makeConsent(choice: Omit<Consent, "v" | "at">): Consent {
  return { v: CONSENT_VERSION, at: new Date().toISOString(), ...choice, necessary: true }
}

/** Read the stored choice, or null when none has been made for this version. */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1)
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Consent
    // A record from an older version is not consent to the current categories.
    if (parsed?.v !== CONSENT_VERSION) return null
    return { ...parsed, necessary: true }
  } catch {
    return null
  }
}

export function writeConsent(consent: Consent) {
  if (typeof document === "undefined") return
  const value = encodeURIComponent(JSON.stringify(consent))
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`
}

/**
 * Remove what a category left behind when it is switched off.
 *
 * Withdrawing consent has to actually withdraw it — leaving a live analytics
 * cookie in place after the visitor said no is the most common way a banner
 * ends up being decorative.
 */
export function clearCategoryCookies(category: Category) {
  if (typeof document === "undefined") return

  const prefixes: Record<Category, string[]> = {
    necessary: [],
    analytics: ["_ga", "_gid", "_gat", "_gac"],
    marketing: ["_fbp", "_fbc", "fr"],
    maps: ["NID", "SNID", "1P_JAR"],
  }

  const wanted = prefixes[category]
  if (!wanted.length) return

  const host = location.hostname
  // The bare host and the dot-prefixed parent, because third parties set both.
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]

  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0]
    if (!wanted.some((p) => name.startsWith(p))) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Domain=${domain}; Max-Age=0`
    }
    document.cookie = `${name}=; Path=/; Max-Age=0`
  }
}

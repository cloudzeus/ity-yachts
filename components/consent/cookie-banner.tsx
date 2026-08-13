"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { DENY_ALL, type Category, type Consent } from "@/lib/consent"
import { useConsent } from "./consent-provider"

/** Everything except `necessary`, which cannot be switched off. */
const OPTIONAL: Category[] = ["analytics", "marketing", "maps"]

function useCategoryCopy(): Record<Category, { title: string; body: string }> {
  const { t } = useTranslations()
  return {
    necessary: {
      title: t("consent.necessary.title", "Strictly necessary"),
      body: t("consent.necessary.body", "Keeps you signed in, remembers your language, and carries an enquiry through to us. The site cannot work without these, so they cannot be switched off."),
    },
    analytics: {
      title: t("consent.analytics.title", "Analytics"),
      body: t("consent.analytics.body", "Tells us which pages people read and where they leave, so we can improve them. We never see who you are."),
    },
    marketing: {
      title: t("consent.marketing.title", "Advertising"),
      body: t("consent.marketing.body", "Lets us measure whether an advert reached the right person, and stop showing you one you have already acted on."),
    },
    maps: {
      title: t("consent.maps.title", "Maps"),
      body: t("consent.maps.body", "Loads Google Maps on our destination and route pages. Google sets its own cookies when a map loads, so we ask first."),
    },
  }
}

export function CookieBanner() {
  const { t } = useTranslations()
  const { consent, ready, acceptAll, rejectAll, preferencesOpen, openPreferences } = useConsent()

  const showBanner = ready && consent === null && !preferencesOpen

  return (
    <>
      {/* ── The bar ────────────────────────────────────────────────────
          Accept and reject sit side by side at the same size: refusing has to
          be no harder than agreeing, which is where most banners fail. */}
      {showBanner && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t("consent.title", "Cookies on this site")}
          className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-4"
          /* Held back for a beat: React hydrates with the server's "no choice
             yet" before the real cookie arrives, and a returning visitor
             should never see the banner blink past. */
          style={{ animation: "iycConsentIn .32s var(--ease-out, ease-out) .45s both" }}
        >
          <div
            className="mx-auto flex max-w-[1100px] flex-col gap-4 rounded-2xl p-5 shadow-2xl sm:p-6 lg:flex-row lg:items-center"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}
          >
            <div className="min-w-0 flex-1">
              <h2 className="mb-1.5 text-base" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>
                {t("consent.title", "Cookies on this site")}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("consent.body", "We use what the site needs to work. With your agreement we would also like to measure how the site is used, load maps, and see whether our advertising reaches the right people.")}{" "}
                <Link href="/legal/data-protection" className="underline underline-offset-2" style={{ color: "var(--text-link)" }}>
                  {t("consent.readMore", "How we handle your data")}
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
              <button
                onClick={rejectAll}
                className="rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold transition"
                style={{ border: "1px solid var(--border-hairline)", color: "var(--text-body)", fontFamily: "var(--font-display)" }}
              >
                {t("consent.rejectAll", "Reject all")}
              </button>
              <button
                onClick={acceptAll}
                className="rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold transition"
                style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
              >
                {t("consent.acceptAll", "Accept all")}
              </button>
              <button
                onClick={openPreferences}
                className="rounded-[var(--iyc-radius-sm)] px-4 py-3 text-sm underline underline-offset-2"
                style={{ color: "var(--text-muted)" }}
              >
                {t("consent.manage", "Choose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {preferencesOpen && <PreferencesDialog />}

      <style>{`@keyframes iycConsentIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </>
  )
}

/**
 * The preferences dialog.
 *
 * Its own component, mounted only while open, so the draft starts from the
 * stored choice at mount rather than being synced into place afterwards.
 */
function PreferencesDialog() {
  const { t } = useTranslations()
  const { consent, save, rejectAll, closePreferences } = useConsent()
  const copy = useCategoryCopy()

  const [draft, setDraft] = useState<Omit<Consent, "v" | "at">>(() =>
    consent ? { ...consent } : { ...DENY_ALL }
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePreferences() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [closePreferences])

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={closePreferences}
        className="absolute inset-0"
        style={{ background: "rgba(4,13,25,.55)", backdropFilter: "blur(2px)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("consent.prefsTitle", "Your cookie choices")}
        className="relative flex max-h-[85vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}
      >
        <div className="flex items-start gap-4 px-6 py-5" style={{ borderBottom: "1px solid var(--border-hairline)" }}>
          <h2 className="flex-1 text-lg" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>
            {t("consent.prefsTitle", "Your cookie choices")}
          </h2>
          <button
            onClick={closePreferences}
            aria-label={t("consent.close", "Close")}
            className="grid h-8 w-8 place-items-center rounded-full"
            style={{ background: "var(--surface-sunken)", color: "var(--text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            {(["necessary", ...OPTIONAL] as Category[]).map((c) => {
              const locked = c === "necessary"
              const on = locked ? true : draft[c]
              return (
                <div key={c} className="flex items-start gap-4 rounded-xl p-4" style={{ background: "var(--surface-sunken)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                      {copy[c].title}
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {copy[c].body}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={copy[c].title}
                    disabled={locked}
                    onClick={() => setDraft((d) => ({ ...d, [c]: !d[c] }))}
                    className="mt-0.5 flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors disabled:opacity-45"
                    style={{ background: on ? "var(--iyc-ionian-600)" : "var(--border-hairline)" }}
                  >
                    <span
                      className="h-5 w-5 rounded-full bg-white transition-transform"
                      style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row-reverse" style={{ borderTop: "1px solid var(--border-hairline)" }}>
          <button
            onClick={() => save(draft)}
            className="rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold"
            style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
          >
            {t("consent.save", "Save my choices")}
          </button>
          <button
            onClick={rejectAll}
            className="rounded-[var(--iyc-radius-sm)] px-6 py-3 text-sm font-semibold"
            style={{ border: "1px solid var(--border-hairline)", color: "var(--text-body)", fontFamily: "var(--font-display)" }}
          >
            {t("consent.rejectAll", "Reject all")}
          </button>
          <span className="flex-1" />
        </div>
      </div>
    </div>
  )
}

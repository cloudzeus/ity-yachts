"use client"

import { useState } from "react"
import { ArrowUpRight, Check, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

/**
 * The footer sign-up.
 *
 * It was an input and a button wired to nothing at all. Now it is a real form:
 * the address is written down as pending, a confirmation email goes out, and
 * nobody joins the list until they click it.
 */
export function NewsletterForm({ iconColor }: { iconColor?: string }) {
  const { t, locale } = useTranslations()
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")   // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === "sending" || !email.trim()) return

    setState("sending")
    setMessage("")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source: "footer", website }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.ok) {
        setState("sent")
        setEmail("")
        setMessage(t("newsletter.checkInbox", "Almost there — click the link in the email we just sent."))
      } else {
        setState("error")
        setMessage(
          data.error === "email"
            ? t("newsletter.badEmail", "That does not look like an email address.")
            : t("newsletter.failed", "That did not go through. Please try again in a moment.")
        )
      }
    } catch {
      setState("error")
      setMessage(t("newsletter.failed", "That did not go through. Please try again in a moment."))
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          {t("footer.emailPlaceholder", "Your email")}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("footer.emailPlaceholder", "Your email")}
          className="flex-1 border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/70 focus:border-white/25 focus:outline-none"
          style={{ borderRadius: "6px", fontFamily: "var(--font-body)" }}
        />

        {/* Hidden from people, irresistible to bots. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />

        <button
          type="submit"
          disabled={state === "sending"}
          className="flex items-center justify-center bg-white/10 px-3 py-2 text-white/60 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
          style={{ borderRadius: "6px" }}
          aria-label={t("newsletter.subscribe", "Subscribe")}
        >
          {state === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: iconColor }} />
          ) : state === "sent" ? (
            <Check className="h-4 w-4" style={{ color: iconColor }} />
          ) : (
            <ArrowUpRight className="h-4 w-4" style={{ color: iconColor }} />
          )}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mt-2 text-xs leading-relaxed"
          style={{ color: state === "error" ? "#F0A9A9" : "rgba(255,255,255,0.72)" }}
        >
          {message}
        </p>
      )}

      {/* Said before they sign up, not after. */}
      <p className="mt-2 text-[11px] leading-relaxed text-white/45">
        {t("newsletter.consentNote", "A few emails a year. You can leave at any time, and we never pass your address on.")}
      </p>
    </form>
  )
}

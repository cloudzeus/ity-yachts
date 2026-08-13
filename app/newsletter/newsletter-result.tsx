"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"

/** What a reader sees after following a confirm or unsubscribe link. */
export function NewsletterResult({ state }: { state: string }) {
  const { t } = useTranslations()

  const copy: Record<string, { ok: boolean; title: string; body: string }> = {
    confirmed: {
      ok: true,
      title: t("newsletter.confirmed.title", "You are on the list"),
      body: t("newsletter.confirmed.body", "Thank you. You will hear from us a few times a year, from the base in Lefkada. Every email has a one-click way out at the foot of it."),
    },
    unsubscribed: {
      ok: true,
      title: t("newsletter.unsubscribed.title", "You have been removed"),
      body: t("newsletter.unsubscribed.body", "That is done — we will not write again. If it was a mistake, you can sign up again from the foot of any page."),
    },
    invalid: {
      ok: false,
      title: t("newsletter.invalid.title", "That link is no longer valid"),
      body: t("newsletter.invalid.body", "It may have been used already, or replaced by a newer one. Sign up again from the foot of any page and we will send a fresh link."),
    },
  }

  const result = copy[state] ?? copy.invalid

  return (
    <section className="mx-auto flex max-w-[560px] flex-col items-center px-6 pb-28 pt-40 text-center md:pt-48">
      <span
        className="mb-6 grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: result.ok ? "var(--iyc-ionian-50)" : "var(--surface-sunken)",
          color: result.ok ? "var(--iyc-ionian-600)" : "var(--text-subtle)",
        }}
      >
        {result.ok ? <Check size={26} strokeWidth={1.5} /> : <X size={26} strokeWidth={1.5} />}
      </span>

      <h1
        className="mb-4 text-[clamp(1.7rem,3.4vw,2.4rem)] font-light leading-[1.15]"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)", textWrap: "balance" }}
      >
        {result.title}
      </h1>

      <p className="mb-9 max-w-[46ch] text-[1.02rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {result.body}
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-7 py-3.5 text-sm font-semibold"
        style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
      >
        {t("newsletter.backHome", "Back to the site")}
      </Link>
    </section>
  )
}

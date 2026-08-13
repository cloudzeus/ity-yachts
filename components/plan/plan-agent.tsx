"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Send, Check, RotateCcw, AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import type { PlanAnswers } from "@/lib/plan-wizard"

interface Msg {
  role: "user" | "assistant"
  content: string
}

type Phase = "talking" | "sending" | "sent" | "error"

/**
 * The planning conversation.
 *
 * The answers are held server-side and echoed back each turn, so this component
 * never owns the truth about what has been collected — it just carries the
 * envelope. Quick replies do most of the work: on a phone, typing free text
 * for eight questions is the fastest way to lose someone.
 */
export function PlanAgent({
  variant = "standalone",
  headerAction,
}: {
  /** "panel" fills its docked container; "standalone" sizes itself. */
  variant?: "standalone" | "panel"
  headerAction?: React.ReactNode
} = {}) {
  const { t, locale } = useTranslations()
  const [messages, setMessages] = useState<Msg[]>([])
  const [answers, setAnswers] = useState<Partial<PlanAnswers>>({})
  const [quick, setQuick] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [phase, setPhase] = useState<Phase>("talking")
  const [failed, setFailed] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)

  // Keep the newest message in view without yanking the whole page.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, thinking, quick])

  const turn = async (history: Msg[], carried: Partial<PlanAnswers>) => {
    setThinking(true)
    setQuick([])
    setFailed(false)
    try {
      const res = await fetch("/api/plan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, answers: carried, locale }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()

      setAnswers(data.answers ?? carried)
      setQuick(data.quick ?? [])
      const next = [...history, { role: "assistant" as const, content: data.reply }]
      setMessages(next)

      if (data.done) await submit(data.answers as PlanAnswers)
    } catch {
      setFailed(true)
    } finally {
      setThinking(false)
    }
  }

  const submit = async (final: PlanAnswers) => {
    setPhase("sending")
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final),
      })
      const data = await res.json()
      setPhase(res.ok && data.ok ? "sent" : "error")
    } catch {
      setPhase("error")
    }
  }

  // React 18 mounts effects twice in development; the guard keeps the
  // conversation from opening with two greetings.
  useEffect(() => {
    if (started.current) return
    started.current = true
    turn([], {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const say = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    setInput("")
    const next = [...messages, { role: "user" as const, content: trimmed }]
    setMessages(next)
    turn(next, answers)
  }

  const restart = () => {
    setMessages([])
    setAnswers({})
    setQuick([])
    setPhase("talking")
    turn([], {})
  }

  if (phase === "sent") {
    return (
      <div className="rounded-3xl p-10 text-center" style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-md)" }}>
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--iyc-ionian-50)", color: "var(--iyc-ionian-600)" }}>
          <Check size={26} strokeWidth={1.5} />
        </span>
        <h2 className="mb-3 text-2xl md:text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>
          {t("plan.sent.title", "Your plan is on its way")}
        </h2>
        <p className="mx-auto mb-7 max-w-[46ch] text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("plan.sent.body", "We have sent you a copy of everything you told us. Maria or Thomas will write to you personally, usually within a day.")}
        </p>
        <Link
          href="/fleet"
          className="inline-flex items-center gap-2 rounded-[var(--iyc-radius-sm)] px-7 py-3.5 text-sm font-semibold"
          style={{ background: "var(--action-accent)", color: "#ffffff", fontFamily: "var(--font-display)" }}
        >
          {t("plan.sent.cta", "Look at the fleet meanwhile")}
        </Link>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-3xl"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        boxShadow: variant === "panel" ? "none" : "var(--shadow-md)",
        borderRadius: variant === "panel" ? 20 : undefined,
        height: variant === "panel" ? "100%" : "min(72vh, 680px)",
      }}
    >
      {/* Who you are talking to */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--border-hairline)", background: "linear-gradient(158deg, var(--iyc-ionian-700), var(--iyc-ionian-900))" }}>
        <span className="relative h-8 w-20 flex-shrink-0">
          <Image src="/brand/iyc-logo-navy.svg" alt="IYC" fill className="object-contain brightness-0 invert" unoptimized />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{t("plan.agent.name", "Planning desk")}</div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.66)" }}>
            {t("plan.agent.role", "Lefkada · answers in a minute")}
          </div>
        </div>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-7">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed"
              style={
                m.role === "user"
                  ? { background: "var(--iyc-ionian-600)", color: "#ffffff", borderBottomRightRadius: 6 }
                  : { background: "var(--surface-sunken)", color: "var(--text-body)", borderBottomLeftRadius: 6 }
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 rounded-2xl px-4 py-4" style={{ background: "var(--surface-sunken)", borderBottomLeftRadius: 6 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--text-subtle)", animation: `planDot 1.2s ${i * 0.18}s infinite ease-in-out` }}
                />
              ))}
            </div>
          </div>
        )}

        {failed && (
          <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "var(--surface-sunken)", color: "var(--text-muted)" }}>
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              {t("plan.error.turn", "That did not go through.")}{" "}
              <button onClick={() => turn(messages, answers)} className="underline" style={{ color: "var(--text-link)" }}>
                {t("plan.error.retry", "Try again")}
              </button>
            </span>
          </div>
        )}

        {phase === "sending" && (
          <div className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {t("plan.sending", "Sending your plan…")}
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "var(--surface-sunken)", color: "var(--text-muted)" }}>
            {t("plan.error.send", "We could not send it. Please email us at info@iyc.de and we will pick it up from there.")}
          </div>
        )}
      </div>

      {/* Quick replies — the fast path */}
      {quick.length > 0 && !thinking && phase === "talking" && (
        <div className="flex flex-wrap gap-2 px-5 pb-3 md:px-7">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => say(q)}
              className="rounded-full px-4 py-2 text-sm transition"
              style={{ background: "var(--iyc-ionian-50)", color: "var(--iyc-ionian-700)", border: "1px solid var(--iyc-ionian-100)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--iyc-ionian-100)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--iyc-ionian-50)" }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Free text, always available */}
      <div className="flex items-center gap-2 px-5 py-4 md:px-7" style={{ borderTop: "1px solid var(--border-hairline)" }}>
        <button
          onClick={restart}
          title={t("plan.restart", "Start over")}
          aria-label={t("plan.restart", "Start over")}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full transition"
          style={{ color: "var(--text-subtle)" }}
        >
          <RotateCcw size={16} />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") say(input) }}
          disabled={thinking || phase !== "talking"}
          placeholder={t("plan.placeholder", "Type your answer…")}
          className="flex-1 rounded-full px-4 py-2.5 text-[15px] outline-none"
          style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-input)", color: "var(--text-body)" }}
        />
        <button
          onClick={() => say(input)}
          disabled={thinking || !input.trim() || phase !== "talking"}
          aria-label={t("plan.send", "Send")}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full transition disabled:opacity-40"
          style={{ background: "var(--action-accent)", color: "#ffffff" }}
        >
          <Send size={16} />
        </button>
      </div>

      <style>{`@keyframes planDot{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
    </div>
  )
}

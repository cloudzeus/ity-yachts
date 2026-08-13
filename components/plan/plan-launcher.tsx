"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageSquare, X } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { PlanAgent } from "./plan-agent"

/** Any control anywhere can open the planner by firing this. */
export const OPEN_PLANNER = "iyc:open-planner"

export function openPlanner() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_PLANNER))
}

/**
 * The planning conversation as a docked panel, bottom right, on every public
 * page.
 *
 * Mounted once in the layout, so the conversation survives navigation: someone
 * can be three questions in, go and look at a yacht, and come back to the same
 * thread. That is the whole reason this is a panel and not a page.
 */
export function PlanLauncher() {
  const { t } = useTranslations()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [everOpened, setEverOpened] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Built on first open, then kept: a visitor who never touches it pays for
  // nothing, and one who closes it mid-conversation comes back to the thread.
  useEffect(() => {
    if (open) setEverOpened(true)
  }, [open])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_PLANNER, onOpen)
    return () => window.removeEventListener(OPEN_PLANNER, onOpen)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, close])

  // The public site only — the admin has no use for it.
  if (pathname.startsWith("/admin")) return null

  return (
    <>
      {/* Scrim on small screens only: on a phone the panel is full height, so
          it needs to read as a layer over the page. */}
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-[90] md:hidden"
          style={{ background: "rgba(4,13,25,.45)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Hidden rather than unmounted, so closing the panel does not throw the
          conversation away. Toggling `display` also sidesteps animating height
          between zero and full, which is what a collapsed panel would need. */}
      {everOpened && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={t("plan.agent.name", "Planning desk")}
          className="fixed z-[95] flex-col overflow-hidden shadow-2xl"
          style={{
            display: open ? "flex" : "none",
            right: "max(16px, env(safe-area-inset-right))",
            bottom: "calc(84px + env(safe-area-inset-bottom))",
            width: "min(calc(100vw - 32px), 420px)",
            maxHeight: "calc(100vh - 116px)",
            height: 620,
            borderRadius: 20,
            animation: "planPanelIn .28s var(--ease-out) both",
          }}
        >
          <PlanAgent
            variant="panel"
            headerAction={
              <button
                onClick={close}
                aria-label={t("plan.close", "Close")}
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full transition"
                style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff" }}
              >
                <X size={15} />
              </button>
            }
          />
          <style>{`@keyframes planPanelIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}

      {/* The launcher itself */}
      <button
        ref={buttonRef}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? t("plan.close", "Close") : t("header.startPlanning", "Start planning")}
        className="fixed z-[96] flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
        style={{
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "max(16px, env(safe-area-inset-bottom))",
          background: open ? "var(--iyc-ionian-800)" : "var(--action-accent)",
          color: "#ffffff",
          fontFamily: "var(--font-display)",
        }}
      >
        {open ? <X size={17} /> : <MessageSquare size={17} />}
        <span className={open ? "hidden" : "hidden sm:inline"}>
          {t("header.startPlanning", "Start planning")}
        </span>
      </button>
    </>
  )
}

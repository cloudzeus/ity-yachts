"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { RefreshCw, CheckCircle2, XCircle, Loader2, Database, Ship, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type StepDef = { key: string; label: string; wave: number }
type StepStatus = "pending" | "syncing" | "done" | "error"

interface StepState {
  status: StepStatus
  count: number
  error?: string
  detail?: string
}

interface SyncModalProps {
  onClose: () => void
  onComplete: () => void
}

export function SyncModal({ onClose, onComplete }: SyncModalProps) {
  const [steps, setSteps] = useState<StepDef[]>([])
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({})
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle")
  const [overallStatus, setOverallStatus] = useState<string>("")
  const [totalItems, setTotalItems] = useState(0)
  const [imageProgress, setImageProgress] = useState<{ yachtName: string; current: number; total: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef<number>(0)
  const [elapsed, setElapsed] = useState(0)

  // Timer
  useEffect(() => {
    if (phase !== "running") return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const startSync = useCallback(async () => {
    setPhase("running")
    startTimeRef.current = Date.now()
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch("/api/admin/fleet/sync/stream", { signal: abort.signal })
      if (!res.ok) {
        const err = await res.text()
        setPhase("error")
        setOverallStatus(err)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const chunk of lines) {
          const dataLine = chunk.replace(/^data: /, "").trim()
          if (!dataLine) continue

          try {
            const msg = JSON.parse(dataLine)

            if (msg.type === "init") {
              setSteps(msg.steps)
              const initial: Record<string, StepState> = {}
              for (const s of msg.steps) {
                initial[s.key] = { status: "pending", count: 0 }
              }
              setStepStates(initial)
            }

            if (msg.type === "progress") {
              setStepStates((prev) => ({
                ...prev,
                [msg.key]: {
                  status: msg.status === "syncing" ? "syncing" : msg.status === "done" ? "done" : "error",
                  count: msg.count ?? 0,
                  error: msg.error,
                  detail: msg.detail,
                },
              }))
              // Clear image sub-progress when images step completes
              if (msg.key === "images" && msg.status !== "syncing") {
                setImageProgress(null)
              }
            }

            if (msg.type === "image_progress") {
              setImageProgress({ yachtName: msg.yachtName, current: msg.current, total: msg.total })
            }

            if (msg.type === "complete") {
              setTotalItems(msg.itemCount ?? 0)
              if (msg.status === "completed") {
                setPhase("done")
                setOverallStatus("Sync completed successfully")
              } else {
                setPhase("error")
                setOverallStatus(msg.error || "Sync failed")
              }
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (err: unknown) {
      if (abort.signal.aborted) return
      const msg = err instanceof Error ? err.message : "Connection failed"
      setPhase("error")
      setOverallStatus(msg)
    }
  }, [])

  // Auto-start on mount
  useEffect(() => {
    startSync()
    return () => abortRef.current?.abort()
  }, [startSync])

  const doneCount = Object.values(stepStates).filter((s) => s.status === "done").length
  const errorCount = Object.values(stepStates).filter((s) => s.status === "error").length
  const totalSteps = steps.length
  const progressPct = totalSteps > 0 ? Math.round(((doneCount + errorCount) / totalSteps) * 100) : 0

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const statusIcon = (s: StepStatus) => {
    switch (s) {
      case "pending":
        return <div className="size-4 rounded-full border-2" style={{ borderColor: "var(--outline-variant)" }} />
      case "syncing":
        return <Loader2 className="size-4 animate-spin" style={{ color: "var(--primary)" }} />
      case "done":
        return <CheckCircle2 className="size-4" style={{ color: "#2D6A4F" }} />
      case "error":
        return <XCircle className="size-4" style={{ color: "#D32F2F" }} />
    }
  }

  // Group by wave
  const waves = new Map<number, StepDef[]>()
  for (const s of steps) {
    if (!waves.has(s.wave)) waves.set(s.wave, [])
    waves.get(s.wave)!.push(s)
  }
  const waveLabels: Record<number, string> = {
    1: "Reference Data",
    2: "Dependent Tables",
    3: "Locations",
    4: "Charter Bases",
    5: "Fleet",
    6: "Media Upload",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-lg, 0 25px 50px rgba(0,0,0,0.25))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg" style={{ background: "var(--primary-container, #e3f2fd)" }}>
              <Database className="size-5" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                NAUSYS Sync
              </h2>
              <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                {phase === "running" ? `Syncing... ${formatTime(elapsed)}` : phase === "done" ? `Done in ${formatTime(elapsed)}` : phase === "error" ? "Failed" : "Starting..."}
              </p>
            </div>
          </div>
          {(phase === "done" || phase === "error") && (
            <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
              <X className="size-4" style={{ color: "var(--on-surface-variant)" }} />
            </button>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>
              {doneCount + errorCount} / {totalSteps} tables
            </span>
            <span className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-container, #e0e0e0)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: phase === "error" && progressPct === 100 ? "#D32F2F" : phase === "done" ? "#2D6A4F" : "var(--primary)",
              }}
            />
          </div>
          {phase === "running" && (
            <p className="text-[10px] mt-1.5 italic" style={{ color: "var(--on-surface-variant)" }}>
              Syncing reference data and fleet from NAUSYS — this usually takes 30–60 seconds...
            </p>
          )}
        </div>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto px-5 py-3" style={{ maxHeight: "50vh" }}>
          {Array.from(waves.entries())
            .sort(([a], [b]) => a - b)
            .map(([waveNum, waveSteps]) => (
              <div key={waveNum} className="mb-3">
                <p className="text-[10px] uppercase font-semibold tracking-wider mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  {waveLabels[waveNum] ?? `Wave ${waveNum}`}
                </p>
                <div className="flex flex-col gap-0.5">
                  {waveSteps.map((step) => {
                    const state = stepStates[step.key] ?? { status: "pending", count: 0 }
                    return (
                      <div
                        key={step.key}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-md transition-colors"
                        style={{
                          background: state.status === "syncing" ? "var(--primary-container, #e3f2fd)" : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          {statusIcon(state.status)}
                          <span
                            className="text-xs"
                            style={{
                              color: state.status === "syncing" ? "var(--primary)" : state.status === "done" ? "var(--on-surface)" : state.status === "error" ? "#D32F2F" : "var(--on-surface-variant)",
                              fontWeight: state.status === "syncing" ? 600 : 400,
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                        <div className="text-right">
                          {state.status === "done" && (
                            <span className="text-[11px] font-medium" style={{ color: "#2D6A4F" }}>
                              {state.detail ?? `${state.count.toLocaleString()} items`}
                            </span>
                          )}
                          {state.status === "error" && (
                            <span className="text-[11px]" style={{ color: "#D32F2F" }} title={state.error}>
                              failed
                            </span>
                          )}
                          {state.status === "syncing" && step.key === "images" && imageProgress ? (
                            <span className="text-[11px]" style={{ color: "var(--primary)" }}>
                              {imageProgress.current}/{imageProgress.total} — {imageProgress.yachtName}
                            </span>
                          ) : state.status === "syncing" ? (
                            <span className="text-[11px]" style={{ color: "var(--primary)" }}>
                              fetching...
                            </span>
                          ) : null}
                        </div>
                        {/* Image upload sub-progress bar */}
                        {step.key === "images" && state.status === "syncing" && imageProgress && (
                          <div className="mt-1.5 w-full">
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-container, #e0e0e0)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.round((imageProgress.current / imageProgress.total) * 100)}%`,
                                  background: "var(--primary)",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          {phase === "done" ? (
            <>
              <span className="text-xs" style={{ color: "#2D6A4F" }}>
                {totalItems.toLocaleString()} total items synced
              </span>
              <Button
                size="sm"
                className="h-8 gap-2 text-xs"
                style={{ background: "var(--primary)" }}
                onClick={() => { onComplete(); onClose() }}
              >
                <Ship className="size-3.5" /> View Fleet
              </Button>
            </>
          ) : phase === "error" ? (
            <>
              <span className="text-xs" style={{ color: "#D32F2F" }}>
                {overallStatus}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onClose}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-2 text-xs"
                  style={{ background: "var(--primary)" }}
                  onClick={() => {
                    setPhase("idle")
                    setStepStates({})
                    setSteps([])
                    setElapsed(0)
                    startSync()
                  }}
                >
                  <RefreshCw className="size-3.5" /> Retry
                </Button>
              </div>
            </>
          ) : (
            <span className="text-xs italic" style={{ color: "var(--on-surface-variant)" }}>
              Please wait, do not close this window...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export interface ArticleDraft {
  title: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  metaTitle: string
  metaDesc: string
  suggestedTags: string[]
  readMinutes: number | null
}

const LENGTHS = [
  { value: "short" as const, label: "Short", hint: "350–500 words" },
  { value: "standard" as const, label: "Standard", hint: "700–900 words" },
  { value: "long" as const, label: "Long", hint: "1100–1500 words" },
]

/**
 * Draft an article from a one-line brief.
 *
 * What comes back replaces the title, both descriptions and the meta — so it
 * asks first when there is already work in those fields. Media, slug, category
 * and tags are never touched.
 */
export function ArticleWriter({
  categoryId,
  tagIds,
  hasContent,
  onDraft,
}: {
  categoryId: string
  tagIds: string[]
  hasContent: boolean
  onDraft: (draft: ArticleDraft) => void
}) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("")
  const [length, setLength] = useState<"short" | "standard" | "long">("standard")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!topic.trim() || busy) return
    if (hasContent && !confirm("This replaces the title, both descriptions and the meta fields. Continue?")) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, length, categoryId: categoryId || undefined, tagIds }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "It did not come back"); return }
      onDraft(json.draft)
      setOpen(false)
      setTopic("")
    } catch {
      setError("It did not come back")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setOpen(true)}
        style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
      >
        <Sparkles className="size-3" />
        Write a draft
      </Button>

      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Write a draft</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                What is it about
              </Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") run() }}
                placeholder="Reading the Maistros before a morning departure"
                className="h-8 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
              <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                One line is enough. Write it in whichever language you think in — all three come back.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                Length
              </Label>
              <div className="flex overflow-hidden rounded-md border" style={{ borderColor: "var(--outline-variant)" }}>
                {LENGTHS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLength(l.value)}
                    title={l.hint}
                    className="flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors"
                    style={{
                      background: length === l.value ? "var(--primary)" : "transparent",
                      color: length === l.value ? "var(--on-primary)" : "var(--on-surface-variant)",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                Tone <span className="normal-case opacity-60">— optional</span>
              </Label>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="practical, for someone on their first charter"
                className="h-8 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "#C1782A" }}>
                <AlertCircle className="size-3.5" /> {error}
              </p>
            )}

            <p className="text-[10px] leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
              It writes from what it knows of the Ionian and will not invent prices, dates, availability or
              yacht names. Read it before publishing — it is a draft.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={run} disabled={busy || !topic.trim()}>
                {busy ? <><Loader2 className="size-3 animate-spin" /> Writing…</> : <><Sparkles className="size-3" /> Write</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

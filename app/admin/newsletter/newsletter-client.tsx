"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Loader2, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Subscriber {
  id: string
  email: string
  name: string | null
  locale: string
  status: string
  source: string
  confirmedAt: string | null
  unsubscribedAt: string | null
  createdAt: string
}

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  subscribed: { label: "Subscribed", bg: "#E1EEE7", fg: "#1F6048" },
  pending: { label: "Awaiting confirmation", bg: "#F7EBD9", fg: "#8A5410" },
  unsubscribed: { label: "Unsubscribed", bg: "#EDEDED", fg: "#666666" },
}

const FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "subscribed", label: "Subscribed" },
  { value: "pending", label: "Awaiting confirmation" },
  { value: "unsubscribed", label: "Unsubscribed" },
]

export function NewsletterClient() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== "all") params.set("status", status)
      if (q.trim()) params.set("q", q.trim())
      const res = await fetch(`/api/admin/newsletter?${params}`)
      const data = await res.json()
      setSubscribers(data.subscribers ?? [])
      setCounts(data.counts ?? {})
    } finally {
      setLoading(false)
    }
  }, [status, q])

  // Debounced, so typing a search does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, q])

  const remove = async (id: string, email: string) => {
    if (!confirm(`Delete ${email} completely? Unsubscribing is usually enough — this is for an erasure request.`)) return
    await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" })
    load()
  }

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  )

  const date = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.subscribed ?? 0} subscribed
            {counts.pending ? ` · ${counts.pending} awaiting confirmation` : ""}
            {counts.unsubscribed ? ` · ${counts.unsubscribed} unsubscribed` : ""}
            {total === 0 && !loading ? "No sign-ups yet." : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          {/* Confirmed addresses only — a pending row is not consent. */}
          <a href="/api/admin/newsletter?format=csv" download>
            <Download className="mr-2 h-4 w-4" />
            Export subscribed (CSV)
          </a>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              status === f.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f.label}
            {f.value !== "all" && counts[f.value] ? (
              <span className="ml-1.5 tabular-nums opacity-70">{counts[f.value]}</span>
            ) : null}
          </button>
        ))}

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email or name…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Signed up</th>
              <th className="px-4 py-3 font-medium">Confirmed</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && subscribers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nobody here yet.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => {
                const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.email}</div>
                      {s.name && <div className="text-xs text-muted-foreground">{s.name}</div>}
                    </td>
                    <td className="px-4 py-3 uppercase text-muted-foreground">{s.locale}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ background: style.bg, color: style.fg }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{date(s.createdAt)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{date(s.confirmedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.source}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(s.id, s.email)}
                        className="text-muted-foreground transition-colors hover:text-red-600"
                        aria-label={`Delete ${s.email}`}
                        title="Delete completely (for an erasure request)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {subscribers.length === 500 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing the most recent 500. Narrow with a search or a filter to see further back.
        </p>
      )}
    </div>
  )
}

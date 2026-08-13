"use client"

import { useState } from "react"
import { BarChart3, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
  gaMeasurementId: string
  gtmId: string
  metaPixelId: string
}

const defaults: AnalyticsData = { gaMeasurementId: "", gtmId: "", metaPixelId: "" }

export function AnalyticsTab({ initialData }: { initialData?: Partial<AnalyticsData> }) {
  const [data, setData] = useState<AnalyticsData>({ ...defaults, ...initialData })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "analytics", value: data }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Google Analytics */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "#E37400", borderRadius: "var(--radius-xs)" }}>
            <BarChart3 className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Google Analytics 4</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Track website visitors and user behaviour</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Measurement ID</Label>
          <Input value={data.gaMeasurementId} onChange={(e) => setData((p) => ({ ...p, gaMeasurementId: e.target.value }))} placeholder="G-XXXXXXXXXX" className="font-mono text-xs" />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Found in Google Analytics → Admin → Data Streams → Web Stream details.</p>
        </div>
      </div>

      {/* GTM */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "#4285F4", borderRadius: "var(--radius-xs)" }}>
            <Tag className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Google Tag Manager</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Manage all your tracking tags from one place (optional)</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Container ID</Label>
          <Input value={data.gtmId} onChange={(e) => setData((p) => ({ ...p, gtmId: e.target.value }))} placeholder="GTM-XXXXXXX" className="font-mono text-xs" />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Found in your GTM workspace — top right next to the container name.</p>
        </div>
      </div>

      {/* Meta pixel — advertising, so a separate consent category from analytics. */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "#1877F2", borderRadius: "var(--radius-xs)" }}>
            <Tag className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Meta Pixel</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Facebook and Instagram advertising measurement (optional)</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Pixel ID</Label>
          <Input value={data.metaPixelId} onChange={(e) => setData((p) => ({ ...p, metaPixelId: e.target.value }))} placeholder="1234567890123456" className="font-mono text-xs" />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Events Manager → Data Sources → your pixel.</p>
        </div>
      </div>

      {/* Say what actually happens, so nobody assumes a saved ID means live data. */}
      <div className="rounded-lg p-4 text-xs leading-relaxed" style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)" }}>
        <b style={{ color: "var(--on-surface)" }}>These only load once a visitor agrees.</b> Google Analytics sits behind the
        “Analytics” consent category and the Meta pixel behind “Advertising”. Anyone who
        rejects or ignores the cookie banner is never sent to either, and turning a category
        off afterwards clears the cookies it set. Leave a field empty to switch that tag off
        entirely.
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {status === "success" && <span className="text-xs font-medium text-green-600">✓ Saved successfully</span>}
        {status === "error" && <span className="text-xs font-medium" style={{ color: "var(--error)" }}>Failed to save</span>}
      </div>
    </div>
  )
}

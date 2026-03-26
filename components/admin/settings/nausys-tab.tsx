"use client"

import { useState } from "react"
import { Eye, EyeOff, Anchor, Link } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface NausysData {
  username: string
  password: string
  endpoint: string
}

const defaults: NausysData = {
  username: "",
  password: "",
  endpoint: "https://ws.nausys.com/CBMS-external/rest",
}

export function NausysTab({ initialData }: { initialData?: Partial<NausysData> }) {
  const [data, setData] = useState<NausysData>({ ...defaults, ...initialData })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "nausys", value: data }),
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

      {/* Credentials */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--primary-container)", borderRadius: "var(--radius-xs)" }}>
            <Anchor className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>NAUSYS Credentials</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Yacht availability and booking synchronization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Username</Label>
            <Input value={data.username} onChange={(e) => setData((p) => ({ ...p, username: e.target.value }))} placeholder="your-nausys-username" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="pr-9 font-mono text-xs"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--on-surface-variant)" }}>
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            <Link className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>API Endpoint</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Override the default NAUSYS API URL if needed</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Endpoint URL</Label>
          <Input value={data.endpoint} onChange={(e) => setData((p) => ({ ...p, endpoint: e.target.value }))} placeholder="https://ws.nausys.com/..." className="font-mono text-xs" />
        </div>
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

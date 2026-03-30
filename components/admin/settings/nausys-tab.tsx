"use client"

import { useState } from "react"
import { Eye, EyeOff, Anchor, Link, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface NausysData {
  username: string
  password: string
  endpoint: string
  companyId: string
}

const defaults: NausysData = {
  username: "",
  password: "",
  endpoint: "https://ws.nausys.com/CBMS-external/rest",
  companyId: "",
}

export function NausysTab({ initialData }: { initialData?: Partial<NausysData> }) {
  const [data, setData] = useState<NausysData>({ ...defaults, ...initialData })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Charter Company ID</Label>
            <Input value={data.companyId} onChange={(e) => setData((p) => ({ ...p, companyId: e.target.value }))} placeholder="e.g. 102701" className="font-mono text-xs" />
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

      {/* Connection Test */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: testResult?.ok ? "rgba(45,106,79,0.15)" : "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            {testResult?.ok ? <Wifi className="size-4" style={{ color: "#2D6A4F" }} /> : <WifiOff className="size-4 text-white" />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Connection Status</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Test your NAUSYS API credentials</p>
          </div>
        </div>

        {testResult && (
          <div
            className="rounded-md px-3 py-2.5 text-xs flex items-start gap-2"
            style={{
              background: testResult.ok ? "rgba(45,106,79,0.08)" : "rgba(186,26,26,0.08)",
              border: `1px solid ${testResult.ok ? "rgba(45,106,79,0.25)" : "rgba(186,26,26,0.25)"}`,
              color: testResult.ok ? "#2D6A4F" : "var(--error)",
            }}
          >
            {testResult.ok ? <Wifi className="size-3.5 mt-0.5 shrink-0" /> : <WifiOff className="size-3.5 mt-0.5 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <Button
          onClick={async () => {
            setTesting(true)
            setTestResult(null)
            try {
              const res = await fetch("/api/admin/settings/nausys-test", { method: "POST" })
              const json = await res.json()
              setTestResult({ ok: json.ok, message: json.message })
              if (json.companyId && !data.companyId) {
                setData((p) => ({ ...p, companyId: json.companyId }))
              }
            } catch {
              setTestResult({ ok: false, message: "Request failed. Please check your network connection." })
            } finally {
              setTesting(false)
            }
          }}
          disabled={testing}
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-xs w-fit"
          style={{ borderColor: "var(--primary)", color: "var(--primary)", borderRadius: "var(--radius-xs)" }}
        >
          {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />}
          {testing ? "Testing…" : "Test Connection"}
        </Button>
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

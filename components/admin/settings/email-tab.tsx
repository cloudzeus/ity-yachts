"use client"

import { useState } from "react"
import { Eye, EyeOff, Mail, Send, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface EmailData {
  mailgunApiKey: string
  mailgunDomain: string
  fromName: string
  fromEmail: string
}

const defaults: EmailData = { mailgunApiKey: "", mailgunDomain: "", fromName: "", fromEmail: "" }

export function EmailTab({ initialData }: { initialData?: Partial<EmailData> }) {
  const [data, setData] = useState<EmailData>({ ...defaults, ...initialData })
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [testEmail, setTestEmail] = useState("")
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [testError, setTestError] = useState("")

  async function handleTest() {
    if (!testEmail) return
    setTesting(true)
    setTestStatus("idle")
    setTestError("")
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      })
      const json = await res.json()
      if (res.ok) {
        setTestStatus("success")
      } else {
        setTestError(json.error ?? "Failed")
        setTestStatus("error")
      }
    } catch {
      setTestStatus("error")
      setTestError("Network error")
    } finally {
      setTesting(false)
      setTimeout(() => setTestStatus("idle"), 4000)
    }
  }

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "email", value: data }),
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

      {/* Security notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(0,99,153,0.06)", border: "1px solid rgba(0,99,153,0.15)", borderRadius: "var(--radius-xs)" }}>
        <ShieldAlert className="size-4 mt-0.5 shrink-0" style={{ color: "var(--secondary)" }} />
        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          Used for sending booking confirmations, password resets, and notifications via <strong>Mailgun</strong>.
        </p>
      </div>

      {/* API Key & Domain */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "#FF4545", borderRadius: "var(--radius-xs)" }}>
            <Mail className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Mailgun Configuration</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>API credentials for transactional email delivery</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>API Key</Label>
            {data.mailgunApiKey && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
                Configured
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={data.mailgunApiKey}
              onChange={(e) => setData((p) => ({ ...p, mailgunApiKey: e.target.value }))}
              placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="pr-9 font-mono text-xs"
            />
            <button type="button" onClick={() => setShowKey((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--on-surface-variant)" }}>
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Mailgun Domain</Label>
          <Input value={data.mailgunDomain} onChange={(e) => setData((p) => ({ ...p, mailgunDomain: e.target.value }))} placeholder="mg.yourdomain.com" className="font-mono text-xs" />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>The sending domain configured in your Mailgun account.</p>
        </div>
      </div>

      {/* Sender identity */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            <Send className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Sender Identity</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>How your emails appear to recipients</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>From Name</Label>
            <Input value={data.fromName} onChange={(e) => setData((p) => ({ ...p, fromName: e.target.value }))} placeholder="IYC Yachts" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>From Email</Label>
            <Input type="email" value={data.fromEmail} onChange={(e) => setData((p) => ({ ...p, fromEmail: e.target.value }))} placeholder="noreply@yourdomain.com" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {status === "success" && <span className="text-xs font-medium text-green-600">✓ Saved successfully</span>}
        {status === "error" && <span className="text-xs font-medium" style={{ color: "var(--error)" }}>Failed to save</span>}
      </div>

      {/* Test send */}
      <div className="rounded-lg p-5 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            <Send className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Send Test Email</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Verify Mailgun is working by sending a test message</p>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Recipient Email</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button onClick={handleTest} disabled={testing || !testEmail} size="sm" className="h-9 text-xs text-white shrink-0" style={{ background: "#FF4545", borderRadius: "var(--radius-xs)" }}>
            {testing ? "Sending…" : "Send Test"}
          </Button>
        </div>
        {testStatus === "success" && <span className="text-xs font-medium text-green-600">✓ Test email sent</span>}
        {testStatus === "error" && <span className="text-xs font-medium" style={{ color: "var(--error)" }}>{testError || "Failed to send"}</span>}
      </div>
    </div>
  )
}

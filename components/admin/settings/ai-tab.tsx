"use client"

import { useState } from "react"
import { Eye, EyeOff, BrainCircuit, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AIData {
  openaiKey: string
  anthropicKey: string
  deepseekKey: string
}

const defaults: AIData = { openaiKey: "", anthropicKey: "", deepseekKey: "" }

function MaskedField({ label, description, value, onChange, placeholder }: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const hasValue = value.length > 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
        {hasValue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            Configured
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9 font-mono text-xs"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: "var(--on-surface-variant)" }}>
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>{description}</p>
    </div>
  )
}

export function AITab({ initialData }: { initialData?: Partial<AIData> }) {
  const [data, setData] = useState<AIData>({ ...defaults, ...initialData })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ai_keys", value: data }),
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
          API keys are stored securely in the database and are <strong>never exposed</strong> to the client or browser.
        </p>
      </div>

      <div className="rounded-lg p-5 flex flex-col gap-5" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            <BrainCircuit className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>AI Provider Keys</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Used for AI-powered features across the platform</p>
          </div>
        </div>

        <MaskedField
          label="OpenAI API Key"
          description="Powers GPT-based content generation and AI chat features."
          value={data.openaiKey}
          onChange={(v) => setData((p) => ({ ...p, openaiKey: v }))}
          placeholder="sk-..."
        />

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="Anthropic API Key"
            description="Powers Claude AI integration for advanced reasoning tasks."
            value={data.anthropicKey}
            onChange={(v) => setData((p) => ({ ...p, anthropicKey: v }))}
            placeholder="sk-ant-..."
          />
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="DeepSeek API Key"
            description="Used for all website translations via DeepSeek's language model."
            value={data.deepseekKey}
            onChange={(v) => setData((p) => ({ ...p, deepseekKey: v }))}
            placeholder="sk-..."
          />
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

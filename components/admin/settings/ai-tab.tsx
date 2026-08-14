"use client"

import { useState } from "react"
import { Eye, EyeOff, BrainCircuit, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AIData {
  openaiKey: string
  openrouterKey: string
  openrouterModel: string
  anthropicKey: string
  claudeModel: string
  deepseekKey: string
  geocodeKey: string
  googleMapsKey: string
  weatherApiKey: string
}

const defaults: AIData = { openaiKey: "", openrouterKey: "", openrouterModel: "", anthropicKey: "", claudeModel: "", deepseekKey: "", geocodeKey: "", googleMapsKey: "", weatherApiKey: "" }

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
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null)

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

  /* A saved key that turns out to be wrong is otherwise only discovered when
     someone clicks Translate and gets an error. */
  async function handleTest() {
    setTesting(true)
    setTest(null)
    try {
      const res = await fetch("/api/admin/settings/ai-test", { method: "POST" })
      const json = await res.json()
      setTest({ ok: Boolean(json.ok), message: json.message ?? "No answer" })
    } catch {
      setTest({ ok: false, message: "Could not reach the server" })
    } finally {
      setTesting(false)
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

        {/* Which key is set decides which provider answers, so the screen
            says so rather than leaving it to be guessed. */}
        <div
          className="rounded-md px-3 py-2 text-[11px]"
          style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)", borderRadius: "var(--radius-xs)" }}
        >
          Active provider:{" "}
          <strong style={{ color: "var(--primary)" }}>
            {data.anthropicKey
              ? `Claude · ${data.claudeModel || "claude-sonnet-5"}`
              : data.openrouterKey
                ? `OpenRouter · ${data.openrouterModel || "deepseek/deepseek-v3.2"}`
                : data.deepseekKey
                  ? "DeepSeek"
                  : "none configured"}
          </strong>
          {!data.anthropicKey && data.openrouterKey
            ? " — Claude has no key, so the OpenRouter backup is answering."
            : ""}
        </div>

        <div>
          <MaskedField
            label="Claude API key (Anthropic)"
            description="The primary provider. Used for every AI feature here whenever it is set."
            value={data.anthropicKey}
            onChange={(v) => setData((p) => ({ ...p, anthropicKey: v }))}
            placeholder="sk-ant-..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Claude model</Label>
          <Input
            value={data.claudeModel}
            onChange={(e) => setData((p) => ({ ...p, claudeModel: e.target.value }))}
            placeholder="claude-sonnet-5"
            className="font-mono text-xs"
          />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            Leave blank for claude-sonnet-5. Use claude-opus-5 for the strongest writing.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="OpenRouter API key (backup)"
            description="Steps in when Claude has no key. Pointed at DeepSeek."
            value={data.openrouterKey}
            onChange={(v) => setData((p) => ({ ...p, openrouterKey: v }))}
            placeholder="sk-or-v1-..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>OpenRouter model</Label>
          <Input
            value={data.openrouterModel}
            onChange={(e) => setData((p) => ({ ...p, openrouterModel: e.target.value }))}
            placeholder="deepseek/deepseek-v3.2"
            className="font-mono text-xs"
          />
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            Leave blank for deepseek/deepseek-v3.2. deepseek/deepseek-chat is refused on this account
            and the v4 models return nothing usable, so change this only after testing.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="DeepSeek API key (direct, last resort)"
            description="Only used when neither of the above has a key. Kept so the original account still works."
            value={data.deepseekKey}
            onChange={(v) => setData((p) => ({ ...p, deepseekKey: v }))}
            placeholder="sk-..."
          />
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="Geocode.maps.co API Key"
            description="Used for geocoding addresses to coordinates in Locations."
            value={data.geocodeKey}
            onChange={(v) => setData((p) => ({ ...p, geocodeKey: v }))}
            placeholder="api_key..."
          />
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="Google Maps API Key"
            description="Powers Google Maps embeds and Places autocomplete in Locations."
            value={data.googleMapsKey}
            onChange={(v) => setData((p) => ({ ...p, googleMapsKey: v }))}
            placeholder="AIza..."
          />
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
          <MaskedField
            label="WeatherAPI.com API Key"
            description="Powers weather forecast widgets for locations on the website."
            value={data.weatherApiKey}
            onChange={(v) => setData((p) => ({ ...p, weatherApiKey: v }))}
            placeholder="your-weatherapi-key"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="h-9 gap-2 text-xs">
          {testing ? "Testing…" : "Test AI key"}
        </Button>
        {status === "success" && <span className="text-xs font-medium text-green-600">✓ Saved successfully</span>}
        {status === "error" && <span className="text-xs font-medium" style={{ color: "var(--error)" }}>Failed to save</span>}
      </div>

      {test && (
        <p
          className="text-xs leading-relaxed"
          style={{ color: test.ok ? "var(--success, #16a34a)" : "var(--error)" }}
        >
          {test.ok ? "✓ " : "✗ "}
          {test.message}
        </p>
      )}
    </div>
  )
}

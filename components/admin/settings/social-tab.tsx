"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface SocialData {
  facebook: string
  instagram: string
  twitter: string
  youtube: string
  linkedin: string
  tiktok: string
  whatsapp: string
}

const defaults: SocialData = { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "", tiktok: "", whatsapp: "" }

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/yourpage",       color: "#1877F2" },
  { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/yourhandle",    color: "#E1306C" },
  { key: "twitter",   label: "X / Twitter", placeholder: "https://x.com/yourhandle",            color: "#000000" },
  { key: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/@yourchannel",    color: "#FF0000" },
  { key: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/company/...",    color: "#0A66C2" },
  { key: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@yourhandle",      color: "#000000" },
  { key: "whatsapp",  label: "WhatsApp",    placeholder: "+30 690 0000000",                     color: "#25D366" },
] as const

export function SocialTab({ initialData }: { initialData?: Partial<SocialData> }) {
  const [data, setData] = useState<SocialData>({ ...defaults, ...initialData })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "social", value: data }),
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
      <div className="rounded-lg p-5 flex flex-col gap-5" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div className="size-8 rounded-md flex items-center justify-center" style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            <Share2 className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>Social Media Profiles</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Enter the full URL for each platform. Leave blank to hide.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {PLATFORMS.map(({ key, label, placeholder, color }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: "var(--on-surface-variant)" }}>
                <span className="size-2.5 rounded-full inline-block shrink-0" style={{ background: color }} />
                {label}
              </Label>
              <Input
                value={data[key]}
                onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
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

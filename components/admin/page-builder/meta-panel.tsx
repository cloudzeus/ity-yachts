"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"
import { PageSection } from "@/types/page"

interface MetaPanelProps {
  pageId: string
  slug: string
  content: PageSection[]
  metas: {
    metaTitle?: string
    metaDesc?: string
    metaKeywords?: string
    metaOgTitle?: string
    metaOgDesc?: string
    metaOgImage?: string
    metaRobots?: string
    metaCanonical?: string
  }
  onMetasChange: (metas: any) => void
}

export function MetaPanel({ pageId, slug, content, metas, onMetasChange }: MetaPanelProps) {
  const [generating, setGenerating] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  async function generateMeta() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/generate-meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, slug }),
      })
      if (res.ok) {
        const generated = await res.json()
        onMetasChange(generated)
      } else {
        alert("Failed to generate metadata")
      }
    } catch (err) {
      console.error("[generateMeta]", err)
      alert("Error generating metadata")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
          SEO & Meta
        </h3>
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs text-white"
          style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
          onClick={generateMeta}
          disabled={generating}
        >
          <Wand2 className="size-3" />
          {generating ? "Generating…" : "Generate"}
        </Button>
      </div>

      {/* Meta Title */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs flex items-center justify-between">
          Meta Title
          <span className="text-xs" style={{ color: metas.metaTitle && metas.metaTitle.length > 60 ? "var(--error)" : "var(--on-surface-variant)" }}>
            {metas.metaTitle?.length || 0}/60
          </span>
        </Label>
        <Input
          value={metas.metaTitle || ""}
          onChange={(e) => onMetasChange({ ...metas, metaTitle: e.target.value.slice(0, 60) })}
          placeholder="Page title (max 60 chars)"
          className="text-xs"
        />
      </div>

      {/* Meta Description */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs flex items-center justify-between">
          Meta Description
          <span className="text-xs" style={{ color: metas.metaDesc && metas.metaDesc.length > 160 ? "var(--error)" : "var(--on-surface-variant)" }}>
            {metas.metaDesc?.length || 0}/160
          </span>
        </Label>
        <Textarea
          value={metas.metaDesc || ""}
          onChange={(e) => onMetasChange({ ...metas, metaDesc: e.target.value.slice(0, 160) })}
          placeholder="Page description (max 160 chars)"
          className="text-xs resize-none h-20"
        />
      </div>

      {/* Keywords */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Keywords</Label>
        <Textarea
          value={metas.metaKeywords || ""}
          onChange={(e) => onMetasChange({ ...metas, metaKeywords: e.target.value })}
          placeholder="Comma-separated keywords"
          className="text-xs resize-none h-16"
        />
      </div>

      <div className="w-full h-px" style={{ background: "var(--outline-variant)" }} />

      {/* OG Title */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">OG Title</Label>
        <Input
          value={metas.metaOgTitle || ""}
          onChange={(e) => onMetasChange({ ...metas, metaOgTitle: e.target.value })}
          placeholder="Social media title"
          className="text-xs"
        />
      </div>

      {/* OG Description */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">OG Description</Label>
        <Textarea
          value={metas.metaOgDesc || ""}
          onChange={(e) => onMetasChange({ ...metas, metaOgDesc: e.target.value })}
          placeholder="Social media description"
          className="text-xs resize-none h-16"
        />
      </div>

      {/* OG Image */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">OG Image</Label>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => setMediaPickerOpen(true)}
        >
          {metas.metaOgImage ? "Change Image" : "Select Image"}
        </Button>
        {metas.metaOgImage && (
          <img src={metas.metaOgImage} alt="og" className="w-full h-20 object-cover rounded" />
        )}
      </div>

      {/* Robots */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Robots</Label>
        <Select value={metas.metaRobots || "index, follow"} onValueChange={(v) => onMetasChange({ ...metas, metaRobots: v })}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="index, follow">Index, Follow</SelectItem>
            <SelectItem value="noindex">No Index</SelectItem>
            <SelectItem value="nofollow">No Follow</SelectItem>
            <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Canonical */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Canonical URL</Label>
        <Input
          value={metas.metaCanonical || ""}
          onChange={(e) => onMetasChange({ ...metas, metaCanonical: e.target.value })}
          placeholder={`/${slug}`}
          className="text-xs"
        />
      </div>

      {/* Media picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(media) => {
          const m = media as PickedMedia
          onMetasChange({ ...metas, metaOgImage: m.url })
          setMediaPickerOpen(false)
        }}
        accept="image"
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { PageSection } from "@/types/page"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

interface SectionSettingsPanelProps {
  section: PageSection
  onUpdate: (section: PageSection) => void
}

export function SectionSettingsPanel({ section, onUpdate }: SectionSettingsPanelProps) {
  const [bgType, setBgType] = useState(section.background?.type || "none")
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  function updateBackground(updates: any) {
    onUpdate({
      ...section,
      background: { ...section.background, ...updates },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Background Type */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">Background</Label>
        <div className="flex gap-1">
          {(["none", "color", "image", "video"] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={bgType === type ? "default" : "outline"}
              className="text-xs"
              onClick={() => {
                setBgType(type)
                updateBackground({ type })
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {bgType === "color" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={section.background?.color || "#ffffff"}
              onChange={(e) => updateBackground({ color: e.target.value })}
              className="h-8 w-12"
            />
            <Input
              type="text"
              value={section.background?.color || ""}
              onChange={(e) => updateBackground({ color: e.target.value })}
              placeholder="#ffffff"
              className="text-xs flex-1"
            />
          </div>
        </div>
      )}

      {bgType === "image" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Background Image</Label>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setMediaPickerOpen(true)}
          >
            {section.background?.imageUrl ? "Change Image" : "Select Image"}
          </Button>
          {section.background?.imageUrl && (
            <img src={section.background.imageUrl} alt="bg" className="w-full h-20 object-cover rounded text-xs" />
          )}
        </div>
      )}

      {(bgType === "image" || bgType === "video") && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Opacity (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={section.background?.opacity || 100}
            onChange={(e) => updateBackground({ opacity: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
      )}

      {/* Vertical Align */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Vertical Align</Label>
        <Select value={section.verticalAlign || "top"} onValueChange={(v) => onUpdate({ ...section, verticalAlign: v as any })}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Padding */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Padding X (px)</Label>
          <Input
            type="number"
            value={section.paddingX || 0}
            onChange={(e) => onUpdate({ ...section, paddingX: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Padding Y (px)</Label>
          <Input
            type="number"
            value={section.paddingY || 0}
            onChange={(e) => onUpdate({ ...section, paddingY: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* Media picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(media) => {
          const m = media as PickedMedia
          updateBackground({ imageUrl: m.url })
          setMediaPickerOpen(false)
        }}
        accept="image"
      />
    </div>
  )
}

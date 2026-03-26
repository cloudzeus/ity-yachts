"use client"

import { useState } from "react"
import { Settings2, Trash2, ChevronUp, ChevronDown, GripHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageSection, ColumnRatio } from "@/types/page"
import { AreaEditor } from "./area-editor"
import { SectionSettingsPanel } from "./section-settings-panel"

interface SectionEditorProps {
  section: PageSection
  onUpdate: (section: PageSection) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const RATIO_OPTIONS: Record<number, ColumnRatio[]> = {
  1: ["1"],
  2: ["1:1", "2:1", "1:2"],
  3: ["1:1:1", "2:1:1", "1:2:1", "1:1:2"],
}

export function SectionEditor({ section, onUpdate, onDelete, onMoveUp, onMoveDown }: SectionEditorProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Calculate flex values from ratio
  function getRatioValues(ratio: ColumnRatio): number[] {
    return ratio.split(":").map(Number)
  }

  function updateColumns(columns: 1 | 2 | 3) {
    const newAreas = section.areas.slice(0, columns)
    while (newAreas.length < columns) {
      newAreas.push({
        id: Math.random().toString(36).substring(2, 11),
        blocks: [],
      })
    }
    onUpdate({
      ...section,
      columns,
      ratio: RATIO_OPTIONS[columns][0],
      areas: newAreas,
    })
  }

  const ratioValues = getRatioValues(section.ratio)

  return (
    <div
      className="rounded-lg overflow-hidden border transition-all hover:shadow-md"
      style={{
        borderColor: "var(--outline-variant)",
        background: "var(--surface-container-low)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="flex items-center gap-2 flex-1">
          <div className="opacity-40 cursor-grab active:cursor-grabbing">
            <GripHorizontal className="size-4" style={{ color: "var(--primary)" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
            Section
          </span>

          {/* Column layout toggle */}
          <div className="flex gap-0.5 ml-2">
            {(["1", "2", "3"] as const).map((n) => (
              <Button
                key={n}
                size="sm"
                variant={section.columns === Number(n) ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                onClick={() => updateColumns(Number(n) as 1 | 2 | 3)}
              >
                {n}
              </Button>
            ))}
          </div>

          {/* Ratio select */}
          {section.columns > 1 && (
            <Select value={section.ratio} onValueChange={(r) => onUpdate({ ...section, ratio: r as ColumnRatio })}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATIO_OPTIONS[section.columns].map((ratio) => (
                  <SelectItem key={ratio} value={ratio} className="text-xs">
                    {ratio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Height select */}
          <Select value={typeof section.height === "number" ? "custom" : section.height} onValueChange={(v) => {
            if (v === "auto") onUpdate({ ...section, height: "auto" })
            else if (v === "screen") onUpdate({ ...section, height: "screen" })
            else if (v === "half-screen") onUpdate({ ...section, height: "half-screen" })
          }}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              <SelectItem value="half-screen" className="text-xs">Half Screen</SelectItem>
              <SelectItem value="screen" className="text-xs">Full Screen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" onClick={onMoveUp} title="Move up">
            <ChevronUp className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" onClick={onMoveDown} title="Move down">
            <ChevronDown className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
            onClick={() => setShowSettings(!showSettings)}
            title="Section settings"
          >
            <Settings2 className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive opacity-60 hover:opacity-100" onClick={onDelete} title="Delete">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}>
          <SectionSettingsPanel section={section} onUpdate={onUpdate} />
        </div>
      )}

      {/* Columns/Areas */}
      <div
        className="flex gap-2 p-4"
        style={{
          height: section.height === "auto" ? "auto" : section.height === "screen" ? "100vh" : section.height === "half-screen" ? "50vh" : undefined,
        }}
      >
        {section.areas.map((area, idx) => (
          <div
            key={area.id}
            style={{
              flex: ratioValues[idx] || 1,
            }}
          >
            <AreaEditor
              area={area}
              onUpdate={(updated) => {
                const newAreas = [...section.areas]
                newAreas[idx] = updated
                onUpdate({ ...section, areas: newAreas })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

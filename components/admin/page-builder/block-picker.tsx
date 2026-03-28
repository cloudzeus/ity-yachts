"use client"

import { useState } from "react"
import { Heading, Type, FileText, Image as ImageIcon, Play, Plus, ChevronLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { PageBlock } from "@/types/page"
import { createBlock } from "@/lib/page-builder"

interface BlockPickerProps {
  onBlockSelect: (block: PageBlock) => void
}

const HEADING_LEVELS = [
  { type: "h1" as const, label: "Heading 1", color: "#0063A9" },
  { type: "h2" as const, label: "Heading 2", color: "#0077B6" },
  { type: "h3" as const, label: "Heading 3", color: "#00B4D8" },
  { type: "h4" as const, label: "Heading 4", color: "#0096C7" },
  { type: "h5" as const, label: "Heading 5", color: "#48CAE4" },
  { type: "h6" as const, label: "Heading 6", color: "#90E0EF" },
]

const BLOCK_TYPES = [
  { type: "heading" as const, label: "Heading", icon: Heading, color: "#0077B6" },
  { type: "paragraph" as const, label: "Paragraph", icon: Type, color: "#7C3AED" },
  { type: "richtext" as const, label: "Rich Text", icon: FileText, color: "#7C3AED" },
  { type: "image" as const, label: "Image", icon: ImageIcon, color: "#E53935" },
  { type: "video" as const, label: "Video", icon: Play, color: "#E53935" },
]

export function BlockPicker({ onBlockSelect }: BlockPickerProps) {
  const [showHeadings, setShowHeadings] = useState(false)
  const [open, setOpen] = useState(false)

  function selectBlock(type: string) {
    const block = createBlock(type as any)
    onBlockSelect(block)
    setOpen(false)
    setShowHeadings(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowHeadings(false) }}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
          variant="ghost"
          title="Add block"
        >
          <Plus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-3" align="start">
        {showHeadings ? (
          <div className="flex flex-col gap-1" style={{ minWidth: 140 }}>
            <button
              onClick={() => setShowHeadings(false)}
              className="flex items-center gap-1.5 text-xs font-medium mb-1 hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <ChevronLeft className="size-3" /> Back
            </button>
            {HEADING_LEVELS.map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => selectBlock(type)}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors hover:bg-black/5"
              >
                <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: color }}>
                  {type.toUpperCase()}
                </span>
                <span className="text-xs" style={{ color: "var(--on-surface)" }}>{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  if (type === "heading") {
                    setShowHeadings(true)
                  } else {
                    selectBlock(type)
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-md transition-colors hover:bg-black/5"
                title={label}
              >
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ color }}>
                  <Icon className="size-5" />
                </div>
                <span className="text-xs text-center font-medium" style={{ color: "var(--on-surface-variant)", maxWidth: "60px" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

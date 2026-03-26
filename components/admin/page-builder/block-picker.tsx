"use client"

import { Heading1, Heading2, Heading3, Type, FileText, Image as ImageIcon, Play, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { PageBlock } from "@/types/page"
import { createBlock } from "@/lib/page-builder"

interface BlockPickerProps {
  onBlockSelect: (block: PageBlock) => void
}

const BLOCK_TYPES = [
  { type: "h1" as const, label: "Heading 1", icon: Heading1, color: "#0063A9" },
  { type: "h2" as const, label: "Heading 2", icon: Heading2, color: "#0063A9" },
  { type: "h3" as const, label: "Heading 3", icon: Heading3, color: "#0063A9" },
  { type: "paragraph" as const, label: "Paragraph", icon: Type, color: "#7C3AED" },
  { type: "richtext" as const, label: "Rich Text", icon: FileText, color: "#7C3AED" },
  { type: "image" as const, label: "Image", icon: ImageIcon, color: "#E53935" },
  { type: "video" as const, label: "Video", icon: Play, color: "#E53935" },
]

export function BlockPicker({ onBlockSelect }: BlockPickerProps) {
  return (
    <Popover>
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
        <div className="grid grid-cols-3 gap-2">
          {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => {
                const block = createBlock(type)
                onBlockSelect(block)
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-md transition-colors hover:bg-black/5"
              title={label}
            >
              <div className="w-10 h-10 rounded flex items-center justify-center transition-colors hover:bg-black/10" style={{ color }}>
                <Icon className="size-5" />
              </div>
              <span className="text-xs text-center font-medium" style={{ color: "var(--on-surface-variant)", maxWidth: "60px" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageArea, PageBlock } from "@/types/page"
import { BlockEditor } from "./block-editor"
import { BlockPicker } from "./block-picker"
import { AreaSettingsPanel } from "./area-settings-panel"

interface AreaEditorProps {
  area: PageArea
  onUpdate: (area: PageArea) => void
}

export function AreaEditor({ area, onUpdate }: AreaEditorProps) {
  const [showSettings, setShowSettings] = useState(false)

  function addBlock(block: PageBlock) {
    onUpdate({
      ...area,
      blocks: [...area.blocks, block],
    })
  }

  function updateBlock(blockId: string, updates: Partial<PageBlock>) {
    onUpdate({
      ...area,
      blocks: area.blocks.map((b) => (b.id === blockId ? ({ ...b, ...updates } as PageBlock) : b)),
    })
  }

  function deleteBlock(blockId: string) {
    onUpdate({
      ...area,
      blocks: area.blocks.filter((b) => b.id !== blockId),
    })
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    const idx = area.blocks.findIndex((b) => b.id === blockId)
    if (idx === -1) return
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === area.blocks.length - 1) return

    const newIdx = direction === "up" ? idx - 1 : idx + 1
    const newBlocks = [...area.blocks]
    ;[newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]

    onUpdate({ ...area, blocks: newBlocks })
  }

  return (
    <div className="relative flex-1 rounded-lg p-4 min-h-40 border-2 border-dashed transition-colors" style={{ borderColor: "var(--outline-variant)", background: "rgba(0,99,153,0.02)" }}>
      {/* Settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5"
        title="Area settings"
      >
        <Settings2 className="size-4" style={{ color: "var(--primary)" }} />
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-lg bg-white/50 border border-outline-variant/50">
          <AreaSettingsPanel area={area} onUpdate={onUpdate} />
        </div>
      )}

      {area.blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <p className="text-sm mb-2" style={{ color: "var(--on-surface-variant)" }}>
            No blocks yet
          </p>
          <BlockPicker onBlockSelect={addBlock} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {area.blocks.map((block, idx) => (
            <BlockEditor
              key={block.id}
              block={block}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, "up")}
              onMoveDown={() => moveBlock(block.id, "down")}
            />
          ))}
          <div className="flex justify-center pt-1">
            <BlockPicker onBlockSelect={addBlock} />
          </div>
        </div>
      )}
    </div>
  )
}

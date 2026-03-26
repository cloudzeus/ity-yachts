"use client"

import { useState, useRef, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { GripHorizontal, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageBlock } from "@/types/page"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

interface BlockEditorProps {
  block: PageBlock
  onUpdate: (block: PageBlock) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function BlockEditor({ block, onUpdate, onDelete, onMoveUp, onMoveDown }: BlockEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false })],
    content: block.type === "richtext" ? ((block as any).content || "") : "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (block.type === "richtext") {
        onUpdate({ ...block, content: editor.getHTML() })
      }
    },
  }, [block.type === "richtext" ? (block as any).content : ""])

  // Auto-grow textarea for text blocks
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef.current && (block.type === "paragraph" || block.type === "h1" || block.type === "h2" || block.type === "h3")) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.max(40, textareaRef.current.scrollHeight)}px`
    }
  }, [block])

  const blockColor: Record<string, string> = {
    h1: "#0063A9",
    h2: "#0077B6",
    h3: "#00B4D8",
    paragraph: "#7C3AED",
    richtext: "#9333EA",
    image: "#DC2626",
    video: "#E53935",
  }

  const fontSize: Record<string, string> = {
    h1: "24px",
    h2: "20px",
    h3: "16px",
    paragraph: "14px",
  }

  const fontWeight: Record<string, number> = {
    h1: 700,
    h2: 600,
    h3: 500,
    paragraph: 400,
  }

  return (
    <div
      className="rounded-lg p-3 flex gap-2 group transition-all hover:shadow-sm"
      style={{
        background: "var(--surface-container-lowest)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      {/* Drag handle */}
      <div className="flex items-start pt-1 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-60">
        <GripHorizontal className="size-4" style={{ color: blockColor[block.type] }} />
      </div>

      {/* Content editor */}
      <div className="flex-1 min-w-0">
        {(block.type === "h1" || block.type === "h2" || block.type === "h3" || block.type === "paragraph") && (
          <textarea
            ref={textareaRef}
            value={(block as any).content || ""}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder={`Enter ${block.type}...`}
            className="w-full resize-none border-0 bg-transparent p-0 outline-none text-sm focus:ring-0"
            style={{
              fontSize: fontSize[block.type],
              fontWeight: fontWeight[block.type],
              color: "var(--on-surface)",
              fontFamily: block.type !== "paragraph" ? "var(--font-display)" : "var(--font-body)",
            }}
          />
        )}

        {block.type === "richtext" && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <style>{`
              .tiptap { outline: none; }
              .tiptap p { margin: 0; }
              .tiptap h1, .tiptap h2, .tiptap h3 { margin: 0; }
              .tiptap ul, .tiptap ol { margin: 0; padding-left: 1rem; }
            `}</style>
            <EditorContent
              editor={editor}
              style={{
                fontSize: "14px",
                color: "var(--on-surface)",
              }}
            />
          </div>
        )}

        {block.type === "image" && (
          <div className="flex flex-col gap-2">
            {(block as any).url && (
              <img
                src={(block as any).url}
                alt={(block as any).alt}
                className="w-full h-32 object-cover rounded"
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMediaPickerOpen(true)}
              className="text-xs"
            >
              {(block as any).url ? "Change Image" : "Select Image"}
            </Button>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Alt Text</Label>
              <Input
                value={(block as any).alt || ""}
                onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
                placeholder="Describe the image..."
                className="text-xs"
              />
            </div>
          </div>
        )}

        {block.type === "video" && (
          <div className="flex flex-col gap-2">
            <Input
              value={(block as any).url || ""}
              onChange={(e) => onUpdate({ ...block, url: e.target.value })}
              placeholder="Video URL (YouTube, Vimeo, etc.)"
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-start gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
          onClick={onMoveUp}
          title="Move up"
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
          onClick={onMoveDown}
          title="Move down"
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive opacity-60 hover:opacity-100"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Media picker for images */}
      {block.type === "image" && (
        <MediaPicker
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(media) => {
            const m = media as PickedMedia
            onUpdate({ ...block, url: m.url, alt: (block as any).alt || m.name })
            setMediaPickerOpen(false)
          }}
          accept="image"
        />
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface TextComponentEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component?: {
    id: string
    key: string
    translations: Record<string, string>
  }
  pageId: string
  onSave: (data: any) => Promise<void>
  onDelete?: (componentId: string) => Promise<void>
  isNew?: boolean
}

export function TextComponentEditor({
  open,
  onOpenChange,
  component,
  pageId,
  onSave,
  onDelete,
  isNew = false,
}: TextComponentEditorProps) {
  const [key, setKey] = useState(component?.key || "")
  const [translations, setTranslations] = useState<Record<string, string>>(
    component?.translations || { en: "", el: "", de: "" }
  )
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!key) {
      alert("Key is required")
      return
    }
    setSaving(true)
    try {
      await onSave({ key, translations })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleTranslate = async () => {
    if (!translations.en) {
      alert("English text is required for translation")
      return
    }
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: translations.en,
          languages: ["el", "de"],
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setTranslations({
          ...translations,
          el: json.translations.el || "",
          de: json.translations.de || "",
        })
      } else {
        alert("Failed to translate")
      }
    } catch (err) {
      console.error("[handleTranslate]", err)
      alert("Error translating")
    } finally {
      setTranslating(false)
    }
  }

  const handleDelete = async () => {
    if (!component?.id) return
    if (!confirm("Are you sure you want to delete this component?")) return
    setDeleting(true)
    try {
      await onDelete?.(component.id)
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
            {isNew ? "Add Text Component" : "Edit Component"}
          </DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            Edit translations for this text component
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isNew && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Component Key
              </Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., hero_title, footer_description"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                English *
              </Label>
              <Textarea
                value={translations.en}
                onChange={(e) => setTranslations({ ...translations, en: e.target.value })}
                placeholder="Enter English text..."
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                className="min-h-20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Greek (Ελληνικά) *
              </Label>
              <Textarea
                value={translations.el}
                onChange={(e) => setTranslations({ ...translations, el: e.target.value })}
                placeholder="Enter Greek text..."
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                className="min-h-20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                German (Deutsch) *
              </Label>
              <Textarea
                value={translations.de}
                onChange={(e) => setTranslations({ ...translations, de: e.target.value })}
                placeholder="Enter German text..."
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                className="min-h-20"
              />
            </div>
          </div>

          <Button
            onClick={handleTranslate}
            disabled={translating || !translations.en}
            variant="outline"
            className="w-full"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            {translating ? "Translating…" : "Translate via DeepSeek"}
          </Button>

          <div className="flex justify-end gap-2 pt-2">
            {!isNew && onDelete && (
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
                className="text-white"
                style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}
              >
                <Trash2 className="size-3 mr-1" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || deleting || !translations.en || !translations.el || !translations.de}
              className="text-white"
              style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

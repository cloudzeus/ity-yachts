"use client"

import { useState, useCallback } from "react"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextComponentEditor } from "@/components/admin/page-builder/text-component-editor"

interface TextComponent {
  id: string
  key: string
  translations: Record<string, string>
}

interface PageTextComponentsProps {
  pageId: string
  components: TextComponent[]
  onComponentsChange: () => void
}

export function PageTextComponents({ pageId, components, onComponentsChange }: PageTextComponentsProps) {
  const [editingComponent, setEditingComponent] = useState<TextComponent | null>(null)
  const [showNewComponent, setShowNewComponent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const colors = [
    { bg: "rgb(255, 87, 34)", text: "#fff" },
    { bg: "rgb(63, 81, 181)", text: "#fff" },
    { bg: "rgb(76, 175, 80)", text: "#fff" },
    { bg: "rgb(233, 30, 99)", text: "#fff" },
    { bg: "rgb(0, 150, 136)", text: "#fff" },
    { bg: "rgb(156, 39, 176)", text: "#fff" },
    { bg: "rgb(255, 152, 0)", text: "#fff" },
    { bg: "rgb(0, 188, 212)", text: "#fff" },
  ]

  function getColorForKey(key: string): { bg: string; text: string } {
    const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  function getAvatarInitials(key: string): string {
    return key
      .split("_")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSaveComponent = useCallback(
    async (data: { key: string; translations: Record<string, string> }) => {
      setIsLoading(true)
      try {
        if (editingComponent) {
          // Update existing
          const res = await fetch(
            `/api/admin/pages/${pageId}/text-components/${editingComponent.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ translations: data.translations }),
            }
          )
          if (!res.ok) throw new Error("Failed to save")
        } else {
          // Create new
          const res = await fetch(`/api/admin/pages/${pageId}/text-components`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
          if (!res.ok) throw new Error("Failed to create")
        }
        setEditingComponent(null)
        setShowNewComponent(false)
        onComponentsChange()
      } catch (err) {
        console.error("[handleSaveComponent]", err)
        alert("Error saving component")
      } finally {
        setIsLoading(false)
      }
    },
    [editingComponent, pageId, onComponentsChange]
  )

  const handleDeleteComponent = useCallback(
    async (componentId: string) => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/admin/pages/${pageId}/text-components/${componentId}`,
          { method: "DELETE" }
        )
        if (!res.ok) throw new Error("Failed to delete")
        onComponentsChange()
      } catch (err) {
        console.error("[handleDeleteComponent]", err)
        alert("Error deleting component")
      } finally {
        setIsLoading(false)
      }
    },
    [pageId, onComponentsChange]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
        >
          Text Components
        </h3>
        <Button
          size="sm"
          className="h-8 gap-1 text-xs text-white"
          style={{ background: "var(--gradient-ocean)" }}
          onClick={() => {
            setEditingComponent(null)
            setShowNewComponent(true)
          }}
          disabled={isLoading}
        >
          <Plus className="size-3.5" />
          Add Component
        </Button>
      </div>

      {components.length === 0 ? (
        <p
          className="text-xs py-3 px-2 text-center rounded"
          style={{ color: "var(--on-surface-variant)", background: "rgba(0,0,0,0.02)" }}
        >
          No text components yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {components.map((component) => {
            const color = getColorForKey(component.key)
            const initials = getAvatarInitials(component.key)
            return (
              <div
                key={component.id}
                className="flex items-center justify-between gap-3 p-3 rounded"
                style={{
                  background: "var(--surface-container-lowest)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full size-10 text-xs font-semibold"
                  style={{
                    background: color.bg,
                    color: color.text,
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                    {component.key}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--on-surface-variant)" }}>
                    <span style={{ fontWeight: 500 }}>EN:</span> {component.translations.en || "—"}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--on-surface-variant)" }}>
                    <span style={{ fontWeight: 500 }}>EL:</span> {component.translations.el || "—"}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--on-surface-variant)" }}>
                    <span style={{ fontWeight: 500 }}>DE:</span> {component.translations.de || "—"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => setEditingComponent(component)}
                  disabled={isLoading}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <TextComponentEditor
        open={!!editingComponent || showNewComponent}
        onOpenChange={(open) => {
          if (!open) {
            setEditingComponent(null)
            setShowNewComponent(false)
          }
        }}
        component={editingComponent || undefined}
        pageId={pageId}
        onSave={handleSaveComponent}
        onDelete={handleDeleteComponent}
        isNew={showNewComponent}
      />
    </div>
  )
}

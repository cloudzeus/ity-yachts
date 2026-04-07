"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Layers, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { COMPONENT_REGISTRY, getComponentTypes } from "@/lib/page-components"
import { TeamGrid, type StaffMember } from "@/components/page-components/team-grid"
import { SkipperAcademyEditor } from "@/components/admin/page-builder/skipper-academy-editor"
import { ContactContentEditor } from "@/components/admin/page-builder/contact-content-editor"
import { PageHeaderEditor } from "@/components/admin/page-builder/page-header-editor"
import { ServicesContentEditor } from "@/components/admin/page-builder/services-content-editor"

interface PageComponentItem {
  id: string
  type: string
  name: string
  props: Record<string, unknown>
  dataSource: Record<string, unknown>
  sortOrder: number
  status: string
}

interface PageComponentsPanelProps {
  pageId: string
}

export function PageComponentsPanel({ pageId }: PageComponentsPanelProps) {
  const [components, setComponents] = useState<PageComponentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [previewComp, setPreviewComp] = useState<PageComponentItem | null>(null)
  const [previewData, setPreviewData] = useState<StaffMember[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const fetchComponents = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/page-components?pageId=${pageId}`)
      if (res.ok) {
        const data = await res.json()
        setComponents(data.components)
      }
    } catch (err) {
      console.error("[fetchComponents]", err)
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchComponents()
  }, [fetchComponents])

  async function addComponent(type: string) {
    const def = COMPONENT_REGISTRY[type]
    if (!def) return

    try {
      const res = await fetch("/api/admin/page-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          type,
          name: def.label,
          props: def.defaultProps,
          dataSource: def.defaultDataSource,
          sortOrder: components.length,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComponents([...components, data.component])
        setExpanded(data.component.id)
      }
    } catch (err) {
      console.error("[addComponent]", err)
    }
  }

  async function updateComponent(id: string, updates: Partial<PageComponentItem>) {
    try {
      const res = await fetch(`/api/admin/page-components/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setComponents(components.map((c) => (c.id === id ? data.component : c)))
      }
    } catch (err) {
      console.error("[updateComponent]", err)
    }
  }

  async function deleteComponent(id: string) {
    try {
      const res = await fetch(`/api/admin/page-components/${id}`, { method: "DELETE" })
      if (res.ok) {
        setComponents(components.filter((c) => c.id !== id))
      }
    } catch (err) {
      console.error("[deleteComponent]", err)
    }
  }

  async function openPreview(comp: PageComponentItem) {
    setPreviewComp(comp)
    setPreviewData(null)
    setPreviewLoading(true)

    try {
      const ds = comp.dataSource as { model?: string }
      if (ds.model === "staff") {
        const res = await fetch("/api/staff")
        if (res.ok) {
          const data = await res.json()
          setPreviewData(data.staff)
        }
      }
    } catch (err) {
      console.error("[preview]", err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const availableTypes = getComponentTypes()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4" style={{ color: "var(--primary)" }} />
          <span
            className="text-[10px] uppercase tracking-wide font-semibold"
            style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
          >
            Page Components
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Loading…</p>
      ) : (
        <>
          {/* Existing components */}
          {components.length === 0 && (
            <p className="text-xs py-2" style={{ color: "var(--on-surface-variant)" }}>
              No components added yet
            </p>
          )}

          <div className="flex flex-col gap-2">
            {components.map((comp) => {
              const isExpanded = expanded === comp.id
              const def = COMPONENT_REGISTRY[comp.type]

              return (
                <div
                  key={comp.id}
                  className="rounded-md overflow-hidden"
                  style={{
                    border: "1px solid var(--outline-variant)",
                    background: "var(--surface-container-lowest)",
                  }}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : comp.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 transition-colors"
                  >
                    <GripVertical className="size-3 shrink-0 opacity-40" />
                    {isExpanded ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
                    <span className="flex-1 font-medium truncate" style={{ color: "var(--on-surface)" }}>
                      {comp.name || def?.label || comp.type}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center justify-center h-6 w-6 shrink-0 rounded hover:bg-black/5 transition-colors cursor-pointer"
                      style={{ color: "var(--primary)" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openPreview(comp)
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); openPreview(comp) } }}
                      title="Preview component"
                    >
                      <Eye className="size-3.5" />
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: comp.status === "active" ? "rgba(45,106,79,0.1)" : "rgba(117,117,117,0.1)",
                        color: comp.status === "active" ? "#2D6A4F" : "#626262",
                      }}
                    >
                      {comp.status}
                    </span>
                  </button>

                  {/* Expanded settings */}
                  {isExpanded && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t" style={{ borderColor: "var(--outline-variant)" }}>
                      {/* Name */}
                      <div className="flex flex-col gap-1 mt-2">
                        <Label className="text-[10px]">Label</Label>
                        <Input
                          value={comp.name}
                          onChange={(e) => updateComponent(comp.id, { name: e.target.value })}
                          className="h-7 text-xs"
                          style={{ background: "var(--surface)", borderColor: "var(--outline-variant)" }}
                        />
                      </div>

                      {/* Type-specific props */}
                      {comp.type === "team-grid" && (
                        <TeamGridPropsEditor
                          props={comp.props}
                          onChange={(props) => updateComponent(comp.id, { props })}
                        />
                      )}
                      {comp.type === "skipper-academy" && (
                        <SkipperAcademyEditor
                          props={comp.props}
                          onChange={(props) => updateComponent(comp.id, { props })}
                        />
                      )}
                      {comp.type === "contact-content" && (
                        <ContactContentEditor
                          props={comp.props}
                          onChange={(props) => updateComponent(comp.id, { props })}
                        />
                      )}
                      {(comp.type === "fleet-content" ||
                        comp.type === "locations-content" ||
                        comp.type === "itineraries-content" ||
                        comp.type === "news-content") && (
                        <PageHeaderEditor
                          props={comp.props}
                          onChange={(props) => updateComponent(comp.id, { props })}
                        />
                      )}
                      {comp.type === "services-content" && (
                        <ServicesContentEditor
                          props={comp.props}
                          onChange={(props) => updateComponent(comp.id, { props })}
                        />
                      )}

                      {/* Status toggle & delete */}
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--outline-variant)" }}>
                        <Select
                          value={comp.status}
                          onValueChange={(val) => updateComponent(comp.id, { status: val })}
                        >
                          <SelectTrigger className="h-7 w-24 text-[10px]" style={{ borderColor: "var(--outline-variant)" }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteComponent(comp.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add component */}
          <Select onValueChange={addComponent}>
            <SelectTrigger
              className="h-8 text-xs gap-2"
              style={{ borderColor: "var(--outline-variant)", borderStyle: "dashed" }}
            >
              <Plus className="size-3.5" />
              <SelectValue placeholder="Add component…" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((def) => (
                <SelectItem key={def.type} value={def.type}>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{def.label}</span>
                    <span className="text-[10px] text-muted-foreground">{def.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewComp} onOpenChange={(open) => !open && setPreviewComp(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Eye className="size-4" style={{ color: "var(--primary)" }} />
              Preview: {previewComp?.name || previewComp?.type}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 bg-white min-h-[300px]">
            {previewLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--outline-variant)", borderTopColor: "transparent" }}
                  />
                  <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Loading preview data…</p>
                </div>
              </div>
            ) : previewComp?.type === "team-grid" && previewData ? (
              <div className="w-full max-w-5xl mx-auto">
                <TeamGrid
                  staff={previewData}
                  columns={(previewComp.props.columns as number) ?? 4}
                  variant={(previewComp.props.variant as "minimal" | "card" | "overlay") ?? "minimal"}
                  maxMembers={(previewComp.props.maxMembers as number) ?? 0}
                  lang="en"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  No preview available for this component type
                </p>
              </div>
            )}
          </div>

          {/* Footer with component info */}
          {previewComp && (
            <div
              className="px-6 py-3 flex items-center justify-between text-[10px] border-t"
              style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}
            >
              <span style={{ color: "var(--on-surface-variant)" }}>
                Type: <strong>{previewComp.type}</strong> · Status: <strong>{previewComp.status}</strong>
                {previewComp.type === "team-grid" && previewData && (
                  <> · {previewData.length} member{previewData.length !== 1 ? "s" : ""}</>
                )}
              </span>
              <span style={{ color: "var(--on-surface-variant)" }}>
                Columns: {String(previewComp.props.columns ?? 4)} · Max: {String(previewComp.props.maxMembers ?? "All")}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Team Grid Props Editor ─────────────────────────────────────

function TeamGridPropsEditor({
  props,
  onChange,
}: {
  props: Record<string, unknown>
  onChange: (props: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <Label className="text-[10px]">Columns</Label>
          <Select
            value={String(props.columns ?? 4)}
            onValueChange={(val) => onChange({ ...props, columns: parseInt(val) })}
          >
            <SelectTrigger className="h-7 text-xs" style={{ borderColor: "var(--outline-variant)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <Label className="text-[10px]">Max members</Label>
          <Input
            type="number"
            min={0}
            value={String(props.maxMembers ?? 0)}
            onChange={(e) => onChange({ ...props, maxMembers: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs"
            style={{ background: "var(--surface)", borderColor: "var(--outline-variant)" }}
            placeholder="0 = all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[10px]">Variant</Label>
        <Select
          value={String(props.variant ?? "minimal")}
          onValueChange={(val) => onChange({ ...props, variant: val })}
        >
          <SelectTrigger className="h-7 text-xs" style={{ borderColor: "var(--outline-variant)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal (circle avatars)</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

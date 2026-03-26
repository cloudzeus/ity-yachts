"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Check, ChevronRight, Folder, Home, Image as ImageIcon, Play } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PickedMedia {
  url: string
  path: string
  name: string
  mimeType: string
  width?: number | null
  height?: number | null
}

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (media: PickedMedia | PickedMedia[]) => void
  accept?: "image" | "video" | "all"
  multiple?: boolean
}

interface MediaFile {
  id: string; name: string; path: string; url: string
  mimeType: string; size: number; width: number | null; height: number | null
}
interface BunnyFolder { ObjectName: string }

export function MediaPicker({ open, onClose, onSelect, accept = "all", multiple = false }: MediaPickerProps) {
  const [folder, setFolder] = useState("")
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<BunnyFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchMedia = useCallback(async (f: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/media?folder=${encodeURIComponent(f)}`)
      if (res.ok) {
        const data = await res.json()
        let allFiles: MediaFile[] = data.files ?? []
        if (accept === "image") allFiles = allFiles.filter((f) => f.mimeType.startsWith("image/"))
        if (accept === "video") allFiles = allFiles.filter((f) => f.mimeType.startsWith("video/"))
        setFiles(allFiles)
        setFolders(data.folders ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [accept])

  useEffect(() => { if (open) fetchMedia(folder) }, [open, folder, fetchMedia])

  // Reset when closed
  useEffect(() => { if (!open) { setFolder(""); setSelected(new Set()) } }, [open])

  function toggleSelect(file: MediaFile) {
    if (!multiple) {
      onSelect({ url: file.url, path: file.path, name: file.name, mimeType: file.mimeType, width: file.width, height: file.height })
      onClose()
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(file.path) ? next.delete(file.path) : next.add(file.path)
      return next
    })
  }

  function handleConfirm() {
    const picked = files.filter((f) => selected.has(f.path)).map((f) => ({
      url: f.url, path: f.path, name: f.name, mimeType: f.mimeType, width: f.width, height: f.height,
    }))
    onSelect(picked)
    onClose()
  }

  const breadcrumbs = folder ? folder.split("/") : []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Media Library</DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            {multiple ? "Select one or more files" : "Click a file to select it"}
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm py-1 flex-wrap shrink-0">
          <button onClick={() => setFolder("")} className="flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: folder ? "var(--secondary)" : "var(--primary)" }}>
            <Home className="size-3.5" /> Root
          </button>
          {breadcrumbs.map((seg, i) => {
            const path = breadcrumbs.slice(0, i + 1).join("/")
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={path} className="flex items-center gap-1">
                <ChevronRight className="size-3.5" style={{ color: "var(--on-surface-variant)" }} />
                <button onClick={() => !isLast && setFolder(path)}
                  style={{ color: isLast ? "var(--primary)" : "var(--secondary)", fontWeight: isLast ? 600 : 400 }}>
                  {seg}
                </button>
              </span>
            )
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm" style={{ color: "var(--on-surface-variant)" }}>Loading…</div>
          ) : (
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
              {/* Folders */}
              {folders.map((f) => (
                <button key={f.ObjectName} className="flex flex-col items-center gap-1.5 p-2 rounded transition-colors hover:bg-black/[0.03]"
                  style={{ borderRadius: "var(--radius-md)" }}
                  onClick={() => setFolder(folder ? `${folder}/${f.ObjectName}` : f.ObjectName)}>
                  <Folder className="size-8" style={{ color: "var(--secondary)" }} />
                  <span className="text-xs truncate w-full text-center" style={{ color: "var(--on-surface)" }}>{f.ObjectName}</span>
                </button>
              ))}
              {/* Files */}
              {files.map((file) => {
                const isImg = file.mimeType.startsWith("image/")
                const isSelected = selected.has(file.path)
                return (
                  <button key={file.path} onClick={() => toggleSelect(file)}
                    className="group relative rounded overflow-hidden text-left transition-all"
                    style={{
                      borderRadius: "var(--radius-md)",
                      outline: isSelected ? "2px solid var(--secondary)" : "2px solid transparent",
                      background: "var(--surface-container-high)",
                    }}>
                    <div className="aspect-square relative overflow-hidden flex items-center justify-center">
                      {isImg
                        ? <Image src={file.url} alt={file.name} fill className="object-contain" sizes="120px" />
                        : <div className="flex items-center justify-center w-full h-full"><Play className="size-6" style={{ color: "var(--secondary)" }} /></div>}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,99,153,0.35)" }}>
                          <Check className="size-6 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="px-1.5 py-1 text-xs truncate" style={{ color: "var(--on-surface)" }}>{file.name}</p>
                  </button>
                )
              })}
              {files.length === 0 && folders.length === 0 && (
                <div className="col-span-5 flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon className="size-8" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>No files here</p>
                </div>
              )}
            </div>
          )}
        </div>

        {multiple && (
          <div className="flex justify-end gap-2 pt-2 shrink-0 border-t" style={{ borderColor: "var(--outline-variant)" }}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={selected.size === 0}
              style={{ background: "var(--gradient-ocean)", color: "white", borderRadius: "var(--radius-xs)" }}>
              Select {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

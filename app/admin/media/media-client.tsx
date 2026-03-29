"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import {
  LayoutGrid, List, FolderPlus, Upload, ChevronRight,
  Folder, Trash2, MoreHorizontal, Play, Image as ImageIcon,
  X, Check, Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatBytes } from "@/lib/utils"

interface MediaFile {
  id: string
  name: string
  path: string
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  lastChanged: string
}

interface BunnyFolder {
  ObjectName: string
  Path: string
  IsDirectory: boolean
}

interface UploadItem {
  file: File
  progress: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function MediaClient() {
  const [folder, setFolder] = useState("")
  const [page, setPage] = useState(1)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<BunnyFolder[]>([])
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ type: "file" | "folder"; path: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(async (f: string, p: number = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/media?folder=${encodeURIComponent(f)}&page=${p}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files ?? [])
        setFolders(data.folders ?? [])
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchMedia(folder, 1)
  }, [folder, fetchMedia])

  useEffect(() => {
    if (page > 1) fetchMedia(folder, page)
  }, [page, fetchMedia, folder])

  // Breadcrumb segments
  const breadcrumbs = folder ? folder.split("/") : []

  async function uploadFiles(fileList: File[]) {
    const items: UploadItem[] = fileList.map((f) => ({ file: f, progress: 0, status: "pending" }))
    setUploads((prev) => [...prev, ...items])

    const startIdx = uploads.length
    // Upload all files concurrently
    await Promise.all(fileList.map((file, idx) => uploadSingle(file, startIdx + idx)))
    await fetchMedia(folder)
  }

  async function uploadSingle(file: File, idx: number) {
    setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: "uploading" } : u))

    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd })
      if (res.ok) {
        setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: "done", progress: 100 } : u))
      } else {
        const err = await res.json()
        setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: "error", error: err.error } : u))
      }
    } catch {
      setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: "error", error: "Upload failed" } : u))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    const path = folder ? `${folder}/${newFolderName.trim()}` : newFolderName.trim()
    await fetch("/api/admin/media/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderPath: path }),
    })
    setCreateFolderOpen(false)
    setNewFolderName("")
    await fetchMedia(folder)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        deleteTarget.type === "file"
          ? `/api/admin/media?path=${encodeURIComponent(deleteTarget.path)}`
          : "/api/admin/media/folder",
        deleteTarget.type === "file"
          ? { method: "DELETE" }
          : {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderPath: deleteTarget.path }),
          }
      )
      if (!res.ok) {
        const err = await res.json()
        alert(`Delete failed: ${err.error}`)
        return
      }
      await fetchMedia(folder)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleBatchDelete() {
    await Promise.all(Array.from(selected).map((path) =>
      fetch(`/api/admin/media?path=${encodeURIComponent(path)}`, { method: "DELETE" })
    ))
    setSelected(new Set())
    await fetchMedia(folder)
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === files.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(files.map((f) => f.path)))
    }
  }

  const activeUploads = uploads.filter((u) => u.status !== "done")

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Media Library
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {files.length} files · {folders.length} folders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button size="sm" className="h-9 gap-2 text-xs" style={{ background: "var(--error)", color: "white", borderRadius: "var(--radius-xs)" }} onClick={handleBatchDelete}>
              <Trash2 className="size-4" /> Delete {selected.size}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="size-4" /> New Folder
          </Button>
          <Button size="sm" className="h-9 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" /> Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
            onChange={(e) => { if (e.target.files) uploadFiles(Array.from(e.target.files)) }} />
          {/* View toggle */}
          <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
            <button onClick={() => setView("grid")} className={cn("px-2.5 py-1.5 transition-colors", view === "grid" ? "text-white" : "text-gray-500")}
              style={{ background: view === "grid" ? "var(--secondary)" : "var(--surface-container-lowest)" }}>
              <LayoutGrid className="size-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("px-2.5 py-1.5 transition-colors", view === "list" ? "text-white" : "text-gray-500")}
              style={{ background: view === "list" ? "var(--secondary)" : "var(--surface-container-lowest)" }}>
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button onClick={() => setFolder("")} className="flex items-center gap-1 hover:text-primary transition-colors" style={{ color: folder === "" ? "var(--primary)" : "var(--on-surface-variant)" }}>
          <Home className="size-3.5" />
          <span>Root</span>
        </button>
        {breadcrumbs.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 opacity-30" />
            <button
              onClick={() => setFolder(breadcrumbs.slice(0, i + 1).join("/"))}
              className="hover:text-primary transition-colors"
              style={{ color: i === breadcrumbs.length - 1 ? "var(--primary)" : "var(--on-surface-variant)" }}
            >
              {seg}
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-[400px] rounded-md transition-colors relative",
          isDragging ? "bg-secondary/5 border-2 border-dashed border-secondary" : "bg-transparent"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="size-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--surface-container-high)" }}>
              <Upload className="size-6 opacity-20" />
            </div>
            <h3 className="text-sm font-medium" style={{ color: "var(--primary)" }}>No files found</h3>
            <p className="text-xs mt-1 max-w-[200px]" style={{ color: "var(--on-surface-variant)" }}>
              Drag and drop files here or use the upload button to get started.
            </p>
          </div>
        ) : (
          view === "grid" ? (
            <GridView
              files={files}
              folders={folders}
              selected={selected}
              onToggle={toggleSelect}
              onSelectAll={toggleSelectAll}
              onFolderClick={setFolder}
              onDelete={(f) => setDeleteTarget({ type: "file", path: f.path, name: f.name })}
              onDeleteFolder={(f) => setDeleteTarget({ type: "folder", path: f.Path.replace(/^\//, ""), name: f.ObjectName })}
            />
          ) : (
            <ListView
              files={files}
              folders={folders}
              selected={selected}
              onToggle={toggleSelect}
              onSelectAll={toggleSelectAll}
              onFolderClick={setFolder}
              onDelete={(f) => setDeleteTarget({ type: "file", path: f.path, name: f.name })}
              onDeleteFolder={(f) => setDeleteTarget({ type: "folder", path: f.Path.replace(/^\//, ""), name: f.ObjectName })}
            />
          )
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            Showing {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} files
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-xs">{page} / {pagination.totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {activeUploads.length > 0 && (
        <div className="fixed bottom-6 right-6 w-80 z-50" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", border: "1px solid var(--outline-variant)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
            <span className="text-xs font-semibold">Uploading {activeUploads.length} files</span>
            <button onClick={() => setUploads([])} className="p-1 hover:bg-black/5 rounded">
              <X className="size-3.5" />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-2">
            {uploads.map((u, i) => (
              <div key={i} className="flex flex-col gap-1 p-2 rounded bg-black/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium truncate flex-1">{u.file.name}</span>
                  {u.status === "done" && <Check className="size-3 text-green-600" />}
                  {u.status === "error" && <X className="size-3 text-red-600" />}
                </div>
                <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-300", u.status === "error" ? "bg-red-500" : "bg-secondary")}
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                {u.error && <span className="text-[9px] text-red-500">{u.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName" className="text-xs mb-2 block">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. yachts-2026"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} style={{ background: "var(--gradient-ocean)", color: "white" }}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === "folder" && " All files inside this folder will also be deleted."}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} style={{ background: "var(--error)", color: "white" }}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GridView({ files, folders, selected, onToggle, onSelectAll, onFolderClick, onDelete, onDeleteFolder }: {
  files: MediaFile[]
  folders: BunnyFolder[]
  selected: Set<string>
  onToggle: (path: string) => void
  onSelectAll: () => void
  onFolderClick: (path: string) => void
  onDelete: (file: MediaFile) => void
  onDeleteFolder: (folder: BunnyFolder) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {/* Folders first */}
      {folders.map((f) => {
        const path = f.Path.replace(/^\//, "")
        return (
          <div
            key={`folder-${path}`}
            className="group relative flex flex-col items-center justify-center p-4 rounded-md cursor-pointer transition-all hover:bg-black/5"
            style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
            onClick={() => onFolderClick(path)}
          >
            <div className="size-12 flex items-center justify-center mb-2">
              <Folder className="size-10 text-secondary opacity-60" fill="currentColor" />
            </div>
            <span className="text-xs font-medium text-center truncate w-full px-2" style={{ color: "var(--primary)" }}>
              {f.ObjectName}
            </span>
            <button
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(f) }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )
      })}

      {/* Files */}
      {files.map((file) => {
        const isImg = file.mimeType.startsWith("image/")
        const isSelected = selected.has(file.path)
        return (
          <div
            key={`file-${file.path}`}
            className="group relative rounded overflow-hidden cursor-pointer transition-all"
            style={{
              background: "var(--surface-container-lowest)",
              boxShadow: isSelected ? "0 0 0 2px var(--secondary)" : "var(--shadow-ambient)",
            }}
            onClick={() => onToggle(file.path)}
          >
            {/* Thumbnail */}
            <div className="aspect-square relative overflow-hidden flex items-center justify-center" style={{ background: "var(--surface-container-high)", position: "relative" }}>
              {isImg ? (
                <Image src={file.url} alt={file.name} fill className="object-contain" sizes="120px" />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={file.url}
                    muted
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-8 rounded-full bg-black/50 flex items-center justify-center">
                      <Play className="size-4 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
              )}
              {/* Selection Overlay */}
              <div className={cn("absolute inset-0 bg-secondary/10 transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40")} />
              <div className={cn("absolute top-2 left-2 size-4 rounded border flex items-center justify-center transition-all",
                isSelected ? "bg-secondary border-secondary text-white" : "bg-white/80 border-black/10 opacity-0 group-hover:opacity-100")}>
                {isSelected && <Check className="size-3" />}
              </div>
            </div>
            {/* Info */}
            <div className="p-2 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate" style={{ color: "var(--primary)" }}>{file.name}</p>
                <p className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>{formatBytes(file.size)}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.url)}>Copy URL</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(file)}>
                    <Trash2 className="size-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ files, folders, selected, onToggle, onSelectAll, onFolderClick, onDelete, onDeleteFolder }: {
  files: MediaFile[]
  folders: BunnyFolder[]
  selected: Set<string>
  onToggle: (path: string) => void
  onSelectAll: () => void
  onFolderClick: (path: string) => void
  onDelete: (file: MediaFile) => void
  onDeleteFolder: (folder: BunnyFolder) => void
}) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--outline-variant)", background: "var(--surface-container-lowest)" }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
            <th className="px-4 py-2 w-10">
              {files.length > 0 && (
                <input
                  type="checkbox"
                  checked={selected.size === files.length && files.length > 0}
                  onChange={onSelectAll}
                  className="rounded"
                />
              )}
            </th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2 hidden sm:table-cell">Type</th>
            <th className="px-4 py-2 hidden md:table-cell">Size</th>
            <th className="px-4 py-2 hidden lg:table-cell">Dimensions</th>
            <th className="px-4 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
          {/* Folders */}
          {folders.map((f) => {
            const path = f.Path.replace(/^\//, "")
            return (
              <tr key={`folder-${path}`} className="hover:bg-black/[0.02] transition-colors cursor-pointer" onClick={() => onFolderClick(path)}>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Folder className="size-4 text-secondary opacity-60" fill="currentColor" />
                    <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>{f.ObjectName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Folder</span>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">—</td>
                <td className="px-4 py-2.5 hidden lg:table-cell">—</td>
                <td className="px-2 py-2 text-right">
                  <button className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteFolder(f) }}>
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            )
          })}

          {/* Files */}
          {files.map((file) => {
            const isImg = file.mimeType.startsWith("image/")
            const isSelected = selected.has(file.path)
            return (
              <tr key={`file-${file.path}`}
                style={{ borderLeft: isSelected ? "2px solid var(--secondary)" : "2px solid transparent", background: isSelected ? "rgba(0,99,153,0.05)" : undefined }}
                className="hover:bg-black/[0.02] transition-colors cursor-pointer"
                onClick={() => onToggle(file.path)}>
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggle(file.path)} className="rounded" />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded overflow-hidden shrink-0 flex items-center justify-center relative"
                      style={{ background: "var(--surface-container-high)", borderRadius: "var(--radius-xs)" }}>
                      {isImg ? (
                        <Image src={file.url} alt={file.name} fill className="object-contain" sizes="32px" />
                      ) : (
                        <>
                          <video src={file.url} muted preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                          <Play className="size-3 text-white relative z-10 drop-shadow-md" fill="white" />
                        </>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: "var(--on-surface)" }}>{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{file.mimeType}</span>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{formatBytes(file.size)}</span>
                </td>
                <td className="px-4 py-2.5 hidden lg:table-cell">
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    {file.width && file.height ? `${file.width} × ${file.height}` : "—"}
                  </span>
                </td>
                <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.url)}>Copy URL</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(file)}>
                        <Trash2 className="size-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

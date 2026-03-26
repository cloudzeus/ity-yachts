"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UserData } from "./user-modal"

interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  onDeleted: () => void
  user?: UserData
}

export function DeleteUserDialog({ open, onClose, onDeleted, user }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      if (res.ok) { onDeleted(); onClose() }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete User</DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            This will permanently delete <strong>{user?.name ?? user?.email}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleDelete} disabled={loading} style={{ background: "var(--error)", color: "white", borderRadius: "var(--radius-xs)" }}>
            {loading ? "Deleting…" : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

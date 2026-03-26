"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface UserData {
  id?: string
  name?: string | null
  email?: string | null
  role: string
}

interface UserModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  mode: "add" | "edit"
  user?: UserData
}

const ROLES = ["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE", "CUSTOMER"]

export function UserModal({ open, onClose, onSave, mode, user }: UserModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("CUSTOMER")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "")
      setEmail(user?.email ?? "")
      setPassword("")
      setRole(user?.role ?? "CUSTOMER")
      setError(null)
    }
  }, [open, user])

  async function handleSubmit() {
    if (!email || !role) { setError("Email and role are required"); return }
    if (mode === "add" && !password) { setError("Password is required"); return }

    setLoading(true)
    setError(null)

    try {
      const url = mode === "add" ? "/api/admin/users" : `/api/admin/users/${user?.id}`
      const method = mode === "add" ? "POST" : "PUT"
      const body: any = { name, email, role }
      if (password) body.password = password

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong")
        return
      }

      onSave()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
            {mode === "add" ? "Add User" : "Edit User"}
          </DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            {mode === "add" ? "Create a new user account." : "Update the user's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" style={{ color: "var(--on-surface-variant)" }}>Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" style={{ color: "var(--on-surface-variant)" }}>Email <span style={{ color: "var(--error)" }}>*</span></Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" style={{ color: "var(--on-surface-variant)" }}>
              {mode === "add" ? <>Password <span style={{ color: "var(--error)" }}>*</span></> : "New Password (leave blank to keep current)"}
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: "var(--on-surface-variant)" }}>Role <span style={{ color: "var(--error)" }}>*</span></Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded" style={{ background: "var(--error-container)", color: "var(--error)", borderRadius: "var(--radius-xs)" }}>
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} style={{ background: "var(--gradient-ocean)", color: "white", borderRadius: "var(--radius-xs)" }}>
            {loading ? "Saving…" : mode === "add" ? "Create User" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

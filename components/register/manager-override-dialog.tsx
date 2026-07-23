"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { STAFF } from "@/lib/mock-data"
import { MANAGER_OVERRIDE_REASONS } from "@/lib/pricing-engine-data"

const APPROVERS = STAFF.filter((s) => s.role === "Owner" || s.role === "Manager")

export function ManagerOverrideDialog({
  open,
  onOpenChange,
  description,
  onApprove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  onApprove: (approvingUser: string, reason: string, note: string | undefined) => void
}) {
  const [approver, setApprover] = useState(APPROVERS[0]?.name ?? "")
  const [pin, setPin] = useState("")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")

  function handleApprove() {
    if (!approver || !reason) return
    onApprove(approver, reason, note.trim() || undefined)
    setPin("")
    setReason("")
    setNote("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manager override required</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="override-approver">Approving manager</Label>
            <Select value={approver} onValueChange={setApprover}>
              <SelectTrigger className="w-full" id="override-approver">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVERS.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} · {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="override-pin">PIN</Label>
            <Input id="override-pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
            <p className="text-xs text-muted-foreground">Visual only in this prototype — not actually verified.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="override-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full" id="override-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {MANAGER_OVERRIDE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="override-note">Note (optional)</Label>
            <Textarea id="override-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            This approval is captured with the approving user, reason, and a timestamp, and appears in the audit log.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={!approver || !reason}>
            Approve & continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

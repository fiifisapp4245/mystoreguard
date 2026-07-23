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
import { ADJUSTMENT_REASONS, adjustMemberPoints, type LoyaltyMember } from "@/lib/loyalty-data"

export function AdjustPointsDialog({
  member,
  userName,
  onOpenChange,
  onAdjusted,
}: {
  member: LoyaltyMember | null
  userName: string
  onOpenChange: (open: boolean) => void
  onAdjusted: () => void
}) {
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null)

  if (member && member.id !== prevMemberId) {
    setPrevMemberId(member.id)
    setAmount("")
    setReason("")
    setNote("")
  }

  const delta = Number.parseInt(amount, 10) || 0
  const resultingBalance = member ? Math.max(0, member.points + delta) : 0
  const canSave = member !== null && delta !== 0 && reason.length > 0

  function handleSave() {
    if (!member || !canSave) return
    adjustMemberPoints(member.id, delta, reason, note.trim() || undefined, userName)
    onAdjusted()
  }

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust points</DialogTitle>
          <DialogDescription>{member?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Current balance</span>
            <span className="font-medium">{member?.points ?? 0} pts</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-points-amount">Points (use a negative number to deduct)</Label>
            <Input
              id="adjust-points-amount"
              type="number"
              placeholder="e.g. 50 or -50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {delta !== 0 && (
              <p className="text-xs text-muted-foreground">New balance will be {resultingBalance} pts.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-points-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full" id="adjust-points-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-points-note">Note (optional)</Label>
            <Textarea id="adjust-points-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

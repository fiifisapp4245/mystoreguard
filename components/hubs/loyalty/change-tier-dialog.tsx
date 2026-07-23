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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { changeTierManually, TIER_CHANGE_REASONS, type LoyaltyMember, type MemberTier } from "@/lib/loyalty-data"

const TIERS: MemberTier[] = ["Bronze", "Silver", "Gold"]

export function ChangeTierDialog({
  member,
  onOpenChange,
  onChanged,
}: {
  member: LoyaltyMember | null
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [tier, setTier] = useState<MemberTier>("Bronze")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null)

  if (member && member.id !== prevMemberId) {
    setPrevMemberId(member.id)
    setTier(member.tier)
    setReason("")
    setNote("")
  }

  const canSave = member !== null && reason.length > 0 && tier !== member?.tier

  function handleSave() {
    if (!member || !canSave) return
    changeTierManually(member.id, tier, reason, note.trim() || undefined)
    onChanged()
  }

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change tier manually</DialogTitle>
          <DialogDescription>{member?.name} — currently {member?.tier}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-tier-new">New tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as MemberTier)}>
              <SelectTrigger className="w-full" id="change-tier-new">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {member && tier === member.tier && (
              <p className="text-xs text-muted-foreground">Already at this tier — choose a different one.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-tier-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full" id="change-tier-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {TIER_CHANGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-tier-note">Note (optional)</Label>
            <Textarea id="change-tier-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Change tier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

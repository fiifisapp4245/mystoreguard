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
import { formatGHS } from "@/lib/mock-data"
import { pointsToGHS, redeemPointsOnBehalf, type LoyaltyMember } from "@/lib/loyalty-data"

export function RedeemPointsDialog({
  member,
  userName,
  onOpenChange,
  onRedeemed,
}: {
  member: LoyaltyMember | null
  userName: string
  onOpenChange: (open: boolean) => void
  onRedeemed: () => void
}) {
  const [amount, setAmount] = useState("")
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null)

  if (member && member.id !== prevMemberId) {
    setPrevMemberId(member.id)
    setAmount("")
  }

  const points = Number.parseInt(amount, 10) || 0
  const exceedsBalance = member ? points > member.points : false
  const canSave = member !== null && points > 0 && !exceedsBalance

  function handleSave() {
    if (!member || !canSave) return
    redeemPointsOnBehalf(member.id, points, userName)
    onRedeemed()
  }

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Redeem on behalf</DialogTitle>
          <DialogDescription>{member?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Available balance</span>
            <span className="font-medium">{member?.points ?? 0} pts</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="redeem-points-amount">Points to redeem</Label>
            <Input
              id="redeem-points-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {points > 0 && (
              <p className="text-xs text-muted-foreground">Worth {formatGHS(pointsToGHS(points))} at the register.</p>
            )}
            {exceedsBalance && <p className="text-xs text-destructive">Cannot exceed the member&apos;s available balance.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Redeem points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

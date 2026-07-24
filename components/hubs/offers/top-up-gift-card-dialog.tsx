"use client"

import { useState } from "react"
import { toast } from "sonner"

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
import { topUpGiftCard, type GiftCard } from "@/lib/gift-cards-data"

export function TopUpGiftCardDialog({
  card,
  onOpenChange,
  onToppedUp,
}: {
  card: GiftCard | null
  onOpenChange: (open: boolean) => void
  onToppedUp: () => void
}) {
  const [amount, setAmount] = useState("")
  const [prevCardId, setPrevCardId] = useState<string | null>(null)

  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id)
    setAmount("")
  }

  const parsedAmount = Number.parseFloat(amount)
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0

  function handleTopUp() {
    if (!card || !canSubmit) return
    topUpGiftCard(card.id, parsedAmount)
    toast.success("Gift card topped up", { description: `${card.id} +${formatGHS(parsedAmount)}` })
    onToppedUp()
  }

  return (
    <Dialog open={card !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle>Top up {card.id}</DialogTitle>
              <DialogDescription>Current balance {formatGHS(card.balance)}.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topup-amount">
                Amount (GHS) <span className="text-destructive">*</span>
              </Label>
              <Input id="topup-amount" type="number" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex flex-col items-end gap-1">
                {!canSubmit && <p className="text-xs text-muted-foreground">Needs an amount greater than 0</p>}
                <Button onClick={handleTopUp} disabled={!canSubmit}>
                  Top up
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

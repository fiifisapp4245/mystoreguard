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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import { voidGiftCard, type GiftCard } from "@/lib/gift-cards-data"

export function VoidGiftCardDialog({
  card,
  onOpenChange,
  onVoided,
}: {
  card: GiftCard | null
  onOpenChange: (open: boolean) => void
  onVoided: () => void
}) {
  const [reason, setReason] = useState("")
  const [prevCardId, setPrevCardId] = useState<string | null>(null)

  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id)
    setReason("")
  }

  const canSubmit = reason.trim() !== ""

  function handleVoid() {
    if (!card || !canSubmit) return
    voidGiftCard(card.id, reason.trim())
    toast.success("Gift card voided", { description: `${card.id} — balance cleared to zero.` })
    onVoided()
  }

  return (
    <Dialog open={card !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle>Void {card.id}</DialogTitle>
              <DialogDescription>
                This clears the remaining {formatGHS(card.balance)} balance and marks the card fully redeemed. A reason is required for the record.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="void-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea id="void-reason" rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Lost card reported by customer" />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleVoid} disabled={!canSubmit}>
                Void card
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

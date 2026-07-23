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
import type { Quotation } from "@/lib/estimator-data"

export function RecordDepositDialog({
  quotation,
  onOpenChange,
  onRecord,
}: {
  quotation: Quotation | null
  onOpenChange: (open: boolean) => void
  onRecord: (amount: number) => void
}) {
  const [amount, setAmount] = useState("0")
  const [prevQuotationId, setPrevQuotationId] = useState<string | null>(null)

  // Reset (and re-seed the amount to 30% of the total) each time a different
  // quotation is opened — adjusting state during render rather than in an
  // effect, since Dialog's onOpenChange only fires on user-driven open/close,
  // not when the parent sets `quotation` via external state.
  if (quotation && quotation.id !== prevQuotationId) {
    setPrevQuotationId(quotation.id)
    setAmount(String(Math.round(quotation.total * 0.3 * 100) / 100))
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPrevQuotationId(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={quotation !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Record deposit</DialogTitle>
          <DialogDescription>
            {quotation?.id} · {quotation?.customer} · Total {quotation ? formatGHS(quotation.total) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-amount">Deposit amount (GHS)</Label>
          <Input id="deposit-amount" type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onRecord(Number.parseFloat(amount) || 0)}>Record deposit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

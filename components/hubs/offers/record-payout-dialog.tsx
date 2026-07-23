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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import { TODAY_ISO } from "@/lib/period-utils"
import {
  commissionOutstanding,
  recordPayout,
  type AffiliatePartner,
  type PayoutMethod,
} from "@/lib/affiliates-data"

const PAYOUT_METHODS: PayoutMethod[] = ["Cash", "Momo", "Bank transfer"]

export function RecordPayoutDialog({
  affiliate,
  onOpenChange,
  onRecorded,
}: {
  affiliate: AffiliatePartner | null
  onOpenChange: (open: boolean) => void
  onRecorded: () => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PayoutMethod>("Cash")
  const [reference, setReference] = useState("")
  const [date, setDate] = useState(TODAY_ISO)
  const [note, setNote] = useState("")
  const [prevAffiliateId, setPrevAffiliateId] = useState<string | null>(null)

  if (affiliate && affiliate.id !== prevAffiliateId) {
    setPrevAffiliateId(affiliate.id)
    setAmount(String(Math.max(0, commissionOutstanding(affiliate))))
    setMethod("Cash")
    setReference("")
    setDate(TODAY_ISO)
    setNote("")
  }

  const parsedAmount = Number.parseFloat(amount)
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && date !== ""

  function handleRecord() {
    if (!affiliate || !canSubmit) return
    recordPayout(affiliate.id, parsedAmount, method, reference.trim() || undefined, date, note.trim() || undefined)
    toast.success("Payout recorded", { description: `${formatGHS(parsedAmount)} to ${affiliate.name}` })
    onRecorded()
  }

  return (
    <Dialog open={affiliate !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {affiliate && (
          <>
            <DialogHeader>
              <DialogTitle>Record payout — {affiliate.name}</DialogTitle>
              <DialogDescription>Outstanding: {formatGHS(commissionOutstanding(affiliate))}.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payout-amount">
                    Amount (GHS) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="payout-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payout-date">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input id="payout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payout-method">Method</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                    <SelectTrigger className="w-full" id="payout-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYOUT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payout-reference">Reference</Label>
                  <Input id="payout-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payout-note">Note</Label>
                <Textarea id="payout-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecord} disabled={!canSubmit}>
                Record payout
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

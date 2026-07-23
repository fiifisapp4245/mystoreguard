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
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import { issueGiftCard } from "@/lib/gift-cards-data"

const QUICK_AMOUNTS = [50, 100, 200, 500]

export function IssueGiftCardDialog({
  open,
  onOpenChange,
  onIssued,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssued: () => void
}) {
  const [value, setValue] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [issuedTo, setIssuedTo] = useState("")
  const [expiryMonths, setExpiryMonths] = useState("12")
  const [note, setNote] = useState("")

  const amount = Number.parseFloat(value)
  const canSubmit = Number.isFinite(amount) && amount > 0

  function resetForm() {
    setValue("")
    setCardNumber("")
    setIssuedTo("")
    setExpiryMonths("12")
    setNote("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function handleIssue() {
    if (!canSubmit) return
    const months = Number.parseInt(expiryMonths, 10) || 12
    const card = issueGiftCard({
      value: amount,
      cardNumber: cardNumber.trim() || undefined,
      issuedTo: issuedTo.trim() || undefined,
      expiryMonths: months,
      note: note.trim() || undefined,
    })
    toast.success(`Gift card issued — ${formatGHS(amount)} taken as a sale`, {
      description: `${card.id}${card.issuedTo ? ` · ${card.issuedTo}` : " · Bearer"}`,
    })
    onIssued()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue gift card</DialogTitle>
          <DialogDescription>Issuing a gift card records a sale — the store takes the cash now.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gc-value">
              Value (GHS) <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((amt) => (
                <Button key={amt} type="button" variant="outline" size="sm" onClick={() => setValue(String(amt))}>
                  {formatGHS(amt)}
                </Button>
              ))}
            </div>
            <Input id="gc-value" type="number" min="0" placeholder="Custom amount" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gc-card-number">Card number</Label>
              <Input
                id="gc-card-number"
                placeholder="Auto-generated"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate, or scan/enter a physical card&apos;s number.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gc-expiry">Expiry (months)</Label>
              <Input id="gc-expiry" type="number" min="1" value={expiryMonths} onChange={(e) => setExpiryMonths(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gc-recipient">Recipient</Label>
            <Input id="gc-recipient" placeholder="Leave blank for Bearer" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gc-note">Note</Label>
            <Textarea id="gc-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleIssue} disabled={!canSubmit}>
            Issue gift card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

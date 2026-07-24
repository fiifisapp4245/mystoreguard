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
import { formatGHS } from "@/lib/mock-data"
import { PAYMENT_METHODS, type Invoice, type PaymentMethod } from "@/lib/invoice-data"
import { TODAY_ISO } from "@/lib/period-utils"

interface FormErrors {
  amount?: string
  reference?: string
}

const REFERENCE_REQUIRED_METHODS: PaymentMethod[] = ["Momo", "Bank transfer"]

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onRecord,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onRecord: (payment: { amount: number; method: PaymentMethod; reference?: string; dateISO: string; note?: string }) => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("Cash")
  const [reference, setReference] = useState("")
  const [date, setDate] = useState(TODAY_ISO)
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [prevInvoiceId, setPrevInvoiceId] = useState<string | null>(null)

  // Reset (and re-seed the amount to the current balance) each time a
  // different invoice is opened for payment — adjusting state during render
  // rather than in an effect, since this component stays mounted between rows.
  if (invoice && invoice.id !== prevInvoiceId) {
    setPrevInvoiceId(invoice.id)
    setAmount(invoice.balance > 0 ? String(invoice.balance) : "")
    setMethod("Cash")
    setReference("")
    setDate(TODAY_ISO)
    setNote("")
    setErrors({})
  }

  function handleOpenChange(next: boolean) {
    if (!next) setPrevInvoiceId(null)
    onOpenChange(next)
  }

  function handleSave() {
    const nextErrors: FormErrors = {}
    const parsedAmount = Number.parseFloat(amount)
    if (!amount.trim() || !(parsedAmount > 0)) {
      nextErrors.amount = "Enter an amount greater than zero."
    }
    if (REFERENCE_REQUIRED_METHODS.includes(method) && !reference.trim()) {
      nextErrors.reference = "Reference is required for this payment method."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onRecord({
      amount: parsedAmount,
      method,
      reference: reference.trim() || undefined,
      dateISO: date,
      note: note.trim() || undefined,
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {invoice ? `${invoice.id} — balance ${formatGHS(invoice.balance)}` : "Record a payment against this invoice."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "payment-amount-error" : undefined}
              aria-required="true"
            />
            {errors.amount && (
              <p id="payment-amount-error" className="text-xs text-destructive">
                {errors.amount}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-method">Payment method</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger id="payment-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-reference">
              Reference {REFERENCE_REQUIRED_METHODS.includes(method) ? "" : "(optional)"}
            </Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. 8891023"
              aria-invalid={Boolean(errors.reference)}
              aria-describedby={errors.reference ? "payment-reference-error" : undefined}
              aria-required={REFERENCE_REQUIRED_METHODS.includes(method)}
            />
            {errors.reference && (
              <p id="payment-reference-error" className="text-xs text-destructive">
                {errors.reference}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-date">Date</Label>
            <Input id="payment-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea id="payment-note" value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

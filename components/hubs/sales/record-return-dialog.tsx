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
import { getCurrentReturnPolicy, REFUND_METHOD_POLICY_LABELS } from "@/lib/return-policy-data"
import { REFUND_METHODS, RETURN_REASONS, SALES_RECORDS, SALES_TODAY_ISO, type ReturnRecord } from "@/lib/sales-data"

interface FormErrors {
  sale?: string
  item?: string
}

export function RecordReturnDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (returnRecord: ReturnRecord) => void
}) {
  const [receiptNo, setReceiptNo] = useState("")
  const [itemName, setItemName] = useState("")
  const [reason, setReason] = useState(RETURN_REASONS[0])
  const [refundMethod, setRefundMethod] = useState(REFUND_METHODS[0])
  const [errors, setErrors] = useState<FormErrors>({})

  const selectedSale = SALES_RECORDS.find((sale) => sale.receiptNo === receiptNo)

  const policy = getCurrentReturnPolicy()
  const policySummary = `${policy.windowDays}-day return window · ${REFUND_METHOD_POLICY_LABELS[policy.refundMethodPolicy]}${policy.receiptRequired ? " · Receipt required" : ""}`

  function reset() {
    setReceiptNo("")
    setItemName("")
    setReason(RETURN_REASONS[0])
    setRefundMethod(REFUND_METHODS[0])
    setErrors({})
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSave() {
    const nextErrors: FormErrors = {}
    if (!receiptNo) nextErrors.sale = "Select the original sale."
    if (!itemName) nextErrors.item = "Select an item to return."

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const line = selectedSale?.lineItems.find((item) => item.name === itemName)

    onAdd({
      id: `ret-${receiptNo}-${itemName.replace(/\s+/g, "-")}`,
      customer: selectedSale?.customer ?? "Walk-in customer",
      item: itemName,
      reason,
      amount: line ? line.quantity * line.unitPrice : 0,
      dateISO: SALES_TODAY_ISO,
      originalReceiptNo: receiptNo,
    })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record return</DialogTitle>
          <DialogDescription>Refund or credit goods brought back to the store. {policySummary}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Original sale</Label>
            <Select
              value={receiptNo}
              onValueChange={(value) => {
                setReceiptNo(value)
                setItemName("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a receipt..." />
              </SelectTrigger>
              <SelectContent>
                {SALES_RECORDS.filter((sale) => sale.type !== "On-hold").map((sale) => (
                  <SelectItem key={sale.receiptNo} value={sale.receiptNo}>
                    {sale.receiptNo} — {sale.customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sale && <p className="text-xs text-destructive">{errors.sale}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Item</Label>
            <Select value={itemName} onValueChange={setItemName} disabled={!selectedSale}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an item..." />
              </SelectTrigger>
              <SelectContent>
                {selectedSale?.lineItems.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.item && <p className="text-xs text-destructive">{errors.item}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Refund method</Label>
            <Select value={refundMethod} onValueChange={setRefundMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFUND_METHODS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

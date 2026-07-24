"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { RecordReturnDialog } from "@/components/hubs/sales/record-return-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS } from "@/lib/mock-data"
import { getCurrentReturnPolicy, REFUND_METHOD_POLICY_LABELS } from "@/lib/return-policy-data"
import { RETURNS_RECORDS, type ReturnRecord } from "@/lib/sales-data"

export function ReturnsTab() {
  const [returns, setReturns] = useState<ReturnRecord[]>(RETURNS_RECORDS)
  const [addOpen, setAddOpen] = useState(false)

  function handleAdd(returnRecord: ReturnRecord) {
    setReturns((prev) => [returnRecord, ...prev])
    setAddOpen(false)
    toast.success("Return recorded", { description: `${returnRecord.item} from ${returnRecord.customer}.` })
  }

  const policy = getCurrentReturnPolicy()
  const policySummary = `${policy.windowDays}-day return window · ${REFUND_METHOD_POLICY_LABELS[policy.refundMethodPolicy]}${policy.receiptRequired ? " · Receipt required" : ""}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{policySummary}</p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Record return
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Original receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium whitespace-nowrap">{item.customer}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                <TableCell>{formatGHS(item.amount)}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {item.originalReceiptNo}
                </TableCell>
              </TableRow>
            ))}
            {returns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No returns recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RecordReturnDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </div>
  )
}

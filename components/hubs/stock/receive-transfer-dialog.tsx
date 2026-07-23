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
import { receiveTransfer, type Transfer } from "@/lib/stock-movements-data"

export function ReceiveTransferDialog({
  transfer,
  isLarry,
  onOpenChange,
  onReceived,
}: {
  transfer: Transfer | null
  isLarry: boolean
  onOpenChange: (open: boolean) => void
  onReceived: () => void
}) {
  const [received, setReceived] = useState<Record<string, string>>({})
  const [discrepancyReason, setDiscrepancyReason] = useState("")
  const [prevTransferId, setPrevTransferId] = useState<string | null>(null)

  if (transfer && transfer.id !== prevTransferId) {
    setPrevTransferId(transfer.id)
    setReceived(Object.fromEntries(transfer.lines.map((l) => [l.productId, String(l.quantitySent)])))
    setDiscrepancyReason("")
  }

  const hasDiscrepancy = transfer?.lines.some((l) => (Number.parseFloat(received[l.productId] ?? "0") || 0) !== l.quantitySent) ?? false

  function handleConfirm() {
    if (!transfer) return
    if (hasDiscrepancy && !discrepancyReason.trim()) {
      toast.error("Add a reason for the discrepancy before confirming.")
      return
    }
    const lines = transfer.lines.map((l) => ({ productId: l.productId, quantityReceived: Number.parseFloat(received[l.productId] ?? "0") || 0 }))
    receiveTransfer(isLarry, transfer.id, lines, hasDiscrepancy ? discrepancyReason.trim() : undefined)
    toast.success("Transfer received", { description: hasDiscrepancy ? "Recorded with a discrepancy." : "Quantities matched exactly." })
    onReceived()
  }

  return (
    <Dialog open={transfer !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive transfer — {transfer?.id}</DialogTitle>
          <DialogDescription>Enter what actually arrived — this never silently overwrites what was sent.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col divide-y rounded-lg border">
            <div className="grid grid-cols-[1fr_70px_90px] gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              <span>Product</span>
              <span>Sent</span>
              <span>Received</span>
            </div>
            {transfer?.lines.map((line) => (
              <div key={line.productId} className="grid grid-cols-[1fr_70px_90px] items-center gap-2 px-3 py-2 text-sm">
                <span className="truncate">{line.productName}</span>
                <span className="text-muted-foreground">{line.quantitySent}</span>
                <Input
                  type="number"
                  min="0"
                  value={received[line.productId] ?? ""}
                  onChange={(e) => setReceived((prev) => ({ ...prev, [line.productId]: e.target.value }))}
                  className="h-8 px-2"
                />
              </div>
            ))}
          </div>

          {hasDiscrepancy && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discrepancy-reason">Discrepancy reason</Label>
              <Textarea
                id="discrepancy-reason"
                rows={2}
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value)}
                placeholder="What happened to the difference?"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

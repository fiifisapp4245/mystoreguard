"use client"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatGHS } from "@/lib/mock-data"
import type { Quotation } from "@/lib/estimator-data"
import { formatDateDisplay } from "@/lib/period-utils"

export function QuotationDetailSheet({
  quotation,
  onOpenChange,
  onEdit,
  onSend,
  onConvert,
  onDuplicate,
  onMarkRejected,
  onRecordDeposit,
}: {
  quotation: Quotation | null
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onSend: () => void
  onConvert: () => void
  onDuplicate: () => void
  onMarkRejected: () => void
  onRecordDeposit: () => void
}) {
  return (
    <Sheet open={quotation !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {quotation && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{quotation.id}</SheetTitle>
              <SheetDescription>
                {quotation.customer} · created {formatDateDisplay(quotation.createdDate)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={quotation.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valid until</span>
                  <span>{formatDateDisplay(quotation.validUntil)}</span>
                </div>
                {quotation.fromAppointmentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">From appointment {quotation.fromAppointmentId}</span>
                  </div>
                )}
                {quotation.convertedToInvoiceId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Converted to</span>
                    <span className="font-medium">{quotation.convertedToInvoiceId}</span>
                  </div>
                )}
                {quotation.depositAmount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deposit taken</span>
                    <span className="font-medium">{formatGHS(quotation.depositAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Line items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {quotation.lineItems.map((item) => (
                    <div key={item.name} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.unitPrice > 0 ? formatGHS(item.unitPrice) : "—"}</span>
                      </div>
                      {item.computedDetail && (
                        <p className="text-xs text-muted-foreground">{item.computedDetail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatGHS(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>− {formatGHS(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-1.5 font-medium">
                  <span>Total</span>
                  <span>{formatGHS(quotation.total)}</span>
                </div>
              </div>
            </div>

            <SheetFooter className="grid grid-cols-2 gap-2">
              <Button
                onClick={onConvert}
                disabled={quotation.status !== "Accepted"}
              >
                Convert to invoice
              </Button>
              <Button
                variant="outline"
                onClick={onRecordDeposit}
                disabled={quotation.status !== "Accepted" || quotation.depositAmount !== undefined}
              >
                Record deposit
              </Button>
              <Button variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="outline" onClick={onSend}>
                Send
              </Button>
              <Button variant="outline" onClick={onDuplicate}>
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={onMarkRejected}
                disabled={quotation.status === "Rejected" || quotation.status === "Converted"}
              >
                Mark rejected
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

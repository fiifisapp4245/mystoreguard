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
import { poTotal, type PurchaseOrder } from "@/lib/purchase-orders-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { useDemoState } from "@/hooks/use-demo-state"
import { canSeeCostPrices } from "@/lib/permissions-data"

export function PODetailSheet({
  po,
  onOpenChange,
  onReceive,
  fullyReceived,
}: {
  po: PurchaseOrder | null
  onOpenChange: (open: boolean) => void
  onReceive: () => void
  fullyReceived: boolean
}) {
  const { state } = useDemoState()
  const showCostPrices = canSeeCostPrices(state.role)

  return (
    <Sheet open={po !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {po && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{po.id}</SheetTitle>
              <SheetDescription>
                {po.supplierName} · created {formatDateDisplay(po.createdDate)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={po.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expected delivery</span>
                  <span>{formatDateDisplay(po.expectedDate)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Line items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {po.lineItems.map((item) => (
                    <div key={item.productId} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{item.productName}</span>
                        {showCostPrices && (
                          <span className="font-medium">{formatGHS(item.orderedQty * item.unitCost)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.receivedQty} of {item.orderedQty} received
                        {showCostPrices ? ` · ${formatGHS(item.unitCost)} each` : ""}
                      </p>
                    </div>
                  ))}
                </div>
                {showCostPrices && (
                  <div className="flex items-center justify-between px-1 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatGHS(poTotal(po))}</span>
                  </div>
                )}
              </div>

              {po.bill && (
                <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Supplier bill</p>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Invoice</span>
                    <span>{po.bill.invoiceNumber}</span>
                  </div>
                  {showCostPrices && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span>{formatGHS(po.bill.amount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span>{po.bill.isPaid ? "Paid" : `Owed — ${po.bill.paymentTerms}`}</span>
                  </div>
                </div>
              )}

              {po.note && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p>{po.note}</p>
                </div>
              )}
            </div>

            <SheetFooter>
              {(po.status === "Sent" || po.status === "Partially received") && !fullyReceived && (
                <Button onClick={onReceive}>Receive goods</Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

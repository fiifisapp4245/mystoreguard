"use client"

import Link from "next/link"

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
import { getRider, type Delivery } from "@/lib/deliveries-data"
import { formatDateDisplay } from "@/lib/period-utils"

export function DeliveryDetailSheet({
  delivery,
  onOpenChange,
  onAssignRider,
  onMarkOutForDelivery,
  onMarkDelivered,
  onMarkFailed,
  onReschedule,
  onReturnToStore,
  onCancel,
  onPrintWaybill,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
  onAssignRider: () => void
  onMarkOutForDelivery: () => void
  onMarkDelivered: () => void
  onMarkFailed: () => void
  onReschedule: () => void
  onReturnToStore: () => void
  onCancel: () => void
  onPrintWaybill: () => void
}) {
  return (
    <Sheet open={delivery !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {delivery && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{delivery.id}</SheetTitle>
              <SheetDescription>
                {delivery.customer} · {formatDateDisplay(delivery.scheduledDateISO)} · {delivery.window}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={delivery.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{delivery.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right">{delivery.address}, {delivery.area}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rider</span>
                  <span>{getRider(delivery.riderId)?.name ?? "Not yet assigned"}</span>
                </div>
                {(delivery.fromReceiptNo || delivery.fromInvoiceNo) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <Link
                      href={delivery.fromReceiptNo ? "/sales/all" : "/invoice/invoices"}
                      className="text-primary hover:underline"
                    >
                      {delivery.fromReceiptNo ?? delivery.fromInvoiceNo}
                    </Link>
                  </div>
                )}
                {delivery.status === "Failed" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Failure reason</span>
                    <span className="font-medium text-destructive">{delivery.failureReason}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {delivery.lineItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p>{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatGHS(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-medium">{formatGHS(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-1 text-sm">
                  <span className="text-muted-foreground">Goods value</span>
                  <span>{formatGHS(delivery.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0))}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium">{delivery.isCod ? "Cash on delivery" : "Prepaid"}</span>
                </div>
                {delivery.isCod && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">COD amount</span>
                    <span className="font-medium">{formatGHS(delivery.codAmount)}</span>
                  </div>
                )}
              </div>

              {delivery.note && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p>{delivery.note}</p>
                </div>
              )}

              {delivery.proof && (
                <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Proof of delivery</p>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Received by</span>
                    <span>{delivery.proof.receivedBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{delivery.proof.method}</span>
                  </div>
                  {delivery.proof.cashCollected !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cash collected</span>
                      <span>{formatGHS(delivery.proof.cashCollected)}</span>
                    </div>
                  )}
                  {delivery.proof.collectedNote && (
                    <p className="text-xs text-muted-foreground">{delivery.proof.collectedNote}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span>{delivery.proof.deliveredAt}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Timeline</p>
                <div className="flex flex-col gap-3 border-l pl-4">
                  {delivery.timeline.map((entry, index) => (
                    <div key={index} className="relative text-sm">
                      <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" />
                      <p>{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{entry.at}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="grid grid-cols-2 gap-2">
              {delivery.status === "Scheduled" && (
                <Button onClick={onAssignRider} className="col-span-2">
                  Assign rider
                </Button>
              )}
              {delivery.status === "Assigned" && (
                <Button onClick={onMarkOutForDelivery} className="col-span-2">
                  Mark out for delivery
                </Button>
              )}
              {delivery.status === "Out for delivery" && (
                <>
                  <Button onClick={onMarkDelivered}>Mark delivered</Button>
                  <Button variant="outline" onClick={onMarkFailed}>
                    Mark failed
                  </Button>
                </>
              )}
              {delivery.status === "Failed" && (
                <>
                  <Button onClick={onReschedule}>Reschedule</Button>
                  <Button variant="outline" onClick={onReturnToStore}>
                    Return to store
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={onPrintWaybill}>
                Print waybill
              </Button>
              {(delivery.status === "Scheduled" || delivery.status === "Assigned") && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel delivery
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

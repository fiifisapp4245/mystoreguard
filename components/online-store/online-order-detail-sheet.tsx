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
import { useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import { nextActionFor, type OnlineOrder } from "@/lib/online-orders-data"

/**
 * One online order, in the same shape as the Delivery and Sale detail sheets
 * — header, fact block, items, payment, timeline, then the single action
 * that moves it forward.
 */
export function OnlineOrderDetailSheet({
  order,
  onOpenChange,
  onAdvance,
  onCancel,
}: {
  order: OnlineOrder | null
  onOpenChange: (open: boolean) => void
  onAdvance: (order: OnlineOrder) => void
  onCancel: (order: OnlineOrder) => void
}) {
  const link = useStoreLink()
  const next = order ? nextActionFor(order) : undefined

  return (
    <Sheet open={order !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{order.id}</SheetTitle>
              <SheetDescription>
                {order.customerName} · {order.placedAtLabel}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={order.status} />
                <StatusBadge label={order.paymentStatus} />
                {order.source === "auction" && (
                  <StatusBadge label="Won" tone="success" />
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{order.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">How they&apos;ll get it</span>
                  <span className="text-right">
                    {order.fulfilment === "pickup" ? "Collecting from the shop" : `Delivery to ${order.deliveryArea}`}
                  </span>
                </div>
                {order.deliveryAddress && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right">{order.deliveryAddress}</span>
                  </div>
                )}
                {order.customerId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer record</span>
                    <Link href={link("/people/customers")} className="text-primary hover:underline">
                      In your directory
                    </Link>
                  </div>
                )}
                {order.deliveryId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <Link href={link("/deliveries")} className="text-primary hover:underline">
                      {order.deliveryId}
                    </Link>
                  </div>
                )}
                {order.saleReceiptNo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">In your sales</span>
                    <Link href={link("/sales/all")} className="text-primary hover:underline">
                      {order.saleReceiptNo}
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {order.lines.map((line) => (
                    <div key={line.productId} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p>{line.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.quantity} × {formatGHS(line.unitPrice)}
                        </p>
                      </div>
                      <span className="font-medium">{formatGHS(line.quantity * line.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1 px-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{formatGHS(order.itemsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{order.deliveryFee > 0 ? formatGHS(order.deliveryFee) : "Free"}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>{formatGHS(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paying by</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                {order.paymentReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-xs">{order.paymentReference}</span>
                  </div>
                )}
              </div>

              {order.note && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p>{order.note}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Timeline</p>
                <div className="flex flex-col gap-3 border-l pl-4">
                  {order.timeline.map((entry, index) => (
                    <div key={index} className="relative text-sm">
                      <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" />
                      <p>{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{entry.at}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter>
              {next && <Button onClick={() => onAdvance(order)}>{next.label}</Button>}
              {order.status !== "Completed" && order.status !== "Cancelled" && (
                <Button variant="outline" onClick={() => onCancel(order)}>
                  Cancel order
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

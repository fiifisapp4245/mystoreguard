"use client"

import { Printer } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatGHS } from "@/lib/mock-data"
import type { SaleRecord } from "@/lib/sales-data"

export function SaleDetailSheet({
  sale,
  onOpenChange,
}: {
  sale: SaleRecord | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={sale !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {sale && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{sale.receiptNo}</SheetTitle>
              <SheetDescription>
                {sale.customer} · {sale.date}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tender</span>
                  <Badge variant="outline" className="font-normal">
                    {sale.type}
                  </Badge>
                </div>
                {sale.momoReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Momo reference</span>
                    <span className="font-medium">{sale.momoReference}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span className="font-medium">{sale.cashier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={sale.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Line items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {sale.lineItems.map((item) => (
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
                <Separator />
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{formatGHS(sale.amount)}</span>
                </div>
              </div>
            </div>

            <SheetFooter>
              <Button variant="outline" className="w-full">
                <Printer className="size-4" />
                Print receipt
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

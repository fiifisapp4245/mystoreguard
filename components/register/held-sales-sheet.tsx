"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { formatGHS } from "@/lib/mock-data"
import { heldSaleTotal, type HeldSale } from "@/lib/pos-data"

export function HeldSalesSheet({
  open,
  onOpenChange,
  heldSales,
  onResume,
  onRestoreFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  heldSales: HeldSale[]
  onResume: (sale: HeldSale) => void
  onRestoreFocus: () => void
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) onRestoreFocus()
      }}
    >
      <SheetContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus()
        }}
      >
        <SheetHeader>
          <SheetTitle>Held sales</SheetTitle>
          <SheetDescription>Resume a parked cart to bring it back to the till.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4 pb-4">
          {heldSales.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales on hold.</p>
          )}
          {heldSales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              onClick={() => onResume(sale)}
              className="flex flex-col gap-1 rounded-lg border p-3 text-left hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{sale.customerName}</span>
                <span className="text-sm text-muted-foreground">{sale.heldAt}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {sale.lines.length} item{sale.lines.length === 1 ? "" : "s"}
                </span>
                <span className="font-medium text-foreground">{formatGHS(heldSaleTotal(sale))}</span>
              </div>
            </button>
          ))}
        </div>

        {heldSales.length > 0 && (
          <div className="mt-auto px-4 pb-4">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

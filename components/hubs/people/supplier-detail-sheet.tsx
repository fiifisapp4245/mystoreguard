"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Supplier } from "@/lib/mock-data"

const RECENT_ORDERS = [
  "PO-1042 — GHS 1,240.00 — Ordered",
  "PO-1039 — GHS 860.00 — Received",
  "PO-1031 — GHS 2,100.00 — Received",
]

export function SupplierDetailSheet({
  supplier,
  onOpenChange,
}: {
  supplier: Supplier | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={supplier !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {supplier && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{supplier.businessName}</SheetTitle>
              <SheetDescription>
                {supplier.contactPerson} · {supplier.phone}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categories</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {supplier.categories.map((category) => (
                      <Badge key={category} variant="outline" className="font-normal">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment terms</span>
                  <span className="font-medium">{supplier.paymentTerms}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Open purchase orders</span>
                  <span className="font-medium">{supplier.openPurchaseOrders}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Recent orders</p>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {RECENT_ORDERS.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <Link
                href="/m/inventory"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View purchase orders
                <ArrowRight className="size-3.5" aria-hidden="true" />
                Stock
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

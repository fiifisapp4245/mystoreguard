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
import type { Invoice } from "@/lib/invoice-data"
import { formatDateDisplay } from "@/lib/period-utils"

export function InvoiceDetailSheet({
  invoice,
  onOpenChange,
  onRecordPayment,
  onSend,
  onDuplicate,
  onVoid,
}: {
  invoice: Invoice | null
  onOpenChange: (open: boolean) => void
  onRecordPayment: () => void
  onSend: () => void
  onDuplicate: () => void
  onVoid: () => void
}) {
  return (
    <Sheet open={invoice !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {invoice && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{invoice.id}</SheetTitle>
              <SheetDescription>
                {invoice.customer} · issued {formatDateDisplay(invoice.issueDate)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={invoice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span className={invoice.status === "Overdue" ? "font-medium text-destructive" : ""}>
                    {formatDateDisplay(invoice.dueDate)}
                  </span>
                </div>
                {invoice.fromReceiptNo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">From sale</span>
                    <Link href="/sales/all" className="text-primary hover:underline">
                      {invoice.fromReceiptNo}
                    </Link>
                  </div>
                )}
                {invoice.fromQuotationNo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">From quotation</span>
                    <Link href="/estimator/quotations" className="text-primary hover:underline">
                      {invoice.fromQuotationNo}
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Line items</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {invoice.lineItems.map((item) => (
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
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatGHS(invoice.subtotal)}</span>
                </div>
                {invoice.taxLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{line.label}</span>
                    <span>{formatGHS(line.amount)}</span>
                  </div>
                ))}
                {invoice.discount > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>− {formatGHS(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-1.5 font-medium">
                  <span>Total</span>
                  <span>{formatGHS(invoice.total)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span>{formatGHS(invoice.amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Balance</span>
                  <span>{formatGHS(invoice.balance)}</span>
                </div>
              </div>
            </div>

            <SheetFooter className="grid grid-cols-2 gap-2">
              <Button onClick={onRecordPayment} disabled={invoice.balance <= 0 || invoice.status === "Void"}>
                Record payment
              </Button>
              <Button variant="outline" onClick={onSend}>
                Send
              </Button>
              <Button variant="outline" onClick={onDuplicate}>
                Duplicate
              </Button>
              <Button variant="outline" onClick={onVoid} disabled={invoice.status === "Void"}>
                Void
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatGHS } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import type { GiftCard, GiftCardTransactionType } from "@/lib/gift-cards-data"

function transactionTone(type: GiftCardTransactionType): "success" | "warning" | "neutral" {
  if (type === "Top-up") return "success"
  if (type === "Redeemed") return "warning"
  return "neutral"
}

export function GiftCardDetailSheet({
  card,
  onOpenChange,
}: {
  card: GiftCard | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={card !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {card && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{card.id}</SheetTitle>
              <SheetDescription>{card.issuedTo ?? "Bearer"}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={card.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Initial value</span>
                  <span>{formatGHS(card.initialValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="font-medium">{formatGHS(card.balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Issued</span>
                  <span>{formatDateDisplay(card.issuedDateISO)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{formatDateDisplay(card.expiryDateISO)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Transaction history</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {card.transactions.map((t) => (
                    <div key={t.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge label={t.type} tone={transactionTone(t.type)} />
                          <span className="text-xs text-muted-foreground">{formatDateDisplay(t.dateISO)}</span>
                        </div>
                        <span className={t.amount < 0 ? "font-medium text-destructive" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                          {t.amount < 0 ? "-" : "+"}
                          {formatGHS(Math.abs(t.amount))}
                        </span>
                      </div>
                      {(t.saleReference || t.note) && (
                        <p className="text-xs text-muted-foreground">{t.saleReference ? `Sale ${t.saleReference}` : t.note}</p>
                      )}
                    </div>
                  ))}
                  {card.transactions.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">No transactions yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDateDisplay } from "@/lib/period-utils"
import { effectiveStatus, promoScopeSummary, promoValueSummary, type PromoCode } from "@/lib/promo-codes-data"

export function PromoRedemptionsSheet({
  promo,
  onOpenChange,
}: {
  promo: PromoCode | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={promo !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {promo && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{promo.id}</SheetTitle>
              <SheetDescription>
                {promoValueSummary(promo)} · {promoScopeSummary(promo)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={effectiveStatus(promo)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valid</span>
                  <span>
                    {formatDateDisplay(promo.validFromISO)} – {formatDateDisplay(promo.validToISO)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Usage</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total redemptions</span>
                  <span className="font-medium">{promo.usedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total uses limit</span>
                  <span>{promo.totalUsesLimit ?? "Unlimited"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Uses per customer</span>
                  <span>{promo.usesPerCustomerLimit ?? "Unlimited"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Eligibility & stacking</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Eligibility</span>
                  <span>
                    {promo.eligibility === "everyone" ? "Everyone" : `${promo.eligibility === "tier" ? "Tier" : "Segment"} — ${promo.eligibilityDetail}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Combines with other codes</span>
                  <span>{promo.canCombine ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span>{promo.priority}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Individual redemptions aren&apos;t logged separately in this system — only the running total above.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

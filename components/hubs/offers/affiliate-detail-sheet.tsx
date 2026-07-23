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
import {
  commissionAccrued,
  commissionOutstanding,
  commissionPaid,
  referredRevenue,
  type AffiliatePartner,
} from "@/lib/affiliates-data"

function commissionRateLabel(affiliate: AffiliatePartner): string {
  return affiliate.commissionModel === "percentage" ? `${affiliate.rate}%` : `${formatGHS(affiliate.rate)} fixed`
}

export function AffiliateDetailSheet({
  affiliate,
  onOpenChange,
}: {
  affiliate: AffiliatePartner | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={affiliate !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {affiliate && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{affiliate.name}</SheetTitle>
              <SheetDescription>
                Code {affiliate.code} · {affiliate.phone}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={affiliate.status} />
                </div>
                {affiliate.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{affiliate.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span>{commissionRateLabel(affiliate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payout schedule</span>
                  <span>{affiliate.payoutScheduleNote}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Referred revenue</span>
                  <span>{formatGHS(referredRevenue(affiliate))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accrued</span>
                  <span>{formatGHS(commissionAccrued(affiliate))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatGHS(commissionPaid(affiliate))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className={commissionOutstanding(affiliate) > 0 ? "font-medium text-destructive" : "font-medium"}>
                    {formatGHS(commissionOutstanding(affiliate))}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Referred sales</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {affiliate.referredSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p>{sale.saleReference}</p>
                        <p className="text-xs text-muted-foreground">{formatDateDisplay(sale.dateISO)}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatGHS(sale.amount)}</p>
                        <p className="text-xs text-muted-foreground">+{formatGHS(sale.commission)} commission</p>
                      </div>
                    </div>
                  ))}
                  {affiliate.referredSales.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">No referred sales yet.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Payout history</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {affiliate.payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p>{formatDateDisplay(payout.dateISO)}</p>
                        <p className="text-xs text-muted-foreground">
                          {payout.method}
                          {payout.reference ? ` · ${payout.reference}` : ""}
                        </p>
                      </div>
                      <p className="font-medium">{formatGHS(payout.amount)}</p>
                    </div>
                  ))}
                  {affiliate.payouts.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">No payouts recorded yet.</p>
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

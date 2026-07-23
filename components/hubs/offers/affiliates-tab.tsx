"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AffiliateDetailSheet } from "@/components/hubs/offers/affiliate-detail-sheet"
import { AffiliateDialog } from "@/components/hubs/offers/affiliate-dialog"
import { RecordPayoutDialog } from "@/components/hubs/offers/record-payout-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS } from "@/lib/mock-data"
import { getStandardPeriodRange, isDateInRange, STANDARD_PERIOD_OPTIONS, type StandardPeriod } from "@/lib/period-utils"
import {
  commissionAccrued,
  commissionOutstanding,
  commissionPaid,
  deactivateAffiliate,
  getAffiliatesStore,
  referredRevenue,
  type AffiliatePartner,
} from "@/lib/affiliates-data"

function commissionRateLabel(affiliate: AffiliatePartner): string {
  return affiliate.commissionModel === "percentage" ? `${affiliate.rate}%` : `${formatGHS(affiliate.rate)} fixed`
}

export function AffiliatesTab() {
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>(() => getAffiliatesStore())

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AffiliatePartner | null>(null)
  const [payoutTarget, setPayoutTarget] = useState<AffiliatePartner | null>(null)
  const [detailTarget, setDetailTarget] = useState<AffiliatePartner | null>(null)

  function refresh() {
    setAffiliates([...getAffiliatesStore()])
  }

  const periodRange = useMemo(() => getStandardPeriodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Today"

  const stats = useMemo(() => {
    const activePartners = affiliates.filter((a) => a.status === "Active").length
    const referredSalesInPeriod = affiliates.flatMap((a) => a.referredSales).filter((s) => isDateInRange(s.dateISO, periodRange))
    const referredSalesValue = referredSalesInPeriod.reduce((sum, s) => sum + s.amount, 0)
    const accruedTotal = affiliates.reduce((sum, a) => sum + commissionAccrued(a), 0)
    const paidTotal = affiliates.reduce((sum, a) => sum + commissionPaid(a), 0)

    return [
      { label: "Active partners", value: String(activePartners) },
      {
        label: "Referred sales",
        caption: periodLabel,
        value: String(referredSalesInPeriod.length),
        footnote: `${formatGHS(referredSalesValue)} in sales`,
      },
      { label: "Commission accrued", caption: "as of now", value: formatGHS(accruedTotal) },
      { label: "Commission paid", caption: "as of now", value: formatGHS(paidTotal) },
    ]
  }, [affiliates, periodRange, periodLabel])

  function handleDeactivate(affiliate: AffiliatePartner) {
    deactivateAffiliate(affiliate.id)
    refresh()
    toast.success("Affiliate deactivated", { description: `${affiliate.name} can no longer refer new sales.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs text-muted-foreground">
            Referral codes are quoted by the customer and entered by the cashier at the till — there&apos;s no link or cookie tracking for a physical store.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus />
              Add affiliate
            </Button>
          </div>
        </div>
        {period === "custom" && <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Referred sales</TableHead>
              <TableHead>Referred revenue</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Accrued</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((affiliate) => {
              const outstanding = commissionOutstanding(affiliate)
              return (
                <TableRow key={affiliate.id} className="cursor-pointer" onClick={() => setDetailTarget(affiliate)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {affiliate.name}
                      {affiliate.status === "Inactive" && <StatusBadge label="Inactive" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{affiliate.code}</TableCell>
                  <TableCell>{affiliate.referredSales.length}</TableCell>
                  <TableCell>{formatGHS(referredRevenue(affiliate))}</TableCell>
                  <TableCell>{commissionRateLabel(affiliate)}</TableCell>
                  <TableCell>{formatGHS(commissionAccrued(affiliate))}</TableCell>
                  <TableCell>{formatGHS(commissionPaid(affiliate))}</TableCell>
                  <TableCell className={outstanding > 0 ? "font-medium text-destructive" : "text-muted-foreground"}>
                    {formatGHS(outstanding)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${affiliate.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(affiliate)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPayoutTarget(affiliate)}>Record payout</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDetailTarget(affiliate)}>View referrals</DropdownMenuItem>
                        {affiliate.status === "Active" && (
                          <DropdownMenuItem variant="destructive" onClick={() => handleDeactivate(affiliate)}>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {affiliates.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No affiliate partners yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AffiliateDialog open={addOpen} onOpenChange={setAddOpen} onSaved={refresh} />

      <AffiliateDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        affiliate={editTarget ?? undefined}
        onSaved={refresh}
      />

      <RecordPayoutDialog
        affiliate={payoutTarget}
        onOpenChange={(open) => !open && setPayoutTarget(null)}
        onRecorded={() => {
          refresh()
          setPayoutTarget(null)
        }}
      />

      <AffiliateDetailSheet affiliate={detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} />
    </div>
  )
}

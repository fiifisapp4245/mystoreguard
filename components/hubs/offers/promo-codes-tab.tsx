"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { EndPromoCodeDialog } from "@/components/hubs/offers/end-promo-code-dialog"
import { PromoCodeDialog } from "@/components/hubs/offers/promo-code-dialog"
import { PromoRedemptionsSheet } from "@/components/hubs/offers/promo-redemptions-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import {
  activatePromoCode,
  duplicatePromoCode,
  effectiveStatus,
  getPromoCodesStore,
  pausePromoCode,
  promoScopeSummary,
  promoValueSummary,
  type PromoCode,
  type PromoDiscountType,
  type PromoEffectiveStatus,
} from "@/lib/promo-codes-data"

type FilterOption = "All" | PromoEffectiveStatus

const STATUS_OPTIONS: PromoEffectiveStatus[] = ["Active", "Scheduled", "Paused", "Expired"]

/** Illustrative only — the data layer doesn't store a basket amount per redemption, so revenue/discount
 * totals below are estimated off a plausible average basket rather than fabricating false precision. */
const ASSUMED_AVERAGE_BASKET = 40

function discountTypeLabel(type: PromoDiscountType): string {
  if (type === "percentage") return "Percentage"
  if (type === "fixed") return "Fixed amount"
  return "Free delivery"
}

export function PromoCodesTab() {
  const [promos, setPromos] = useState<PromoCode[]>(() => getPromoCodesStore())
  const [filter, setFilter] = useState<FilterOption>("All")

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null)
  const [redemptionsTarget, setRedemptionsTarget] = useState<PromoCode | null>(null)
  const [endTarget, setEndTarget] = useState<PromoCode | null>(null)

  function refresh() {
    setPromos([...getPromoCodesStore()])
  }

  const stats = useMemo(() => {
    const activeCodes = promos.filter((p) => effectiveStatus(p) === "Active").length
    const totalRedemptions = promos.reduce((sum, p) => sum + p.usedCount, 0)
    const discountGivenFixed = promos
      .filter((p) => p.discountType === "fixed")
      .reduce((sum, p) => sum + p.usedCount * p.value, 0)
    const revenueAttributed = promos.reduce((sum, p) => sum + p.usedCount * ASSUMED_AVERAGE_BASKET, 0)

    return [
      { label: "Active codes", value: String(activeCodes) },
      { label: "Redemptions", caption: "as of now", value: String(totalRedemptions) },
      {
        label: "Discount given",
        caption: "fixed codes only",
        value: formatGHS(discountGivenFixed),
        footnote: "Percentage codes vary by basket size, not counted here",
      },
      {
        label: "Revenue attributed",
        caption: "estimate",
        value: formatGHS(revenueAttributed),
        footnote: `Assumes a ${formatGHS(ASSUMED_AVERAGE_BASKET)} average basket`,
      },
    ]
  }, [promos])

  const filtered = useMemo(
    () => promos.filter((p) => filter === "All" || effectiveStatus(p) === filter),
    [promos, filter]
  )

  function handleToggle(promo: PromoCode) {
    if (promo.paused) {
      activatePromoCode(promo.id)
      toast.success("Promo code activated", { description: promo.id })
    } else {
      pausePromoCode(promo.id)
      toast.success("Promo code paused", { description: promo.id })
    }
    refresh()
  }

  function handleDuplicate(promo: PromoCode) {
    const copy = duplicatePromoCode(promo.id)
    refresh()
    if (copy) toast.success("Promo code duplicated", { description: `${copy.id} created as paused — edit and activate it.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create promo code
        </Button>
      </div>
      <LiveResultCount count={filtered.length} itemLabel="promo code" />

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Used / limit</TableHead>
              <TableHead>Valid dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((promo) => {
              const status = effectiveStatus(promo)
              return (
                <TableRow key={promo.id} className="cursor-pointer" onClick={() => setRedemptionsTarget(promo)}>
                  <TableCell className="font-medium">{promo.id}</TableCell>
                  <TableCell>{discountTypeLabel(promo.discountType)}</TableCell>
                  <TableCell>{promoValueSummary(promo)}</TableCell>
                  <TableCell className="text-muted-foreground">{promoScopeSummary(promo)}</TableCell>
                  <TableCell>
                    {promo.usedCount} / {promo.totalUsesLimit ?? "∞"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateDisplay(promo.validFromISO)} – {formatDateDisplay(promo.validToISO)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${promo.id}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(promo)}>Edit</DropdownMenuItem>
                        {status !== "Expired" && (
                          <DropdownMenuItem onClick={() => handleToggle(promo)}>{promo.paused ? "Activate" : "Pause"}</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(promo)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRedemptionsTarget(promo)}>View redemptions</DropdownMenuItem>
                        {status !== "Expired" && (
                          <DropdownMenuItem variant="destructive" onClick={() => setEndTarget(promo)}>
                            End now
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No promo codes match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PromoCodeDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={refresh} />

      <PromoCodeDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        promo={editTarget ?? undefined}
        onSaved={refresh}
      />

      <PromoRedemptionsSheet promo={redemptionsTarget} onOpenChange={(open) => !open && setRedemptionsTarget(null)} />

      <EndPromoCodeDialog
        promo={endTarget}
        onOpenChange={(open) => !open && setEndTarget(null)}
        onEnded={() => {
          refresh()
          setEndTarget(null)
        }}
      />
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { GiftCardDetailSheet } from "@/components/hubs/offers/gift-card-detail-sheet"
import { IssueGiftCardDialog } from "@/components/hubs/offers/issue-gift-card-dialog"
import { TopUpGiftCardDialog } from "@/components/hubs/offers/top-up-gift-card-dialog"
import { VoidGiftCardDialog } from "@/components/hubs/offers/void-gift-card-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { formatDateDisplay, getStandardPeriodRange, isDateInRange, STANDARD_PERIOD_OPTIONS, type StandardPeriod } from "@/lib/period-utils"
import {
  freezeGiftCard,
  getGiftCardsStore,
  unfreezeGiftCard,
  type GiftCard,
  type GiftCardStatus,
} from "@/lib/gift-cards-data"

type FilterOption = "All" | GiftCardStatus

const GIFT_CARD_STATUSES: GiftCardStatus[] = ["Active", "Fully redeemed", "Frozen", "Expired"]

export function GiftCardsTab() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>(() => getGiftCardsStore())

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterOption>("All")
  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const [issueOpen, setIssueOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<GiftCard | null>(null)
  const [topUpTarget, setTopUpTarget] = useState<GiftCard | null>(null)
  const [voidTarget, setVoidTarget] = useState<GiftCard | null>(null)

  function refresh() {
    setGiftCards([...getGiftCardsStore()])
  }

  const periodRange = useMemo(() => getStandardPeriodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Today"

  const stats = useMemo(() => {
    const activeCards = giftCards.filter((c) => c.status === "Active")
    const outstandingBalance = giftCards
      .filter((c) => c.status === "Active" || c.status === "Frozen")
      .reduce((sum, c) => sum + c.balance, 0)

    const soldCards = giftCards.filter((c) => isDateInRange(c.issuedDateISO, periodRange))
    const soldValue = soldCards.reduce((sum, c) => sum + c.initialValue, 0)

    const redeemedThisPeriod = giftCards.reduce((sum, c) => {
      const redeemed = c.transactions
        .filter((t) => t.type === "Redeemed" && isDateInRange(t.dateISO, periodRange))
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      return sum + redeemed
    }, 0)

    return [
      { label: "Active cards", value: String(activeCards.length) },
      { label: "Outstanding balance", caption: "as of now", value: formatGHS(outstandingBalance), footnote: "Liability across active & frozen cards" },
      { label: "Sold", caption: periodLabel, value: String(soldCards.length), footnote: `${formatGHS(soldValue)} issued value` },
      { label: "Redeemed", caption: periodLabel, value: formatGHS(redeemedThisPeriod) },
    ]
  }, [giftCards, periodRange, periodLabel])

  const filtered = useMemo(
    () =>
      giftCards.filter((c) => {
        if (filter !== "All" && c.status !== filter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return c.id.toLowerCase().includes(q) || (c.issuedTo ?? "").toLowerCase().includes(q)
      }),
    [giftCards, filter, search]
  )

  function handleCheckBalance(card: GiftCard) {
    toast.info(`${card.id} balance`, { description: formatGHS(card.balance) })
  }

  function handleFreeze(card: GiftCard) {
    freezeGiftCard(card.id)
    refresh()
    toast.success("Gift card frozen", { description: `${card.id} can't be used until it's unfrozen.` })
  }

  function handleUnfreeze(card: GiftCard) {
    unfreezeGiftCard(card.id)
    refresh()
    toast.success("Gift card unfrozen", { description: `${card.id} is active again.` })
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
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by card number or name..." aria-label="Search by card number or name"
              className="max-w-xs"
            />
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                {GIFT_CARD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <Button onClick={() => setIssueOpen(true)}>
              <Plus />
              Issue gift card
            </Button>
          </div>
        </div>
        {period === "custom" && <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />}
        <LiveResultCount count={filtered.length} itemLabel="gift card" />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card number</TableHead>
              <TableHead>Issued to</TableHead>
              <TableHead>Initial value</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((card) => (
              <TableRow key={card.id} className="cursor-pointer" onClick={() => setDetailTarget(card)}>
                <TableCell className="font-medium">{card.id}</TableCell>
                <TableCell>{card.issuedTo ?? "Bearer"}</TableCell>
                <TableCell>{formatGHS(card.initialValue)}</TableCell>
                <TableCell className="font-medium">{formatGHS(card.balance)}</TableCell>
                <TableCell>
                  <StatusBadge label={card.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(card.issuedDateISO)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(card.expiryDateISO)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${card.id}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailTarget(card)}>View transactions</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCheckBalance(card)}>Check balance</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTopUpTarget(card)}>Top up</DropdownMenuItem>
                      {card.status === "Active" && <DropdownMenuItem onClick={() => handleFreeze(card)}>Freeze</DropdownMenuItem>}
                      {card.status === "Frozen" && <DropdownMenuItem onClick={() => handleUnfreeze(card)}>Unfreeze</DropdownMenuItem>}
                      <DropdownMenuItem variant="destructive" onClick={() => setVoidTarget(card)}>
                        Void
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No gift cards match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <IssueGiftCardDialog open={issueOpen} onOpenChange={setIssueOpen} onIssued={refresh} />

      <GiftCardDetailSheet card={detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} />

      <TopUpGiftCardDialog
        card={topUpTarget}
        onOpenChange={(open) => !open && setTopUpTarget(null)}
        onToppedUp={() => {
          refresh()
          setTopUpTarget(null)
        }}
      />

      <VoidGiftCardDialog
        card={voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        onVoided={() => {
          refresh()
          setVoidTarget(null)
        }}
      />
    </div>
  )
}

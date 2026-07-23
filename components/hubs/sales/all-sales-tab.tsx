"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { SaleDetailSheet } from "@/components/hubs/sales/sale-detail-sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import {
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  type StandardPeriod,
} from "@/lib/period-utils"
import { RETURNS_RECORDS, SALES_RECORDS, type SaleRecord, type SaleTenderType } from "@/lib/sales-data"

type FilterChip = "All" | SaleTenderType

const FILTER_CHIPS: FilterChip[] = ["All", "Cash", "Momo", "Credit", "Deposit", "On-hold"]

export function AllSalesTab() {
  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [filter, setFilter] = useState<FilterChip>("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<SaleRecord | null>(null)

  const periodRange = useMemo(
    () => getStandardPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Today"

  const inPeriod = useMemo(
    () => SALES_RECORDS.filter((sale) => isDateInRange(sale.dateISO, periodRange)),
    [periodRange]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return inPeriod.filter((sale) => {
      const matchesFilter = filter === "All" || sale.type === filter
      const matchesSearch =
        !query ||
        sale.customer.toLowerCase().includes(query) ||
        sale.receiptNo.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [inPeriod, filter, search])

  const stats = useMemo(() => {
    const completedInPeriod = inPeriod.filter((sale) => sale.type !== "On-hold")
    const salesTotal = completedInPeriod.reduce((sum, sale) => sum + sale.amount, 0)
    const returnsInPeriod = RETURNS_RECORDS.filter((r) => isDateInRange(r.dateISO, periodRange))

    return [
      { label: "Sales", caption: periodLabel, value: formatGHS(salesTotal) },
      { label: "Transactions", caption: periodLabel, value: String(completedInPeriod.length) },
      { label: "Credit outstanding", caption: "as of now", value: "GHS 6,840.00" },
      { label: "Returns", caption: periodLabel, value: String(returnsInPeriod.length) },
    ]
  }, [inPeriod, periodRange, periodLabel])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setFilter(chip)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  filter === chip
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customer or receipt no..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-8 sm:w-64"
              />
            </div>
          </div>
        </div>

        {period === "custom" && (
          <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt no.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date &amp; time</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sale) => (
              <TableRow key={sale.id} className="cursor-pointer" onClick={() => setSelected(sale)}>
                <TableCell className="font-medium whitespace-nowrap">{sale.receiptNo}</TableCell>
                <TableCell className="whitespace-nowrap">{sale.customer}</TableCell>
                <TableCell>{formatGHS(sale.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {sale.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{sale.date}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{sale.cashier}</TableCell>
                <TableCell>
                  <StatusBadge label={sale.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No sales match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SaleDetailSheet sale={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

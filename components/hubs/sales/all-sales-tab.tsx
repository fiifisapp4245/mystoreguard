"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

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
import { RETURNS_RECORDS, SALES_RECORDS, type SaleRecord, type SaleTenderType } from "@/lib/sales-data"

const STATS = [
  {
    label: "Today's sales",
    value: "GHS 4,850",
    trend: { value: 12, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Transactions",
    value: "76",
    trend: { value: 8, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Credit outstanding",
    value: "GHS 6,840.00",
    caption: "as of now",
  },
  {
    label: "Returns today",
    value: String(RETURNS_RECORDS.length),
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
]

type FilterChip = "All" | SaleTenderType

const FILTER_CHIPS: FilterChip[] = ["All", "Cash", "Momo", "Credit", "Deposit", "On-hold"]

export function AllSalesTab() {
  const [filter, setFilter] = useState<FilterChip>("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<SaleRecord | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return SALES_RECORDS.filter((sale) => {
      const matchesFilter = filter === "All" || sale.type === filter
      const matchesSearch =
        !query ||
        sale.customer.toLowerCase().includes(query) ||
        sale.receiptNo.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

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
                  No sales match your search.
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

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
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
import { getInvoicesStore, getPaymentsStore, PAYMENT_METHODS, type PaymentMethod } from "@/lib/invoice-data"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  type StandardPeriod,
} from "@/lib/period-utils"

type FilterOption = "All" | PaymentMethod

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00`)
  const to = new Date(`${toISO}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function PaymentsTab() {
  const payments = getPaymentsStore()
  const invoices = getInvoicesStore()
  const invoicesById = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices])

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [filter, setFilter] = useState<FilterOption>("All")

  const periodRange = useMemo(
    () => getStandardPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Today"

  const filtered = useMemo(
    () => payments.filter((payment) => filter === "All" || payment.method === filter),
    [payments, filter]
  )

  const stats = useMemo(() => {
    const receivedThisPeriod = payments
      .filter((payment) => isDateInRange(payment.dateISO, periodRange))
      .reduce((sum, payment) => sum + payment.amount, 0)

    const outstanding = invoices
      .filter((invoice) => invoice.status !== "Void")
      .reduce((sum, invoice) => sum + invoice.balance, 0)

    const daysToPayment = payments
      .map((payment) => {
        const invoice = invoicesById.get(payment.invoiceId)
        return invoice ? daysBetween(invoice.issueDate, payment.dateISO) : null
      })
      .filter((days): days is number => days !== null)
    const avgDays =
      daysToPayment.length > 0
        ? Math.round(daysToPayment.reduce((sum, days) => sum + days, 0) / daysToPayment.length)
        : 0

    return [
      { label: "Received this period", caption: periodLabel, value: formatGHS(receivedThisPeriod) },
      { label: "Outstanding", caption: "as of now", value: formatGHS(outstanding) },
      { label: "Average days to payment", caption: "as of now", value: `${avgDays} days` },
    ]
  }, [payments, invoices, invoicesById, periodRange, periodLabel])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All methods</SelectItem>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodSelect value={period} onValueChange={setPeriod} />
        </div>

        {period === "custom" && (
          <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateDisplay(payment.dateISO)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{payment.customer}</TableCell>
                <TableCell>
                  <Link href="/invoice/invoices" className="font-medium text-primary hover:underline">
                    {payment.invoiceId}
                  </Link>
                </TableCell>
                <TableCell>{formatGHS(payment.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {payment.method}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{payment.reference ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{payment.recordedBy}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No payments match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

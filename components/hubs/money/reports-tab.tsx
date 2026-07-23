"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  FileDown,
  Heart,
  Hourglass,
  Landmark,
  Mail,
  Percent,
  Receipt,
  Scale,
  TrendingUp,
  Truck,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatGHS } from "@/lib/mock-data"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  STANDARD_PERIOD_OPTIONS,
  type StandardPeriod,
} from "@/lib/period-utils"
import {
  AGEING_BUCKET_LABELS,
  computeCashierReport,
  computeCustomerLoyaltyReport,
  computeDiscountsGiven,
  computeExpensesByCategory,
  computeProfitLoss,
  computeSalesPerformance,
  computeStockValuation,
  computeTaxSummary,
  getPayables,
  getReceivables,
  managerOverridesCountInRange,
  type AgeingBucket,
} from "@/lib/reports-data"
import { MOVEMENT_TYPES } from "@/lib/stock-movements-data"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Shared period-range helper — the data functions want ISO strings, the
// period-select convention hands back Date objects.
// ---------------------------------------------------------------------------

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function useReportPeriod() {
  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const range = useMemo(
    () => getStandardPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )
  const fromISO = useMemo(() => toISODate(range.from), [range])
  const toISO = useMemo(() => toISODate(range.to), [range])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Today"

  return { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, fromISO, toISO, periodLabel }
}

type ReportPeriodState = ReturnType<typeof useReportPeriod>

function PeriodBar({ period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo }: ReportPeriodState) {
  return (
    <div className="flex flex-col gap-3">
      <PeriodSelect value={period} onValueChange={setPeriod} />
      {period === "custom" && (
        <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report shell — back button, title, optional period bar, content, footer.
// ---------------------------------------------------------------------------

function ScheduleEmailDialog({
  open,
  onOpenChange,
  reportTitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportTitle: string
}) {
  const [frequency, setFrequency] = useState("Weekly")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule &ldquo;{reportTitle}&rdquo; to email</DialogTitle>
          <DialogDescription>Get this report delivered automatically on a set cadence.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Schedule saved", {
                description: `${reportTitle} will be emailed ${frequency.toLowerCase()}.`,
              })
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReportFooter({ title }: { title: string }) {
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info("Export coming soon", { description: `${title} — CSV export isn't wired up in this prototype.` })
          }
        >
          <FileDown className="size-4" /> Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info("Export coming soon", { description: `${title} — PDF export isn't wired up in this prototype.` })
          }
        >
          <FileDown className="size-4" /> Export PDF
        </Button>
      </div>
      <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
        <Mail className="size-4" /> Schedule to email
      </Button>
      <ScheduleEmailDialog open={scheduleOpen} onOpenChange={setScheduleOpen} reportTitle={title} />
    </div>
  )
}

function ReportShell({
  title,
  description,
  onBack,
  periodBar,
  children,
}: {
  title: string
  description: string
  onBack: () => void
  periodBar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to reports
      </Button>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {periodBar}

      <div className="flex flex-col gap-4">{children}</div>

      <ReportFooter title={title} />
    </div>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

function CssBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

function bucketTotals(entries: { bucket: AgeingBucket; balance: number }[]): Record<AgeingBucket, number> {
  const totals = { current: 0, "1-30": 0, "31-60": 0, "60+": 0 } as Record<AgeingBucket, number>
  for (const entry of entries) totals[entry.bucket] += entry.balance
  return totals
}

const AGEING_BUCKETS: AgeingBucket[] = ["current", "1-30", "31-60", "60+"]

// ---------------------------------------------------------------------------
// Profit & loss — the screen that proves stock purchases aren't expenses.
// ---------------------------------------------------------------------------

function StatementRow({
  label,
  amount,
  variant,
  note,
}: {
  label: string
  amount: number
  variant: "plain" | "subtract" | "subtotal" | "total"
  note?: string
}) {
  const isDeduction = variant === "subtract"
  const isEmphasis = variant === "subtotal" || variant === "total"

  return (
    <div className={cn("flex flex-col gap-1 py-3", isEmphasis && "mt-1 border-t")}>
      <div className="flex items-baseline justify-between gap-4">
        <span
          className={cn(
            "flex items-baseline gap-1.5 text-sm",
            isDeduction && "pl-4 text-muted-foreground",
            isEmphasis && "text-base font-semibold text-foreground"
          )}
        >
          {isDeduction && <span aria-hidden="true">&minus;</span>}
          {isEmphasis && <span aria-hidden="true">=</span>}
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            isDeduction && "text-muted-foreground",
            isEmphasis && "text-base font-semibold",
            variant === "total" && (amount < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")
          )}
        >
          {isDeduction ? "− " : ""}
          {formatGHS(Math.abs(amount))}
        </span>
      </div>
      {note && <p className={cn("text-xs text-muted-foreground", isDeduction && "pl-4")}>{note}</p>}
    </div>
  )
}

function ProfitLossView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const report = useMemo(
    () => computeProfitLoss(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )

  return (
    <ReportShell
      title="Profit & loss"
      description="Stock purchases are never expenses here — only inventory that has actually sold becomes Cost of goods sold."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <div className="rounded-xl border p-5 sm:p-6">
        <StatementRow label="Sales revenue" amount={report.salesRevenue} variant="plain" />
        <StatementRow
          label="Cost of goods sold"
          amount={report.cogs}
          variant="subtract"
          note="From inventory consumed by sales, at current cost."
        />
        <StatementRow label="Gross profit" amount={report.grossProfit} variant="subtotal" />
        <StatementRow
          label="Operating expenses"
          amount={report.operatingExpenses}
          variant="subtract"
          note="From the Expenses tab — stock purchases are never included here."
        />
        <StatementRow label="Net profit" amount={report.netProfit} variant="total" />
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Sales performance
// ---------------------------------------------------------------------------

function SalesPerformanceView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const report = useMemo(
    () => computeSalesPerformance(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )

  return (
    <ReportShell
      title="Sales performance"
      description="Revenue and transactions broken down by product, category, cashier and payment type."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total revenue" caption={periodState.periodLabel} value={formatGHS(report.totalRevenue)} />
        <StatCard label="Transactions" caption={periodState.periodLabel} value={String(report.totalTransactions)} />
      </div>

      <Tabs defaultValue="product">
        <TabsList>
          <TabsTrigger value="product">By product</TabsTrigger>
          <TabsTrigger value="category">By category</TabsTrigger>
          <TabsTrigger value="cashier">By cashier</TabsTrigger>
          <TabsTrigger value="payment">By payment type</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-3">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byProduct.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{formatGHS(row.revenue)}</TableCell>
                  </TableRow>
                ))}
                {report.byProduct.length === 0 && <EmptyRow colSpan={3} label="No sales in this period." />}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="category" className="mt-3">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byCategory.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">{row.category}</TableCell>
                    <TableCell>{formatGHS(row.revenue)}</TableCell>
                  </TableRow>
                ))}
                {report.byCategory.length === 0 && <EmptyRow colSpan={2} label="No sales in this period." />}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cashier" className="mt-3">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byCashier.map((row) => (
                  <TableRow key={row.cashier}>
                    <TableCell className="font-medium">{row.cashier}</TableCell>
                    <TableCell>{formatGHS(row.revenue)}</TableCell>
                    <TableCell>{row.transactions}</TableCell>
                  </TableRow>
                ))}
                {report.byCashier.length === 0 && <EmptyRow colSpan={3} label="No sales in this period." />}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-3">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment type</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byPaymentType.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{formatGHS(row.revenue)}</TableCell>
                    <TableCell>{row.transactions}</TableCell>
                  </TableRow>
                ))}
                {report.byPaymentType.length === 0 && <EmptyRow colSpan={3} label="No sales in this period." />}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Cashier report
// ---------------------------------------------------------------------------

function CashierReportView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const rows = useMemo(
    () => computeCashierReport(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )
  const overridesCount = useMemo(
    () => managerOverridesCountInRange(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )

  return (
    <ReportShell
      title="Cashier report"
      description="Sales, discounts and returns by cashier for the period."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cashier</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Transactions</TableHead>
              <TableHead>Discounts applied</TableHead>
              <TableHead>Returns</TableHead>
              <TableHead>Manager overrides</TableHead>
              <TableHead>Voids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.cashier}>
                <TableCell className="font-medium">{row.cashier}</TableCell>
                <TableCell>{formatGHS(row.sales)}</TableCell>
                <TableCell>{row.transactions}</TableCell>
                <TableCell>{formatGHS(row.discountsApplied)}</TableCell>
                <TableCell>{formatGHS(row.returns)}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={7} label="No sales in this period." />}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p>
          {overridesCount} manager override{overridesCount === 1 ? "" : "s"} this period, not attributable to a
          specific cashier in this prototype.
        </p>
        <p>Voids aren&rsquo;t modelled as their own action distinct from returns in this build.</p>
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Credit ageing / Supplier bills due
// ---------------------------------------------------------------------------

function CreditAgeingView({ onBack }: { onBack: () => void }) {
  const receivables = useMemo(() => getReceivables(), [])
  const totals = useMemo(() => bucketTotals(receivables), [receivables])

  return (
    <ReportShell
      title="Credit ageing"
      description="Outstanding customer balances by age, as of now — the receivables view laid out as a printable report."
      onBack={onBack}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AGEING_BUCKETS.map((bucket) => (
          <StatCard key={bucket} label={AGEING_BUCKET_LABELS[bucket]} value={formatGHS(totals[bucket])} />
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Days overdue</TableHead>
              <TableHead>Ageing bucket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.customerName}</TableCell>
                <TableCell className="text-muted-foreground">{r.document}</TableCell>
                <TableCell>{formatGHS(r.balance)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(r.dueDateISO)}</TableCell>
                <TableCell className={r.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {r.daysOverdue > 0 ? r.daysOverdue : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{AGEING_BUCKET_LABELS[r.bucket]}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {receivables.length === 0 && <EmptyRow colSpan={6} label="No outstanding receivables." />}
          </TableBody>
        </Table>
      </div>
    </ReportShell>
  )
}

function SupplierBillsDueView({ onBack }: { onBack: () => void }) {
  const payables = useMemo(() => getPayables(), [])
  const totals = useMemo(() => bucketTotals(payables), [payables])

  return (
    <ReportShell
      title="Supplier bills due"
      description="Outstanding supplier balances by age, as of now — the payables view laid out as a printable report."
      onBack={onBack}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AGEING_BUCKETS.map((bucket) => (
          <StatCard key={bucket} label={AGEING_BUCKET_LABELS[bucket]} value={formatGHS(totals[bucket])} />
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Days overdue</TableHead>
              <TableHead>Ageing bucket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.supplierName}</TableCell>
                <TableCell className="text-muted-foreground">{p.reference}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal capitalize">
                    {p.tag}
                  </Badge>
                </TableCell>
                <TableCell>{formatGHS(p.balance)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(p.dueDateISO)}</TableCell>
                <TableCell className={p.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {p.daysOverdue > 0 ? p.daysOverdue : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{AGEING_BUCKET_LABELS[p.bucket]}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {payables.length === 0 && <EmptyRow colSpan={7} label="No outstanding supplier bills." />}
          </TableBody>
        </Table>
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Stock valuation & movement
// ---------------------------------------------------------------------------

function StockValuationView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const report = useMemo(
    () => computeStockValuation(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )
  const maxCategoryValue = Math.max(1, ...report.byCategory.map((c) => c.value))

  return (
    <ReportShell
      title="Stock valuation & movement"
      description="Current inventory value by category, plus stock movement activity for the period."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <StatCard label="Total stock value" caption="as of now" value={formatGHS(report.totalValue)} className="max-w-xs" />

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-1/3">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byCategory.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell>{row.units}</TableCell>
                <TableCell>{formatGHS(row.value)}</TableCell>
                <TableCell>
                  <CssBar value={row.value} max={maxCategoryValue} />
                </TableCell>
              </TableRow>
            ))}
            {report.byCategory.length === 0 && <EmptyRow colSpan={4} label="No active stock." />}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement counts — {periodState.periodLabel}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOVEMENT_TYPES.map((type) => (
            <div key={type} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{type}</p>
              <p className="text-lg font-semibold">{report.movementCountsByType[type]}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Expenses by category
// ---------------------------------------------------------------------------

function ExpensesByCategoryView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const rows = useMemo(
    () => computeExpensesByCategory(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )
  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  const maxAmount = Math.max(1, ...rows.map((r) => r.amount))

  return (
    <ReportShell
      title="Expenses by category"
      description="Operating expenses recorded in the Expenses tab, grouped by category — stock purchases aren't expenses and aren't included here."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <StatCard label="Total operating expenses" caption={periodState.periodLabel} value={formatGHS(total)} className="max-w-xs" />

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-1/3">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatGHS(row.amount)}</TableCell>
                <TableCell>
                  <CssBar value={row.amount} max={maxAmount} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={4} label="No expenses in this period." />}
          </TableBody>
        </Table>
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Customer & loyalty
// ---------------------------------------------------------------------------

function CustomerLoyaltyView({ onBack }: { onBack: () => void }) {
  const report = useMemo(() => computeCustomerLoyaltyReport(), [])

  return (
    <ReportShell
      title="Customer & loyalty"
      description="A point-in-time snapshot of top customers and loyalty liability — not filtered by period."
      onBack={onBack}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Lapsed customers" caption="no visit in 60+ days" value={String(report.lapsedCount)} />
        <StatCard
          label="Points liability"
          value={formatGHS(report.pointsLiabilityGHS)}
          footnote="Value if every point were redeemed today."
        />
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Lifetime spend</TableHead>
              <TableHead>Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.topCustomers.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{formatGHS(c.lifetimeSpend)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.tier}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {report.topCustomers.length === 0 && <EmptyRow colSpan={3} label="No active loyalty members." />}
          </TableBody>
        </Table>
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Discounts given
// ---------------------------------------------------------------------------

function DiscountsGivenView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const report = useMemo(
    () => computeDiscountsGiven(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )

  return (
    <ReportShell
      title="Discounts given"
      description="Discounts applied at the till, including manager overrides and who approved them."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <StatCard label="Total discounted" caption={periodState.periodLabel} value={formatGHS(report.totalDiscounted)} className="max-w-xs" />

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Discount</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byLabel.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatGHS(row.amount)}</TableCell>
              </TableRow>
            ))}
            {report.byLabel.length === 0 && <EmptyRow colSpan={3} label="No discounts in this period." />}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Manager overrides</h3>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Approved by</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.overrides.map((o, i) => (
                <TableRow key={`${o.dateISO}-${i}`}>
                  <TableCell className="text-muted-foreground">{formatDateDisplay(o.dateISO)}</TableCell>
                  <TableCell className="font-medium">{o.approvingUser}</TableCell>
                  <TableCell>{o.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{o.context}</TableCell>
                </TableRow>
              ))}
              {report.overrides.length === 0 && <EmptyRow colSpan={4} label="No manager overrides in this period." />}
            </TableBody>
          </Table>
        </div>
      </div>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Tax summary
// ---------------------------------------------------------------------------

function TaxSummaryView({ onBack }: { onBack: () => void }) {
  const periodState = useReportPeriod()
  const report = useMemo(
    () => computeTaxSummary(periodState.fromISO, periodState.toISO),
    [periodState.fromISO, periodState.toISO]
  )

  return (
    <ReportShell
      title="Tax summary"
      description="Estimated tax due on the period's taxable revenue."
      onBack={onBack}
      periodBar={<PeriodBar {...periodState} />}
    >
      <StatCard label="Taxable revenue" caption={periodState.periodLabel} value={formatGHS(report.taxableRevenue)} className="max-w-xs" />

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.lines.map((line) => (
              <TableRow key={line.label}>
                <TableCell className="font-medium">{line.label}</TableCell>
                <TableCell>{formatGHS(line.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total tax</TableCell>
              <TableCell className="font-semibold">{formatGHS(report.totalTax)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Estimated from period sales — a per-sale tax breakdown isn&rsquo;t persisted in this prototype.
      </p>
    </ReportShell>
  )
}

// ---------------------------------------------------------------------------
// Launcher grid
// ---------------------------------------------------------------------------

type ReportKey =
  | "profit-loss"
  | "sales-performance"
  | "cashier-report"
  | "credit-ageing"
  | "supplier-bills-due"
  | "stock-valuation"
  | "expenses-by-category"
  | "customer-loyalty"
  | "discounts-given"
  | "tax-summary"

interface ReportDef {
  key: ReportKey
  title: string
  description: string
  icon: LucideIcon
}

const REPORTS: ReportDef[] = [
  {
    key: "profit-loss",
    title: "Profit & loss",
    description: "Sales revenue through to net profit — cost of goods sold and operating expenses kept visibly separate.",
    icon: Scale,
  },
  {
    key: "sales-performance",
    title: "Sales performance",
    description: "Revenue and transactions by product, category, cashier and payment type.",
    icon: TrendingUp,
  },
  {
    key: "cashier-report",
    title: "Cashier report",
    description: "Sales, discounts and returns per cashier for the period.",
    icon: UserCheck,
  },
  {
    key: "credit-ageing",
    title: "Credit ageing",
    description: "Outstanding customer balances, aged by how overdue they are.",
    icon: Hourglass,
  },
  {
    key: "supplier-bills-due",
    title: "Supplier bills due",
    description: "Outstanding supplier balances, aged by how overdue they are.",
    icon: Truck,
  },
  {
    key: "stock-valuation",
    title: "Stock valuation & movement",
    description: "Current inventory value by category, plus movement activity for the period.",
    icon: Boxes,
  },
  {
    key: "expenses-by-category",
    title: "Expenses by category",
    description: "Operating expenses grouped by category — never stock purchases.",
    icon: Receipt,
  },
  {
    key: "customer-loyalty",
    title: "Customer & loyalty",
    description: "Top customers, lapsed members, and points liability.",
    icon: Heart,
  },
  {
    key: "discounts-given",
    title: "Discounts given",
    description: "Discounts by type, including manager overrides and who approved them.",
    icon: Percent,
  },
  {
    key: "tax-summary",
    title: "Tax summary",
    description: "Estimated VAT, NHIL and other tax lines on period revenue.",
    icon: Landmark,
  },
]

export function ReportsTab() {
  const [selected, setSelected] = useState<ReportKey | null>(null)
  const onBack = () => setSelected(null)

  if (selected === "profit-loss") return <ProfitLossView onBack={onBack} />
  if (selected === "sales-performance") return <SalesPerformanceView onBack={onBack} />
  if (selected === "cashier-report") return <CashierReportView onBack={onBack} />
  if (selected === "credit-ageing") return <CreditAgeingView onBack={onBack} />
  if (selected === "supplier-bills-due") return <SupplierBillsDueView onBack={onBack} />
  if (selected === "stock-valuation") return <StockValuationView onBack={onBack} />
  if (selected === "expenses-by-category") return <ExpensesByCategoryView onBack={onBack} />
  if (selected === "customer-loyalty") return <CustomerLoyaltyView onBack={onBack} />
  if (selected === "discounts-given") return <DiscountsGivenView onBack={onBack} />
  if (selected === "tax-summary") return <TaxSummaryView onBack={onBack} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {REPORTS.map((report) => {
        const Icon = report.icon
        return (
          <Card
            key={report.key}
            className="cursor-pointer gap-3 transition-colors hover:bg-accent/40"
            onClick={() => setSelected(report.key)}
          >
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-base">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{report.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                View report <ArrowRight className="size-3.5" />
              </span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

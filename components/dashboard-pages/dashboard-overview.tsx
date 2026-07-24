"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Award,
  Banknote,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Package,
  Plus,
  Settings2,
  ShoppingCart,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { ModulePageData } from "@/components/dashboard-pages/registry"
import { SetupChecklistCard } from "@/components/dashboard-pages/setup-checklist-card"
import { useDemoState } from "@/hooks/use-demo-state"
import {
  DASHBOARD_DATA,
  DASHBOARD_RECENT_SALES,
  formatGHS,
  formatGHSCompact,
  initials,
  NEW_STORE_ATTENTION_ITEMS,
  OUTSTANDING_CREDIT,
  type DashboardPeriod,
} from "@/lib/mock-data"
import { dueBucketFor, mostUrgentTasksForRole, type TaskCategory } from "@/lib/workflow-data"

// Recharts crashes Next's server-side page-data collection if imported
// statically, even from a "use client" module — isolate it behind a real
// code-split boundary so it's only ever loaded in the browser.
const AnalyticsChart = dynamic(() => import("./analytics-chart"), {
  ssr: false,
})
const PaymentTypeChart = dynamic(() => import("./payment-type-chart"), {
  ssr: false,
})

type PeriodOption = DashboardPeriod | "custom"

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
]

const NEW_STORE_ATTENTION_ICON: Record<string, LucideIcon> = {
  "add-products": Package,
  "add-supplier": Building2,
  "first-sale": ShoppingCart,
}

/** Icon per Workflow task category — the Dashboard panel renders live tasks, so this is the UI-layer mapping onto lib/workflow-data.ts's TaskCategory. */
const TASK_CATEGORY_ICON: Record<TaskCategory, LucideIcon> = {
  stock: Package,
  "purchase-order": FileText,
  delivery: Truck,
  invoice: FileText,
  credit: Clock,
  stocktake: Warehouse,
  "day-close": Banknote,
  transfer: Warehouse,
  quotation: FileText,
  override: Settings2,
  "supplier-bill": Building2,
  loyalty: Award,
  expense: Banknote,
  checklist: CalendarCheck,
  manual: ClipboardList,
}

const PAYMENT_COLOR: Record<string, string> = {
  Cash: "bg-chart-1",
  Momo: "bg-chart-2",
  Credit: "bg-chart-3",
  Deposit: "bg-chart-4",
}

export function DashboardOverviewPage({ module }: { module: ModulePageData }) {
  const { state } = useDemoState()
  const [period, setPeriod] = useState<PeriodOption>("today")

  const effectivePeriod: DashboardPeriod = period === "custom" ? "month" : period
  const data = useMemo(() => DASHBOARD_DATA[effectivePeriod], [effectivePeriod])
  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? data.label

  const isNewStore = state.storeState === "new"

  const attentionTasks = useMemo(() => mostUrgentTasksForRole(state.role, 6), [state.role])

  const totalRevenueForShare = data.revenue.value

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={module.name}
        subtitle="Revenue, expenses, profit, and what needs your attention."
        action={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodOption)}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Settings2 />
              Customize
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                <Plus />
                New sale
              </Link>
            </Button>
          </div>
        }
      />

      {isNewStore && <SetupChecklistCard />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={isNewStore ? "—" : formatGHSCompact(data.revenue.value)}
          trend={
            isNewStore
              ? undefined
              : { value: data.revenue.deltaPercent, direction: data.revenue.direction, tone: "positive" }
          }
          footnote={isNewStore ? "No sales yet" : undefined}
          href="/sales/all"
        />
        <StatCard
          label="Gross profit"
          value={isNewStore ? "—" : formatGHSCompact(data.grossProfit.value)}
          trend={
            isNewStore
              ? undefined
              : { value: data.grossProfit.deltaPercent, direction: data.grossProfit.direction, tone: "positive" }
          }
          footnote={isNewStore ? "No sales yet" : undefined}
          href="/m/reports"
        />
        <StatCard
          label="Expenses"
          value={isNewStore ? "—" : formatGHSCompact(data.expenses.value)}
          trend={
            isNewStore
              ? undefined
              : { value: data.expenses.deltaPercent, direction: data.expenses.direction, tone: "negative" }
          }
          footnote={isNewStore ? "No sales yet" : undefined}
          href="/money/expenses"
        />
        <StatCard
          label="Outstanding credit"
          value={isNewStore ? "—" : formatGHSCompact(OUTSTANDING_CREDIT.amount)}
          caption="as of now"
          footnote={isNewStore ? "No credit issued yet" : `Across ${OUTSTANDING_CREDIT.customerCount} customers`}
          href="/sales/all"
        />
      </div>

      <Card className="gap-4 py-5">
        <CardHeader className="px-5">
          <CardTitle className="font-sans">Needs attention</CardTitle>
          <CardDescription>
            {isNewStore ? "Things worth a look today." : "Live from Workflow — nothing here is invented independently."}
          </CardDescription>
          {!isNewStore && (
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/workflow/my-tasks">View all in Workflow →</Link>
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col divide-y px-0">
          {isNewStore
            ? NEW_STORE_ATTENTION_ITEMS.map((item) => {
                const Icon = NEW_STORE_ATTENTION_ICON[item.id] ?? Package
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{item.line}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                )
              })
            : attentionTasks.map((task) => {
                const Icon = TASK_CATEGORY_ICON[task.category] ?? Package
                return (
                  <Link
                    key={task.id}
                    href={`/workflow/my-tasks?task=${task.id}`}
                    className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{task.title}</span>
                    <span className="font-medium text-muted-foreground">{dueBucketFor(task)}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                )
              })}
          {!isNewStore && attentionTasks.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              Tasks appear here automatically when something needs your attention — low stock, an overdue invoice, a failed delivery.
            </p>
          )}
        </CardContent>
      </Card>

      {isNewStore ? (
        <Card className="items-center gap-3 py-16 text-center">
          <CardContent className="flex flex-col items-center gap-4 px-5">
            <p className="max-w-sm text-sm text-muted-foreground">
              Once you record your first sale, your charts and reports will appear here.
            </p>
            <Button asChild>
              <Link href="/register">Record a sale</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Income vs expenses</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart data={data.chart} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Top products</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
                <CardAction>
                  <Link
                    href="/m/reports"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View all
                    <ChevronRight className="size-3.5" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {data.topProducts.map((product, index) => {
                  const maxRevenue = data.topProducts[0]?.revenue ?? product.revenue
                  const widthPercent = Math.round((product.revenue / maxRevenue) * 100)
                  return (
                    <div key={product.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {index + 1}. {product.name}
                        </span>
                        <span className="whitespace-nowrap text-muted-foreground">
                          {product.units} units · {formatGHS(product.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Sales by payment type</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <PaymentTypeChart data={data.paymentBreakdown} />
                <div className="flex flex-1 flex-col gap-2.5">
                  {data.paymentBreakdown.map((payment) => (
                    <div key={payment.type} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${PAYMENT_COLOR[payment.type]}`} />
                        {payment.type}
                      </span>
                      <span className="text-muted-foreground">
                        {formatGHS(payment.amount)} ·{" "}
                        {Math.round((payment.amount / totalRevenueForShare) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Recent sales</CardTitle>
              <CardDescription>The latest transactions across the till.</CardDescription>
              <CardAction>
                <Link
                  href="/sales/all"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all
                  <ChevronRight className="size-3.5" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date &amp; time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DASHBOARD_RECENT_SALES.map((sale) => (
                    <TableRow key={sale.customer + sale.date}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback>{initials(sale.customer)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium whitespace-nowrap">{sale.customer}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sale.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {sale.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sale.date}</TableCell>
                      <TableCell>
                        <StatusBadge label={sale.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

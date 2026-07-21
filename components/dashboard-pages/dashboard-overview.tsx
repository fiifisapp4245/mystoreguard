"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard, type StatTrend } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { CustomizeDashboard } from "@/components/dashboard-pages/customize-dashboard"
import { useDashboardWidgets, type DashboardWidgets } from "@/hooks/use-dashboard-widgets"

// Recharts crashes Next's server-side page-data collection if imported
// statically, even from a "use client" module — isolate it behind a real
// code-split boundary so it's only ever loaded in the browser.
const AnalyticsChart = dynamic(() => import("./analytics-chart"), {
  ssr: false,
})

type Range = "week" | "month" | "year"

interface RangeData {
  label: string
  stats: { key: keyof DashboardWidgets; label: string; value: string; trend: StatTrend }[]
  chart: { period: string; income: number; expenses: number }[]
}

const RANGE_DATA: Record<Range, RangeData> = {
  week: {
    label: "This week",
    stats: [
      {
        key: "revenue",
        label: "Revenue",
        value: "GHS 32,450",
        trend: { value: 14, direction: "up", tone: "positive" },
      },
      {
        key: "itemsSold",
        label: "Items sold",
        value: "612",
        trend: { value: 9, direction: "up", tone: "positive" },
      },
      {
        key: "expenses",
        label: "Expenses",
        value: "GHS 8,900",
        trend: { value: 5, direction: "up", tone: "negative" },
      },
      {
        key: "profit",
        label: "Gross profit",
        value: "GHS 23,550",
        trend: { value: 18, direction: "up", tone: "positive" },
      },
    ],
    chart: [
      { period: "Mon", income: 4200, expenses: 1100 },
      { period: "Tue", income: 3900, expenses: 1300 },
      { period: "Wed", income: 4800, expenses: 1050 },
      { period: "Thu", income: 4500, expenses: 1400 },
      { period: "Fri", income: 5200, expenses: 1200 },
      { period: "Sat", income: 6100, expenses: 1500 },
      { period: "Sun", income: 3750, expenses: 1350 },
    ],
  },
  month: {
    label: "This month",
    stats: [
      {
        key: "revenue",
        label: "Revenue",
        value: "GHS 138,200",
        trend: { value: 16, direction: "up", tone: "positive" },
      },
      {
        key: "itemsSold",
        label: "Items sold",
        value: "2,840",
        trend: { value: 11, direction: "up", tone: "positive" },
      },
      {
        key: "expenses",
        label: "Expenses",
        value: "GHS 41,300",
        trend: { value: 7, direction: "up", tone: "negative" },
      },
      {
        key: "profit",
        label: "Gross profit",
        value: "GHS 96,900",
        trend: { value: 20, direction: "up", tone: "positive" },
      },
    ],
    chart: [
      { period: "Week 1", income: 29500, expenses: 8800 },
      { period: "Week 2", income: 33200, expenses: 9600 },
      { period: "Week 3", income: 38400, expenses: 10200 },
      { period: "Week 4", income: 37100, expenses: 12700 },
    ],
  },
  year: {
    label: "This year",
    stats: [
      {
        key: "revenue",
        label: "Revenue",
        value: "GHS 1,542,000",
        trend: { value: 22, direction: "up", tone: "positive" },
      },
      {
        key: "itemsSold",
        label: "Items sold",
        value: "31,200",
        trend: { value: 15, direction: "up", tone: "positive" },
      },
      {
        key: "expenses",
        label: "Expenses",
        value: "GHS 468,000",
        trend: { value: 9, direction: "up", tone: "negative" },
      },
      {
        key: "profit",
        label: "Gross profit",
        value: "GHS 1,074,000",
        trend: { value: 26, direction: "up", tone: "positive" },
      },
    ],
    chart: [
      { period: "Jan", income: 98000, expenses: 32000 },
      { period: "Feb", income: 102000, expenses: 34000 },
      { period: "Mar", income: 118000, expenses: 36000 },
      { period: "Apr", income: 121000, expenses: 38000 },
      { period: "May", income: 134000, expenses: 39500 },
      { period: "Jun", income: 128000, expenses: 41000 },
      { period: "Jul", income: 142000, expenses: 40200 },
      { period: "Aug", income: 138000, expenses: 42500 },
      { period: "Sep", income: 130000, expenses: 39800 },
      { period: "Oct", income: 145000, expenses: 41200 },
      { period: "Nov", income: 152000, expenses: 43000 },
      { period: "Dec", income: 168000, expenses: 44500 },
    ],
  },
}

const RECENT_SALES = [
  {
    customer: "Kwame Mensah",
    initials: "KM",
    amount: "GHS 320.00",
    type: "Cash",
    date: "21 Jul, 10:24 am",
    status: "Completed",
  },
  {
    customer: "Ama Serwaa",
    initials: "AS",
    amount: "GHS 1,150.00",
    type: "Credit",
    date: "21 Jul, 09:52 am",
    status: "Pending",
  },
  {
    customer: "Kofi Boateng",
    initials: "KB",
    amount: "GHS 480.00",
    type: "Deposit",
    date: "20 Jul, 04:15 pm",
    status: "Completed",
  },
  {
    customer: "Efua Owusu",
    initials: "EO",
    amount: "GHS 96.00",
    type: "Cash",
    date: "20 Jul, 02:30 pm",
    status: "Completed",
  },
  {
    customer: "Yaw Asante",
    initials: "YA",
    amount: "GHS 640.00",
    type: "Credit",
    date: "19 Jul, 11:05 am",
    status: "On hold",
  },
]

export function DashboardOverviewPage({ module }: { module: ModulePageData }) {
  const [range, setRange] = useState<Range>("month")
  const data = useMemo(() => RANGE_DATA[range], [range])
  const { widgets, toggle } = useDashboardWidgets()
  const visibleStats = data.stats.filter((stat) => widgets[stat.key])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        action={
          <div className="flex items-center gap-2">
            <Select
              value={range}
              onValueChange={(value) => setRange(value as Range)}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <CustomizeDashboard widgets={widgets} onToggle={toggle} />
          </div>
        }
      />

      {visibleStats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStats.map((stat) => (
            <StatCard key={stat.key} label={stat.label} value={stat.value} trend={stat.trend} />
          ))}
        </div>
      )}

      {widgets.chart && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Income vs expenses</CardTitle>
            <CardDescription>{data.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.chart} />
          </CardContent>
        </Card>
      )}

      {widgets.recentSales && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Recent sales</CardTitle>
            <CardDescription>
              The latest transactions across the till.
            </CardDescription>
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
                {RECENT_SALES.map((sale) => (
                  <TableRow key={sale.customer + sale.date}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{sale.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium whitespace-nowrap">
                          {sale.customer}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {sale.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sale.date}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={sale.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {visibleStats.length === 0 && !widgets.chart && !widgets.recentSales && (
        <p className="text-sm text-muted-foreground">
          Nothing selected — use Customize above to bring widgets back.
        </p>
      )}
    </div>
  )
}

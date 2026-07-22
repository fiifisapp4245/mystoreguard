import { BarChart3, Package, Receipt, TrendingUp, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"
import { formatGHS, TOP_PRODUCTS_MONTH } from "@/lib/mock-data"

const REPORTS = [
  {
    icon: BarChart3,
    title: "Sales report",
    description: "Revenue, transactions, and sale types over any period.",
    highlight: "GHS 138,200",
    highlightLabel: "this month",
  },
  {
    icon: Package,
    title: "Inventory report",
    description: "Stock levels, low-stock items, and purchase order status.",
    highlight: "184",
    highlightLabel: "products tracked",
  },
  {
    icon: Receipt,
    title: "Expense report",
    description: "Every business cost, broken down by category.",
    highlight: "GHS 5,240",
    highlightLabel: "this month",
  },
  {
    icon: Users,
    title: "Customer report",
    description: "Who's buying, how often, and how much they spend.",
    highlight: "342",
    highlightLabel: "customers",
  },
  {
    icon: TrendingUp,
    title: "Sales performance",
    description: "Trends, best cashiers, and how selling is trending over time.",
    highlight: "+9%",
    highlightLabel: "vs last month",
  },
]

export function ReportsPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.title}>
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2">
                <report.icon className="size-4 text-primary" aria-hidden="true" />
                <CardTitle className="font-sans">{report.title}</CardTitle>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{report.highlight}</p>
              <p className="text-sm text-muted-foreground">{report.highlightLabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Top products</CardTitle>
          <CardDescription>Every product sold this month, ranked by revenue.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Units sold</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOP_PRODUCTS_MONTH.map((product, index) => (
                <TableRow key={product.name}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.units.toLocaleString()}</TableCell>
                  <TableCell>{formatGHS(product.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { BarChart3, Package, Receipt, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

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
]

export function ReportsPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
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
    </div>
  )
}

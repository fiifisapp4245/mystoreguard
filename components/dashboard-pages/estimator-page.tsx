import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Estimates this month",
    value: "14",
    trend: { value: 3, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Converted to sale",
    value: "9",
    trend: { value: 2, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Pending",
    value: "4",
    trend: { value: 1, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Conversion rate",
    value: "64%",
    trend: { value: 5, direction: "up" as const, tone: "positive" as const },
  },
]

const ESTIMATES = [
  { id: "EST-118", customer: "Kwame Mensah", amount: "GHS 2,400.00", status: "Accepted", date: "20 Jul 2026" },
  { id: "EST-117", customer: "Ama Serwaa", amount: "GHS 860.00", status: "Sent", date: "19 Jul 2026" },
  { id: "EST-116", customer: "Kofi Boateng", amount: "GHS 4,100.00", status: "Draft", date: "18 Jul 2026" },
  { id: "EST-115", customer: "Yaw Asante", amount: "GHS 1,250.00", status: "Expired", date: "5 Jul 2026" },
  { id: "EST-114", customer: "Efua Owusu", amount: "GHS 690.00", status: "Accepted", date: "2 Jul 2026" },
]

export function EstimatorPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} search="Search estimates..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Estimates</CardTitle>
          <CardDescription>Quotations given to customers before a sale is confirmed.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ESTIMATES.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">{estimate.id}</TableCell>
                  <TableCell>{estimate.customer}</TableCell>
                  <TableCell>{estimate.amount}</TableCell>
                  <TableCell>
                    <StatusBadge label={estimate.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{estimate.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

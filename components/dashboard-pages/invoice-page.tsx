import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Total invoiced",
    value: "GHS 10,320",
    trend: { value: 9, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Outstanding",
    value: "GHS 3,400",
    trend: { value: 4, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Paid this month",
    value: "GHS 5,580",
    trend: { value: 12, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Overdue",
    value: "1",
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
]

const INVOICES = [
  { id: "INV-2041", customer: "Kwame Mensah", amount: "GHS 1,240.00", status: "Sent", due: "28 Jul 2026" },
  { id: "INV-2040", customer: "Kofi Boateng", amount: "GHS 3,600.00", status: "Paid", due: "20 Jul 2026" },
  { id: "INV-2039", customer: "Ama Serwaa", amount: "GHS 860.00", status: "Partially paid", due: "25 Jul 2026" },
  { id: "INV-2038", customer: "Yaw Asante", amount: "GHS 2,100.00", status: "Overdue", due: "10 Jul 2026" },
  { id: "INV-2037", customer: "Efua Owusu", amount: "GHS 540.00", status: "Draft", due: "—" },
  { id: "INV-2036", customer: "Nana Yeboah", amount: "GHS 1,980.00", status: "Paid", due: "5 Jul 2026" },
]

export function InvoicePage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} search="Search invoices..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Invoices</CardTitle>
          <CardDescription>Every invoice raised, from draft through to paid.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <StatusBadge label={invoice.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

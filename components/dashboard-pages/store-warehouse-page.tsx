import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Stock value (all locations)",
    value: "GHS 84,600",
    trend: { value: 6, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Warehouse items",
    value: "1,240",
    trend: { value: 4, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Shop floor items",
    value: "612",
    trend: { value: 2, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Pending transfers",
    value: "3",
    trend: { value: 1, direction: "up" as const, tone: "negative" as const },
  },
]

const TRANSFERS = [
  { id: "TRF-512", from: "Warehouse", to: "Makola Shop", items: "Frytol Cooking Oil × 6 cartons", status: "Completed", date: "20 Jul 2026" },
  { id: "TRF-511", from: "Warehouse", to: "Makola Shop", items: "Milo 400g × 12 cartons", status: "In transit", date: "21 Jul 2026" },
  { id: "TRF-510", from: "Makola Shop", to: "Warehouse", items: "Ideal Milk 380g × 4 cartons (return)", status: "Pending", date: "21 Jul 2026" },
  { id: "TRF-509", from: "Warehouse", to: "Makola Shop", items: "Peak Milk Powder × 8 cartons", status: "Completed", date: "18 Jul 2026" },
]

const STOCKTAKES = [
  { location: "Makola Shop", date: "15 Jul 2026", discrepancies: 2, status: "Discrepancy found" },
  { location: "Warehouse", date: "8 Jul 2026", discrepancies: 0, status: "Reconciled" },
  { location: "Makola Shop", date: "1 Jul 2026", discrepancies: 0, status: "Reconciled" },
]

export function StoreWarehousePage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} search="Search transfers..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Transfers</CardTitle>
          <CardDescription>Stock moving between the warehouse and the shop floor.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRANSFERS.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.id}</TableCell>
                  <TableCell className="text-muted-foreground">{transfer.from}</TableCell>
                  <TableCell className="text-muted-foreground">{transfer.to}</TableCell>
                  <TableCell className="max-w-xs truncate">{transfer.items}</TableCell>
                  <TableCell>
                    <StatusBadge label={transfer.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{transfer.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Stocktaking</CardTitle>
          <CardDescription>Physical counts against system records, by location.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {STOCKTAKES.map((count) => (
            <div
              key={count.location + count.date}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{count.location}</p>
                <p className="text-sm text-muted-foreground">
                  {count.date} · {count.discrepancies === 0 ? "No discrepancies" : `${count.discrepancies} discrepancies`}
                </p>
              </div>
              <StatusBadge label={count.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

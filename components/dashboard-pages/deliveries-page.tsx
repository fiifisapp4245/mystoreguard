import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Scheduled today",
    value: "6",
    trend: { value: 2, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "In transit",
    value: "3",
    trend: { value: 1, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Delivered this week",
    value: "28",
    trend: { value: 10, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Failed",
    value: "1",
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
]

const DELIVERIES = [
  { id: "DEL-3312", customer: "Kwame Mensah", address: "Osu, Accra", driver: "Kwesi Ansah", status: "Delivered" },
  { id: "DEL-3311", customer: "Ama Serwaa", address: "East Legon, Accra", driver: "Kwesi Ansah", status: "In transit" },
  { id: "DEL-3310", customer: "Kofi Boateng", address: "Tema, Community 4", driver: "Yaw Darko", status: "Scheduled" },
  { id: "DEL-3309", customer: "Efua Owusu", address: "Madina, Accra", driver: "Yaw Darko", status: "Delivered" },
  { id: "DEL-3308", customer: "Yaw Asante", address: "Adenta, Accra", driver: "Kwesi Ansah", status: "Failed" },
]

export function DeliveriesPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} search="Search deliveries..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Deliveries</CardTitle>
          <CardDescription>Orders on their way to a customer, from dispatch to confirmed receipt.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DELIVERIES.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>{delivery.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{delivery.address}</TableCell>
                  <TableCell>{delivery.driver}</TableCell>
                  <TableCell>
                    <StatusBadge label={delivery.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

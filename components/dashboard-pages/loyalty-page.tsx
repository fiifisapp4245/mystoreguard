import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Points issued this month",
    value: "18,400",
    trend: { value: 12, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Active members",
    value: "298",
    trend: { value: 8, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Redemption rate",
    value: "34%",
    trend: { value: 3, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Gold tier members",
    value: "22",
    trend: { value: 4, direction: "up" as const, tone: "positive" as const },
  },
]

const TIER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

const CUSTOMERS = [
  { name: "Kwame Mensah", tier: "Gold", points: 2840, lifetimeSpend: "GHS 14,200.00" },
  { name: "Ama Serwaa", tier: "Silver", points: 1120, lifetimeSpend: "GHS 6,340.00" },
  { name: "Kofi Boateng", tier: "Gold", points: 3960, lifetimeSpend: "GHS 18,900.00" },
  { name: "Efua Owusu", tier: "Bronze", points: 340, lifetimeSpend: "GHS 1,780.00" },
  { name: "Yaw Asante", tier: "Silver", points: 980, lifetimeSpend: "GHS 5,120.00" },
]

const SEGMENTS = [
  { name: "Big spenders", criteria: "Lifetime spend above GHS 10,000", members: 34 },
  { name: "Lapsed customers", criteria: "No purchase in 60 days", members: 51 },
  { name: "New this month", criteria: "First purchase in the last 30 days", members: 19 },
]

export function LoyaltyPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} search="Search members..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Members</CardTitle>
          <CardDescription>Customers ranked by their loyalty tier and points balance.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Points balance</TableHead>
                <TableHead>Lifetime spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CUSTOMERS.map((customer) => (
                <TableRow key={customer.name}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <Badge variant={TIER_VARIANT[customer.tier]}>{customer.tier}</Badge>
                  </TableCell>
                  <TableCell>{customer.points.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.lifetimeSpend}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Segments</CardTitle>
          <CardDescription>Customer groups kept current automatically, without manual work.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {SEGMENTS.map((segment) => (
            <div
              key={segment.name}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{segment.name}</p>
                <p className="text-sm text-muted-foreground">{segment.criteria}</p>
              </div>
              <span className="text-sm font-medium">{segment.members} members</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

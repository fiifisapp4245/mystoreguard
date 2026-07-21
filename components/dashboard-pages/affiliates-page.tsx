import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Active affiliates",
    value: "6",
    trend: { value: 1, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Referrals this month",
    value: "23",
    trend: { value: 6, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Commission paid",
    value: "GHS 690",
    trend: { value: 9, direction: "up" as const, tone: "negative" as const },
  },
]

const AFFILIATES = [
  { name: "Adwoa Beauty Blog", referrals: 14, conversion: "38%", commission: "GHS 420.00", status: "Active" },
  { name: "Makola Traders Group", referrals: 9, conversion: "22%", commission: "GHS 270.00", status: "Active" },
  { name: "Osu Community Page", referrals: 3, conversion: "15%", commission: "GHS 60.00", status: "Active" },
  { name: "Tema Market Radio", referrals: 0, conversion: "—", commission: "GHS 0.00", status: "Inactive" },
]

export function AffiliatesPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={module.name} subtitle={module.description} search="Search affiliates..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Affiliates</CardTitle>
          <CardDescription>Referral partners bringing in new customers, and what they&apos;ve earned.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AFFILIATES.map((affiliate) => (
                <TableRow key={affiliate.name}>
                  <TableCell className="font-medium">{affiliate.name}</TableCell>
                  <TableCell>{affiliate.referrals}</TableCell>
                  <TableCell className="text-muted-foreground">{affiliate.conversion}</TableCell>
                  <TableCell>{affiliate.commission}</TableCell>
                  <TableCell>
                    <StatusBadge label={affiliate.status} />
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

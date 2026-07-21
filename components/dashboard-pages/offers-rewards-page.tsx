import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Active promo codes",
    value: "5",
    trend: { value: 1, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Gift cards sold",
    value: "GHS 2,400",
    trend: { value: 14, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Affiliate referrals",
    value: "23",
    trend: { value: 6, direction: "up" as const, tone: "positive" as const },
  },
]

const PROMO_CODES = [
  { code: "AUGUST10", discount: "10% off", uses: "42 / 100", expires: "31 Aug 2026", status: "Active" },
  { code: "WELCOME5", discount: "GHS 5 off", uses: "118 / —", expires: "No expiry", status: "Active" },
  { code: "EASTER25", discount: "25% off", uses: "80 / 80", expires: "20 Apr 2026", status: "Expired" },
]

const GIFT_CARDS = [
  { code: "GC-8841", balance: "GHS 100.00", issuedTo: "Ama Serwaa" },
  { code: "GC-8839", balance: "GHS 50.00", issuedTo: "Kofi Boateng" },
  { code: "GC-8830", balance: "GHS 0.00", issuedTo: "Yaw Asante" },
]

const AFFILIATES = [
  { name: "Adwoa Beauty Blog", referrals: 14, commission: "GHS 420.00" },
  { name: "Makola Traders Group", referrals: 9, commission: "GHS 270.00" },
]

export function OffersRewardsPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={module.name} subtitle={module.description} search="Search promo codes..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Promo codes</CardTitle>
          <CardDescription>Discount codes running for the store right now.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROMO_CODES.map((promo) => (
                <TableRow key={promo.code}>
                  <TableCell className="font-medium">{promo.code}</TableCell>
                  <TableCell>{promo.discount}</TableCell>
                  <TableCell className="text-muted-foreground">{promo.uses}</TableCell>
                  <TableCell className="text-muted-foreground">{promo.expires}</TableCell>
                  <TableCell>
                    <StatusBadge label={promo.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Gift cards</CardTitle>
            <CardDescription>Stored-value cards issued to customers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {GIFT_CARDS.map((card) => (
              <div key={card.code} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{card.code}</p>
                  <p className="text-sm text-muted-foreground">Issued to {card.issuedTo}</p>
                </div>
                <span className="text-sm font-medium">{card.balance}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Affiliates</CardTitle>
            <CardDescription>Referral partners bringing in new customers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {AFFILIATES.map((affiliate) => (
              <div key={affiliate.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{affiliate.name}</p>
                  <p className="text-sm text-muted-foreground">{affiliate.referrals} referrals</p>
                </div>
                <span className="text-sm font-medium">{affiliate.commission}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

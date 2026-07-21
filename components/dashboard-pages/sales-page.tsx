import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Today's sales",
    value: "GHS 4,850",
    trend: { value: 12, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Transactions",
    value: "76",
    trend: { value: 8, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Credit outstanding",
    value: "GHS 2,340",
    trend: { value: 4, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Returns today",
    value: "3",
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
]

const SALES = [
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
  {
    customer: "Abena Darko",
    initials: "AD",
    amount: "GHS 210.00",
    type: "Cash",
    date: "19 Jul, 09:40 am",
    status: "Completed",
  },
  {
    customer: "Kwabena Owusu",
    initials: "KO",
    amount: "GHS 75.00",
    type: "Cash",
    date: "18 Jul, 05:20 pm",
    status: "Completed",
  },
  {
    customer: "Adjoa Boateng",
    initials: "AB",
    amount: "GHS 890.00",
    type: "Deposit",
    date: "18 Jul, 01:10 pm",
    status: "Pending",
  },
]

const RETURNS = [
  {
    customer: "Yaw Asante",
    item: "Milo 400g × 2",
    reason: "Wrong item",
    amount: "GHS 68.00",
  },
  {
    customer: "Ama Serwaa",
    item: "Frytol Cooking Oil 3L",
    reason: "Damaged seal",
    amount: "GHS 62.00",
  },
  {
    customer: "Efua Owusu",
    item: "Indomie Chicken Noodles × 5",
    reason: "Changed mind",
    amount: "GHS 16.00",
  },
]

export function SalesPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search sales..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">All sales</CardTitle>
          <CardDescription>
            Daily, credit, deposit, and on-hold sales in one place.
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
              {SALES.map((sale) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Store returns</CardTitle>
          <CardDescription>
            Goods brought back today, handled under the store&apos;s return
            policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {RETURNS.map((item) => (
            <div
              key={item.customer + item.item}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.customer}</p>
                <p className="text-sm text-muted-foreground">
                  {item.item} · {item.reason}
                </p>
              </div>
              <span className="text-sm">{item.amount}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

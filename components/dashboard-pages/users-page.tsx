import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    label: "Customers",
    value: "342",
    trend: { value: 7, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Suppliers",
    value: "18",
    trend: { value: 2, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Staff accounts",
    value: "6",
    trend: { value: 0, direction: "up" as const, tone: "positive" as const },
  },
]

const CUSTOMERS = [
  {
    name: "Kwame Mensah",
    initials: "KM",
    phone: "024 123 4567",
    spend: "GHS 4,820.00",
    lastPurchase: "21 Jul 2026",
    status: "Active",
  },
  {
    name: "Ama Serwaa",
    initials: "AS",
    phone: "020 987 6543",
    spend: "GHS 2,150.00",
    lastPurchase: "21 Jul 2026",
    status: "Active",
  },
  {
    name: "Kofi Boateng",
    initials: "KB",
    phone: "055 456 7890",
    spend: "GHS 6,340.00",
    lastPurchase: "20 Jul 2026",
    status: "Active",
  },
  {
    name: "Efua Owusu",
    initials: "EO",
    phone: "027 234 5678",
    spend: "GHS 980.00",
    lastPurchase: "20 Jul 2026",
    status: "Active",
  },
  {
    name: "Yaw Asante",
    initials: "YA",
    phone: "050 345 6789",
    spend: "GHS 1,760.00",
    lastPurchase: "19 Jul 2026",
    status: "Active",
  },
  {
    name: "Nana Yeboah",
    initials: "NY",
    phone: "024 555 1212",
    spend: "GHS 310.00",
    lastPurchase: "2 Jun 2026",
    status: "Inactive",
  },
]

const SUPPLIERS = [
  {
    name: "Kasapreko Distributors",
    contact: "Mr. Owusu · 030 222 1111",
    supplies: "Beverages, cooking oil",
  },
  {
    name: "Unilever Ghana",
    contact: "Ms. Addo · 030 333 2222",
    supplies: "Margarine, soap",
  },
  {
    name: "Nestlé Ghana",
    contact: "Mr. Tetteh · 030 444 3333",
    supplies: "Milo, Peak Milk",
  },
]

const STAFF = [
  { name: "Adjoa Boateng", role: "Cashier", status: "Active" },
  { name: "Kwabena Owusu", role: "Store Manager", status: "Active" },
  { name: "Abena Darko", role: "Cashier", status: "Active" },
]

export function UsersPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search customers..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Customers</CardTitle>
          <CardDescription>
            Everyone who buys from the store, and their history with it.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total spend</TableHead>
                <TableHead>Last purchase</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CUSTOMERS.map((customer) => (
                <TableRow key={customer.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{customer.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium whitespace-nowrap">
                        {customer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone}
                  </TableCell>
                  <TableCell>{customer.spend}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.lastPurchase}
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={customer.status} />
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
            <CardTitle className="font-sans">Suppliers</CardTitle>
            <CardDescription>Who the store buys stock from.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {SUPPLIERS.map((supplier) => (
              <div key={supplier.name} className="rounded-lg border p-3">
                <p className="font-medium">{supplier.name}</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.contact}
                </p>
                <p className="text-sm text-muted-foreground">
                  {supplier.supplies}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Staff accounts</CardTitle>
            <CardDescription>
              A seat for every staff member, tied to what they do in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {STAFF.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <StatusBadge label={member.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

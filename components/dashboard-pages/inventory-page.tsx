import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
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
    label: "Total products",
    value: "184",
    trend: { value: 6, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Low stock items",
    value: "9",
    trend: { value: 3, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Purchase orders pending",
    value: "4",
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
  {
    label: "Stock value",
    value: "GHS 62,400",
    trend: { value: 8, direction: "up" as const, tone: "positive" as const },
  },
]

const PRODUCTS = [
  {
    name: "Ideal Milk 380g",
    unit: "Carton of 24",
    stock: 132,
    price: "GHS 8.50",
    status: "In stock",
  },
  {
    name: "Frytol Cooking Oil 3L",
    unit: "Carton of 6",
    stock: 6,
    price: "GHS 62.00",
    status: "Low stock",
  },
  {
    name: "Indomie Chicken Noodles",
    unit: "Carton of 40",
    stock: 210,
    price: "GHS 3.20",
    status: "In stock",
  },
  {
    name: "Milo 400g",
    unit: "Carton of 12",
    stock: 0,
    price: "GHS 34.00",
    status: "Out of stock",
  },
  {
    name: "Peak Milk Powder 400g",
    unit: "Carton of 24",
    stock: 88,
    price: "GHS 32.50",
    status: "In stock",
  },
  {
    name: "Golden Stork Margarine",
    unit: "Carton of 24",
    stock: 14,
    price: "GHS 11.00",
    status: "Low stock",
  },
]

const PURCHASE_ORDERS = [
  {
    id: "PO-1042",
    supplier: "Kasapreko Distributors",
    items: "Frytol Cooking Oil, Milo 400g",
    status: "Ordered",
  },
  {
    id: "PO-1041",
    supplier: "Unilever Ghana",
    items: "Golden Stork Margarine",
    status: "Draft",
  },
  {
    id: "PO-1039",
    supplier: "Nestlé Ghana",
    items: "Peak Milk Powder, Milo 400g",
    status: "Received",
  },
]

export function InventoryPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search products..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Products</CardTitle>
          <CardDescription>
            Every item the store sells, and what&apos;s on the shelf right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock on hand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map((product) => (
                <TableRow key={product.name}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.unit}
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <StatusBadge label={product.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Purchase orders</CardTitle>
          <CardDescription>
            What&apos;s been requested from suppliers, and what&apos;s arrived.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {PURCHASE_ORDERS.map((po) => (
            <div
              key={po.id}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {po.id}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {po.supplier}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{po.items}</p>
              </div>
              <StatusBadge label={po.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

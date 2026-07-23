"use client"

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
import { formatGHS } from "@/lib/mock-data"
import { availableStock, getProductsStore, type Product } from "@/lib/pos-data"

function stockStatus(product: Product): string {
  const available = availableStock(product)
  if (available <= 0) return "Out of stock"
  if (available <= 20) return "Low stock"
  return "In stock"
}

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
  const products = getProductsStore()
  const lowStock = products.filter((p) => {
    const available = availableStock(p)
    return available > 0 && available <= 20
  }).length
  const outOfStock = products.filter((p) => availableStock(p) <= 0).length
  const stockValue = products.reduce((sum, p) => sum + p.onHand * p.price, 0)

  const stats = [
    { label: "Total products", value: String(products.length) },
    { label: "Low stock items", value: String(lowStock) },
    { label: "Out of stock", value: String(outOfStock) },
    { label: "Stock value (on hand)", value: formatGHS(stockValue) },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search products..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Products</CardTitle>
          <CardDescription>
            Every item the store sells, and what&apos;s available to sell right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{availableStock(product)}</span>
                      {product.setAside > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {product.onHand} on hand · {product.setAside} set aside for delivery
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatGHS(product.price)}</TableCell>
                  <TableCell>
                    <StatusBadge label={stockStatus(product)} />
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

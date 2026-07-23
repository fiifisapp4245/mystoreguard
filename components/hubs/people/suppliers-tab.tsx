"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { AddSupplierDialog } from "@/components/hubs/people/add-supplier-dialog"
import { SupplierDetailSheet } from "@/components/hubs/people/supplier-detail-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LARRY_SUPPLIERS } from "@/lib/larry-data"
import { SUPPLIERS, type Supplier } from "@/lib/mock-data"
import { useDemoState } from "@/hooks/use-demo-state"

function CategoryBadges({ categories }: { categories: string[] }) {
  const shown = categories.slice(0, 2)
  const overflow = categories.length - shown.length

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((category) => (
        <Badge key={category} variant="outline" className="font-normal">
          {category}
        </Badge>
      ))}
      {overflow > 0 && (
        <Badge variant="outline" className="font-normal">
          +{overflow}
        </Badge>
      )}
    </div>
  )
}

export function SuppliersTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => (isLarry ? LARRY_SUPPLIERS : SUPPLIERS))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setSuppliers(isLarry ? LARRY_SUPPLIERS : SUPPLIERS)
  }

  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Supplier | null>(null)

  const stats = useMemo(
    () => [
      { label: "Suppliers", value: String(suppliers.length) },
      { label: "Open purchase orders", value: String(suppliers.reduce((sum, s) => sum + s.openPurchaseOrders, 0)) },
    ],
    [suppliers]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return suppliers
    return suppliers.filter(
      (supplier) =>
        supplier.businessName.toLowerCase().includes(query) ||
        supplier.contactPerson.toLowerCase().includes(query)
    )
  }, [suppliers, search])

  function handleAdd(supplier: Supplier) {
    setSuppliers((prev) => [supplier, ...prev])
    setAddOpen(false)
    toast.success("Supplier added", { description: `${supplier.businessName} has been added.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-8 sm:w-64"
          />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add supplier
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Payment terms</TableHead>
              <TableHead>Last order</TableHead>
              <TableHead>Open POs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((supplier) => (
              <TableRow
                key={supplier.id}
                className="cursor-pointer"
                onClick={() => setSelected(supplier)}
              >
                <TableCell>
                  <p className="font-medium whitespace-nowrap">{supplier.businessName}</p>
                  <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                <TableCell>
                  <CategoryBadges categories={supplier.categories} />
                </TableCell>
                <TableCell className="text-muted-foreground">{supplier.paymentTerms}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.lastOrder}</TableCell>
                <TableCell>{supplier.openPurchaseOrders}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No suppliers match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddSupplierDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <SupplierDetailSheet supplier={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

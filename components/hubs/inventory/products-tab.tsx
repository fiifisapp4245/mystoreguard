"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus, Search, Tags, Upload } from "lucide-react"
import { toast } from "sonner"

import { PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CategoriesBrandsUnitsDialog } from "@/components/hubs/inventory/categories-brands-units-dialog"
import { ImportProductsDialog } from "@/components/hubs/inventory/import-products-dialog"
import { ProductDialog, type ProductFormValues } from "@/components/hubs/inventory/product-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatGHS, getVisibleLocations, LOCATIONS, SUPPLIERS, type Supplier } from "@/lib/mock-data"
import { LARRY_LOCATIONS, LARRY_SUPPLIERS, getLarryProductsStore, setLarryProductsStore } from "@/lib/larry-data"
import {
  availableAt,
  getProductsStore,
  setProductsStore,
  stockAt,
  totalAvailable,
  totalOnHand,
  totalSetAside,
  type Product,
} from "@/lib/pos-data"
import { getMovementsStore, getLarryMovementsStore, movementProductLabel, type Movement } from "@/lib/stock-movements-data"
import { isMultiLocationTier } from "@/lib/modules"
import type { StandardPeriod } from "@/lib/period-utils"
import { useDemoState } from "@/hooks/use-demo-state"
import { canSeeCostPrices } from "@/lib/permissions-data"
import { markSetupItemDone } from "@/lib/setup-checklist-data"

type StatusFilter = "All" | "In stock" | "Low stock" | "Out of stock"

function productStatus(product: Product): "In stock" | "Low stock" | "Out of stock" {
  const available = totalAvailable(product)
  if (available <= 0) return "Out of stock"
  if (available <= product.reorderPoint) return "Low stock"
  return "In stock"
}

function unitStructureLabel(product: Product): string {
  if (product.pack.soldByMeasure) return `Sold by ${product.pack.baseUnit}`
  if (product.pack.purchaseUnit && product.pack.unitsPerPurchaseUnit) {
    return `${product.pack.purchaseUnit} of ${product.pack.unitsPerPurchaseUnit} · sold by ${product.pack.baseUnit}`
  }
  return product.pack.baseUnit
}

export function ProductsTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const isMultiLocation = isMultiLocationTier(state.tier)
  const showCostPrices = canSeeCostPrices(state.role)

  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const suppliers: Supplier[] = isLarry ? LARRY_SUPPLIERS : SUPPLIERS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)

  const [products, setProducts] = useState<Product[]>(() => (isLarry ? getLarryProductsStore() : getProductsStore()))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setProducts(isLarry ? getLarryProductsStore() : getProductsStore())
  }

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [locationFilter, setLocationFilter] = useState("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)

  function persist(next: Product[]) {
    setProducts(next)
    if (isLarry) setLarryProductsStore(next)
    else setProductsStore(next)
  }

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      if (!product.isActive) return false
      const matchesSearch = !query || product.name.toLowerCase().includes(query)
      const matchesCategory = categoryFilter === "All" || product.category === categoryFilter
      const matchesStatus = statusFilter === "All" || productStatus(product) === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive)
    const lowStock = active.filter((p) => productStatus(p) === "Low stock").length
    const outOfStock = active.filter((p) => productStatus(p) === "Out of stock").length
    const stockValue = active.reduce((sum, p) => sum + totalOnHand(p) * p.costPrice, 0)
    return [
      { label: "Total products", value: String(active.length) },
      { label: "Low stock items", value: String(lowStock) },
      { label: "Out of stock", value: String(outOfStock) },
      { label: "Stock value", caption: "all locations", value: formatGHS(stockValue) },
    ]
  }, [products])

  function handleAdd() {
    setEditingProduct(undefined)
    setDialogOpen(true)
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  function handleSave(values: ProductFormValues) {
    const pack = values.soldByMeasure
      ? { soldByMeasure: true as const, baseUnit: values.baseUnit || "Unit" }
      : {
          soldByMeasure: false as const,
          baseUnit: values.baseUnit || "Unit",
          purchaseUnit: values.purchaseUnit || "Pack",
          unitsPerPurchaseUnit: Number.parseInt(values.unitsPerPurchaseUnit, 10) || 1,
        }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        barcode: values.barcode.trim() || undefined,
        category: values.category.trim() || "Uncategorised",
        pack,
        sellingPrice: Number.parseFloat(values.sellingPrice) || 0,
        taxTreatment: values.taxTreatment,
        reorderPoint: Number.parseInt(values.reorderPoint, 10) || 0,
        preferredSupplierId: values.preferredSupplierId || undefined,
        isService: values.isService,
      }
      persist(products.map((p) => (p.id === updated.id ? updated : p)))
      toast.success("Product updated", { description: updated.name })
    } else {
      const newProduct: Product = {
        id: `${isLarry ? "larry-p" : "p"}-new-${Date.now()}`,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        barcode: values.barcode.trim() || undefined,
        category: values.category.trim() || "Uncategorised",
        isService: values.isService,
        isActive: true,
        pack,
        costPrice: 0,
        sellingPrice: Number.parseFloat(values.sellingPrice) || 0,
        reorderPoint: Number.parseInt(values.reorderPoint, 10) || 0,
        preferredSupplierId: values.preferredSupplierId || undefined,
        taxTreatment: values.taxTreatment,
        locationStock: locations.map((loc) => ({ locationId: loc.id, onHand: 0, setAside: 0, sealedPurchaseUnits: 0 })),
      }
      persist([newProduct, ...products])
      markSetupItemDone("products")
      toast.success("Product added", { description: newProduct.name })
    }
    setDialogOpen(false)
  }

  function handleDeactivate(product: Product) {
    persist(products.map((p) => (p.id === product.id ? { ...p, isActive: false } : p)))
    toast.success("Product deactivated", { description: `${product.name} is hidden from the register but kept in reports.` })
  }

  function handlePrintLabels(product: Product) {
    toast.success("Barcode labels queued", { description: `${product.name} — visual only in this prototype.` })
  }

  const movements: Movement[] = isLarry ? getLarryMovementsStore() : getMovementsStore()
  const historyMovements = historyProduct
    ? movements.filter((m) => (m.type === "Transfer" ? m.lines.some((l) => l.productId === historyProduct.id) : m.productId === historyProduct.id))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} caption="as of now" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="In stock">In stock</SelectItem>
              <SelectItem value="Low stock">Low stock</SelectItem>
              <SelectItem value="Out of stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          {isMultiLocation ? (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {visibleLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">{visibleLocations[0]?.name}</span>
          )}
          <PeriodSelect value={period} onValueChange={setPeriod} className="ml-auto" />
          <Button variant="outline" onClick={() => setCategoriesDialogOpen(true)}>
            <Tags />
            Categories, brands &amp; units
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload />
            Import products
          </Button>
          <Button onClick={handleAdd}>
            <Plus />
            Add product
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit structure</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Set aside</TableHead>
              <TableHead>Available</TableHead>
              {showCostPrices && <TableHead>Cost</TableHead>}
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const scoped = locationFilter !== "all" ? stockAt(product, locationFilter) : undefined
              const onHand = scoped ? scoped.onHand + scoped.sealedPurchaseUnits * (product.pack.unitsPerPurchaseUnit ?? 0) : totalOnHand(product)
              const setAside = scoped ? scoped.setAside : totalSetAside(product)
              const available = locationFilter !== "all" ? availableAt(product, locationFilter) : totalAvailable(product)

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-muted-foreground">{unitStructureLabel(product)}</TableCell>
                  <TableCell>{onHand}</TableCell>
                  <TableCell>{setAside > 0 ? setAside : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="font-medium">{available}</TableCell>
                  {showCostPrices && (
                    <TableCell className="text-muted-foreground">{formatGHS(product.costPrice)}</TableCell>
                  )}
                  <TableCell>{formatGHS(product.sellingPrice)}</TableCell>
                  <TableCell>
                    <StatusBadge label={productStatus(product)} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintLabels(product)}>Print barcode labels</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setHistoryProduct(product)}>View movement history</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => handleDeactivate(product)}>
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={showCostPrices ? 10 : 9} className="py-8 text-center text-muted-foreground">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        suppliers={suppliers}
        categories={categories}
        onSave={handleSave}
      />

      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} />

      <CategoriesBrandsUnitsDialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen} />

      <Sheet open={historyProduct !== null} onOpenChange={(open) => !open && setHistoryProduct(null)}>
        <SheetContent className="sm:max-w-md">
          {historyProduct && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{historyProduct.name}</SheetTitle>
                <SheetDescription>Movement history</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {historyMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{m.type}</p>
                      <p className="text-xs text-muted-foreground">{movementProductLabel(m)}</p>
                    </div>
                    <span className={cn("text-xs text-muted-foreground")}>
                      {m.type === "Transfer" ? m.status : m.type === "Split" ? `${m.dateISO}` : m.dateISO}
                    </span>
                  </div>
                ))}
                {historyMovements.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No movements recorded yet.</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

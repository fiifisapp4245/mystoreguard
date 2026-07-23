"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { AdjustStockDialog } from "@/components/hubs/stock/adjust-stock-dialog"
import { CreateTransferDialog } from "@/components/hubs/stock/create-transfer-dialog"
import { SplitStockDialog } from "@/components/hubs/stock/split-stock-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { formatGHS, getVisibleLocations, LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS, getLarryProductsStore } from "@/lib/larry-data"
import {
  availableAt,
  getProductsStore,
  stockAt,
  totalAvailable,
  totalOnHand,
  totalSetAside,
  type Product,
} from "@/lib/pos-data"
import { getMovementsStore, getLarryMovementsStore, movementProductLabel, type Movement } from "@/lib/stock-movements-data"
import { isMultiLocationTier } from "@/lib/modules"
import { useDemoState } from "@/hooks/use-demo-state"

export function StockLevelsTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const isMultiLocation = isMultiLocationTier(state.tier)
  const userName = "Adjoa Boateng"

  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const shopLocations = visibleLocations.filter((l) => l.type === "shop")
  const warehouseLocations = locations.filter((l) => l.type === "warehouse")

  const [products, setProducts] = useState<Product[]>(() => (isLarry ? getLarryProductsStore() : getProductsStore()))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setProducts(isLarry ? getLarryProductsStore() : getProductsStore())
  }

  const [locationFilter, setLocationFilter] = useState("all")
  const [onlyLowOrOut, setOnlyLowOrOut] = useState(false)

  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)
  const [splitTarget, setSplitTarget] = useState<Product | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null)
  const [breakdownTarget, setBreakdownTarget] = useState<Product | null>(null)

  function refresh() {
    setProducts([...(isLarry ? getLarryProductsStore() : getProductsStore())])
  }

  const movements: Movement[] = isLarry ? getLarryMovementsStore() : getMovementsStore()

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive)
    const stockValue = active.reduce((sum, p) => sum + totalOnHand(p) * p.costPrice, 0)
    const onShopFloor = active.reduce(
      (sum, p) => sum + shopLocations.reduce((locSum, loc) => locSum + stockAt(p, loc.id).onHand, 0),
      0
    )
    const inWarehouse = isMultiLocation
      ? active.reduce((sum, p) => sum + warehouseLocations.reduce((locSum, loc) => locSum + stockAt(p, loc.id).onHand, 0), 0)
      : 0
    const pendingTransfers = movements.filter((m) => m.type === "Transfer" && m.status === "In transit").length
    return [
      { label: "Stock value", caption: "all locations", value: formatGHS(stockValue) },
      { label: "Items on shop floor", caption: shopLocations.length > 1 ? `${shopLocations.length} shops` : undefined, value: String(onShopFloor) },
      { label: "Items in warehouse", caption: warehouseLocations.length > 1 ? `${warehouseLocations.length} warehouses` : undefined, value: String(inWarehouse) },
      { label: "Pending transfers", caption: "as of now", value: String(pendingTransfers) },
    ]
  }, [products, movements, shopLocations, warehouseLocations, isMultiLocation])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false
      if (onlyLowOrOut && totalAvailable(p) > p.reorderPoint) return false
      return true
    })
  }, [products, onlyLowOrOut])

  const historyMovements = historyTarget
    ? movements.filter((m) => (m.type === "Transfer" ? m.lines.some((l) => l.productId === historyTarget.id) : m.productId === historyTarget.id))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isMultiLocation ? (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {shopLocations.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Shops</SelectLabel>
                  {shopLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {warehouseLocations.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Warehouses</SelectLabel>
                  {warehouseLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">{visibleLocations[0]?.name}</span>
        )}
        <Select value={onlyLowOrOut ? "low" : "all"} onValueChange={(v) => setOnlyLowOrOut(v === "low")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock levels</SelectItem>
            <SelectItem value="low">Low / out of stock only</SelectItem>
          </SelectContent>
        </Select>
        {isMultiLocation && (
          <Button variant="outline" className="ml-auto" onClick={() => setTransferOpen(true)}>
            New transfer
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Set aside</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const scoped = locationFilter !== "all" ? stockAt(product, locationFilter) : undefined
              const onHand = scoped
                ? scoped.onHand + scoped.sealedPurchaseUnits * (product.pack.unitsPerPurchaseUnit ?? 0)
                : totalOnHand(product)
              const setAside = scoped ? scoped.setAside : totalSetAside(product)
              const available = locationFilter !== "all" ? availableAt(product, locationFilter) : totalAvailable(product)

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {onHand}
                    {scoped && scoped.sealedPurchaseUnits > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">({scoped.sealedPurchaseUnits} sealed)</span>
                    )}
                  </TableCell>
                  <TableCell>{setAside > 0 ? setAside : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="font-medium">{available}</TableCell>
                  <TableCell className="text-muted-foreground">{formatGHS(onHand * product.costPrice)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAdjustTarget(product)}>Adjust stock</DropdownMenuItem>
                        {isMultiLocation && <DropdownMenuItem onClick={() => setTransferOpen(true)}>Transfer</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setSplitTarget(product)}>Split</DropdownMenuItem>
                        {isMultiLocation && <DropdownMenuItem onClick={() => setBreakdownTarget(product)}>View by location</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setHistoryTarget(product)}>View movement history</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No products match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdjustStockDialog
        product={adjustTarget}
        locations={locations}
        isMultiLocation={isMultiLocation}
        isLarry={isLarry}
        userName={userName}
        onOpenChange={(open) => !open && setAdjustTarget(null)}
        onAdjusted={() => {
          refresh()
          setAdjustTarget(null)
        }}
      />

      <SplitStockDialog
        product={splitTarget}
        locations={locations}
        isMultiLocation={isMultiLocation}
        isLarry={isLarry}
        userName={userName}
        onOpenChange={(open) => !open && setSplitTarget(null)}
        onSplit={() => {
          refresh()
          setSplitTarget(null)
        }}
      />

      <CreateTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        locations={visibleLocations}
        products={products}
        isLarry={isLarry}
        userName={userName}
        onCreated={refresh}
      />

      <Sheet open={historyTarget !== null} onOpenChange={(open) => !open && setHistoryTarget(null)}>
        <SheetContent className="sm:max-w-md">
          {historyTarget && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{historyTarget.name}</SheetTitle>
                <SheetDescription>Movement history</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {historyMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{m.type}</p>
                      <p className="text-xs text-muted-foreground">{movementProductLabel(m)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{m.type === "Transfer" ? m.status : m.dateISO}</span>
                  </div>
                ))}
                {historyMovements.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No movements recorded yet.</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={breakdownTarget !== null} onOpenChange={(open) => !open && setBreakdownTarget(null)}>
        <SheetContent className="sm:max-w-sm">
          {breakdownTarget && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{breakdownTarget.name}</SheetTitle>
                <SheetDescription>Stock by location</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {locations.map((loc) => {
                  const s = stockAt(breakdownTarget, loc.id)
                  const physical = s.onHand + s.sealedPurchaseUnits * (breakdownTarget.pack.unitsPerPurchaseUnit ?? 0)
                  return (
                    <div key={loc.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                      <div>
                        <p className="font-medium">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">{loc.type === "shop" ? "Shop" : "Warehouse"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {physical}
                          {s.sealedPurchaseUnits > 0 && <span className="ml-1 text-xs text-muted-foreground">({s.sealedPurchaseUnits} sealed)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">Available {availableAt(breakdownTarget, loc.id)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

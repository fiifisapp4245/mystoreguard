"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ConceptTooltip } from "@/components/help/concept-tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Location } from "@/lib/mock-data"
import { getVisibleLocations } from "@/lib/mock-data"
import type { Product } from "@/lib/pos-data"
import { startStocktake, type StocktakeScope } from "@/lib/stocktakes-data"

export function StartCountDialog({
  open,
  onOpenChange,
  locations,
  products,
  isMultiLocation,
  isLarry,
  userName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  products: Product[]
  isMultiLocation: boolean
  isLarry: boolean
  userName: string
}) {
  const router = useRouter()
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const stockedProducts = useMemo(() => products.filter((p) => p.isActive && !p.isService), [products])
  const categories = useMemo(() => Array.from(new Set(stockedProducts.map((p) => p.category))).sort(), [stockedProducts])

  const [locationId, setLocationId] = useState(visibleLocations[0]?.id ?? "")
  const [scope, setScope] = useState<StocktakeScope>("Full location")
  const [category, setCategory] = useState(categories[0] ?? "")
  const [shelfLabel, setShelfLabel] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [blindCount, setBlindCount] = useState(true)

  function resetForm() {
    setLocationId(visibleLocations[0]?.id ?? "")
    setScope("Full location")
    setCategory(categories[0] ?? "")
    setShelfLabel("")
    setSelectedIds([])
    setBlindCount(true)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const productIds =
    scope === "Full location"
      ? stockedProducts.map((p) => p.id)
      : scope === "By category"
        ? stockedProducts.filter((p) => p.category === category).map((p) => p.id)
        : selectedIds

  function handleStart() {
    if (!locationId || productIds.length === 0) return
    const stocktake = startStocktake(isLarry, {
      locationId,
      scope,
      scopeDetail: scope === "By category" ? category : scope === "By shelf" ? shelfLabel.trim() || undefined : undefined,
      productIds,
      blindCount,
      startedBy: userName,
    })
    handleOpenChange(false)
    router.push(`/stocktake/${stocktake.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a count</DialogTitle>
          <DialogDescription>Counting happens while trading — sales and receipts during the count are reconciled automatically.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          {isMultiLocation ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count-location">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-full" id="count-location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">{visibleLocations[0]?.name}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="count-scope">Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as StocktakeScope)}>
              <SelectTrigger className="w-full" id="count-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full location">Full location</SelectItem>
                <SelectItem value="By category">By category</SelectItem>
                <SelectItem value="By shelf">By shelf or aisle</SelectItem>
                <SelectItem value="Selected products">Selected products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "By category" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full" id="count-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "By shelf" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count-shelf">Shelf or aisle label</Label>
              <Input id="count-shelf" value={shelfLabel} onChange={(e) => setShelfLabel(e.target.value)} placeholder="e.g. Aisle 3" />
            </div>
          )}

          {(scope === "By shelf" || scope === "Selected products") && (
            <div className="flex flex-col gap-1.5">
              <Label>Products ({selectedIds.length} selected)</Label>
              <div className="flex max-h-48 flex-col divide-y overflow-y-auto rounded-lg border">
                {stockedProducts.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      className="size-4"
                    />
                    <span className="flex-1">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="flex items-center gap-1 text-sm font-medium">
                Blind count <ConceptTooltip conceptKey="blind-count" />
              </p>
              <p className="text-xs text-muted-foreground">Hides the system quantity while counting, so the counter records what&apos;s actually there instead of confirming the screen.</p>
            </div>
            <Switch checked={blindCount} onCheckedChange={setBlindCount} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!locationId || productIds.length === 0}>
            Start count
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

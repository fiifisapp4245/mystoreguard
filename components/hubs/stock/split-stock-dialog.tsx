"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
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
import { getVisibleLocations, type Location } from "@/lib/mock-data"
import { purchaseUnitsAt, type Product } from "@/lib/pos-data"
import { splitStock } from "@/lib/stock-movements-data"
import { toast } from "sonner"

export function SplitStockDialog({
  product,
  locations,
  isMultiLocation,
  isLarry,
  userName,
  onOpenChange,
  onSplit,
}: {
  product: Product | null
  locations: Location[]
  isMultiLocation: boolean
  isLarry: boolean
  userName: string
  onOpenChange: (open: boolean) => void
  onSplit: () => void
}) {
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const [locationId, setLocationId] = useState("")
  const [units, setUnits] = useState("1")
  const [prevProductId, setPrevProductId] = useState<string | null>(null)

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id)
    setLocationId(visibleLocations[0]?.id ?? "")
    setUnits("1")
  }

  const sealed = product && locationId ? purchaseUnitsAt(product, locationId) : 0
  const unitsToSplit = Math.min(Number.parseInt(units, 10) || 0, sealed)
  const baseUnitsCreated = product ? unitsToSplit * (product.pack.unitsPerPurchaseUnit ?? 0) : 0

  function handleLocationChange(next: string) {
    setLocationId(next)
  }

  function handleSave() {
    if (!product || !locationId || unitsToSplit <= 0) return
    const movement = splitStock(isLarry, locationId, product.id, unitsToSplit, userName)
    if (!movement) {
      toast.error("Nothing sealed to split at this location.")
      return
    }
    toast.success("Stock split", { description: `${movement.purchaseUnitsSplit} × ${product.pack.purchaseUnit} → ${movement.baseUnitsCreated} × ${product.pack.baseUnit}` })
    onSplit()
  }

  if (product && product.pack.soldByMeasure) {
    return (
      <Dialog open={product !== null} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Split stock</DialogTitle>
            <DialogDescription>{product.name} is sold by measure — there&apos;s no pack to split.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Split stock</DialogTitle>
          <DialogDescription>{product?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isMultiLocation && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="split-location">Location</Label>
              <Select value={locationId} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full" id="split-location">
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
          )}

          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Sealed {product?.pack.purchaseUnit} on hand</span>
            <span className="font-medium">{sealed}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="split-units">Number of {product?.pack.purchaseUnit} to break</Label>
            <Input id="split-units" type="number" min="1" max={sealed} value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-center text-sm font-medium">
            {unitsToSplit} {product?.pack.purchaseUnit} → {baseUnitsCreated} {product?.pack.baseUnit}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={unitsToSplit <= 0}>
            Split stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

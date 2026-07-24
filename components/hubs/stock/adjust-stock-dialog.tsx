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
import { Textarea } from "@/components/ui/textarea"
import { getVisibleLocations, type Location } from "@/lib/mock-data"
import { ADJUSTMENT_REASONS, adjustStock } from "@/lib/stock-movements-data"
import { stockAt, type Product } from "@/lib/pos-data"

export function AdjustStockDialog({
  product,
  locations,
  isMultiLocation,
  isLarry,
  userName,
  onOpenChange,
  onAdjusted,
}: {
  product: Product | null
  locations: Location[]
  isMultiLocation: boolean
  isLarry: boolean
  userName: string
  onOpenChange: (open: boolean) => void
  onAdjusted: () => void
}) {
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const [locationId, setLocationId] = useState("")
  const [newQty, setNewQty] = useState("")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [prevProductId, setPrevProductId] = useState<string | null>(null)

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id)
    const defaultLocation = visibleLocations[0]?.id ?? ""
    setLocationId(defaultLocation)
    setNewQty(String(stockAt(product, defaultLocation).onHand))
    setReason("")
    setNote("")
  }

  const currentQty = product && locationId ? stockAt(product, locationId).onHand : 0
  const delta = (Number.parseFloat(newQty) || 0) - currentQty
  const missingFields = [!locationId && "a location", !reason && "a reason"].filter(Boolean) as string[]

  function handleLocationChange(next: string) {
    setLocationId(next)
    if (product) setNewQty(String(stockAt(product, next).onHand))
  }

  function handleSave() {
    if (!product || !locationId || !reason) return
    adjustStock(isLarry, locationId, product.id, Number.parseFloat(newQty) || 0, reason, note.trim() || undefined, userName)
    onAdjusted()
  }

  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{product?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isMultiLocation && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adjust-location">Location</Label>
              <Select value={locationId} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full" id="adjust-location">
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
            <span className="text-muted-foreground">Current quantity</span>
            <span className="font-medium">{currentQty}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-new-qty">New quantity</Label>
            <Input id="adjust-new-qty" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            {delta !== 0 && (
              <p className="text-xs text-muted-foreground">
                {delta > 0 ? "+" : ""}
                {delta} from current
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full" id="adjust-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">An adjustment without a reason is indistinguishable from theft.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-note">Note (optional)</Label>
            <Textarea id="adjust-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex flex-col items-end gap-1">
            {missingFields.length > 0 && (
              <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
            )}
            <Button onClick={handleSave} disabled={!reason || !locationId}>
              Save adjustment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

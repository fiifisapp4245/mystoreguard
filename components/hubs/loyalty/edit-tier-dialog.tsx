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
import { Switch } from "@/components/ui/switch"
import { formatGHS } from "@/lib/mock-data"
import type { LoyaltyTierDefinition } from "@/lib/loyalty-data"

export function EditTierDialog({
  tier,
  onOpenChange,
  onSave,
}: {
  tier: LoyaltyTierDefinition | null
  onOpenChange: (open: boolean) => void
  onSave: (patch: Partial<LoyaltyTierDefinition>) => void
}) {
  const [threshold, setThreshold] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [prevTierId, setPrevTierId] = useState<string | null>(null)

  if (tier && tier.id !== prevTierId) {
    setPrevTierId(tier.id)
    setThreshold(tier.lifetimeSpendThreshold)
    setDiscount(tier.discountPercent)
    setMultiplier(tier.pointsMultiplier)
    setFreeDelivery(tier.freeDelivery)
  }

  function handleSave() {
    onSave({ lifetimeSpendThreshold: threshold, discountPercent: discount, pointsMultiplier: multiplier, freeDelivery })
    onOpenChange(false)
  }

  return (
    <Dialog open={tier !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {tier?.name}</DialogTitle>
          <DialogDescription>Only this tier&apos;s settings change — the others stay as they are.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-threshold">Lifetime spend threshold (GHS)</Label>
            <Input
              id="tier-threshold"
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Number.parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier-discount">Discount %</Label>
              <Input
                id="tier-discount"
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier-multiplier">Points multiplier</Label>
              <Input
                id="tier-multiplier"
                type="number"
                min={0}
                step={0.25}
                value={multiplier}
                onChange={(e) => setMultiplier(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Free delivery</p>
              <p className="text-xs text-muted-foreground">Waived delivery fee for members at this tier.</p>
            </div>
            <Switch checked={freeDelivery} onCheckedChange={setFreeDelivery} />
          </div>

          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            A {tier?.name} member spending over {formatGHS(threshold)} gets {discount}% off and earns {multiplier}× points
            {freeDelivery ? ", plus free delivery." : "."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save tier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

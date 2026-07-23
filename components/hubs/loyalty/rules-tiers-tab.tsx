"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import {
  getProgrammeSettings,
  setProgrammeSettings,
  type LoyaltyProgrammeSettings,
  type LoyaltyTierDefinition,
  type RoundingRule,
} from "@/lib/loyalty-data"

const ROUNDING_LABELS: Record<RoundingRule, string> = {
  "round-down": "Round down",
  "round-nearest": "Round to nearest",
  "round-up": "Round up",
}

const BADGE_COLOR_CLASS: Record<LoyaltyTierDefinition["badgeColor"], string> = {
  slate: "bg-slate-400",
  zinc: "bg-zinc-400",
  amber: "bg-amber-500",
}

function applyRounding(value: number, rule: RoundingRule): number {
  if (rule === "round-up") return Math.ceil(value)
  if (rule === "round-nearest") return Math.round(value)
  return Math.floor(value)
}

export function RulesTiersTab() {
  const [form, setForm] = useState<LoyaltyProgrammeSettings>(() => getProgrammeSettings())

  function updateField<K extends keyof LoyaltyProgrammeSettings>(key: K, value: LoyaltyProgrammeSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateTier(index: number, patch: Partial<LoyaltyTierDefinition>) {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }))
  }

  function handleSave() {
    setProgrammeSettings(form)
    toast.success("Programme settings saved")
  }

  const exampleEarnedPoints = applyRounding(100 / (form.ghsPerPoint || 1), form.roundingRule)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Earning</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ghs-per-point">GHS spent per point</Label>
              <Input
                id="ghs-per-point"
                type="number"
                min={0.01}
                step={0.5}
                value={form.ghsPerPoint}
                onChange={(e) => updateField("ghsPerPoint", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rounding-rule">Rounding rule</Label>
              <Select value={form.roundingRule} onValueChange={(v) => updateField("roundingRule", v as RoundingRule)}>
                <SelectTrigger className="w-full" id="rounding-rule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROUNDING_LABELS) as RoundingRule[]).map((rule) => (
                    <SelectItem key={rule} value={rule}>
                      {ROUNDING_LABELS[rule]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Credit sales earn points</p>
              <p className="text-xs text-muted-foreground">Points accrue even when the sale is on credit.</p>
            </div>
            <Switch checked={form.creditSalesEarn} onCheckedChange={(v) => updateField("creditSalesEarn", v)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Discounted items earn points</p>
              <p className="text-xs text-muted-foreground">Points accrue on the discounted price, not the original.</p>
            </div>
            <Switch checked={form.discountedItemsEarn} onCheckedChange={(v) => updateField("discountedItemsEarn", v)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="points-expiry">Points expiry (months)</Label>
            <Input
              id="points-expiry"
              type="number"
              min={0}
              value={form.pointsExpiryMonths}
              onChange={(e) => updateField("pointsExpiryMonths", Number.parseInt(e.target.value, 10) || 0)}
              className="max-w-40"
            />
            <p className="text-xs text-muted-foreground">{form.pointsExpiryMonths === 0 ? "Never expires." : `Points expire ${form.pointsExpiryMonths} months after they're earned.`}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            A GHS 100 purchase earns {exampleEarnedPoints} points.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Redemption</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="point-value">Value of one point (GHS)</Label>
              <Input
                id="point-value"
                type="number"
                min={0}
                step={0.01}
                value={form.pointValueGHS}
                onChange={(e) => updateField("pointValueGHS", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="min-points">Minimum points to redeem</Label>
              <Input
                id="min-points"
                type="number"
                min={0}
                value={form.minPointsToRedeem}
                onChange={(e) => updateField("minPointsToRedeem", Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="max-redemption-percent">Max % of transaction payable by points</Label>
              <Input
                id="max-redemption-percent"
                type="number"
                min={0}
                max={100}
                value={form.maxRedemptionPercent}
                onChange={(e) => updateField("maxRedemptionPercent", Math.min(100, Math.max(0, Number.parseInt(e.target.value, 10) || 0)))}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            100 points is worth {formatGHS(100 * form.pointValueGHS)}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Tiers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {form.tiers.map((tier, index) => (
            <div key={tier.id} className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className={cn("size-3 rounded-full", BADGE_COLOR_CLASS[tier.badgeColor])} />
                <span className="font-medium">{tier.name}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${tier.id}-threshold`}>Lifetime spend threshold (GHS)</Label>
                  <Input
                    id={`${tier.id}-threshold`}
                    type="number"
                    min={0}
                    value={tier.lifetimeSpendThreshold}
                    onChange={(e) => updateTier(index, { lifetimeSpendThreshold: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${tier.id}-discount`}>Discount %</Label>
                  <Input
                    id={`${tier.id}-discount`}
                    type="number"
                    min={0}
                    max={100}
                    value={tier.discountPercent}
                    onChange={(e) => updateTier(index, { discountPercent: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${tier.id}-multiplier`}>Points multiplier</Label>
                  <Input
                    id={`${tier.id}-multiplier`}
                    type="number"
                    min={0}
                    step={0.25}
                    value={tier.pointsMultiplier}
                    onChange={(e) => updateTier(index, { pointsMultiplier: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <span className="text-sm">Free delivery</span>
                  <Switch checked={tier.freeDelivery} onCheckedChange={(v) => updateTier(index, { freeDelivery: v })} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  )
}

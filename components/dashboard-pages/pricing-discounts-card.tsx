"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react"

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
import {
  DEFAULT_PRICING_SETTINGS,
  PRICE_FLOOR_BEHAVIOR_LABELS,
  PRICE_FLOOR_MODE_LABELS,
  PRIORITY_ITEM_LABELS,
  PRIORITY_ITEM_NOTES,
  STACKING_RULE_LABELS,
  priceFloorFor,
  type PriceFloorBehavior,
  type PriceFloorMode,
  type PricingSettings,
} from "@/lib/pricing-engine-data"

export function PricingDiscountsCard() {
  const [settings, setSettings] = useState<PricingSettings>(() => ({
    priorityOrder: [...DEFAULT_PRICING_SETTINGS.priorityOrder],
    stacking: { ...DEFAULT_PRICING_SETTINGS.stacking },
    priceFloor: { ...DEFAULT_PRICING_SETTINGS.priceFloor },
    managerOverride: { ...DEFAULT_PRICING_SETTINGS.managerOverride },
  }))

  function moveItem(index: number, direction: -1 | 1) {
    setSettings((prev) => {
      const next = [...prev.priorityOrder]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, priorityOrder: next }
    })
  }

  function toggleStacking(key: keyof PricingSettings["stacking"]) {
    setSettings((prev) => ({ ...prev, stacking: { ...prev.stacking, [key]: !prev.stacking[key] } }))
  }

  const floorExample = priceFloorFor(75, undefined, settings)

  return (
    <>
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="font-sans text-base">Pricing & discounts</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Discounts are decided by these rules, not by the cashier — cashier scans, rules decide the price.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Priority order</Label>
            <p className="text-xs text-muted-foreground">The sequence discounts apply in, top to bottom.</p>
            <div className="flex flex-col divide-y rounded-lg border">
              {settings.priorityOrder.map((item, index) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{PRIORITY_ITEM_LABELS[item]}</p>
                    <p className="text-xs text-muted-foreground">{PRIORITY_ITEM_NOTES[item]}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                      aria-label={`Move ${PRIORITY_ITEM_LABELS[item]} up`}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={index === settings.priorityOrder.length - 1}
                      onClick={() => moveItem(index, 1)}
                      aria-label={`Move ${PRIORITY_ITEM_LABELS[item]} down`}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Price → discounts in priority order → tax → points redeemed against the remaining balance.
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t pt-4">
            <Label className="text-sm font-medium">Stacking rules</Label>
            <div className="flex flex-col gap-3">
              {(Object.keys(STACKING_RULE_LABELS) as (keyof PricingSettings["stacking"])[]).map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`stack-${key}`} className="text-sm font-normal">
                    {STACKING_RULE_LABELS[key]}
                  </Label>
                  <Switch id={`stack-${key}`} checked={settings.stacking[key]} onCheckedChange={() => toggleStacking(key)} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.stacking.favorCustomerOnConflict
                ? "Conflicting discounts: whichever benefits the customer most is applied."
                : "Conflicting discounts: applied strictly by priority order above, the rest rejected."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader className="gap-2">
          <CardTitle className="font-sans text-base">Price floor — margin protection</CardTitle>
          <p className="text-sm text-muted-foreground">The point past which discounts stop, whatever combination applied.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="floor-mode">Mode</Label>
              <Select
                value={settings.priceFloor.mode}
                onValueChange={(v) => setSettings((prev) => ({ ...prev, priceFloor: { ...prev.priceFloor, mode: v as PriceFloorMode } }))}
              >
                <SelectTrigger className="w-full" id="floor-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICE_FLOOR_MODE_LABELS) as PriceFloorMode[]).map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {PRICE_FLOOR_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="floor-behavior">When a discount would breach the floor</Label>
              <Select
                value={settings.priceFloor.behavior}
                onValueChange={(v) => setSettings((prev) => ({ ...prev, priceFloor: { ...prev.priceFloor, behavior: v as PriceFloorBehavior } }))}
              >
                <SelectTrigger className="w-full" id="floor-behavior">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICE_FLOOR_BEHAVIOR_LABELS) as PriceFloorBehavior[]).map((b) => (
                    <SelectItem key={b} value={b}>
                      {PRICE_FLOOR_BEHAVIOR_LABELS[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {settings.priceFloor.mode === "min-margin-percent" && (
            <div className="flex flex-col gap-1.5 sm:w-56">
              <Label htmlFor="floor-margin">Minimum margin %</Label>
              <Input
                id="floor-margin"
                type="number"
                value={settings.priceFloor.minMarginPercent}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, priceFloor: { ...prev.priceFloor, minMarginPercent: Number(e.target.value) || 0 } }))
                }
              />
            </div>
          )}
          {settings.priceFloor.mode === "cost-plus-markup" && (
            <div className="flex flex-col gap-1.5 sm:w-56">
              <Label htmlFor="floor-markup">Fixed markup (GHS)</Label>
              <Input
                id="floor-markup"
                type="number"
                value={settings.priceFloor.fixedMarkup}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, priceFloor: { ...prev.priceFloor, fixedMarkup: Number(e.target.value) || 0 } }))
                }
              />
            </div>
          )}
          {settings.priceFloor.mode === "min-selling-price" && (
            <p className="text-xs text-muted-foreground">Set per product on the product record — no organisation-wide number to configure here.</p>
          )}

          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            {settings.priceFloor.mode === "min-margin-percent" &&
              `Cost GHS 75, minimum margin ${settings.priceFloor.minMarginPercent}% → floor GHS ${floorExample.toFixed(2)}. Discounts stop at GHS ${floorExample.toFixed(2)}.`}
            {settings.priceFloor.mode === "cost-plus-markup" &&
              `Cost GHS 75 + GHS ${settings.priceFloor.fixedMarkup} markup → floor GHS ${floorExample.toFixed(2)}. Discounts stop at GHS ${floorExample.toFixed(2)}.`}
            {settings.priceFloor.mode === "min-selling-price" &&
              "Each product carries its own floor price — discounts on that product stop there, however they combine."}
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader className="gap-2">
          <CardTitle className="font-sans text-base">Manager override</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 sm:w-72">
            <Label htmlFor="cashier-max">Maximum discount a Cashier may apply without approval</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cashier-max"
                type="number"
                className="w-24"
                value={settings.managerOverride.cashierMaxDiscountPercent}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    managerOverride: { ...prev.managerOverride, cashierMaxDiscountPercent: Number(e.target.value) || 0 },
                  }))
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Always requires approval</p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              <li>Selling below the price floor</li>
              <li>Exceeding the cashier discount limit above</li>
              <li>A manual price override</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Every override is captured as an approving user, a reason and note, and a timestamp — and appears in the audit log. That trail is the point.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

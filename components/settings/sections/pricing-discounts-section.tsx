"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { toast } from "sonner"

import { ConceptTooltip } from "@/components/help/concept-tooltip"
import { HelpPanelTrigger } from "@/components/help/help-panel-trigger"
import { EffectiveDateDialog } from "@/components/settings/effective-date-dialog"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { VersionHistoryList, type VersionRowData } from "@/components/settings/version-history-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  DEFAULT_PRICING_SETTINGS,
  PRICE_FLOOR_BEHAVIOR_LABELS,
  PRICE_FLOOR_MODE_LABELS,
  PRIORITY_ITEM_LABELS,
  PRIORITY_ITEM_NOTES,
  STACKING_RULE_LABELS,
  addCashierLimitVersion,
  addPriceFloorVersion,
  cancelScheduledCashierLimit,
  cancelScheduledPriceFloor,
  cashierLimitVersionAsOf,
  getCashierLimitVersions,
  getPriceFloorVersions,
  getPricingSettings,
  priceFloorVersionAsOf,
  scheduledCashierLimitVersion,
  scheduledPriceFloorVersion,
  setPricingSettings,
  type PriceFloorBehavior,
  type PriceFloorMode,
  type PriceFloorSettings,
  type PricingSettings,
} from "@/lib/pricing-engine-data"

function floorValueLabel(settings: PriceFloorSettings): string {
  if (settings.mode === "min-margin-percent") return `Min margin ${settings.minMarginPercent}%`
  if (settings.mode === "cost-plus-markup") return `Cost + GHS ${settings.fixedMarkup}`
  return "Per-product minimum selling price"
}

/**
 * Mixed classes: priority order + stacking rules are Class C (no
 * retroactive-history concern). Price floor and the cashier discount limit
 * are Class B — each keeps its own version history with an effective date,
 * because changing them retroactively would make past sales look like
 * policy violations.
 */
export function PricingDiscountsSection() {
  const [settings, setSettings] = useState<PricingSettings>(() => getPricingSettings())
  const [floorVersions, setFloorVersions] = useState(() => getPriceFloorVersions())
  const [cashierVersions, setCashierVersions] = useState(() => getCashierLimitVersions())

  const [floorDialogOpen, setFloorDialogOpen] = useState(false)
  const [floorForm, setFloorForm] = useState<PriceFloorSettings>(() => ({ ...DEFAULT_PRICING_SETTINGS.priceFloor }))

  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [cashierPercent, setCashierPercent] = useState<number>(DEFAULT_PRICING_SETTINGS.managerOverride.cashierMaxDiscountPercent)

  function refresh() {
    setSettings(getPricingSettings())
  }

  function refreshFloor() {
    setFloorVersions([...getPriceFloorVersions()])
    refresh()
  }

  function refreshCashier() {
    setCashierVersions([...getCashierLimitVersions()])
    refresh()
  }

  function moveItem(index: number, direction: -1 | 1) {
    const next = [...settings.priorityOrder]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setPricingSettings({ ...settings, priorityOrder: next })
    refresh()
  }

  function toggleStacking(key: keyof PricingSettings["stacking"]) {
    setPricingSettings({ ...settings, stacking: { ...settings.stacking, [key]: !settings.stacking[key] } })
    refresh()
  }

  const floorCurrent = priceFloorVersionAsOf()
  const floorScheduled = scheduledPriceFloorVersion()
  const floorRows: VersionRowData[] = floorVersions
    .slice()
    .sort((a, b) => a.effectiveFromISO.localeCompare(b.effectiveFromISO))
    .map((v) => ({
      id: v.id,
      valueLabel: floorValueLabel(v.settings),
      fromISO: v.effectiveFromISO,
      toISO: v.effectiveToISO,
      status: floorScheduled?.id === v.id ? "scheduled" : floorCurrent?.id === v.id ? "current" : "past",
    }))

  function openFloorDialog() {
    setFloorForm({ ...(floorCurrent?.settings ?? DEFAULT_PRICING_SETTINGS.priceFloor) })
    setFloorDialogOpen(true)
  }

  function handleFloorSubmit(effectiveFromISO: string) {
    addPriceFloorVersion(floorForm, effectiveFromISO)
    refreshFloor()
    setFloorDialogOpen(false)
    toast.success("New price floor scheduled")
  }

  const cashierCurrent = cashierLimitVersionAsOf()
  const cashierScheduled = scheduledCashierLimitVersion()
  const cashierRows: VersionRowData[] = cashierVersions
    .slice()
    .sort((a, b) => a.effectiveFromISO.localeCompare(b.effectiveFromISO))
    .map((v) => ({
      id: v.id,
      valueLabel: `${v.percent}%`,
      fromISO: v.effectiveFromISO,
      toISO: v.effectiveToISO,
      status: cashierScheduled?.id === v.id ? "scheduled" : cashierCurrent?.id === v.id ? "current" : "past",
    }))

  function openCashierDialog() {
    setCashierPercent(cashierCurrent?.percent ?? DEFAULT_PRICING_SETTINGS.managerOverride.cashierMaxDiscountPercent)
    setCashierDialogOpen(true)
  }

  function handleCashierSubmit(effectiveFromISO: string) {
    addCashierLimitVersion(cashierPercent, effectiveFromISO)
    refreshCashier()
    setCashierDialogOpen(false)
    toast.success("New cashier discount limit scheduled")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <HelpPanelTrigger screenKey="pricing-settings" />
      </div>

      <SettingsSectionCard
        title="Pricing & discounts"
        settingClass="C"
        description="Discounts are decided by these rules, not by the cashier — cashier scans, rules decide the price."
      >
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
      </SettingsSectionCard>

      <SettingsSectionCard title="Price floor — margin protection" settingClass="B">
        <p className="flex items-center gap-1 text-sm font-medium">
          Price floor <ConceptTooltip conceptKey="price-floor" />
        </p>
        <p className="text-sm text-muted-foreground">
          Changes apply from the date you choose. Existing documents keep the rate that applied when they were created.
        </p>
        <VersionHistoryList rows={floorRows} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={openFloorDialog}>
            Add new floor
          </Button>
          {floorScheduled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelScheduledPriceFloor()
                refreshFloor()
                toast.success("Scheduled floor cancelled")
              }}
            >
              Cancel scheduled
            </Button>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Manager override" settingClass="B">
        <VersionHistoryList rows={cashierRows} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={openCashierDialog}>
            Add new limit
          </Button>
          {cashierScheduled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelScheduledCashierLimit()
                refreshCashier()
                toast.success("Scheduled limit cancelled")
              }}
            >
              Cancel scheduled
            </Button>
          )}
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
          Every override is captured as an approving user, a reason and note, and a timestamp — and appears in the audit log.
        </p>
      </SettingsSectionCard>

      <EffectiveDateDialog
        open={floorDialogOpen}
        onOpenChange={setFloorDialogOpen}
        title="New price floor"
        description="Schedule a new price floor to take effect from a future date."
        canSubmit
        onSubmit={handleFloorSubmit}
        submitLabel="Add new floor"
      >
        {() => (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="floor-mode">Mode</Label>
              <Select value={floorForm.mode} onValueChange={(v) => setFloorForm((prev) => ({ ...prev, mode: v as PriceFloorMode }))}>
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

            {floorForm.mode === "min-margin-percent" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="floor-margin">Minimum margin %</Label>
                <Input
                  id="floor-margin"
                  type="number"
                  value={floorForm.minMarginPercent}
                  onChange={(e) => setFloorForm((prev) => ({ ...prev, minMarginPercent: Number(e.target.value) || 0 }))}
                />
              </div>
            )}
            {floorForm.mode === "cost-plus-markup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="floor-markup">Fixed markup (GHS)</Label>
                <Input
                  id="floor-markup"
                  type="number"
                  value={floorForm.fixedMarkup}
                  onChange={(e) => setFloorForm((prev) => ({ ...prev, fixedMarkup: Number(e.target.value) || 0 }))}
                />
              </div>
            )}
            {floorForm.mode === "min-selling-price" && (
              <p className="text-xs text-muted-foreground">
                Set per product on the product record — no organisation-wide number to configure here.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="floor-behavior">When a discount would breach the floor</Label>
              <Select value={floorForm.behavior} onValueChange={(v) => setFloorForm((prev) => ({ ...prev, behavior: v as PriceFloorBehavior }))}>
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
        )}
      </EffectiveDateDialog>

      <EffectiveDateDialog
        open={cashierDialogOpen}
        onOpenChange={setCashierDialogOpen}
        title="New manager override limit"
        description="Schedule a new cashier discount limit to take effect from a future date."
        canSubmit
        onSubmit={handleCashierSubmit}
        submitLabel="Add new limit"
      >
        {() => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cashier-max">Maximum discount %</Label>
            <Input
              id="cashier-max"
              type="number"
              value={cashierPercent}
              onChange={(e) => setCashierPercent(Number(e.target.value) || 0)}
            />
          </div>
        )}
      </EffectiveDateDialog>
    </div>
  )
}

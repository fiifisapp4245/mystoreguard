"use client"

import { useState } from "react"
import { Check, Pencil } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditTierDialog } from "@/components/hubs/loyalty/edit-tier-dialog"
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
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null)

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
  const editingTier = editingTierIndex !== null ? form.tiers[editingTierIndex] : null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Open a section to change it — nothing is saved until you click <span className="font-medium">Save changes</span> below.
      </p>

      <Accordion type="single" collapsible defaultValue="earning" className="flex flex-col gap-3">
        <AccordionItem value="earning" className="rounded-xl border px-4">
          <AccordionTrigger>
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="font-medium">Earning</span>
              <span className="text-xs font-normal text-muted-foreground">
                GHS {form.ghsPerPoint} per point · {ROUNDING_LABELS[form.roundingRule].toLowerCase()}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 pt-1 pb-2">
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
                <p className="text-xs text-muted-foreground">
                  {form.pointsExpiryMonths === 0 ? "Never expires." : `Points expire ${form.pointsExpiryMonths} months after they're earned.`}
                </p>
              </div>

              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                A GHS 100 purchase earns {exampleEarnedPoints} points.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="redemption" className="rounded-xl border px-4">
          <AccordionTrigger>
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="font-medium">Redemption</span>
              <span className="text-xs font-normal text-muted-foreground">
                1 point = {formatGHS(form.pointValueGHS)} · min {form.minPointsToRedeem} pts · up to {form.maxRedemptionPercent}% of a sale
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 pt-1 pb-2">
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

              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                100 points is worth {formatGHS(100 * form.pointValueGHS)}.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tiers" className="rounded-xl border px-4">
          <AccordionTrigger>
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="font-medium">Tiers</span>
              <span className="text-xs font-normal text-muted-foreground">
                {form.tiers.map((t) => t.name).join(" · ")}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 pt-1 pb-2">
              <p className="text-xs text-muted-foreground">Click a row&apos;s Edit button to change just that tier — the others are untouched.</p>
              {form.tiers.length === 0 ? (
                <TeachingEmptyState message="Tiers give customers better discounts and perks as their lifetime spend grows — Bronze, Silver, Gold, or whatever names fit your store." />
              ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Spend threshold</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Points multiplier</TableHead>
                      <TableHead>Free delivery</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.tiers.map((tier, index) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <span className={cn("size-2.5 shrink-0 rounded-full", BADGE_COLOR_CLASS[tier.badgeColor])} />
                            {tier.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatGHS(tier.lifetimeSpendThreshold)}+</TableCell>
                        <TableCell className="text-muted-foreground">{tier.discountPercent > 0 ? `${tier.discountPercent}%` : "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{tier.pointsMultiplier}×</TableCell>
                        <TableCell>
                          {tier.freeDelivery ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <Check className="size-3.5" /> Included
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingTierIndex(index)} aria-label={`Edit ${tier.name}`}>
                            <Pencil className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save changes</Button>
      </div>

      <EditTierDialog
        tier={editingTier}
        onOpenChange={(open) => !open && setEditingTierIndex(null)}
        onSave={(patch) => {
          if (editingTierIndex !== null) updateTier(editingTierIndex, patch)
        }}
      />
    </div>
  )
}

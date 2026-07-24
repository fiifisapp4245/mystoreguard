"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EffectiveDateDialog } from "@/components/settings/effective-date-dialog"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { VersionHistoryList, type VersionRowData } from "@/components/settings/version-history-list"
import { markSetupItemDone } from "@/lib/setup-checklist-data"
import {
  addTaxRateVersion,
  cancelScheduledVersion,
  getTaxDefaults,
  getTaxRatesStore,
  scheduledVersion,
  setTaxDefaults,
  toggleTaxRateEnabled,
  versionAsOf,
  type VersionedTaxRate,
} from "@/lib/tax-data"

/**
 * Class B for the four rates (VAT, NHIL, GETFund, COVID levy) — each keeps a
 * version history and edits go through an effective-date dialog rather than
 * overwriting. The two store-wide defaults below are plain Class C toggles.
 */
export function TaxSection() {
  const [rates, setRates] = useState<VersionedTaxRate[]>(() => getTaxRatesStore())
  const [defaults, setDefaults] = useState(() => getTaxDefaults())
  const [addDialogFor, setAddDialogFor] = useState<string | null>(null)
  const [newRatePercent, setNewRatePercent] = useState("")

  function refresh() {
    setRates([...getTaxRatesStore()])
  }

  useEffect(() => {
    // Confirming/reviewing the Ghana tax defaults is itself the setup-checklist action.
    markSetupItemDone("tax-rates")
  }, [])

  const editingRate = rates.find((r) => r.id === addDialogFor) ?? null

  function handleAddVersion(effectiveFromISO: string) {
    if (!editingRate) return
    const value = Number(newRatePercent)
    if (Number.isNaN(value)) return
    addTaxRateVersion(editingRate.id, value, effectiveFromISO)
    refresh()
    setAddDialogFor(null)
    setNewRatePercent("")
    toast.success(`New ${editingRate.label} rate scheduled`)
  }

  function handleDefaultsChange(next: typeof defaults) {
    setDefaults(next)
    setTaxDefaults(next)
    toast.success("Tax defaults saved")
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Changes apply from the date you choose. Existing documents keep the rate that applied when they were created.
      </p>

      {rates.map((rate) => {
        const rows: VersionRowData[] = rate.versions
          .slice()
          .sort((a, b) => a.effectiveFromISO.localeCompare(b.effectiveFromISO))
          .map((v) => ({
            id: v.id,
            valueLabel: `${v.ratePercent}%`,
            fromISO: v.effectiveFromISO,
            toISO: v.effectiveToISO,
            status: scheduledVersion(rate)?.id === v.id ? "scheduled" : versionAsOf(rate)?.id === v.id ? "current" : "past",
          }))
        const scheduled = scheduledVersion(rate)

        return (
          <SettingsSectionCard key={rate.id} title={rate.label} settingClass="B">
            <VersionHistoryList rows={rows} />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={rate.enabled}
                  onCheckedChange={() => {
                    toggleTaxRateEnabled(rate.id)
                    refresh()
                  }}
                />
                <Label>Enabled</Label>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddDialogFor(rate.id)}>
                Add new rate
              </Button>
              {scheduled && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    cancelScheduledVersion(rate.id)
                    refresh()
                    toast.success("Scheduled rate cancelled")
                  }}
                >
                  Cancel scheduled
                </Button>
              )}
            </div>
          </SettingsSectionCard>
        )
      })}

      <SettingsSectionCard title="Tax defaults" settingClass="C">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="tax-mode">Prices are tax exclusive</Label>
          <Switch
            id="tax-mode"
            checked={defaults.mode === "exclusive"}
            onCheckedChange={(checked) => handleDefaultsChange({ ...defaults, mode: checked ? "exclusive" : "inclusive" })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="tax-delivery">Tax applies to delivery charges</Label>
          <Switch
            id="tax-delivery"
            checked={defaults.taxAppliesToDelivery}
            onCheckedChange={(checked) => handleDefaultsChange({ ...defaults, taxAppliesToDelivery: checked })}
          />
        </div>
      </SettingsSectionCard>

      <EffectiveDateDialog
        open={addDialogFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogFor(null)
            setNewRatePercent("")
          }
        }}
        title={editingRate ? `New rate for ${editingRate.label}` : "New rate"}
        description="Schedule a new rate to take effect from a future date."
        canSubmit={newRatePercent.trim() !== "" && !Number.isNaN(Number(newRatePercent))}
        onSubmit={handleAddVersion}
        submitLabel="Add new rate"
      >
        {() => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-rate-percent">Rate %</Label>
            <Input
              id="new-rate-percent"
              type="number"
              step="0.1"
              value={newRatePercent}
              onChange={(e) => setNewRatePercent(e.target.value)}
            />
          </div>
        )}
      </EffectiveDateDialog>
    </div>
  )
}

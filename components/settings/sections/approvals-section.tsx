"use client"

import { useState } from "react"
import { toast } from "sonner"

import { EffectiveDateDialog } from "@/components/settings/effective-date-dialog"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { VersionHistoryList, type VersionRowData } from "@/components/settings/version-history-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  addApprovalsVersion,
  cancelScheduledApprovals,
  getApprovalsVersions,
  scheduledApprovalsVersion,
  versionAsOf,
  type ApprovalsSnapshot,
  type ApprovalsVersion,
} from "@/lib/approvals-data"
import { getExpenseApprovalThreshold } from "@/lib/expenses-data"
import { formatGHS } from "@/lib/mock-data"
import { getPricingSettings } from "@/lib/pricing-engine-data"

interface ApprovalsFormState {
  overrideRequirementsNote: string
  stockAdjustmentThreshold: string
  voidRefundThreshold: string
}

const EMPTY_FORM: ApprovalsFormState = {
  overrideRequirementsNote: "",
  stockAdjustmentThreshold: "",
  voidRefundThreshold: "",
}

/**
 * Class B — consolidates approval thresholds that used to be scattered.
 * The expense threshold and cashier discount limit already have their own
 * versioned homes (Money → Expenses, Settings → Pricing & discounts) and are
 * shown here read-only for reference only — this section doesn't duplicate
 * their storage or edit controls.
 */
export function ApprovalsSection() {
  const [versions, setVersions] = useState<ApprovalsVersion[]>(() => getApprovalsVersions())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<ApprovalsFormState>(EMPTY_FORM)

  function refresh() {
    setVersions([...getApprovalsVersions()])
  }

  const scheduled = scheduledApprovalsVersion()
  const current = versionAsOf()

  const rows: VersionRowData[] = versions
    .slice()
    .sort((a, b) => a.effectiveFromISO.localeCompare(b.effectiveFromISO))
    .map((v) => ({
      id: v.id,
      valueLabel: `Stock adj. ${formatGHS(v.snapshot.stockAdjustmentThreshold)} · Void/refund ${formatGHS(v.snapshot.voidRefundThreshold)}`,
      fromISO: v.effectiveFromISO,
      toISO: v.effectiveToISO,
      status: scheduled?.id === v.id ? "scheduled" : current?.id === v.id ? "current" : "past",
    }))

  const canSubmit =
    form.overrideRequirementsNote.trim() !== "" &&
    form.stockAdjustmentThreshold.trim() !== "" &&
    !Number.isNaN(Number(form.stockAdjustmentThreshold)) &&
    form.voidRefundThreshold.trim() !== "" &&
    !Number.isNaN(Number(form.voidRefundThreshold))

  function handleAdd(effectiveFromISO: string) {
    const snapshot: ApprovalsSnapshot = {
      overrideRequirementsNote: form.overrideRequirementsNote,
      stockAdjustmentThreshold: Number(form.stockAdjustmentThreshold),
      voidRefundThreshold: Number(form.voidRefundThreshold),
    }
    addApprovalsVersion(snapshot, effectiveFromISO)
    refresh()
    setAddOpen(false)
    setForm(EMPTY_FORM)
    toast.success("New approvals version scheduled")
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Changes apply from the date you choose. Existing documents keep the rate that applied when they were created.
      </p>

      <SettingsSectionCard title="Approvals" settingClass="B" description="Above these lines, someone else has to say yes.">
        <VersionHistoryList rows={rows} />

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Add new version
          </Button>
          {scheduled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelScheduledApprovals()
                refresh()
                toast.success("Scheduled version cancelled")
              }}
            >
              Cancel scheduled
            </Button>
          )}
        </div>

        {current && <p className="text-xs text-muted-foreground">{current.snapshot.overrideRequirementsNote}</p>}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Other approval thresholds"
        settingClass="C"
        description="Edited at their own point of enforcement — shown here for reference only."
      >
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <div>
            <p className="font-medium">Expense approval threshold</p>
            <p className="text-xs text-muted-foreground">This is the same threshold used when recording expenses in Money → Expenses.</p>
          </div>
          <span className="font-medium tabular-nums">{formatGHS(getExpenseApprovalThreshold())}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <div>
            <p className="font-medium">Cashier discount limit</p>
            <p className="text-xs text-muted-foreground">Edit in Settings → Pricing & discounts.</p>
          </div>
          <span className="font-medium tabular-nums">{getPricingSettings().managerOverride.cashierMaxDiscountPercent}%</span>
        </div>
      </SettingsSectionCard>

      <EffectiveDateDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setForm(EMPTY_FORM)
        }}
        title="New approvals version"
        description="Schedule a new set of approval thresholds to take effect from a future date."
        canSubmit={canSubmit}
        onSubmit={handleAdd}
        submitLabel="Add new version"
      >
        {() => (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="override-requirements-note">Override requirements note</Label>
              <Textarea
                id="override-requirements-note"
                value={form.overrideRequirementsNote}
                onChange={(e) => setForm((prev) => ({ ...prev, overrideRequirementsNote: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-adjustment-threshold">Stock adjustment threshold requiring approval (GHS)</Label>
              <Input
                id="stock-adjustment-threshold"
                type="number"
                value={form.stockAdjustmentThreshold}
                onChange={(e) => setForm((prev) => ({ ...prev, stockAdjustmentThreshold: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="void-refund-threshold">Void/refund threshold (GHS)</Label>
              <Input
                id="void-refund-threshold"
                type="number"
                value={form.voidRefundThreshold}
                onChange={(e) => setForm((prev) => ({ ...prev, voidRefundThreshold: e.target.value }))}
              />
            </div>
          </div>
        )}
      </EffectiveDateDialog>
    </div>
  )
}

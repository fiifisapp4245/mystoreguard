"use client"

import { useState } from "react"
import { toast } from "sonner"

import { EffectiveDateDialog } from "@/components/settings/effective-date-dialog"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { VersionHistoryList, type VersionRowData } from "@/components/settings/version-history-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  REFUND_METHOD_POLICY_LABELS,
  addReturnPolicyVersion,
  cancelScheduledReturnPolicy,
  getCurrentReturnPolicy,
  getReturnPolicyVersions,
  scheduledReturnPolicyVersion,
  versionAsOf,
  type RefundMethodPolicy,
  type ReturnPolicySnapshot,
} from "@/lib/return-policy-data"

interface ReturnPolicyFormState extends Omit<ReturnPolicySnapshot, "nonReturnableCategories"> {
  nonReturnableCategoriesText: string
}

function toFormState(snapshot: ReturnPolicySnapshot): ReturnPolicyFormState {
  const { nonReturnableCategories, ...rest } = snapshot
  return { ...rest, nonReturnableCategoriesText: nonReturnableCategories.join(", ") }
}

/**
 * Class B — the whole policy is versioned as one bundled snapshot, since a
 * return processed last month must be judged against the policy that applied
 * then, not today's.
 */
export function ReturnPolicySection() {
  const [versions, setVersions] = useState(() => getReturnPolicyVersions())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ReturnPolicyFormState>(() => toFormState(getCurrentReturnPolicy()))

  function refresh() {
    setVersions([...getReturnPolicyVersions()])
  }

  const current = versionAsOf()
  const scheduled = scheduledReturnPolicyVersion()

  const rows: VersionRowData[] = versions
    .slice()
    .sort((a, b) => a.effectiveFromISO.localeCompare(b.effectiveFromISO))
    .map((v) => ({
      id: v.id,
      valueLabel: `${v.snapshot.windowDays} days · ${REFUND_METHOD_POLICY_LABELS[v.snapshot.refundMethodPolicy]}`,
      fromISO: v.effectiveFromISO,
      toISO: v.effectiveToISO,
      status: scheduled?.id === v.id ? "scheduled" : current?.id === v.id ? "current" : "past",
    }))

  function openDialog() {
    setForm(toFormState(current?.snapshot ?? getCurrentReturnPolicy()))
    setDialogOpen(true)
  }

  function handleSubmit(effectiveFromISO: string) {
    const snapshot: ReturnPolicySnapshot = {
      windowDays: form.windowDays,
      conditionRequirement: form.conditionRequirement,
      refundMethodPolicy: form.refundMethodPolicy,
      receiptRequired: form.receiptRequired,
      restockingFeePercent: form.restockingFeePercent,
      nonReturnableCategories: form.nonReturnableCategoriesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      storeCreditExpiryEnabled: form.storeCreditExpiryEnabled,
      storeCreditExpiryMonths: form.storeCreditExpiryMonths,
      storeCreditRefundableToCash: form.storeCreditRefundableToCash,
      storeCreditAutoIssueOnReturns: form.storeCreditAutoIssueOnReturns,
      storeCreditMaxBalance: form.storeCreditMaxBalance,
    }
    addReturnPolicyVersion(snapshot, effectiveFromISO)
    refresh()
    setDialogOpen(false)
    toast.success("New return policy version scheduled")
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Changes apply from the date you choose. Existing documents keep the rate that applied when they were created.
      </p>

      <SettingsSectionCard title="Return policy" settingClass="B">
        <p className="text-xs text-muted-foreground">
          The customer&apos;s own store credit balance lives on their People record — this section only sets the policy.
        </p>
        <VersionHistoryList rows={rows} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={openDialog}>
            Add new version
          </Button>
          {scheduled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelScheduledReturnPolicy()
                refresh()
                toast.success("Scheduled version cancelled")
              }}
            >
              Cancel scheduled
            </Button>
          )}
        </div>
      </SettingsSectionCard>

      <EffectiveDateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="New return policy version"
        description="Schedule a new return policy to take effect from a future date."
        canSubmit={form.conditionRequirement.trim() !== ""}
        onSubmit={handleSubmit}
        submitLabel="Add new version"
      >
        {() => (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="window-days">Return window (days)</Label>
              <Input
                id="window-days"
                type="number"
                value={form.windowDays}
                onChange={(e) => setForm((prev) => ({ ...prev, windowDays: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="condition-requirement">Condition requirement</Label>
              <Textarea
                id="condition-requirement"
                value={form.conditionRequirement}
                onChange={(e) => setForm((prev) => ({ ...prev, conditionRequirement: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="refund-method-policy">Refund method policy</Label>
              <Select
                value={form.refundMethodPolicy}
                onValueChange={(v) => setForm((prev) => ({ ...prev, refundMethodPolicy: v as RefundMethodPolicy }))}
              >
                <SelectTrigger className="w-full" id="refund-method-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REFUND_METHOD_POLICY_LABELS) as RefundMethodPolicy[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {REFUND_METHOD_POLICY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="receipt-required">Receipt required</Label>
              <Switch
                id="receipt-required"
                checked={form.receiptRequired}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, receiptRequired: checked }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restocking-fee">Restocking fee %</Label>
              <Input
                id="restocking-fee"
                type="number"
                value={form.restockingFeePercent}
                onChange={(e) => setForm((prev) => ({ ...prev, restockingFeePercent: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="non-returnable-categories">Non-returnable categories</Label>
              <Input
                id="non-returnable-categories"
                value={form.nonReturnableCategoriesText}
                onChange={(e) => setForm((prev) => ({ ...prev, nonReturnableCategoriesText: e.target.value }))}
                placeholder="Produce, Cooking Oil"
              />
              <p className="text-xs text-muted-foreground">Comma-separated.</p>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4">
              <p className="text-sm font-medium">Store credit policy</p>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="store-credit-expiry-enabled">Does store credit expire</Label>
                <Switch
                  id="store-credit-expiry-enabled"
                  checked={form.storeCreditExpiryEnabled}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, storeCreditExpiryEnabled: checked }))}
                />
              </div>

              {form.storeCreditExpiryEnabled && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="store-credit-expiry-months">After how many months</Label>
                  <Input
                    id="store-credit-expiry-months"
                    type="number"
                    value={form.storeCreditExpiryMonths}
                    onChange={(e) => setForm((prev) => ({ ...prev, storeCreditExpiryMonths: Number(e.target.value) || 0 }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="store-credit-refundable-to-cash">Refundable to cash</Label>
                <Switch
                  id="store-credit-refundable-to-cash"
                  checked={form.storeCreditRefundableToCash}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, storeCreditRefundableToCash: checked }))}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="store-credit-auto-issue">Auto-issued on returns</Label>
                <Switch
                  id="store-credit-auto-issue"
                  checked={form.storeCreditAutoIssueOnReturns}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, storeCreditAutoIssueOnReturns: checked }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-credit-max-balance">Maximum balance per customer (GHS)</Label>
                <Input
                  id="store-credit-max-balance"
                  type="number"
                  value={form.storeCreditMaxBalance}
                  onChange={(e) => setForm((prev) => ({ ...prev, storeCreditMaxBalance: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        )}
      </EffectiveDateDialog>
    </div>
  )
}

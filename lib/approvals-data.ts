import { TODAY_ISO } from "@/lib/period-utils"

/**
 * Approvals — the governance thresholds scattered across the product,
 * consolidated into one Settings section since they're the same concept:
 * "above this line, someone else has to say yes." Class B — retroactively
 * lowering a threshold would turn already-approved actions into apparent
 * policy violations.
 *
 * The expense approval threshold (lib/expenses-data.ts) and the cashier
 * discount limit (lib/pricing-engine-data.ts) already have their own
 * versioned homes — each is genuinely used at its point of enforcement, so
 * this file doesn't duplicate their storage. It only owns the two
 * thresholds that don't already live somewhere else, plus the override
 * requirements text.
 */

export interface ApprovalsSnapshot {
  overrideRequirementsNote: string
  stockAdjustmentThreshold: number
  voidRefundThreshold: number
}

export interface ApprovalsVersion {
  id: string
  effectiveFromISO: string
  effectiveToISO?: string
  snapshot: ApprovalsSnapshot
}

const DEFAULT_SNAPSHOT: ApprovalsSnapshot = {
  overrideRequirementsNote:
    "Selling below the price floor, exceeding the cashier discount limit, or a manual price override all require a manager override — captured with an approving user, a reason, and a timestamp.",
  stockAdjustmentThreshold: 50,
  voidRefundThreshold: 100,
}

let versionsStore: ApprovalsVersion[] = [{ id: "appr-v1", effectiveFromISO: "2022-01-01", snapshot: { ...DEFAULT_SNAPSHOT } }]

export function getApprovalsVersions(): ApprovalsVersion[] {
  return versionsStore
}

export function versionAsOf(asOfISO: string = TODAY_ISO): ApprovalsVersion | undefined {
  return [...versionsStore].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledApprovalsVersion(asOfISO: string = TODAY_ISO): ApprovalsVersion | undefined {
  return versionsStore.find((v) => v.effectiveFromISO > asOfISO)
}

export function getCurrentApprovals(asOfISO: string = TODAY_ISO): ApprovalsSnapshot {
  return versionAsOf(asOfISO)?.snapshot ?? DEFAULT_SNAPSHOT
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function addApprovalsVersion(snapshot: ApprovalsSnapshot, effectiveFromISO: string): void {
  const closed = versionsStore.map((v) =>
    !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBefore(effectiveFromISO) } : v
  )
  versionsStore = [...closed, { id: `appr-v${closed.length + 1}-${Date.now().toString(36)}`, effectiveFromISO, snapshot }]
}

export function cancelScheduledApprovals(): void {
  const scheduled = scheduledApprovalsVersion()
  if (!scheduled) return
  versionsStore = versionsStore
    .filter((v) => v.id !== scheduled.id)
    .map((v) => (v.effectiveToISO === dayBefore(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
}

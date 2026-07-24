import { TODAY_ISO } from "@/lib/period-utils"

/**
 * The store's own return rules — Class B. Changing the window or refund
 * policy legitimately happens over time, but a return processed last month
 * must be judged against the policy that applied then, not today's.
 */

export type RefundMethodPolicy = "cash" | "store-credit" | "exchange-only" | "customer-choice"

export const REFUND_METHOD_POLICY_LABELS: Record<RefundMethodPolicy, string> = {
  cash: "Cash refund only",
  "store-credit": "Store credit only",
  "exchange-only": "Exchange only — no refunds",
  "customer-choice": "Customer's choice",
}

export interface ReturnPolicySnapshot {
  windowDays: number
  conditionRequirement: string
  refundMethodPolicy: RefundMethodPolicy
  receiptRequired: boolean
  restockingFeePercent: number
  nonReturnableCategories: string[]
  /**
   * Store credit policy — deliberately kept here rather than a standalone
   * section: a customer's own balance is data that lives on their People
   * record, but the policy governing it (does it expire, can it be
   * refunded to cash, is it auto-issued) is a return-time decision.
   */
  storeCreditExpiryEnabled: boolean
  storeCreditExpiryMonths: number
  storeCreditRefundableToCash: boolean
  storeCreditAutoIssueOnReturns: boolean
  storeCreditMaxBalance: number
}

export interface ReturnPolicyVersion {
  id: string
  effectiveFromISO: string
  effectiveToISO?: string
  snapshot: ReturnPolicySnapshot
}

const DEFAULT_SNAPSHOT: ReturnPolicySnapshot = {
  windowDays: 14,
  conditionRequirement: "Unused, in original packaging, with proof of purchase",
  refundMethodPolicy: "customer-choice",
  receiptRequired: true,
  restockingFeePercent: 0,
  nonReturnableCategories: ["Produce", "Cooking Oil"],
  storeCreditExpiryEnabled: true,
  storeCreditExpiryMonths: 12,
  storeCreditRefundableToCash: false,
  storeCreditAutoIssueOnReturns: true,
  storeCreditMaxBalance: 500,
}

let versionsStore: ReturnPolicyVersion[] = [
  { id: "rp-v1", effectiveFromISO: "2022-01-01", snapshot: { ...DEFAULT_SNAPSHOT } },
]

export function getReturnPolicyVersions(): ReturnPolicyVersion[] {
  return versionsStore
}

export function versionAsOf(asOfISO: string = TODAY_ISO): ReturnPolicyVersion | undefined {
  return [...versionsStore].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledReturnPolicyVersion(asOfISO: string = TODAY_ISO): ReturnPolicyVersion | undefined {
  return versionsStore.find((v) => v.effectiveFromISO > asOfISO)
}

export function getCurrentReturnPolicy(asOfISO: string = TODAY_ISO): ReturnPolicySnapshot {
  return versionAsOf(asOfISO)?.snapshot ?? DEFAULT_SNAPSHOT
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function addReturnPolicyVersion(snapshot: ReturnPolicySnapshot, effectiveFromISO: string): void {
  const closed = versionsStore.map((v) =>
    !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBefore(effectiveFromISO) } : v
  )
  versionsStore = [...closed, { id: `rp-v${closed.length + 1}-${Date.now().toString(36)}`, effectiveFromISO, snapshot }]
}

export function cancelScheduledReturnPolicy(): void {
  const scheduled = scheduledReturnPolicyVersion()
  if (!scheduled) return
  versionsStore = versionsStore
    .filter((v) => v.id !== scheduled.id)
    .map((v) => (v.effectiveToISO === dayBefore(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
}

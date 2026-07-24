import type { StaffRole } from "@/lib/mock-data"

/** Which events notify which roles, in-app and by SMS. Class C. */
export type NotificationEventKey =
  | "low-stock"
  | "large-discount"
  | "day-close-variance"
  | "overdue-invoice"
  | "failed-delivery"
  | "stocktake-discrepancy"

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventKey, string> = {
  "low-stock": "Low stock",
  "large-discount": "Large discount applied",
  "day-close-variance": "Day-close variance over threshold",
  "overdue-invoice": "Overdue invoice",
  "failed-delivery": "Failed delivery",
  "stocktake-discrepancy": "Stocktake discrepancy",
}

export interface NotificationRule {
  event: NotificationEventKey
  roles: StaffRole[]
  inApp: boolean
  sms: boolean
}

const DEFAULT_RULES: NotificationRule[] = [
  { event: "low-stock", roles: ["Owner", "Manager", "Stockkeeper"], inApp: true, sms: false },
  { event: "large-discount", roles: ["Owner", "Manager"], inApp: true, sms: false },
  { event: "day-close-variance", roles: ["Owner", "Manager"], inApp: true, sms: true },
  { event: "overdue-invoice", roles: ["Owner", "Manager"], inApp: true, sms: false },
  { event: "failed-delivery", roles: ["Owner", "Manager"], inApp: true, sms: true },
  { event: "stocktake-discrepancy", roles: ["Owner", "Manager", "Stockkeeper"], inApp: true, sms: false },
]

let notificationRulesStore: NotificationRule[] = DEFAULT_RULES.map((r) => ({ ...r, roles: [...r.roles] }))

export function getNotificationRules(): NotificationRule[] {
  return notificationRulesStore
}

export function setNotificationRule(event: NotificationEventKey, patch: Partial<NotificationRule>): void {
  notificationRulesStore = notificationRulesStore.map((r) => (r.event === event ? { ...r, ...patch } : r))
}

export function toggleNotificationRole(event: NotificationEventKey, role: StaffRole): void {
  notificationRulesStore = notificationRulesStore.map((r) => {
    if (r.event !== event) return r
    const roles = r.roles.includes(role) ? r.roles.filter((x) => x !== role) : [...r.roles, role]
    return { ...r, roles }
  })
}

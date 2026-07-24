/**
 * First-run setup checklist — shown on the Dashboard (and as a header chip)
 * only when the demo control's "Store state" is "New store". Every real
 * store in this prototype ships fully seeded, so completion here is tracked
 * by its own small store rather than derived from the (always-populated)
 * mock data — each item flips to done the moment the corresponding action
 * is actually taken (saving the business profile, adding a location, etc.),
 * the same way a genuinely empty account would fill in one field at a time.
 */

export interface SetupChecklistItemDef {
  id: string
  label: string
  description: string
  href: string
}

export const SETUP_CHECKLIST_ITEMS: SetupChecklistItemDef[] = [
  { id: "business-profile", label: "Business profile", description: "Name, address, phone, TIN", href: "/settings/business-profile" },
  { id: "locations", label: "Locations", description: "At least one", href: "/settings/locations" },
  { id: "tax-rates", label: "Tax rates", description: "Confirm or edit the Ghana defaults", href: "/settings/tax" },
  { id: "payment-methods", label: "Payment methods", description: "Momo numbers, bank account", href: "/settings/payment-methods" },
  { id: "products", label: "Products", description: "Add or import", href: "/inventory/products" },
  { id: "staff", label: "Staff", description: "Invite your team and set roles", href: "/people/staff" },
]

let doneStore: Set<string> = new Set()

export function getSetupChecklistDone(): Set<string> {
  return doneStore
}

export function markSetupItemDone(id: string): void {
  if (doneStore.has(id)) return
  doneStore = new Set(doneStore).add(id)
}

export function setupChecklistProgress(): { done: number; total: number } {
  return { done: doneStore.size, total: SETUP_CHECKLIST_ITEMS.length }
}

export function isSetupChecklistComplete(): boolean {
  return doneStore.size >= SETUP_CHECKLIST_ITEMS.length
}

/** Guide's "Replay setup checklist" action — re-shows the first-run checklist on the Dashboard. */
export function resetSetupChecklist(): void {
  doneStore = new Set()
}

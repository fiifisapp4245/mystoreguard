/**
 * The single source of truth for Settings' left index — group, section,
 * order, and governance class. The route (app/(dashboard)/settings/[section]/page.tsx),
 * the sticky left nav, and the role-gating logic all read from this file.
 */

export type SettingClass = "A" | "B" | "C"

export interface SettingsSection {
  id: string
  label: string
  groupId: string
  /** The class shown in the legend and next to the section — sections that mix classes (e.g. Receipts & documents) use their dominant class here and note exceptions inline. */
  settingClass: SettingClass
}

export interface SettingsGroupMeta {
  id: string
  label: string
}

export const SETTINGS_GROUPS: SettingsGroupMeta[] = [
  { id: "business", label: "Business" },
  { id: "selling", label: "Selling" },
  { id: "stock", label: "Stock" },
  { id: "people-access", label: "People & access" },
  { id: "communication", label: "Communication" },
  { id: "account", label: "Account" },
]

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "business-profile", label: "Business profile", groupId: "business", settingClass: "C" },
  { id: "locations", label: "Locations", groupId: "business", settingClass: "C" },
  { id: "tax", label: "Tax", groupId: "business", settingClass: "B" },
  { id: "receipts-documents", label: "Receipts & documents", groupId: "business", settingClass: "C" },

  { id: "pricing-discounts", label: "Pricing & discounts", groupId: "selling", settingClass: "B" },
  { id: "return-policy", label: "Return policy", groupId: "selling", settingClass: "B" },
  { id: "payment-methods", label: "Payment methods", groupId: "selling", settingClass: "C" },

  { id: "inventory-costing", label: "Inventory costing", groupId: "stock", settingClass: "A" },
  { id: "stock-rules", label: "Stock rules", groupId: "stock", settingClass: "C" },

  { id: "roles-permissions", label: "Roles & permissions", groupId: "people-access", settingClass: "C" },
  { id: "approvals", label: "Approvals", groupId: "people-access", settingClass: "B" },

  { id: "sms-gateway", label: "SMS gateway", groupId: "communication", settingClass: "C" },
  { id: "notifications", label: "Notifications", groupId: "communication", settingClass: "C" },

  { id: "subscription-tier", label: "Subscription & tier", groupId: "account", settingClass: "C" },
  { id: "data-export", label: "Data & export", groupId: "account", settingClass: "C" },
]

const SECTIONS_BY_ID = new Map(SETTINGS_SECTIONS.map((s) => [s.id, s]))

export function getSettingsSection(id: string): SettingsSection | undefined {
  return SECTIONS_BY_ID.get(id)
}

export const FIRST_SETTINGS_SECTION_ID = SETTINGS_SECTIONS[0].id

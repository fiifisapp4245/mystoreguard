import type { StaffRole } from "@/lib/mock-data"

/**
 * Roles & permissions — the governance model behind "Viewing as role" in the
 * demo controls. This is what makes Settings dangerous in the wrong hands:
 * the price floor, discount limits, costing method, and approval thresholds
 * all live behind the "Settings" row below.
 */

export type PermissionLevel = "None" | "View" | "Edit" | "Full"

export const PERMISSION_LEVELS: PermissionLevel[] = ["None", "View", "Edit", "Full"]

export interface PermissionModuleRow {
  key: string
  label: string
}

/** Modules down the left of the matrix — matches the sidebar's real hubs and top-level items. */
export const PERMISSION_MODULES: PermissionModuleRow[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "register", label: "Register" },
  { key: "sales", label: "Sales" },
  { key: "invoice", label: "Invoice" },
  { key: "deliveries", label: "Deliveries" },
  { key: "estimator", label: "Estimator" },
  { key: "inventory", label: "Inventory" },
  { key: "stock", label: "Stock" },
  { key: "people", label: "People" },
  { key: "loyalty", label: "Loyalty" },
  { key: "offers-rewards", label: "Offers & Rewards" },
  { key: "appointments", label: "Appointments" },
  { key: "money", label: "Money" },
  { key: "message", label: "Message" },
  { key: "settings", label: "Settings" },
  { key: "audit-log", label: "Audit log" },
]

export const PERMISSION_ROLES: StaffRole[] = ["Owner", "Manager", "Cashier", "Stockkeeper"]

export type PermissionMatrix = Record<StaffRole, Record<string, PermissionLevel>>

function row(entries: Record<string, PermissionLevel>): Record<string, PermissionLevel> {
  const base = Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, "None" as PermissionLevel]))
  return { ...base, ...entries }
}

/**
 * Seed defaults from the brief. Anything the brief didn't specify for a role
 * defaults to "None" — conservative, consistent with each role only seeing
 * what it needs for its job.
 */
export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  Owner: row(Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, "Full"]))),
  Manager: row({
    dashboard: "Full",
    register: "Full",
    sales: "Full",
    invoice: "Full",
    deliveries: "Full",
    estimator: "Full",
    inventory: "Full",
    stock: "Full",
    people: "Full",
    loyalty: "Full",
    "offers-rewards": "Full",
    appointments: "Full",
    money: "Full",
    message: "Full",
    settings: "View",
    "audit-log": "Full",
  }),
  Cashier: row({
    register: "Full",
    sales: "View", // own sales only — not modelled at matrix granularity, enforced in the Sales tab
    people: "View", // customers only — not modelled at matrix granularity
  }),
  Stockkeeper: row({
    inventory: "Full",
    stock: "Full",
    sales: "View",
  }),
}

/**
 * Section-level overrides finer than the matrix's one "Settings" row — e.g.
 * Manager has broad View access to Settings but must not see billing.
 */
export const SETTINGS_SECTION_OVERRIDES: Partial<Record<StaffRole, Record<string, PermissionLevel>>> = {
  Manager: { "subscription-tier": "None" },
}

let permissionMatrixStore: PermissionMatrix = {
  Owner: { ...DEFAULT_PERMISSION_MATRIX.Owner },
  Manager: { ...DEFAULT_PERMISSION_MATRIX.Manager },
  Cashier: { ...DEFAULT_PERMISSION_MATRIX.Cashier },
  Stockkeeper: { ...DEFAULT_PERMISSION_MATRIX.Stockkeeper },
}

export function getPermissionMatrix(): PermissionMatrix {
  return permissionMatrixStore
}

export function setPermissionLevel(role: StaffRole, moduleKey: string, level: PermissionLevel): void {
  if (role === "Owner") return // Owner column is locked to Full
  permissionMatrixStore = {
    ...permissionMatrixStore,
    [role]: { ...permissionMatrixStore[role], [moduleKey]: level },
  }
}

/** Settings access for a role, honoring the finer-grained section overrides above the matrix's one row. */
export function getSettingsSectionAccess(role: StaffRole, sectionId: string): PermissionLevel {
  const override = SETTINGS_SECTION_OVERRIDES[role]?.[sectionId]
  if (override) return override
  return getPermissionMatrix()[role].settings
}

export function hasAtLeast(level: PermissionLevel, required: PermissionLevel): boolean {
  return PERMISSION_LEVELS.indexOf(level) >= PERMISSION_LEVELS.indexOf(required)
}

// ---------------------------------------------------------------------------
// Cross-cutting toggles — the governance questions that cut across modules
// rather than belonging to one of them.
// ---------------------------------------------------------------------------

export interface RoleCrossCuttingSettings {
  canApplyDiscounts: boolean
  /**
   * Informational per-role ceiling shown in the matrix. The Cashier figure is
   * seeded from lib/pricing-engine-data.ts's managerOverride.cashierMaxDiscountPercent
   * — that store remains the single value actually enforced at checkout; this
   * one is the role-governance view of it, editable independently here.
   */
  maxDiscountPercent: number
  canApproveOverrides: boolean
  canVoidSales: boolean
  canRecordExpenses: boolean
  /** Cashiers must not see cost prices or margins — the field that most often leaks. */
  canSeeCostPricesAndMargins: boolean
  canOpenCloseDay: boolean
}

export const DEFAULT_CROSS_CUTTING: Record<StaffRole, RoleCrossCuttingSettings> = {
  Owner: {
    canApplyDiscounts: true,
    maxDiscountPercent: 100,
    canApproveOverrides: true,
    canVoidSales: true,
    canRecordExpenses: true,
    canSeeCostPricesAndMargins: true,
    canOpenCloseDay: true,
  },
  Manager: {
    canApplyDiscounts: true,
    maxDiscountPercent: 30,
    canApproveOverrides: true,
    canVoidSales: true,
    canRecordExpenses: true,
    canSeeCostPricesAndMargins: true,
    canOpenCloseDay: true,
  },
  Cashier: {
    canApplyDiscounts: true,
    maxDiscountPercent: 10,
    canApproveOverrides: false,
    canVoidSales: false,
    canRecordExpenses: false,
    canSeeCostPricesAndMargins: false,
    canOpenCloseDay: true,
  },
  Stockkeeper: {
    canApplyDiscounts: false,
    maxDiscountPercent: 0,
    canApproveOverrides: false,
    canVoidSales: false,
    canRecordExpenses: false,
    canSeeCostPricesAndMargins: false,
    canOpenCloseDay: false,
  },
}

let crossCuttingStore: Record<StaffRole, RoleCrossCuttingSettings> = {
  Owner: { ...DEFAULT_CROSS_CUTTING.Owner },
  Manager: { ...DEFAULT_CROSS_CUTTING.Manager },
  Cashier: { ...DEFAULT_CROSS_CUTTING.Cashier },
  Stockkeeper: { ...DEFAULT_CROSS_CUTTING.Stockkeeper },
}

export function getCrossCuttingSettings(): Record<StaffRole, RoleCrossCuttingSettings> {
  return crossCuttingStore
}

export function setCrossCuttingSettings(role: StaffRole, patch: Partial<RoleCrossCuttingSettings>): void {
  crossCuttingStore = { ...crossCuttingStore, [role]: { ...crossCuttingStore[role], ...patch } }
}

/** Cashiers (and any role with the toggle off) must not see cost prices or margins. */
export function canSeeCostPrices(role: StaffRole): boolean {
  return getCrossCuttingSettings()[role].canSeeCostPricesAndMargins
}

/** A real, derived-from-the-matrix summary of what a role can do — replaces invented prose in add-staff-dialog. */
export function summarizeRolePermissions(role: StaffRole): string {
  const matrix = getPermissionMatrix()[role]
  const fullAccess = PERMISSION_MODULES.filter((m) => matrix[m.key] === "Full").map((m) => m.label)
  const viewOnly = PERMISSION_MODULES.filter((m) => matrix[m.key] === "View").map((m) => m.label)
  if (role === "Owner") return "Full access to everything, including billing and staff management."
  const parts: string[] = []
  if (fullAccess.length > 0) parts.push(`Full access to ${fullAccess.join(", ")}`)
  if (viewOnly.length > 0) parts.push(`view-only on ${viewOnly.join(", ")}`)
  return parts.length > 0 ? `${parts.join("; ")}.` : "No module access by default."
}

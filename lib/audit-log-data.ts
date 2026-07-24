import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"
import type { StaffRole } from "@/lib/mock-data"

/**
 * Audit log — a record, not a configuration screen. Immutable: nothing on
 * this screen can be edited or deleted, by anyone, ever. Entries below
 * deliberately reconcile with events already seeded elsewhere in the
 * prototype (the GHS 85 day-close variance, the damaged-in-transit transfer,
 * the stock-adjustment and expense-approval flows) rather than inventing a
 * parallel, disconnected history.
 */

export type AuditActionType =
  | "setting-changed"
  | "price-changed"
  | "discount-override-approved"
  | "expense-approved"
  | "expense-rejected"
  | "stock-adjusted"
  | "transfer-discrepancy-recorded"
  | "stocktake-posted"
  | "day-closed-with-variance"
  | "sale-voided"
  | "refund-issued"
  | "product-deactivated"
  | "user-role-changed"
  | "permission-changed"
  | "task-completed"

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  "setting-changed": "Setting changed",
  "price-changed": "Price changed",
  "discount-override-approved": "Discount override approved",
  "expense-approved": "Expense approved",
  "expense-rejected": "Expense rejected",
  "stock-adjusted": "Stock adjusted",
  "transfer-discrepancy-recorded": "Transfer discrepancy recorded",
  "stocktake-posted": "Stocktake posted",
  "day-closed-with-variance": "Day closed with variance",
  "sale-voided": "Sale voided",
  "refund-issued": "Refund issued",
  "product-deactivated": "Product deactivated",
  "user-role-changed": "User role changed",
  "permission-changed": "Permission changed",
  "task-completed": "Task completed",
}

export interface AuditLogEntry {
  id: string
  dateISO: string
  time: string
  user: string
  role: StaffRole
  module: string
  action: AuditActionType
  target: string
  targetHref?: string
  before?: string
  after?: string
  reason?: string
}

const USERS: { name: string; role: StaffRole }[] = [
  { name: "Kesewaa Adjei", role: "Owner" },
  { name: "Kwabena Owusu", role: "Manager" },
  { name: "Adjoa Boateng", role: "Cashier" },
  { name: "Abena Darko", role: "Cashier" },
  { name: "Yaw Boadi", role: "Stockkeeper" },
]

const TIMES = ["8:14 AM", "9:02 AM", "9:47 AM", "10:30 AM", "11:15 AM", "12:40 PM", "1:22 PM", "2:05 PM", "3:38 PM", "4:51 PM", "5:20 PM", "6:44 PM"]

interface Spec {
  userIndex: number
  daysAgo: number
  module: string
  action: AuditActionType
  target: string
  targetHref?: string
  before?: string
  after?: string
  reason?: string
}

const SPECS: Spec[] = [
  // Setting changed (14)
  { userIndex: 0, daysAgo: 1, module: "Settings", action: "setting-changed", target: "Tax → VAT", before: "15%", after: "18% (scheduled from 1 Jan 2027)" },
  { userIndex: 0, daysAgo: 2, module: "Settings", action: "setting-changed", target: "Pricing & discounts → Price floor", before: "Min margin 8%", after: "Min margin 10%" },
  { userIndex: 1, daysAgo: 3, module: "Settings", action: "setting-changed", target: "Return policy → Return window", before: "7 days", after: "14 days" },
  { userIndex: 0, daysAgo: 4, module: "Settings", action: "setting-changed", target: "Receipts & documents → Footer text", before: "Thank you for your custom.", after: "Goods sold in good condition are exchangeable within 14 days with this receipt." },
  { userIndex: 0, daysAgo: 5, module: "Settings", action: "setting-changed", target: "Payment methods → Card", before: "Off", after: "Off (reviewed, kept off)" },
  { userIndex: 1, daysAgo: 6, module: "Settings", action: "setting-changed", target: "Stock rules → Low-stock alert threshold", before: "5 units", after: "10 units" },
  { userIndex: 0, daysAgo: 7, module: "Settings", action: "setting-changed", target: "Approvals → Void/refund threshold", before: "GHS 150", after: "GHS 100" },
  { userIndex: 0, daysAgo: 8, module: "Settings", action: "setting-changed", target: "Business profile → Phone", before: "024 000 0000", after: "024 000 1111" },
  { userIndex: 1, daysAgo: 9, module: "Settings", action: "setting-changed", target: "Numbering → Invoices (INV) prefix", before: "INV", after: "INV (unchanged, format reviewed)" },
  { userIndex: 0, daysAgo: 11, module: "Settings", action: "setting-changed", target: "Notifications → Day-close variance", before: "In-app only", after: "In-app + SMS" },
  { userIndex: 1, daysAgo: 13, module: "Settings", action: "setting-changed", target: "SMS gateway", before: "Platform credits", after: "Platform credits (reviewed)" },
  { userIndex: 0, daysAgo: 16, module: "Settings", action: "setting-changed", target: "Approvals → Expense approval threshold", before: "GHS 150", after: "GHS 200" },
  { userIndex: 0, daysAgo: 20, module: "Settings", action: "setting-changed", target: "Locations → Warehouse — Abossey Okai", before: "canSell: true", after: "canSell: false" },
  { userIndex: 1, daysAgo: 25, module: "Settings", action: "setting-changed", target: "Stock rules → Stocktake blind counting", before: "Off", after: "On" },

  // Price changed (10)
  { userIndex: 1, daysAgo: 1, module: "Inventory", action: "price-changed", target: "Frytol Cooking Oil 3L", before: "GHS 88.00", after: "GHS 92.00" },
  { userIndex: 0, daysAgo: 2, module: "Inventory", action: "price-changed", target: "Milo 400g tin", before: "GHS 39.50", after: "GHS 42.00" },
  { userIndex: 1, daysAgo: 4, module: "Inventory", action: "price-changed", target: "Indomie Chicken Noodles", before: "GHS 5.50", after: "GHS 6.00" },
  { userIndex: 0, daysAgo: 6, module: "Inventory", action: "price-changed", target: "Voltic Water 750ml", before: "GHS 4.50", after: "GHS 5.00" },
  { userIndex: 1, daysAgo: 9, module: "Inventory", action: "price-changed", target: "Key Soap", before: "GHS 8.00", after: "GHS 8.50" },
  { userIndex: 0, daysAgo: 12, module: "Inventory", action: "price-changed", target: "Perfumed Rice 5kg", before: "GHS 74.00", after: "GHS 78.00" },
  { userIndex: 1, daysAgo: 15, module: "Inventory", action: "price-changed", target: "Coca-Cola 500ml", before: "GHS 6.50", after: "GHS 7.00" },
  { userIndex: 0, daysAgo: 18, module: "Inventory", action: "price-changed", target: "Omo 900g", before: "GHS 30.00", after: "GHS 32.00" },
  { userIndex: 1, daysAgo: 22, module: "Inventory", action: "price-changed", target: "Geisha Sardines", before: "GHS 11.50", after: "GHS 12.00" },
  { userIndex: 0, daysAgo: 27, module: "Inventory", action: "price-changed", target: "Peak Milk 400g", before: "GHS 15.00", after: "GHS 16.00" },

  // Discount override approved (6)
  { userIndex: 1, daysAgo: 2, module: "Register", action: "discount-override-approved", target: "Sale RCT-5211", reason: "Price match", before: "8% (cashier limit)", after: "20%" },
  { userIndex: 0, daysAgo: 5, module: "Register", action: "discount-override-approved", target: "Sale RCT-5198", reason: "Damaged/near-expiry stock", before: "10% (cashier limit)", after: "35%" },
  { userIndex: 1, daysAgo: 8, module: "Register", action: "discount-override-approved", target: "Sale RCT-5176", reason: "Loyal customer goodwill", before: "10% (cashier limit)", after: "15%" },
  { userIndex: 1, daysAgo: 14, module: "Register", action: "discount-override-approved", target: "Sale RCT-5140", reason: "Manager discretion", before: "10% (cashier limit)", after: "25%" },
  { userIndex: 0, daysAgo: 19, module: "Register", action: "discount-override-approved", target: "Sale RCT-5102", reason: "Price match", before: "10% (cashier limit)", after: "18%" },
  { userIndex: 1, daysAgo: 24, module: "Register", action: "discount-override-approved", target: "Sale RCT-5061", reason: "Other", before: "10% (cashier limit)", after: "12%" },

  // Expense approved (10)
  { userIndex: 0, daysAgo: 1, module: "Money", action: "expense-approved", target: "Rent — July", targetHref: "/money/expenses", after: "GHS 2,500.00" },
  { userIndex: 1, daysAgo: 3, module: "Money", action: "expense-approved", target: "Electricity — ECG", targetHref: "/money/expenses", after: "GHS 410.00" },
  { userIndex: 0, daysAgo: 4, module: "Money", action: "expense-approved", target: "Salaries & wages — July", targetHref: "/money/expenses", after: "GHS 3,200.00" },
  { userIndex: 1, daysAgo: 7, module: "Money", action: "expense-approved", target: "Repairs & maintenance — Freezer compressor", targetHref: "/money/expenses", after: "GHS 650.00" },
  { userIndex: 0, daysAgo: 10, module: "Money", action: "expense-approved", target: "Transport & fuel — Delivery van", targetHref: "/money/expenses", after: "GHS 280.00" },
  { userIndex: 1, daysAgo: 13, module: "Money", action: "expense-approved", target: "Marketing — Radio spot", targetHref: "/money/expenses", after: "GHS 500.00" },
  { userIndex: 0, daysAgo: 17, module: "Money", action: "expense-approved", target: "Packaging & supplies — Carrier bags", targetHref: "/money/expenses", after: "GHS 320.00" },
  { userIndex: 1, daysAgo: 21, module: "Money", action: "expense-approved", target: "Bank & Momo charges — July", targetHref: "/money/expenses", after: "GHS 95.00" },
  { userIndex: 0, daysAgo: 26, module: "Money", action: "expense-approved", target: "Licences & rates — Business operating permit", targetHref: "/money/expenses", after: "GHS 1,200.00" },
  { userIndex: 1, daysAgo: 29, module: "Money", action: "expense-approved", target: "Cleaning & security — SecureGuard contract", targetHref: "/money/expenses", after: "GHS 800.00" },

  // Expense rejected (3)
  { userIndex: 0, daysAgo: 6, module: "Money", action: "expense-rejected", target: "Other — Staff lunch", targetHref: "/money/expenses", reason: "No receipt attached, resubmit with evidence" },
  { userIndex: 1, daysAgo: 15, module: "Money", action: "expense-rejected", target: "Transport & fuel — Personal trip", targetHref: "/money/expenses", reason: "Not a business expense" },
  { userIndex: 0, daysAgo: 23, module: "Money", action: "expense-rejected", target: "Marketing — Duplicate radio invoice", targetHref: "/money/expenses", reason: "Already recorded on the 12th" },

  // Stock adjusted (10)
  { userIndex: 4, daysAgo: 2, module: "Stock", action: "stock-adjusted", target: "Frytol Cooking Oil 3L", targetHref: "/stock/stock-levels", reason: "Damaged in storage", before: "38 units", after: "34 units" },
  { userIndex: 4, daysAgo: 4, module: "Stock", action: "stock-adjusted", target: "Sunlight Dishwashing Liquid", targetHref: "/stock/stock-levels", reason: "Miscount at last stocktake", before: "70 units", after: "68 units" },
  { userIndex: 4, daysAgo: 6, module: "Stock", action: "stock-adjusted", target: "Voltic 1.5L", targetHref: "/stock/stock-levels", reason: "Expiry", before: "140 units", after: "132 units" },
  { userIndex: 4, daysAgo: 9, module: "Stock", action: "stock-adjusted", target: "Malta Guinness", targetHref: "/stock/stock-levels", reason: "Theft suspected", before: "100 units", after: "94 units" },
  { userIndex: 1, daysAgo: 11, module: "Stock", action: "stock-adjusted", target: "Tasty Tom Tomato Paste", targetHref: "/stock/stock-levels", reason: "Damaged in storage", before: "200 units", after: "195 units" },
  { userIndex: 4, daysAgo: 14, module: "Stock", action: "stock-adjusted", target: "Royal Aroma Rice 5kg", targetHref: "/stock/stock-levels", reason: "Miscount at last stocktake", before: "40 units", after: "42 units" },
  { userIndex: 4, daysAgo: 18, module: "Stock", action: "stock-adjusted", target: "Duracell AA (pack)", targetHref: "/stock/stock-levels", reason: "Theft suspected", before: "53 units", after: "48 units" },
  { userIndex: 4, daysAgo: 20, module: "Stock", action: "stock-adjusted", target: "Close Up Toothpaste", targetHref: "/stock/stock-levels", reason: "Expiry", before: "70 units", after: "66 units" },
  { userIndex: 1, daysAgo: 24, module: "Stock", action: "stock-adjusted", target: "Cowbell Milk Sachet", targetHref: "/stock/stock-levels", reason: "Damaged in storage", before: "300 units", after: "290 units" },
  { userIndex: 4, daysAgo: 28, module: "Stock", action: "stock-adjusted", target: "Tema Salt 1kg", targetHref: "/stock/stock-levels", reason: "Miscount at last stocktake", before: "160 units", after: "158 units" },

  // Transfer discrepancy recorded (2)
  { userIndex: 4, daysAgo: 9, module: "Stock", action: "transfer-discrepancy-recorded", target: "Transfer TRF-0052", targetHref: "/stock/movements", reason: "4 tins damaged in transit" },
  { userIndex: 4, daysAgo: 22, module: "Stock", action: "transfer-discrepancy-recorded", target: "Transfer TRF-0047", targetHref: "/stock/movements", reason: "1 carton short on arrival, courier notified" },

  // Stocktake posted (3)
  { userIndex: 4, daysAgo: 5, module: "Stock", action: "stocktake-posted", target: "Stocktake ST-1003", targetHref: "/stock/stocktakes", after: "3 variances posted" },
  { userIndex: 4, daysAgo: 16, module: "Stock", action: "stocktake-posted", target: "Stocktake ST-1002", targetHref: "/stock/stocktakes", after: "1 variance posted" },
  { userIndex: 1, daysAgo: 27, module: "Stock", action: "stocktake-posted", target: "Stocktake ST-1001", targetHref: "/stock/stocktakes", after: "0 variances" },

  // Day closed with variance (4)
  { userIndex: 3, daysAgo: 17, module: "Money", action: "day-closed-with-variance", target: "Day close — session 5", targetHref: "/money/day-close", reason: "Unrecorded expense", before: "Expected GHS 2,980.00", after: "Counted GHS 2,895.00 (− GHS 85.00)" },
  { userIndex: 3, daysAgo: 20, module: "Money", action: "day-closed-with-variance", target: "Day close — session 2", targetHref: "/money/day-close", before: "Expected GHS 3,110.00", after: "Counted GHS 3,107.00 (− GHS 3.00)" },
  { userIndex: 4, daysAgo: 15, module: "Money", action: "day-closed-with-variance", target: "Day close — session 7", targetHref: "/money/day-close", before: "Expected GHS 2,790.00", after: "Counted GHS 2,786.00 (− GHS 4.00)" },
  { userIndex: 2, daysAgo: 12, module: "Money", action: "day-closed-with-variance", target: "Day close — session 9", targetHref: "/money/day-close", before: "Expected GHS 2,930.00", after: "Counted GHS 2,928.00 (− GHS 2.00)" },

  // Sale voided (5)
  { userIndex: 1, daysAgo: 3, module: "Sales", action: "sale-voided", target: "Sale RCT-5205", targetHref: "/sales/all", reason: "Wrong item scanned twice" },
  { userIndex: 0, daysAgo: 8, module: "Sales", action: "sale-voided", target: "Sale RCT-5169", targetHref: "/sales/all", reason: "Customer changed their mind before payment" },
  { userIndex: 1, daysAgo: 13, module: "Sales", action: "sale-voided", target: "Sale RCT-5133", targetHref: "/sales/all", reason: "Till error, re-rung correctly" },
  { userIndex: 0, daysAgo: 19, module: "Sales", action: "sale-voided", target: "Sale RCT-5090", targetHref: "/sales/all", reason: "Duplicate transaction" },
  { userIndex: 1, daysAgo: 25, module: "Sales", action: "sale-voided", target: "Sale RCT-5044", targetHref: "/sales/all", reason: "Price override entered before manager approval arrived" },

  // Refund issued (6)
  { userIndex: 2, daysAgo: 2, module: "Sales", action: "refund-issued", target: "Return — Frytol Cooking Oil 3L", targetHref: "/sales/returns", after: "GHS 68.00 cash refund" },
  { userIndex: 3, daysAgo: 6, module: "Sales", action: "refund-issued", target: "Return — Milo 400g tin", targetHref: "/sales/returns", after: "GHS 42.00 store credit" },
  { userIndex: 2, daysAgo: 10, module: "Sales", action: "refund-issued", target: "Return — Key Soap", targetHref: "/sales/returns", after: "GHS 8.50 cash refund" },
  { userIndex: 3, daysAgo: 16, module: "Sales", action: "refund-issued", target: "Return — Duracell AA (pack)", targetHref: "/sales/returns", after: "GHS 22.00 exchange" },
  { userIndex: 2, daysAgo: 21, module: "Sales", action: "refund-issued", target: "Return — Voltic 1.5L", targetHref: "/sales/returns", after: "GHS 8.00 cash refund" },
  { userIndex: 3, daysAgo: 26, module: "Sales", action: "refund-issued", target: "Return — Omo 900g", targetHref: "/sales/returns", after: "GHS 32.00 store credit" },

  // Product deactivated (3)
  { userIndex: 1, daysAgo: 11, module: "Inventory", action: "product-deactivated", target: "Discontinued: Lipton Iced Tea 500ml", targetHref: "/inventory/products", reason: "Supplier discontinued the line" },
  { userIndex: 0, daysAgo: 20, module: "Inventory", action: "product-deactivated", target: "Discontinued: Star Beer 300ml", targetHref: "/inventory/products", reason: "Slow mover, replaced by Malta Guinness variant" },
  { userIndex: 1, daysAgo: 29, module: "Inventory", action: "product-deactivated", target: "Discontinued: Trebi Biscuits", targetHref: "/inventory/products", reason: "Repeated quality complaints" },

  // User role changed (3)
  { userIndex: 0, daysAgo: 7, module: "People", action: "user-role-changed", target: "Efua Mensima", targetHref: "/people/staff", before: "Cashier", after: "Stockkeeper" },
  { userIndex: 0, daysAgo: 18, module: "People", action: "user-role-changed", target: "Abena Darko", targetHref: "/people/staff", before: "Stockkeeper", after: "Cashier" },
  { userIndex: 1, daysAgo: 28, module: "People", action: "user-role-changed", target: "Yaw Boadi", targetHref: "/people/staff", before: "Cashier", after: "Stockkeeper" },

  // Permission changed (3)
  { userIndex: 0, daysAgo: 9, module: "Settings", action: "permission-changed", target: "Manager → Settings", before: "Full", after: "View" },
  { userIndex: 0, daysAgo: 14, module: "Settings", action: "permission-changed", target: "Cashier → Inventory cost prices", before: "Visible", after: "Hidden" },
  { userIndex: 0, daysAgo: 23, module: "Settings", action: "permission-changed", target: "Stockkeeper → Money", before: "View", after: "None" },
]

export const AUDIT_LOG_SEED: AuditLogEntry[] = SPECS.map((spec, index) => {
  const { name, role } = USERS[spec.userIndex]
  return {
    id: `audit-${index + 1}`,
    dateISO: addDaysISO(TODAY_ISO, -spec.daysAgo),
    time: TIMES[index % TIMES.length],
    user: name,
    role,
    module: spec.module,
    action: spec.action,
    target: spec.target,
    targetHref: spec.targetHref,
    before: spec.before,
    after: spec.after,
    reason: spec.reason,
  }
}).sort((a, b) => (b.dateISO === a.dateISO ? b.time.localeCompare(a.time) : b.dateISO.localeCompare(a.dateISO)))

let auditLogStore: AuditLogEntry[] = [...AUDIT_LOG_SEED]

/** Entries are immutable — this is the only mutation this store ever performs: appending new ones. */
export function getAuditLogStore(): AuditLogEntry[] {
  return auditLogStore
}

export function appendAuditLogEntry(entry: Omit<AuditLogEntry, "id">): void {
  auditLogStore = [{ ...entry, id: `audit-${auditLogStore.length + 1}-${Date.now().toString(36)}` }, ...auditLogStore]
}

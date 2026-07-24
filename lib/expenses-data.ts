/**
 * Expenses — money that left the business for something other than stock.
 * Buying inventory is not spending it: a supplier bill for goods creates a
 * payable and increases inventory (see lib/money-owed-data.ts /
 * lib/purchase-orders-data.ts); it only becomes an expense as Cost of Goods
 * Sold when the item sells (see lib/reports-data.ts). There is deliberately
 * no "stock purchase" category here — recording one here would double-count
 * against inventory and silently corrupt every profit figure.
 */

import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries & wages",
  "Electricity",
  "Water",
  "Internet & airtime",
  "Transport & fuel",
  "Repairs & maintenance",
  "Packaging & supplies",
  "Bank & Momo charges",
  "Licences & rates",
  "Marketing",
  "Cleaning & security",
  "Other",
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const PAID_FROM_OPTIONS = ["Cash from till", "Momo", "Bank", "Owner's pocket"] as const
export type PaidFrom = (typeof PAID_FROM_OPTIONS)[number]

export type ExpenseStatus = "Approved" | "Pending" | "Rejected"

export const CUSTOM_CATEGORY_NOTE =
  "Stock purchases don't belong here — goods bought for resale are recorded when you receive a purchase order, and become a cost when they sell."

export interface Expense {
  id: string
  dateISO: string
  category: ExpenseCategory | string
  description: string
  amount: number
  paidFrom: PaidFrom
  paidTo: string
  reference?: string
  note?: string
  hasReceipt: boolean
  recordedBy: string
  status: ExpenseStatus
  approvedBy?: string
  approvalNote?: string
  approvalDateISO?: string
  /** True while a recurring instance is awaiting the owner's confirm/edit — separate from approval status. */
  isRecurringPending?: boolean
  fromRecurringId?: string
}

// ---------------------------------------------------------------------------
// Approval threshold — Class B in Settings → Approvals: it changes what
// counts as "needs a decision" going forward, but must not make past,
// already-approved expenses look like policy violations. getExpenseApprovalThreshold()
// always resolves the version in force today, so every existing call site
// (recordExpense, confirmRecurringExpense) keeps working unchanged.
// ---------------------------------------------------------------------------

export const DEFAULT_EXPENSE_APPROVAL_THRESHOLD = 200

export interface ExpenseApprovalThresholdVersion {
  id: string
  amount: number
  effectiveFromISO: string
  effectiveToISO?: string
}

let approvalThresholdVersions: ExpenseApprovalThresholdVersion[] = [
  { id: "exp-thr-v1", amount: DEFAULT_EXPENSE_APPROVAL_THRESHOLD, effectiveFromISO: "2022-01-01" },
]

export function getExpenseApprovalThresholdVersions(): ExpenseApprovalThresholdVersion[] {
  return approvalThresholdVersions
}

function thresholdVersionAsOf(asOfISO: string = TODAY_ISO): ExpenseApprovalThresholdVersion | undefined {
  return [...approvalThresholdVersions].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledExpenseApprovalThreshold(asOfISO: string = TODAY_ISO): ExpenseApprovalThresholdVersion | undefined {
  return approvalThresholdVersions.find((v) => v.effectiveFromISO > asOfISO)
}

function dayBeforeIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function getExpenseApprovalThreshold(): number {
  return thresholdVersionAsOf()?.amount ?? DEFAULT_EXPENSE_APPROVAL_THRESHOLD
}

export function addExpenseApprovalThresholdVersion(amount: number, effectiveFromISO: string): void {
  const closed = approvalThresholdVersions.map((v) =>
    !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBeforeIso(effectiveFromISO) } : v
  )
  approvalThresholdVersions = [...closed, { id: `exp-thr-v${closed.length + 1}-${Date.now().toString(36)}`, amount, effectiveFromISO }]
}

export function cancelScheduledExpenseApprovalThreshold(): void {
  const scheduled = scheduledExpenseApprovalThreshold()
  if (!scheduled) return
  approvalThresholdVersions = approvalThresholdVersions
    .filter((v) => v.id !== scheduled.id)
    .map((v) => (v.effectiveToISO === dayBeforeIso(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
}

// ---------------------------------------------------------------------------
// Recurring definitions
// ---------------------------------------------------------------------------

export interface RecurringExpenseDefinition {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  paidFrom: PaidFrom
  paidTo: string
  /** Day of the month the pending entry generates on. */
  dayOfMonth: number
  active: boolean
}

export const RECURRING_DEFINITIONS: RecurringExpenseDefinition[] = [
  { id: "rec-rent", category: "Rent", description: "Shop rent", amount: 1200, paidFrom: "Bank", paidTo: "Makola Landlords Association", dayOfMonth: 1, active: true },
  { id: "rec-salaries", category: "Salaries & wages", description: "Staff salaries", amount: 3400, paidFrom: "Bank", paidTo: "Payroll", dayOfMonth: 28, active: true },
  { id: "rec-internet", category: "Internet & airtime", description: "Shop internet & airtime bundle", amount: 250, paidFrom: "Momo", paidTo: "MTN Ghana", dayOfMonth: 5, active: true },
  { id: "rec-security", category: "Cleaning & security", description: "Security service contract", amount: 400, paidFrom: "Bank", paidTo: "SecureGuard Services", dayOfMonth: 3, active: true },
]

// ---------------------------------------------------------------------------
// Seed data — ~30 expenses over the last 60 days
// ---------------------------------------------------------------------------

const PAID_TO_BY_CATEGORY: Record<ExpenseCategory, string> = {
  Rent: "Makola Landlords Association",
  "Salaries & wages": "Payroll",
  Electricity: "ECG",
  Water: "Ghana Water Company",
  "Internet & airtime": "MTN Ghana",
  "Transport & fuel": "Goil Filling Station",
  "Repairs & maintenance": "Kwame's Repairs",
  "Packaging & supplies": "Accra Packaging Supplies",
  "Bank & Momo charges": "GCB Bank",
  "Licences & rates": "Accra Metropolitan Assembly",
  Marketing: "Various",
  "Cleaning & security": "SecureGuard Services",
  Other: "Sundry",
}

const DESCRIPTION_BY_CATEGORY: Record<ExpenseCategory, string> = {
  Rent: "Monthly shop rent",
  "Salaries & wages": "Staff salaries",
  Electricity: "ECG prepaid top-up",
  Water: "Water bill",
  "Internet & airtime": "Airtime & data bundle",
  "Transport & fuel": "Fuel for deliveries",
  "Repairs & maintenance": "Shelving repair",
  "Packaging & supplies": "Carrier bags & tape",
  "Bank & Momo charges": "Momo cash-out charges",
  "Licences & rates": "Business operating permit",
  Marketing: "Flyers for weekend promo",
  "Cleaning & security": "Cleaning supplies",
  Other: "Sundry expense",
}

const SEED_ROTATION: { category: ExpenseCategory; amount: number; paidFrom: PaidFrom; hasReceipt: boolean }[] = [
  { category: "Transport & fuel", amount: 45, paidFrom: "Cash from till", hasReceipt: false },
  { category: "Packaging & supplies", amount: 120, paidFrom: "Cash from till", hasReceipt: true },
  { category: "Electricity", amount: 380, paidFrom: "Momo", hasReceipt: true },
  { category: "Water", amount: 95, paidFrom: "Bank", hasReceipt: false },
  { category: "Bank & Momo charges", amount: 22, paidFrom: "Momo", hasReceipt: false },
  { category: "Repairs & maintenance", amount: 260, paidFrom: "Bank", hasReceipt: true },
  { category: "Marketing", amount: 150, paidFrom: "Momo", hasReceipt: true },
  { category: "Cleaning & security", amount: 60, paidFrom: "Cash from till", hasReceipt: false },
  { category: "Transport & fuel", amount: 70, paidFrom: "Owner's pocket", hasReceipt: false },
  { category: "Licences & rates", amount: 450, paidFrom: "Bank", hasReceipt: true },
  { category: "Other", amount: 35, paidFrom: "Cash from till", hasReceipt: false },
  { category: "Packaging & supplies", amount: 90, paidFrom: "Momo", hasReceipt: false },
]

function buildSeedExpenses(): Expense[] {
  const expenses: Expense[] = []
  let counter = 0

  for (let i = 0; i < 28; i++) {
    const rotation = SEED_ROTATION[i % SEED_ROTATION.length]
    const daysAgo = 2 + i * 2 // spread across ~56 days
    counter += 1
    const amount = rotation.amount + (i % 5) * 6
    const status: ExpenseStatus = i === 3 || i === 17 ? "Pending" : "Approved"
    expenses.push({
      id: `exp-${counter}`,
      dateISO: addDaysISO(TODAY_ISO, -daysAgo),
      category: rotation.category,
      description: DESCRIPTION_BY_CATEGORY[rotation.category],
      amount,
      paidFrom: rotation.paidFrom,
      paidTo: PAID_TO_BY_CATEGORY[rotation.category],
      reference: rotation.paidFrom === "Momo" ? `MM-${8800 + counter}` : undefined,
      hasReceipt: rotation.hasReceipt,
      recordedBy: i % 3 === 0 ? "Yaw Boadi" : "Adjoa Boateng",
      status,
      approvedBy: status === "Approved" ? "Adjoa Boateng" : undefined,
      approvalDateISO: status === "Approved" ? addDaysISO(TODAY_ISO, -daysAgo) : undefined,
    })
  }

  // Three expenses paid from the till, dated today — these must visibly
  // reduce expected cash at Day close.
  expenses.push(
    { id: "exp-till-1", dateISO: TODAY_ISO, category: "Transport & fuel", description: "Okada fare — bank errand", amount: 25, paidFrom: "Cash from till", paidTo: "Rider", hasReceipt: false, recordedBy: "Adjoa Boateng", status: "Approved", approvedBy: "Adjoa Boateng", approvalDateISO: TODAY_ISO },
    { id: "exp-till-2", dateISO: TODAY_ISO, category: "Packaging & supplies", description: "Extra carrier bags", amount: 40, paidFrom: "Cash from till", paidTo: "Accra Packaging Supplies", hasReceipt: true, recordedBy: "Adjoa Boateng", status: "Approved", approvedBy: "Adjoa Boateng", approvalDateISO: TODAY_ISO },
    { id: "exp-till-3", dateISO: TODAY_ISO, category: "Other", description: "Change float top-up shortfall", amount: 115, paidFrom: "Cash from till", paidTo: "Sundry", hasReceipt: false, recordedBy: "Yaw Boadi", status: "Pending" }
  )

  // A recurring instance still awaiting confirmation.
  expenses.push({
    id: "exp-recurring-pending",
    dateISO: addDaysISO(TODAY_ISO, -17),
    category: "Internet & airtime",
    description: "Shop internet & airtime bundle",
    amount: 250,
    paidFrom: "Momo",
    paidTo: "MTN Ghana",
    hasReceipt: false,
    recordedBy: "System",
    status: "Pending",
    isRecurringPending: true,
    fromRecurringId: "rec-internet",
  })

  return expenses
}

let expensesStore: Expense[] = buildSeedExpenses()

export function getExpensesStore(): Expense[] {
  return expensesStore
}

export function setExpensesStore(next: Expense[]): void {
  expensesStore = next
}

export function getExpense(id: string): Expense | undefined {
  return expensesStore.find((e) => e.id === id)
}

let customCategoriesStore: string[] = []

export function getCustomCategories(): string[] {
  return customCategoriesStore
}

export function addCustomCategory(name: string): void {
  const trimmed = name.trim()
  if (!trimmed || customCategoriesStore.includes(trimmed) || (EXPENSE_CATEGORIES as readonly string[]).includes(trimmed)) return
  customCategoriesStore = [...customCategoriesStore, trimmed]
}

let expenseCounter = 100

function nextExpenseId(): string {
  expenseCounter += 1
  return `exp-new-${expenseCounter}`
}

export interface RecordExpenseInput {
  dateISO: string
  category: string
  description: string
  amount: number
  paidFrom: PaidFrom
  paidTo: string
  reference?: string
  note?: string
  hasReceipt: boolean
  recordedBy: string
}

export function recordExpense(input: RecordExpenseInput): Expense {
  const threshold = getExpenseApprovalThreshold()
  const expense: Expense = {
    ...input,
    id: nextExpenseId(),
    status: input.amount > threshold ? "Pending" : "Approved",
    approvedBy: input.amount > threshold ? undefined : input.recordedBy,
    approvalDateISO: input.amount > threshold ? undefined : input.dateISO,
  }
  expensesStore = [expense, ...expensesStore]
  return expense
}

export function updateExpense(id: string, patch: Partial<RecordExpenseInput>): void {
  expensesStore = expensesStore.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

export function approveExpense(id: string, approvedBy: string, note?: string): void {
  expensesStore = expensesStore.map((e) =>
    e.id === id ? { ...e, status: "Approved", approvedBy, approvalNote: note, approvalDateISO: TODAY_ISO } : e
  )
}

export function rejectExpense(id: string, approvedBy: string, reason: string): void {
  expensesStore = expensesStore.map((e) =>
    e.id === id ? { ...e, status: "Rejected", approvedBy, approvalNote: reason, approvalDateISO: TODAY_ISO } : e
  )
}

export function deleteExpense(id: string, reason: string): void {
  void reason
  expensesStore = expensesStore.filter((e) => e.id !== id)
}

/** Confirming a recurring instance posts it as a real expense — still subject to the approval threshold. */
export function confirmRecurringExpense(id: string, patch: Partial<RecordExpenseInput> | undefined, confirmedBy: string): void {
  const threshold = getExpenseApprovalThreshold()
  expensesStore = expensesStore.map((e) => {
    if (e.id !== id) return e
    const merged = { ...e, ...patch }
    const overThreshold = merged.amount > threshold
    return {
      ...merged,
      isRecurringPending: false,
      status: overThreshold ? "Pending" : "Approved",
      approvedBy: overThreshold ? undefined : confirmedBy,
      approvalDateISO: overThreshold ? undefined : TODAY_ISO,
    }
  })
}

/** Money paid out of the till today — this is the link Day close reads for its expected-cash breakdown. */
export function cashExpensesFromTillToday(dateISO: string = TODAY_ISO): number {
  return expensesStore
    .filter((e) => e.dateISO === dateISO && e.paidFrom === "Cash from till" && e.status !== "Rejected" && !e.isRecurringPending)
    .reduce((sum, e) => sum + e.amount, 0)
}

export function expensesInRange(fromISO: string, toISO: string): Expense[] {
  return expensesStore.filter((e) => !e.isRecurringPending && e.status === "Approved" && e.dateISO >= fromISO && e.dateISO <= toISO)
}

/**
 * Reports — pure aggregation functions over the other data modules. Kept
 * separate from any UI so every report view can stay a plain table with one
 * small chart, per the brief: "keep every report presentation plain."
 *
 * The Profit & Loss report is the one that proves principle 1 (stock
 * purchases are not expenses): gross profit is sales revenue minus Cost of
 * Goods Sold (from inventory consumed by sales), and only THEN are operating
 * expenses (from lib/expenses-data.ts) subtracted to reach net profit.
 */

import { getProductByName, getProductsStore, totalOnHand, type Product } from "@/lib/pos-data"
import { getExpensesStore, expensesInRange } from "@/lib/expenses-data"
import { getSalesRecordsStore, RETURNS_RECORDS, type SaleRecord } from "@/lib/sales-data"
import { getReceivables, getPayables, AGEING_BUCKET_LABELS, type AgeingBucket } from "@/lib/money-owed-data"
import { getLoyaltyMembersStore, pointsToGHS, daysSinceLastVisit } from "@/lib/loyalty-data"
import { getMovementsStore, MOVEMENT_TYPES, type MovementType } from "@/lib/stock-movements-data"
import { getOverrideLogStore } from "@/lib/pricing-engine-data"
import { computeTaxLines, INITIAL_TAX_RATES } from "@/lib/settings-data"

function costOf(lineItemName: string): number {
  return getProductByName(lineItemName)?.costPrice ?? 0
}

function categoryOf(lineItemName: string): string {
  return getProductByName(lineItemName)?.category ?? "Uncategorised"
}

function completedSalesInRange(fromISO: string, toISO: string): SaleRecord[] {
  return getSalesRecordsStore().filter((s) => s.status === "Completed" && s.dateISO >= fromISO && s.dateISO <= toISO)
}

// ---------------------------------------------------------------------------
// Profit & loss
// ---------------------------------------------------------------------------

export interface ProfitLossReport {
  salesRevenue: number
  cogs: number
  grossProfit: number
  operatingExpenses: number
  netProfit: number
}

export function computeProfitLoss(fromISO: string, toISO: string): ProfitLossReport {
  const sales = completedSalesInRange(fromISO, toISO)
  const salesRevenue = Math.round(sales.reduce((sum, s) => sum + s.amount, 0) * 100) / 100
  const cogs =
    Math.round(
      sales.reduce((sum, s) => sum + s.lineItems.reduce((lineSum, li) => lineSum + li.quantity * costOf(li.name), 0), 0) * 100
    ) / 100
  const grossProfit = Math.round((salesRevenue - cogs) * 100) / 100
  const operatingExpenses = Math.round(expensesInRange(fromISO, toISO).reduce((sum, e) => sum + e.amount, 0) * 100) / 100
  const netProfit = Math.round((grossProfit - operatingExpenses) * 100) / 100
  return { salesRevenue, cogs, grossProfit, operatingExpenses, netProfit }
}

// ---------------------------------------------------------------------------
// Sales performance
// ---------------------------------------------------------------------------

export interface SalesPerformanceReport {
  totalRevenue: number
  totalTransactions: number
  byProduct: { name: string; quantity: number; revenue: number }[]
  byCategory: { category: string; revenue: number }[]
  byCashier: { cashier: string; revenue: number; transactions: number }[]
  byPaymentType: { type: string; revenue: number; transactions: number }[]
}

export function computeSalesPerformance(fromISO: string, toISO: string): SalesPerformanceReport {
  const sales = completedSalesInRange(fromISO, toISO)

  const byProductMap = new Map<string, { quantity: number; revenue: number }>()
  const byCategoryMap = new Map<string, number>()
  for (const sale of sales) {
    for (const li of sale.lineItems) {
      const row = byProductMap.get(li.name) ?? { quantity: 0, revenue: 0 }
      row.quantity += li.quantity
      row.revenue += li.quantity * li.unitPrice
      byProductMap.set(li.name, row)
      byCategoryMap.set(categoryOf(li.name), (byCategoryMap.get(categoryOf(li.name)) ?? 0) + li.quantity * li.unitPrice)
    }
  }

  const byCashierMap = new Map<string, { revenue: number; transactions: number }>()
  const byPaymentMap = new Map<string, { revenue: number; transactions: number }>()
  for (const sale of sales) {
    const cashierRow = byCashierMap.get(sale.cashier) ?? { revenue: 0, transactions: 0 }
    cashierRow.revenue += sale.amount
    cashierRow.transactions += 1
    byCashierMap.set(sale.cashier, cashierRow)

    const paymentRow = byPaymentMap.get(sale.type) ?? { revenue: 0, transactions: 0 }
    paymentRow.revenue += sale.amount
    paymentRow.transactions += 1
    byPaymentMap.set(sale.type, paymentRow)
  }

  return {
    totalRevenue: Math.round(sales.reduce((sum, s) => sum + s.amount, 0) * 100) / 100,
    totalTransactions: sales.length,
    byProduct: Array.from(byProductMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue),
    byCategory: Array.from(byCategoryMap.entries()).map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue),
    byCashier: Array.from(byCashierMap.entries()).map(([cashier, v]) => ({ cashier, ...v })).sort((a, b) => b.revenue - a.revenue),
    byPaymentType: Array.from(byPaymentMap.entries()).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.revenue - a.revenue),
  }
}

// ---------------------------------------------------------------------------
// Cashier report — the quiet accountability layer
// ---------------------------------------------------------------------------

export interface CashierReportRow {
  cashier: string
  sales: number
  transactions: number
  discountsApplied: number
  returns: number
}

export function computeCashierReport(fromISO: string, toISO: string): CashierReportRow[] {
  const sales = completedSalesInRange(fromISO, toISO)
  const returns = RETURNS_RECORDS.filter((r) => r.dateISO >= fromISO && r.dateISO <= toISO)

  const rows = new Map<string, CashierReportRow>()
  for (const sale of sales) {
    const row = rows.get(sale.cashier) ?? { cashier: sale.cashier, sales: 0, transactions: 0, discountsApplied: 0, returns: 0 }
    row.sales += sale.amount
    row.transactions += 1
    row.discountsApplied += (sale.discountsApplied ?? []).reduce((sum, d) => sum + d.amount, 0)
    rows.set(sale.cashier, row)
  }
  // Returns aren't tied to a specific cashier in the current data model — folded into a shared row.
  if (returns.length > 0) {
    const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0)
    const shared = rows.get("Adjoa Boateng") ?? { cashier: "Adjoa Boateng", sales: 0, transactions: 0, discountsApplied: 0, returns: 0 }
    shared.returns += totalReturns
    rows.set("Adjoa Boateng", shared)
  }

  return Array.from(rows.values()).sort((a, b) => b.sales - a.sales)
}

/** Manager overrides aren't attributable to a specific cashier in this prototype's data model — shown as one figure for the period. */
export function managerOverridesCountInRange(fromISO: string, toISO: string): number {
  return getOverrideLogStore().filter((o) => o.dateISO >= fromISO && o.dateISO <= toISO).length
}

// ---------------------------------------------------------------------------
// Credit ageing / supplier bills due — thin wrappers for a single reports surface
// ---------------------------------------------------------------------------

export { getReceivables, getPayables, AGEING_BUCKET_LABELS, type AgeingBucket }

// ---------------------------------------------------------------------------
// Stock valuation & movement
// ---------------------------------------------------------------------------

export interface StockValuationReport {
  totalValue: number
  byCategory: { category: string; value: number; units: number }[]
  movementCountsByType: Record<MovementType, number>
}

export function computeStockValuation(fromISO: string, toISO: string): StockValuationReport {
  const products: Product[] = getProductsStore().filter((p) => p.isActive)
  const byCategory = new Map<string, { value: number; units: number }>()
  let totalValue = 0
  for (const p of products) {
    const units = totalOnHand(p)
    const value = units * p.costPrice
    totalValue += value
    const row = byCategory.get(p.category) ?? { value: 0, units: 0 }
    row.value += value
    row.units += units
    byCategory.set(p.category, row)
  }

  const movements = getMovementsStore().filter((m) => {
    const dateISO = m.type === "Transfer" ? m.createdDateISO : m.dateISO
    return dateISO >= fromISO && dateISO <= toISO
  })
  const movementCountsByType = Object.fromEntries(MOVEMENT_TYPES.map((t) => [t, 0])) as Record<MovementType, number>
  for (const m of movements) movementCountsByType[m.type] += 1

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    byCategory: Array.from(byCategory.entries()).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.value - a.value),
    movementCountsByType,
  }
}

// ---------------------------------------------------------------------------
// Expenses by category
// ---------------------------------------------------------------------------

export function computeExpensesByCategory(fromISO: string, toISO: string): { category: string; amount: number; count: number }[] {
  const rows = new Map<string, { amount: number; count: number }>()
  for (const e of getExpensesStore()) {
    if (e.isRecurringPending || e.status === "Rejected") continue
    if (e.dateISO < fromISO || e.dateISO > toISO) continue
    const row = rows.get(e.category) ?? { amount: 0, count: 0 }
    row.amount += e.amount
    row.count += 1
    rows.set(e.category, row)
  }
  return Array.from(rows.entries()).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.amount - a.amount)
}

// ---------------------------------------------------------------------------
// Customer & loyalty
// ---------------------------------------------------------------------------

export interface CustomerLoyaltyReport {
  topCustomers: { name: string; lifetimeSpend: number; tier: string }[]
  lapsedCount: number
  pointsLiabilityGHS: number
}

export function computeCustomerLoyaltyReport(): CustomerLoyaltyReport {
  const members = getLoyaltyMembersStore().filter((m) => m.status === "Active")
  const topCustomers = [...members]
    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
    .slice(0, 10)
    .map((m) => ({ name: m.name, lifetimeSpend: m.lifetimeSpend, tier: m.tier }))
  const lapsedCount = members.filter((m) => daysSinceLastVisit(m) > 60).length
  const pointsLiabilityGHS = Math.round(members.reduce((sum, m) => sum + pointsToGHS(m.points), 0) * 100) / 100
  return { topCustomers, lapsedCount, pointsLiabilityGHS }
}

// ---------------------------------------------------------------------------
// Discounts given
// ---------------------------------------------------------------------------

export interface DiscountsGivenReport {
  totalDiscounted: number
  byLabel: { label: string; amount: number; count: number }[]
  overrides: { dateISO: string; approvingUser: string; reason: string; context: string }[]
}

export function computeDiscountsGiven(fromISO: string, toISO: string): DiscountsGivenReport {
  const sales = completedSalesInRange(fromISO, toISO)
  const byLabel = new Map<string, { amount: number; count: number }>()
  let totalDiscounted = 0
  for (const sale of sales) {
    for (const d of sale.discountsApplied ?? []) {
      totalDiscounted += d.amount
      const row = byLabel.get(d.label) ?? { amount: 0, count: 0 }
      row.amount += d.amount
      row.count += 1
      byLabel.set(d.label, row)
    }
  }
  const overrides = getOverrideLogStore()
    .filter((o) => o.dateISO >= fromISO && o.dateISO <= toISO)
    .map((o) => ({ dateISO: o.dateISO, approvingUser: o.approvingUser, reason: o.reason, context: o.context }))

  return {
    totalDiscounted: Math.round(totalDiscounted * 100) / 100,
    byLabel: Array.from(byLabel.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.amount - a.amount),
    overrides,
  }
}

// ---------------------------------------------------------------------------
// Tax summary
// ---------------------------------------------------------------------------

export interface TaxSummaryReport {
  taxableRevenue: number
  lines: { label: string; amount: number }[]
  totalTax: number
}

/** Sales don't currently persist a per-sale tax breakdown, so this re-derives an estimate from the period total using the current tax settings — captioned as an estimate wherever it's shown. */
export function computeTaxSummary(fromISO: string, toISO: string): TaxSummaryReport {
  const sales = completedSalesInRange(fromISO, toISO)
  const taxableRevenue = Math.round(sales.reduce((sum, s) => sum + s.amount, 0) * 100) / 100
  const lines = computeTaxLines(taxableRevenue, INITIAL_TAX_RATES)
  const totalTax = Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100
  return { taxableRevenue, lines, totalTax }
}

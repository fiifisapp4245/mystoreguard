/**
 * Money owed — accounts receivable and payable in one workspace. These are
 * balance-sheet items, not expenses: paying a supplier bill for stock
 * settles a liability, it does not create an expense (that already happened,
 * as Cost of Goods Sold, when the stock sells — see lib/reports-data.ts).
 * Paying a bill for a non-stock supplier (electricity, cleaning) creates the
 * expense at bill time (lib/expenses-data.ts), not at payment.
 */

import { CUSTOMERS } from "@/lib/mock-data"
import { getInvoicesStore, setInvoicesStore, recomputeInvoiceStatus, type Invoice } from "@/lib/invoice-data"
import { getLoyaltyMembersStore, setLoyaltyMembersStore, type LoyaltyMember } from "@/lib/loyalty-data"
import { getPurchaseOrdersStore, setPurchaseOrdersStore, type PurchaseOrder } from "@/lib/purchase-orders-data"
import { addDaysISO, daysBetween, TODAY_ISO } from "@/lib/period-utils"

export type AgeingBucket = "current" | "1-30" | "31-60" | "60+"

export const AGEING_BUCKET_LABELS: Record<AgeingBucket, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "60+": "60+ days",
}

export function ageingBucketFor(daysOverdue: number): AgeingBucket {
  if (daysOverdue <= 0) return "current"
  if (daysOverdue <= 30) return "1-30"
  if (daysOverdue <= 60) return "31-60"
  return "60+"
}

// ---------------------------------------------------------------------------
// Receivables — owed to me
// ---------------------------------------------------------------------------

export type ReceivableSource = "invoice" | "credit-sale"

export interface ReceivableEntry {
  id: string
  source: ReceivableSource
  customerName: string
  customerPhone?: string
  document: string
  documentHref: string
  amount: number
  amountPaid: number
  balance: number
  dueDateISO: string
  daysOverdue: number
  bucket: AgeingBucket
}

function phoneForCustomerName(name: string): string | undefined {
  return CUSTOMERS.find((c) => c.name === name)?.phone
}

export function getReceivables(): ReceivableEntry[] {
  const invoiceEntries: ReceivableEntry[] = getInvoicesStore()
    .filter((inv) => inv.status !== "Void" && inv.balance > 0)
    .map((inv) => {
      const daysOverdue = daysBetween(inv.dueDate, TODAY_ISO)
      return {
        id: `recv-inv-${inv.id}`,
        source: "invoice",
        customerName: inv.customer,
        customerPhone: phoneForCustomerName(inv.customer),
        document: inv.id,
        documentHref: "/invoice/invoices",
        amount: inv.total,
        amountPaid: inv.amountPaid,
        balance: inv.balance,
        dueDateISO: inv.dueDate,
        daysOverdue,
        bucket: ageingBucketFor(daysOverdue),
      }
    })

  const creditEntries: ReceivableEntry[] = getLoyaltyMembersStore()
    .filter((m) => m.status === "Active" && m.creditBalance > 0)
    .map((m) => {
      // No explicit due date is captured against a credit balance today —
      // a standard 30-day term from the member's last visit is assumed.
      const dueDateISO = addDaysISO(m.lastVisitISO, 30)
      const daysOverdue = daysBetween(dueDateISO, TODAY_ISO)
      return {
        id: `recv-credit-${m.id}`,
        source: "credit-sale",
        customerName: m.name,
        customerPhone: m.phone,
        document: `Credit — ${m.id}`,
        documentHref: "/loyalty/loyalty-members",
        amount: m.creditBalance,
        amountPaid: 0,
        balance: m.creditBalance,
        dueDateISO,
        daysOverdue,
        bucket: ageingBucketFor(daysOverdue),
      }
    })

  return [...invoiceEntries, ...creditEntries].sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export function receivablesTotal(entries: ReceivableEntry[] = getReceivables()): number {
  return Math.round(entries.reduce((sum, e) => sum + e.balance, 0) * 100) / 100
}

export function receivablesByBucket(entries: ReceivableEntry[] = getReceivables()): Record<AgeingBucket, number> {
  const totals: Record<AgeingBucket, number> = { current: 0, "1-30": 0, "31-60": 0, "60+": 0 }
  for (const e of entries) totals[e.bucket] += e.balance
  return totals
}

export function recordReceivablePayment(entry: ReceivableEntry, amount: number): void {
  if (entry.source === "invoice") {
    const invoiceId = entry.document
    const invoices = getInvoicesStore()
    const invoice = invoices.find((i) => i.id === invoiceId)
    if (!invoice) return
    const nextAmountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100
    const nextBalance = Math.max(0, Math.round((invoice.total - nextAmountPaid) * 100) / 100)
    const nextStatus = recomputeInvoiceStatus(invoice.total, nextAmountPaid, invoice.dueDate, TODAY_ISO)
    setInvoicesStore(
      invoices.map((i): Invoice => (i.id === invoiceId ? { ...i, amountPaid: nextAmountPaid, balance: nextBalance, status: nextStatus } : i))
    )
  } else {
    const memberId = entry.document.replace("Credit — ", "")
    const members = getLoyaltyMembersStore()
    setLoyaltyMembersStore(
      members.map((m): LoyaltyMember => (m.id === memberId ? { ...m, creditBalance: Math.max(0, Math.round((m.creditBalance - amount) * 100) / 100) } : m))
    )
  }
}

// ---------------------------------------------------------------------------
// Payables — I owe
// ---------------------------------------------------------------------------

export type PayableTag = "inventory" | "operating"
export type PayableMethod = "Cash" | "Momo" | "Bank transfer"

export interface OperatingBillInput {
  id: string
  supplierName: string
  billReference: string
  amount: number
  amountPaid: number
  issueDateISO: string
  dueDateISO: string
  isPaid: boolean
  expenseCategory: string
}

const OPERATING_BILLS_SEED: OperatingBillInput[] = [
  { id: "opbill-1", supplierName: "ECG (Electricity Company of Ghana)", billReference: "ECG-771402", amount: 620, amountPaid: 0, issueDateISO: "2026-06-20", dueDateISO: "2026-07-05", isPaid: false, expenseCategory: "Electricity" },
  { id: "opbill-2", supplierName: "Ghana Water Company", billReference: "GWCL-33012", amount: 210, amountPaid: 0, issueDateISO: "2026-07-15", dueDateISO: "2026-07-30", isPaid: false, expenseCategory: "Water" },
  { id: "opbill-3", supplierName: "Vodafone Business Fibre", billReference: "VF-90211", amount: 480, amountPaid: 0, issueDateISO: "2026-06-25", dueDateISO: "2026-07-10", isPaid: false, expenseCategory: "Internet & airtime" },
  { id: "opbill-4", supplierName: "SecureGuard Services", billReference: "SGS-4471", amount: 400, amountPaid: 0, issueDateISO: "2026-04-20", dueDateISO: "2026-05-05", isPaid: false, expenseCategory: "Cleaning & security" },
]

let operatingBillsStore: OperatingBillInput[] = OPERATING_BILLS_SEED.map((b) => ({ ...b }))

export function getOperatingBillsStore(): OperatingBillInput[] {
  return operatingBillsStore
}

export function setOperatingBillsStore(next: OperatingBillInput[]): void {
  operatingBillsStore = next
}

export interface PayableEntry {
  id: string
  tag: PayableTag
  supplierName: string
  reference: string
  amount: number
  amountPaid: number
  balance: number
  dueDateISO: string
  daysOverdue: number
  bucket: AgeingBucket
  poId?: string
  operatingBillId?: string
}

export function getPayables(): PayableEntry[] {
  const inventoryEntries: PayableEntry[] = getPurchaseOrdersStore()
    .filter((po) => po.bill && !po.bill.isPaid)
    .map((po) => {
      const bill = po.bill!
      const dueDateISO = billDueDate(bill.invoiceDate, bill.paymentTerms)
      const daysOverdue = daysBetween(dueDateISO, TODAY_ISO)
      return {
        id: `pay-po-${po.id}`,
        tag: "inventory" as PayableTag,
        supplierName: po.supplierName,
        reference: bill.invoiceNumber,
        amount: bill.amount,
        amountPaid: 0,
        balance: bill.amount,
        dueDateISO,
        daysOverdue,
        bucket: ageingBucketFor(daysOverdue),
        poId: po.id,
      }
    })

  const operatingEntries: PayableEntry[] = getOperatingBillsStore()
    .filter((b) => !b.isPaid)
    .map((b) => {
      const daysOverdue = daysBetween(b.dueDateISO, TODAY_ISO)
      return {
        id: `pay-op-${b.id}`,
        tag: "operating" as PayableTag,
        supplierName: b.supplierName,
        reference: b.billReference,
        amount: b.amount,
        amountPaid: b.amountPaid,
        balance: Math.max(0, b.amount - b.amountPaid),
        dueDateISO: b.dueDateISO,
        daysOverdue,
        bucket: ageingBucketFor(daysOverdue),
        operatingBillId: b.id,
      }
    })

  return [...inventoryEntries, ...operatingEntries].sort((a, b) => b.daysOverdue - a.daysOverdue)
}

function billDueDate(invoiceDateISO: string, paymentTerms: string): string {
  const match = paymentTerms.match(/\d+/)
  const days = match ? Number.parseInt(match[0], 10) : 30
  return addDaysISO(invoiceDateISO, days)
}

export function payablesTotal(entries: PayableEntry[] = getPayables()): number {
  return Math.round(entries.reduce((sum, e) => sum + e.balance, 0) * 100) / 100
}

export function payablesByBucket(entries: PayableEntry[] = getPayables()): Record<AgeingBucket, number> {
  const totals: Record<AgeingBucket, number> = { current: 0, "1-30": 0, "31-60": 0, "60+": 0 }
  for (const e of entries) totals[e.bucket] += e.balance
  return totals
}

export function isDueThisWeek(entry: PayableEntry): boolean {
  return entry.daysOverdue <= 0 && entry.daysOverdue >= -7
}

/** Paying a supplier bill settles a liability — it never creates an Expense entry (that already happened at bill time for operating bills, or happens as COGS on sale for inventory bills). */
export function recordPayablePayment(entry: PayableEntry, amount: number): void {
  if (entry.tag === "inventory" && entry.poId) {
    const pos = getPurchaseOrdersStore()
    setPurchaseOrdersStore(
      pos.map((po): PurchaseOrder => {
        if (po.id !== entry.poId || !po.bill) return po
        const remaining = po.bill.amount - amount
        return { ...po, bill: { ...po.bill, isPaid: remaining <= 0.01 } }
      })
    )
  } else if (entry.operatingBillId) {
    setOperatingBillsStore(
      operatingBillsStore.map((b) => {
        if (b.id !== entry.operatingBillId) return b
        const nextPaid = b.amountPaid + amount
        return { ...b, amountPaid: nextPaid, isPaid: nextPaid >= b.amount - 0.01 }
      })
    )
  }
}

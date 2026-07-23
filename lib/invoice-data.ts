/**
 * Mock data for the Invoice hub. Plain typed arrays, no backend — matches
 * the Sales/People hub convention. Numbering is continuous (INV-2036,
 * INV-2037, ...), not per-year.
 */

import { computeTaxLines, type TaxRate } from "@/lib/settings-data"

export type InvoiceStatus = "Draft" | "Sent" | "Partially paid" | "Paid" | "Overdue" | "Void"
export type PaymentMethod = "Cash" | "Momo" | "Bank transfer" | "Cheque"

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Momo", "Bank transfer", "Cheque"]

export interface InvoiceLineItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface TaxLine {
  label: string
  amount: number
}

export interface Invoice {
  id: string
  customer: string
  issueDate: string
  /** Empty string for drafts that haven't been sent yet. */
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  discount: number
  taxLines: TaxLine[]
  total: number
  amountPaid: number
  balance: number
  status: InvoiceStatus
  note?: string
  /** Set when this invoice was created "from a sale". */
  fromReceiptNo?: string
  /** Set when this invoice was converted from an accepted quotation. */
  fromQuotationNo?: string
}

export const INVOICES: Invoice[] = [
  {
    id: "INV-2036",
    customer: "Nana Yeboah",
    issueDate: "2026-07-05",
    dueDate: "2026-07-15",
    lineItems: [
      { name: "Royal Aroma Rice 5kg", quantity: 10, unitPrice: 82 },
      { name: "Perfumed Rice 5kg", quantity: 5, unitPrice: 78 },
    ],
    subtotal: 1210,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 181.5 },
      { label: "NHIL (2.5%)", amount: 30.25 },
      { label: "GETFund (2.5%)", amount: 30.25 },
      { label: "COVID levy (1%)", amount: 12.1 },
    ],
    total: 1464.1,
    amountPaid: 1464.1,
    balance: 0,
    status: "Paid",
  },
  {
    id: "INV-2037",
    customer: "Efua Owusu",
    issueDate: "2026-07-22",
    dueDate: "",
    lineItems: [
      { name: "Indomie Chicken Noodles", quantity: 50, unitPrice: 6 },
      { name: "Key Soap", quantity: 20, unitPrice: 8.5 },
    ],
    subtotal: 470,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 70.5 },
      { label: "NHIL (2.5%)", amount: 11.75 },
      { label: "GETFund (2.5%)", amount: 11.75 },
      { label: "COVID levy (1%)", amount: 4.7 },
    ],
    total: 568.7,
    amountPaid: 0,
    balance: 568.7,
    status: "Draft",
  },
  {
    id: "INV-2038",
    customer: "Yaw Asante",
    issueDate: "2026-06-25",
    dueDate: "2026-07-10",
    lineItems: [
      { name: "Frytol Cooking Oil 3L", quantity: 15, unitPrice: 92 },
      { name: "Omo 900g", quantity: 10, unitPrice: 32 },
    ],
    subtotal: 1700,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 255 },
      { label: "NHIL (2.5%)", amount: 42.5 },
      { label: "GETFund (2.5%)", amount: 42.5 },
      { label: "COVID levy (1%)", amount: 17 },
    ],
    total: 2057,
    amountPaid: 0,
    balance: 2057,
    status: "Overdue",
  },
  {
    id: "INV-2039",
    customer: "Ama Serwaa",
    issueDate: "2026-07-08",
    dueDate: "2026-07-25",
    lineItems: [
      { name: "Lipton Tea 25s", quantity: 20, unitPrice: 18 },
      { name: "Geisha Sardines", quantity: 15, unitPrice: 12 },
    ],
    subtotal: 540,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 81 },
      { label: "NHIL (2.5%)", amount: 13.5 },
      { label: "GETFund (2.5%)", amount: 13.5 },
      { label: "COVID levy (1%)", amount: 5.4 },
    ],
    total: 653.4,
    amountPaid: 326.7,
    balance: 326.7,
    status: "Partially paid",
  },
  {
    id: "INV-2040",
    customer: "Kofi Boateng",
    issueDate: "2026-07-10",
    dueDate: "2026-07-20",
    lineItems: [
      { name: "Royal Aroma Rice 5kg", quantity: 20, unitPrice: 82 },
      { name: "Voltic 1.5L", quantity: 50, unitPrice: 8 },
    ],
    subtotal: 2040,
    discount: 50,
    taxLines: [
      { label: "VAT (15%)", amount: 306 },
      { label: "NHIL (2.5%)", amount: 51 },
      { label: "GETFund (2.5%)", amount: 51 },
      { label: "COVID levy (1%)", amount: 20.4 },
    ],
    total: 2418.4,
    amountPaid: 2418.4,
    balance: 0,
    status: "Paid",
  },
  {
    id: "INV-2041",
    customer: "Kwame Mensah",
    issueDate: "2026-07-18",
    dueDate: "2026-07-28",
    lineItems: [
      { name: "Perfumed Rice 5kg", quantity: 10, unitPrice: 78 },
      { name: "Titus Sardines", quantity: 15, unitPrice: 15 },
    ],
    subtotal: 1005,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 150.75 },
      { label: "NHIL (2.5%)", amount: 25.13 },
      { label: "GETFund (2.5%)", amount: 25.13 },
      { label: "COVID levy (1%)", amount: 10.05 },
    ],
    total: 1216.06,
    amountPaid: 0,
    balance: 1216.06,
    status: "Sent",
  },
  {
    id: "INV-2042",
    customer: "Abena Osei",
    issueDate: "2026-07-15",
    dueDate: "2026-08-01",
    lineItems: [
      { name: "Nido 400g", quantity: 10, unitPrice: 48 },
      { name: "Peak Milk 400g", quantity: 10, unitPrice: 16 },
    ],
    subtotal: 640,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 96 },
      { label: "NHIL (2.5%)", amount: 16 },
      { label: "GETFund (2.5%)", amount: 16 },
      { label: "COVID levy (1%)", amount: 6.4 },
    ],
    total: 774.4,
    amountPaid: 537.2,
    balance: 237.2,
    status: "Partially paid",
  },
  {
    id: "INV-2043",
    customer: "Akosua Frimpong",
    issueDate: "2026-07-20",
    dueDate: "2026-08-05",
    lineItems: [
      { name: "Malta Guinness", quantity: 30, unitPrice: 9.5 },
      { name: "Coca-Cola 500ml", quantity: 20, unitPrice: 7 },
    ],
    subtotal: 425,
    discount: 0,
    taxLines: [
      { label: "VAT (15%)", amount: 63.75 },
      { label: "NHIL (2.5%)", amount: 10.63 },
      { label: "GETFund (2.5%)", amount: 10.63 },
      { label: "COVID levy (1%)", amount: 4.25 },
    ],
    total: 514.26,
    amountPaid: 0,
    balance: 514.26,
    status: "Sent",
  },
]

export interface PaymentRecord {
  id: string
  invoiceId: string
  dateISO: string
  customer: string
  amount: number
  method: PaymentMethod
  reference?: string
  recordedBy: string
}

export const PAYMENTS: PaymentRecord[] = [
  { id: "pay-1", invoiceId: "INV-2036", dateISO: "2026-07-06", customer: "Nana Yeboah", amount: 500, method: "Cash", recordedBy: "Adjoa Boateng" },
  { id: "pay-2", invoiceId: "INV-2036", dateISO: "2026-07-10", customer: "Nana Yeboah", amount: 500, method: "Momo", reference: "8891023", recordedBy: "Abena Darko" },
  { id: "pay-3", invoiceId: "INV-2036", dateISO: "2026-07-14", customer: "Nana Yeboah", amount: 464.1, method: "Bank transfer", reference: "TRF-55123", recordedBy: "Adjoa Boateng" },
  { id: "pay-4", invoiceId: "INV-2039", dateISO: "2026-07-12", customer: "Ama Serwaa", amount: 200, method: "Cash", recordedBy: "Abena Darko" },
  { id: "pay-5", invoiceId: "INV-2039", dateISO: "2026-07-18", customer: "Ama Serwaa", amount: 126.7, method: "Momo", reference: "8892210", recordedBy: "Adjoa Boateng" },
  { id: "pay-6", invoiceId: "INV-2040", dateISO: "2026-07-11", customer: "Kofi Boateng", amount: 1000, method: "Bank transfer", reference: "TRF-55130", recordedBy: "Adjoa Boateng" },
  { id: "pay-7", invoiceId: "INV-2040", dateISO: "2026-07-16", customer: "Kofi Boateng", amount: 1000, method: "Cheque", reference: "CHQ-00214", recordedBy: "Abena Darko" },
  { id: "pay-8", invoiceId: "INV-2040", dateISO: "2026-07-19", customer: "Kofi Boateng", amount: 418.4, method: "Cash", recordedBy: "Adjoa Boateng" },
  { id: "pay-9", invoiceId: "INV-2042", dateISO: "2026-07-17", customer: "Abena Osei", amount: 200, method: "Momo", reference: "8893307", recordedBy: "Abena Darko" },
  { id: "pay-10", invoiceId: "INV-2042", dateISO: "2026-07-21", customer: "Abena Osei", amount: 187.2, method: "Cash", recordedBy: "Adjoa Boateng" },
  { id: "pay-11", invoiceId: "INV-2042", dateISO: "2026-07-22", customer: "Abena Osei", amount: 150, method: "Cash", recordedBy: "Adjoa Boateng" },
]

/**
 * Invoice/Payment tabs are separate routes — each fully unmounts on tab
 * switch, so plain component state can't carry a newly recorded payment
 * across. This module-level store persists for the browser session (until a
 * hard refresh), which is enough for "record a payment, see it show up on
 * the other tab" to work without a real backend.
 */
let invoicesStore: Invoice[] = INVOICES.map((invoice) => ({ ...invoice }))
let paymentsStore: PaymentRecord[] = PAYMENTS.map((payment) => ({ ...payment }))

export function getInvoicesStore(): Invoice[] {
  return invoicesStore
}

export function setInvoicesStore(next: Invoice[]): void {
  invoicesStore = next
}

export function getPaymentsStore(): PaymentRecord[] {
  return paymentsStore
}

export function addPaymentToStore(payment: PaymentRecord): void {
  paymentsStore = [payment, ...paymentsStore]
}

const INVOICE_NUMBER_PREFIX = "INV-"

export function getLastInvoiceNumber(): number {
  return invoicesStore.reduce((max, inv) => {
    const n = Number.parseInt(inv.id.replace(INVOICE_NUMBER_PREFIX, ""), 10)
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 2035)
}

export function nextInvoiceNumber(): string {
  return `${INVOICE_NUMBER_PREFIX}${getLastInvoiceNumber() + 1}`
}

/** Paid once balance reaches zero, Partially paid otherwise — recalculated automatically on Record payment. */
export function recomputeInvoiceStatus(total: number, amountPaid: number, dueDateISO: string, todayISO: string): InvoiceStatus {
  const balance = Math.round((total - amountPaid) * 100) / 100
  if (balance <= 0) return "Paid"
  if (amountPaid > 0) return "Partially paid"
  if (dueDateISO && dueDateISO < todayISO) return "Overdue"
  return "Sent"
}

export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  discount: number,
  taxRates?: TaxRate[]
): { subtotal: number; taxLines: TaxLine[]; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxLines = computeTaxLines(subtotal, taxRates)
  const taxTotal = taxLines.reduce((sum, line) => sum + line.amount, 0)
  const total = Math.round((subtotal + taxTotal - discount) * 100) / 100
  return { subtotal, taxLines, total }
}

export const DUE_DATE_QUICK_OPTIONS = [
  { label: "On receipt", days: 0 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
]

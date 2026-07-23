/**
 * Mock data for the Sales hub. Plain typed arrays, no backend — matches the
 * People hub's convention.
 */

export type SaleTenderType = "Cash" | "Momo" | "Credit" | "Deposit" | "On-hold"
export type SaleStatus = "Completed" | "Pending" | "On hold"

export interface SaleLineItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface SaleRecord {
  id: string
  receiptNo: string
  customer: string
  amount: number
  type: SaleTenderType
  /** Display string, e.g. "22 Jul, 11:40 am". */
  date: string
  /** Plain "YYYY-MM-DD", used for period filtering. */
  dateISO: string
  cashier: string
  status: SaleStatus
  lineItems: SaleLineItem[]
  momoReference?: string
}

export const SALES_RECORDS: SaleRecord[] = [
  {
    id: "sale-1",
    receiptNo: "RCT-10241",
    customer: "Kwame Mensah",
    amount: 320,
    type: "Cash",
    date: "22 Jul, 11:40 am",
    dateISO: "2026-07-22",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [
      { name: "Frytol Cooking Oil 3L", quantity: 2, unitPrice: 92 },
      { name: "Key Soap", quantity: 16, unitPrice: 8.5 },
    ],
  },
  {
    id: "sale-2",
    receiptNo: "RCT-10240",
    customer: "Ama Serwaa",
    amount: 450,
    type: "Credit",
    date: "22 Jul, 11:05 am",
    dateISO: "2026-07-22",
    cashier: "Abena Darko",
    status: "Pending",
    lineItems: [
      { name: "Perfumed Rice 5kg", quantity: 5, unitPrice: 78 },
      { name: "Geisha Sardines", quantity: 5, unitPrice: 12 },
    ],
  },
  {
    id: "sale-3",
    receiptNo: "RCT-10239",
    customer: "Kofi Boateng",
    amount: 180,
    type: "Momo",
    date: "22 Jul, 10:22 am",
    dateISO: "2026-07-22",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Lipton Tea 25s", quantity: 10, unitPrice: 18 }],
    momoReference: "8837201",
  },
  {
    id: "sale-4",
    receiptNo: "RCT-10238",
    customer: "Efua Owusu",
    amount: 96,
    type: "Cash",
    date: "22 Jul, 9:47 am",
    dateISO: "2026-07-22",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Indomie Chicken Noodles", quantity: 16, unitPrice: 6 }],
  },
  {
    id: "sale-5",
    receiptNo: "RCT-10237",
    customer: "Yaw Asante",
    amount: 240,
    type: "Deposit",
    date: "22 Jul, 8:58 am",
    dateISO: "2026-07-22",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Nido 400g", quantity: 5, unitPrice: 48 }],
  },
  {
    id: "sale-6",
    receiptNo: "RCT-10236",
    customer: "Abena Osei",
    amount: 210,
    type: "Cash",
    date: "21 Jul, 5:20 pm",
    dateISO: "2026-07-21",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Titus Sardines", quantity: 14, unitPrice: 15 }],
  },
  {
    id: "sale-7",
    receiptNo: "RCT-10235",
    customer: "Kwabena Owusu",
    amount: 75,
    type: "Cash",
    date: "21 Jul, 4:12 pm",
    dateISO: "2026-07-21",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [
      { name: "Milo 400g tin", quantity: 1, unitPrice: 42 },
      { name: "Cowbell Milk Sachet", quantity: 11, unitPrice: 3 },
    ],
  },
  {
    id: "sale-8",
    receiptNo: "RCT-10234",
    customer: "Adjoa Boateng",
    amount: 890,
    type: "Deposit",
    date: "21 Jul, 1:10 pm",
    dateISO: "2026-07-21",
    cashier: "Adjoa Boateng",
    status: "Pending",
    lineItems: [
      { name: "Perfumed Rice 5kg", quantity: 11, unitPrice: 78 },
      { name: "Omo 900g", quantity: 1, unitPrice: 32 },
    ],
  },
  {
    id: "sale-9",
    receiptNo: "RCT-10233",
    customer: "Nana Yeboah",
    amount: 154,
    type: "Momo",
    date: "20 Jul, 3:45 pm",
    dateISO: "2026-07-20",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Duracell AA (pack)", quantity: 7, unitPrice: 22 }],
    momoReference: "8801456",
  },
  {
    id: "sale-10",
    receiptNo: "RCT-10232",
    customer: "Akosua Frimpong",
    amount: 640,
    type: "Credit",
    date: "20 Jul, 11:30 am",
    dateISO: "2026-07-20",
    cashier: "Adjoa Boateng",
    status: "Pending",
    lineItems: [{ name: "Omo 900g", quantity: 20, unitPrice: 32 }],
  },
  {
    id: "sale-11",
    receiptNo: "HOLD-0091",
    customer: "Walk-in customer",
    amount: 96,
    type: "On-hold",
    date: "22 Jul, 12:10 pm",
    dateISO: "2026-07-22",
    cashier: "Adjoa Boateng",
    status: "On hold",
    lineItems: [{ name: "Voltic 1.5L", quantity: 12, unitPrice: 8 }],
  },
  {
    id: "sale-12",
    receiptNo: "HOLD-0090",
    customer: "Kwame Mensah",
    amount: 54,
    type: "On-hold",
    date: "22 Jul, 11:52 am",
    dateISO: "2026-07-22",
    cashier: "Abena Darko",
    status: "On hold",
    lineItems: [{ name: "Indomie Chicken Noodles", quantity: 9, unitPrice: 6 }],
  },

  // Last month (June 2026)
  {
    id: "sale-13",
    receiptNo: "RCT-10190",
    customer: "Yaw Asante",
    amount: 216,
    type: "Cash",
    date: "28 Jun, 3:40 pm",
    dateISO: "2026-06-28",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Voltic 1.5L", quantity: 27, unitPrice: 8 }],
  },
  {
    id: "sale-14",
    receiptNo: "RCT-10184",
    customer: "Ama Serwaa",
    amount: 180,
    type: "Momo",
    date: "20 Jun, 1:15 pm",
    dateISO: "2026-06-20",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Lipton Tea 25s", quantity: 10, unitPrice: 18 }],
    momoReference: "8845213",
  },
  {
    id: "sale-15",
    receiptNo: "RCT-10176",
    customer: "Kofi Boateng",
    amount: 640,
    type: "Credit",
    date: "15 Jun, 10:05 am",
    dateISO: "2026-06-15",
    cashier: "Adjoa Boateng",
    status: "Pending",
    lineItems: [{ name: "Omo 900g", quantity: 20, unitPrice: 32 }],
  },
  {
    id: "sale-16",
    receiptNo: "RCT-10168",
    customer: "Efua Owusu",
    amount: 120,
    type: "Cash",
    date: "10 Jun, 4:30 pm",
    dateISO: "2026-06-10",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Indomie Chicken Noodles", quantity: 20, unitPrice: 6 }],
  },
  {
    id: "sale-17",
    receiptNo: "RCT-10155",
    customer: "Abena Osei",
    amount: 468,
    type: "Deposit",
    date: "5 Jun, 11:50 am",
    dateISO: "2026-06-05",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Perfumed Rice 5kg", quantity: 6, unitPrice: 78 }],
  },
  {
    id: "sale-18",
    receiptNo: "RCT-10148",
    customer: "Nana Yeboah",
    amount: 150,
    type: "Cash",
    date: "2 Jun, 2:20 pm",
    dateISO: "2026-06-02",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Titus Sardines", quantity: 10, unitPrice: 15 }],
  },

  // Earlier this year (2026, before June)
  {
    id: "sale-19",
    receiptNo: "RCT-10160",
    customer: "Akosua Frimpong",
    amount: 180,
    type: "Momo",
    date: "18 May, 9:10 am",
    dateISO: "2026-05-18",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Geisha Sardines", quantity: 15, unitPrice: 12 }],
    momoReference: "8801122",
  },
  {
    id: "sale-20",
    receiptNo: "RCT-10145",
    customer: "Kwabena Owusu",
    amount: 126,
    type: "Cash",
    date: "22 Apr, 3:00 pm",
    dateISO: "2026-04-22",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Milo 400g tin", quantity: 3, unitPrice: 42 }],
  },
  {
    id: "sale-21",
    receiptNo: "RCT-10130",
    customer: "Adjoa Boateng",
    amount: 592,
    type: "Credit",
    date: "10 Mar, 1:40 pm",
    dateISO: "2026-03-10",
    cashier: "Adjoa Boateng",
    status: "Pending",
    lineItems: [{ name: "Frytol Cooking Oil 5L", quantity: 4, unitPrice: 148 }],
  },
  {
    id: "sale-22",
    receiptNo: "RCT-10110",
    customer: "Kwame Mensah",
    amount: 410,
    type: "Deposit",
    date: "14 Feb, 12:30 pm",
    dateISO: "2026-02-14",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Royal Aroma Rice 5kg", quantity: 5, unitPrice: 82 }],
  },
  {
    id: "sale-23",
    receiptNo: "RCT-10095",
    customer: "Ama Serwaa",
    amount: 170,
    type: "Cash",
    date: "20 Jan, 10:15 am",
    dateISO: "2026-01-20",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Key Soap", quantity: 20, unitPrice: 8.5 }],
  },

  // Last year (2025)
  {
    id: "sale-24",
    receiptNo: "RCT-9820",
    customer: "Kofi Boateng",
    amount: 145,
    type: "Cash",
    date: "18 Dec 2025, 2:10 pm",
    dateISO: "2025-12-18",
    cashier: "Abena Darko",
    status: "Completed",
    lineItems: [{ name: "Ideal Milk 380g", quantity: 10, unitPrice: 14.5 }],
  },
  {
    id: "sale-25",
    receiptNo: "RCT-9760",
    customer: "Efua Owusu",
    amount: 210,
    type: "Momo",
    date: "5 Oct 2025, 4:45 pm",
    dateISO: "2025-10-05",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Coca-Cola 500ml", quantity: 30, unitPrice: 7 }],
    momoReference: "8790011",
  },
  {
    id: "sale-26",
    receiptNo: "RCT-9600",
    customer: "Yaw Asante",
    amount: 288,
    type: "Credit",
    date: "12 Jul 2025, 9:30 am",
    dateISO: "2025-07-12",
    cashier: "Abena Darko",
    status: "Pending",
    lineItems: [{ name: "Nido 400g", quantity: 6, unitPrice: 48 }],
  },
  {
    id: "sale-27",
    receiptNo: "RCT-9450",
    customer: "Abena Osei",
    amount: 132,
    type: "Cash",
    date: "30 Apr 2025, 1:00 pm",
    dateISO: "2025-04-30",
    cashier: "Adjoa Boateng",
    status: "Completed",
    lineItems: [{ name: "Sunlight Dishwashing Liquid", quantity: 12, unitPrice: 11 }],
  },
]

export interface ReturnRecord {
  id: string
  customer: string
  item: string
  reason: string
  amount: number
  originalReceiptNo: string
  dateISO: string
}

export const RETURNS_RECORDS: ReturnRecord[] = [
  {
    id: "ret-1",
    customer: "Yaw Asante",
    item: "Milo 400g tin × 2",
    reason: "Wrong item",
    amount: 84,
    originalReceiptNo: "RCT-10241",
    dateISO: "2026-07-22",
  },
  {
    id: "ret-2",
    customer: "Ama Serwaa",
    item: "Frytol Cooking Oil 3L",
    reason: "Damaged seal",
    amount: 92,
    originalReceiptNo: "RCT-10240",
    dateISO: "2026-07-21",
  },
  {
    id: "ret-3",
    customer: "Efua Owusu",
    item: "Indomie Chicken Noodles × 5",
    reason: "Changed mind",
    amount: 30,
    originalReceiptNo: "RCT-10238",
    dateISO: "2026-07-20",
  },
  {
    id: "ret-4",
    customer: "Yaw Asante",
    item: "Voltic 1.5L × 3",
    reason: "Duplicate purchase",
    amount: 24,
    originalReceiptNo: "RCT-10190",
    dateISO: "2026-06-28",
  },
  {
    id: "ret-5",
    customer: "Kofi Boateng",
    item: "Ideal Milk 380g × 4",
    reason: "Damaged/defective",
    amount: 58,
    originalReceiptNo: "RCT-9820",
    dateISO: "2025-12-18",
  },
]

export const RETURN_REASONS = ["Wrong item", "Damaged/defective", "Changed mind", "Duplicate purchase", "Other"]

export const REFUND_METHODS = ["Cash refund", "Store credit", "Exchange"]

/**
 * Period filtering now uses the shared, standardised convention (Today /
 * This week / This month / Custom) — see lib/period-utils.ts. Re-exported
 * here so existing imports keep working.
 */
export { TODAY_ISO as SALES_TODAY_ISO } from "@/lib/period-utils"

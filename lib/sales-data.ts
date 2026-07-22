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
  date: string
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
    cashier: "Abena Darko",
    status: "On hold",
    lineItems: [{ name: "Indomie Chicken Noodles", quantity: 9, unitPrice: 6 }],
  },
]

export interface ReturnRecord {
  id: string
  customer: string
  item: string
  reason: string
  amount: number
  originalReceiptNo: string
}

export const RETURNS_RECORDS: ReturnRecord[] = [
  {
    id: "ret-1",
    customer: "Yaw Asante",
    item: "Milo 400g tin × 2",
    reason: "Wrong item",
    amount: 84,
    originalReceiptNo: "RCT-10190",
  },
  {
    id: "ret-2",
    customer: "Ama Serwaa",
    item: "Frytol Cooking Oil 3L",
    reason: "Damaged seal",
    amount: 92,
    originalReceiptNo: "RCT-10184",
  },
  {
    id: "ret-3",
    customer: "Efua Owusu",
    item: "Indomie Chicken Noodles × 5",
    reason: "Changed mind",
    amount: 30,
    originalReceiptNo: "RCT-10176",
  },
]

export const RETURN_REASONS = ["Wrong item", "Damaged/defective", "Changed mind", "Duplicate purchase", "Other"]

export const REFUND_METHODS = ["Cash refund", "Store credit", "Exchange"]

/**
 * Mock data for the Deliveries module — a single list with a real lifecycle,
 * proof of delivery, and cash-on-delivery reconciliation. Not a hub: one
 * list, status chips, and a List/Board view toggle over the same data.
 *
 * Stock model: goods leave inventory at dispatch ("Out for delivery"), not
 * at sale. Creating a delivery pulls stock aside (Set aside) without
 * touching On hand; dispatch reduces both. See lib/pos-data.ts.
 */

import { STAFF, type StaffMember } from "@/lib/mock-data"
import {
  addSetAsideForDelivery,
  dispatchSetAsideStock,
  getProductByName,
  releaseSetAside,
  returnStockToStore,
} from "@/lib/pos-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"

export type DeliveryStatus = "Scheduled" | "Assigned" | "Out for delivery" | "Delivered" | "Failed" | "Cancelled"

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "Scheduled",
  "Assigned",
  "Out for delivery",
  "Delivered",
  "Failed",
  "Cancelled",
]

export type ProofMethod = "Signature" | "Photo" | "Confirmation code"

export const FAILURE_REASONS = [
  "Customer not available",
  "Wrong address",
  "Customer refused",
  "Goods damaged",
  "Other",
]

export type DeliverySourceType = "sale" | "invoice" | "manual"

export interface DeliveryLineItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export interface DeliveryTimelineEntry {
  status: DeliveryStatus
  at: string
  label: string
}

export interface DeliveryProof {
  receivedBy: string
  method: ProofMethod
  cashCollected?: number
  collectedNote?: string
  deliveredAt: string
}

export interface Delivery {
  id: string
  customer: string
  phone: string
  address: string
  area: string
  lineItems: DeliveryLineItem[]
  isCod: boolean
  codAmount: number
  riderId?: string
  scheduledDateISO: string
  window: string
  note?: string
  status: DeliveryStatus
  failureReason?: string
  failureNote?: string
  /** Pre-generated so it can be told to the customer ahead of the drop-off; read back as proof. */
  confirmationCode: string
  proof?: DeliveryProof
  timeline: DeliveryTimelineEntry[]
  sourceType: DeliverySourceType
  fromReceiptNo?: string
  fromInvoiceNo?: string
}

export const RIDER_STAFF_IDS = ["staff-3", "staff-4", "staff-5", "staff-6"]

export function getRiders(): StaffMember[] {
  return STAFF.filter((s) => RIDER_STAFF_IDS.includes(s.id))
}

export function getRider(riderId?: string): StaffMember | undefined {
  if (!riderId) return undefined
  return STAFF.find((s) => s.id === riderId)
}

function lineItemsTotal(lineItems: DeliveryLineItem[]): number {
  return lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)
}

export const DELIVERIES: Delivery[] = [
  {
    id: "DEL-1030",
    customer: "Akosua Frimpong",
    phone: "027 888 4545",
    address: "Tema, Community 4",
    area: "Tema",
    lineItems: [{ productId: "p-15", name: "Omo 900g", quantity: 12, unitPrice: 32 }],
    isCod: true,
    codAmount: 384,
    riderId: "staff-5",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Delivered",
    confirmationCode: "4821",
    proof: { receivedBy: "Akosua Frimpong", method: "Photo", cashCollected: 384, deliveredAt: "22 Jul, 10:20 am" },
    timeline: [
      { status: "Scheduled", at: "21 Jul, 4:00 pm", label: "Delivery created from RCT-10232" },
      { status: "Assigned", at: "22 Jul, 8:05 am", label: "Assigned to Yaw Boadi · Morning" },
      { status: "Out for delivery", at: "22 Jul, 9:10 am", label: "Out for delivery — 12 × Omo 900g left stock" },
      { status: "Delivered", at: "22 Jul, 10:20 am", label: "Delivered — proof captured (Photo)" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10232",
  },
  {
    id: "DEL-1031",
    customer: "Akosua Frimpong",
    phone: "027 888 4545",
    address: "Tema, Community 4",
    area: "Tema",
    lineItems: [{ productId: "p-15", name: "Omo 900g", quantity: 8, unitPrice: 32 }],
    isCod: true,
    codAmount: 256,
    scheduledDateISO: "2026-07-23",
    window: "Afternoon",
    note: "Remaining 8 of 20 from RCT-10232 — 12 already delivered on DEL-1030.",
    status: "Scheduled",
    confirmationCode: "7734",
    timeline: [{ status: "Scheduled", at: "22 Jul, 11:00 am", label: "Delivery created from RCT-10232 — remainder" }],
    sourceType: "sale",
    fromReceiptNo: "RCT-10232",
  },
  {
    id: "DEL-1032",
    customer: "Kwame Mensah",
    phone: "024 123 4567",
    address: "Makola, Accra",
    area: "Makola",
    lineItems: [
      { productId: "p-3", name: "Frytol Cooking Oil 3L", quantity: 2, unitPrice: 92 },
      { productId: "p-6", name: "Key Soap", quantity: 16, unitPrice: 8.5 },
    ],
    isCod: false,
    codAmount: 0,
    riderId: "staff-3",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Out for delivery",
    confirmationCode: "2290",
    timeline: [
      { status: "Scheduled", at: "22 Jul, 8:00 am", label: "Delivery created from RCT-10241" },
      { status: "Assigned", at: "22 Jul, 8:40 am", label: "Assigned to Adjoa Boateng · Morning" },
      { status: "Out for delivery", at: "22 Jul, 9:30 am", label: "Out for delivery — items left stock" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10241",
  },
  {
    id: "DEL-1033",
    customer: "Kofi Boateng",
    phone: "055 456 7890",
    address: "Tema, Community 1",
    area: "Tema",
    lineItems: [{ productId: "p-20", name: "Lipton Tea 25s", quantity: 10, unitPrice: 18 }],
    isCod: false,
    codAmount: 0,
    riderId: "staff-4",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Delivered",
    confirmationCode: "5510",
    proof: { receivedBy: "Kofi Boateng", method: "Confirmation code", deliveredAt: "22 Jul, 9:55 am" },
    timeline: [
      { status: "Scheduled", at: "21 Jul, 5:30 pm", label: "Delivery created from RCT-10239" },
      { status: "Assigned", at: "22 Jul, 8:10 am", label: "Assigned to Abena Darko · Morning" },
      { status: "Out for delivery", at: "22 Jul, 8:50 am", label: "Out for delivery — items left stock" },
      { status: "Delivered", at: "22 Jul, 9:55 am", label: "Delivered — proof captured (Confirmation code)" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10239",
  },
  {
    id: "DEL-1034",
    customer: "Abena Osei",
    phone: "020 666 2323",
    address: "Makola, Accra",
    area: "Makola",
    lineItems: [{ productId: "p-13", name: "Titus Sardines", quantity: 14, unitPrice: 15 }],
    isCod: false,
    codAmount: 0,
    riderId: "staff-6",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Delivered",
    confirmationCode: "8845",
    proof: { receivedBy: "Abena Osei", method: "Signature", deliveredAt: "22 Jul, 11:15 am" },
    timeline: [
      { status: "Scheduled", at: "21 Jul, 6:00 pm", label: "Delivery created from RCT-10236" },
      { status: "Assigned", at: "22 Jul, 8:15 am", label: "Assigned to Efua Mensima · Morning" },
      { status: "Out for delivery", at: "22 Jul, 9:40 am", label: "Out for delivery — items left stock" },
      { status: "Delivered", at: "22 Jul, 11:15 am", label: "Delivered — proof captured (Signature)" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10236",
  },
  {
    id: "DEL-1035",
    customer: "Nana Yeboah",
    phone: "024 555 1212",
    address: "Kaneshie, Accra",
    area: "Kaneshie",
    lineItems: [{ productId: "p-23", name: "Duracell AA (pack)", quantity: 7, unitPrice: 22 }],
    isCod: false,
    codAmount: 0,
    riderId: "staff-3",
    scheduledDateISO: "2026-07-22",
    window: "Afternoon",
    status: "Out for delivery",
    confirmationCode: "3162",
    timeline: [
      { status: "Scheduled", at: "22 Jul, 9:00 am", label: "Delivery created from RCT-10233" },
      { status: "Assigned", at: "22 Jul, 10:00 am", label: "Assigned to Adjoa Boateng · Afternoon" },
      { status: "Out for delivery", at: "22 Jul, 12:05 pm", label: "Out for delivery — items left stock" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10233",
  },
  {
    id: "DEL-1036",
    customer: "Ama Serwaa",
    phone: "020 987 6543",
    address: "Osu, Accra",
    area: "Osu",
    lineItems: [
      { productId: "p-17", name: "Perfumed Rice 5kg", quantity: 5, unitPrice: 78 },
      { productId: "p-7", name: "Geisha Sardines", quantity: 5, unitPrice: 12 },
    ],
    isCod: true,
    codAmount: 450,
    riderId: "staff-4",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Delivered",
    confirmationCode: "9027",
    proof: {
      receivedBy: "Ama Serwaa",
      method: "Photo",
      cashCollected: 410,
      collectedNote: "Customer paid GHS 410 cash, asked to settle the rest next week.",
      deliveredAt: "22 Jul, 10:40 am",
    },
    timeline: [
      { status: "Scheduled", at: "21 Jul, 3:00 pm", label: "Delivery created from RCT-10240" },
      { status: "Assigned", at: "22 Jul, 8:20 am", label: "Assigned to Abena Darko · Morning" },
      { status: "Out for delivery", at: "22 Jul, 9:05 am", label: "Out for delivery — items left stock" },
      { status: "Delivered", at: "22 Jul, 10:40 am", label: "Delivered — proof captured (Photo)" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10240",
  },
  {
    id: "DEL-1037",
    customer: "Adjoa Boateng",
    phone: "024 111 2222",
    address: "Madina, Accra",
    area: "Madina",
    lineItems: [
      { productId: "p-17", name: "Perfumed Rice 5kg", quantity: 11, unitPrice: 78 },
      { productId: "p-15", name: "Omo 900g", quantity: 1, unitPrice: 32 },
    ],
    isCod: true,
    codAmount: 200,
    scheduledDateISO: "2026-07-23",
    window: "Morning",
    note: "Balance remaining after deposit paid at sale (RCT-10234).",
    status: "Scheduled",
    confirmationCode: "6603",
    timeline: [{ status: "Scheduled", at: "21 Jul, 2:00 pm", label: "Delivery created from RCT-10234" }],
    sourceType: "sale",
    fromReceiptNo: "RCT-10234",
  },
  {
    id: "DEL-1038",
    customer: "Kwabena Owusu",
    phone: "020 222 3333",
    address: "Osu, Accra",
    area: "Osu",
    lineItems: [
      { productId: "p-2", name: "Milo 400g tin", quantity: 1, unitPrice: 42 },
      { productId: "p-19", name: "Cowbell Milk Sachet", quantity: 11, unitPrice: 3 },
    ],
    isCod: false,
    codAmount: 0,
    scheduledDateISO: "2026-07-22",
    window: "Afternoon",
    note: "Customer called to cancel — collecting in person instead.",
    status: "Cancelled",
    confirmationCode: "1489",
    timeline: [
      { status: "Scheduled", at: "21 Jul, 4:45 pm", label: "Delivery created from RCT-10235" },
      { status: "Cancelled", at: "22 Jul, 7:50 am", label: "Cancelled — set aside stock released" },
    ],
    sourceType: "sale",
    fromReceiptNo: "RCT-10235",
  },
  {
    id: "DEL-1039",
    customer: "Kojo Antwi",
    phone: "055 777 3434",
    address: "Adenta, Accra",
    area: "Adenta",
    lineItems: [{ productId: "p-14", name: "Sunlight Dishwashing Liquid", quantity: 8, unitPrice: 11 }],
    isCod: true,
    codAmount: 88,
    scheduledDateISO: "2026-07-22",
    window: "Evening",
    note: "Phoned in — not tied to an existing sale.",
    status: "Scheduled",
    confirmationCode: "4417",
    timeline: [{ status: "Scheduled", at: "22 Jul, 9:30 am", label: "Delivery created manually" }],
    sourceType: "manual",
  },
  {
    id: "DEL-1040",
    customer: "Yaa Mansa",
    phone: "050 999 5656",
    address: "East Legon, Accra",
    area: "East Legon",
    lineItems: [{ productId: "p-11", name: "Coca-Cola 500ml", quantity: 24, unitPrice: 7 }],
    isCod: false,
    codAmount: 0,
    riderId: "staff-5",
    scheduledDateISO: "2026-07-22",
    window: "Afternoon",
    note: "Paid by Momo when the order was phoned in.",
    status: "Assigned",
    confirmationCode: "2938",
    timeline: [
      { status: "Scheduled", at: "22 Jul, 8:45 am", label: "Delivery created manually" },
      { status: "Assigned", at: "22 Jul, 9:50 am", label: "Assigned to Yaw Boadi · Afternoon" },
    ],
    sourceType: "manual",
  },
  {
    id: "DEL-1041",
    customer: "Kwame Mensah",
    phone: "024 123 4567",
    address: "Makola, Accra",
    area: "Makola",
    lineItems: [
      { productId: "p-17", name: "Perfumed Rice 5kg", quantity: 10, unitPrice: 78 },
      { productId: "p-13", name: "Titus Sardines", quantity: 15, unitPrice: 15 },
    ],
    isCod: true,
    codAmount: 1216.06,
    riderId: "staff-3",
    scheduledDateISO: "2026-07-22",
    window: "Morning",
    status: "Failed",
    failureReason: "Customer not available",
    failureNote: "No answer at the gate, tried calling twice.",
    confirmationCode: "5127",
    timeline: [
      { status: "Scheduled", at: "20 Jul, 10:00 am", label: "Delivery created from INV-2041" },
      { status: "Assigned", at: "22 Jul, 8:00 am", label: "Assigned to Adjoa Boateng · Morning" },
      { status: "Out for delivery", at: "22 Jul, 9:00 am", label: "Out for delivery — items left stock" },
      { status: "Failed", at: "22 Jul, 10:50 am", label: "Failed — Customer not available" },
    ],
    sourceType: "invoice",
    fromInvoiceNo: "INV-2041",
  },
]

const DELIVERY_PREFIX = "DEL-"

export function nextDeliveryNumber(): string {
  const numbers = deliveriesStore.map((d) => Number.parseInt(d.id.replace(DELIVERY_PREFIX, ""), 10))
  const next = Math.max(0, ...numbers) + 1
  return `${DELIVERY_PREFIX}${next}`
}

/** Deliveries is its own route and fully unmounts on navigation — same session-persisted store pattern as Invoice/Estimator. */
let deliveriesStore: Delivery[] = DELIVERIES.map((d) => ({ ...d, lineItems: [...d.lineItems], timeline: [...d.timeline] }))

export function getDeliveriesStore(): Delivery[] {
  return deliveriesStore
}

export function setDeliveriesStore(next: Delivery[]): void {
  deliveriesStore = next
}

function updateDelivery(id: string, patch: (d: Delivery) => Delivery): void {
  deliveriesStore = deliveriesStore.map((d) => (d.id === id ? patch(d) : d))
}

/** Quantities already claimed by non-cancelled deliveries against a sale/invoice source, keyed by product name. */
export function getClaimedQuantities(sourceType: "sale" | "invoice", sourceRef: string): Record<string, number> {
  const relevant = deliveriesStore.filter(
    (d) =>
      d.status !== "Cancelled" &&
      ((sourceType === "sale" && d.fromReceiptNo === sourceRef) ||
        (sourceType === "invoice" && d.fromInvoiceNo === sourceRef))
  )
  const totals: Record<string, number> = {}
  let lastDate = ""
  for (const d of relevant) {
    if (d.scheduledDateISO > lastDate) lastDate = d.scheduledDateISO
    for (const li of d.lineItems) {
      totals[li.name] = (totals[li.name] ?? 0) + li.quantity
    }
  }
  return totals
}

/** Most recent scheduled date among deliveries already claiming this source — for the "dispatched on 22 Jul" note. */
export function getLastClaimDate(sourceType: "sale" | "invoice", sourceRef: string): string | undefined {
  const relevant = deliveriesStore.filter(
    (d) =>
      d.status !== "Cancelled" &&
      ((sourceType === "sale" && d.fromReceiptNo === sourceRef) ||
        (sourceType === "invoice" && d.fromInvoiceNo === sourceRef))
  )
  if (relevant.length === 0) return undefined
  return relevant.reduce((latest, d) => (d.scheduledDateISO > latest ? d.scheduledDateISO : latest), relevant[0].scheduledDateISO)
}

export interface CreateDeliveryInput {
  customer: string
  phone: string
  address: string
  area: string
  lineItems: DeliveryLineItem[]
  isCod: boolean
  codAmount: number
  scheduledDateISO: string
  window: string
  note?: string
  sourceType: DeliverySourceType
  fromReceiptNo?: string
  fromInvoiceNo?: string
}

function generateConfirmationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/** New delivery — pulls the line items' stock aside (still on hand, no longer available). */
export function createDelivery(input: CreateDeliveryInput): Delivery {
  const delivery: Delivery = {
    id: nextDeliveryNumber(),
    customer: input.customer,
    phone: input.phone,
    address: input.address,
    area: input.area,
    lineItems: input.lineItems,
    isCod: input.isCod,
    codAmount: input.isCod ? input.codAmount : 0,
    scheduledDateISO: input.scheduledDateISO,
    window: input.window,
    note: input.note,
    status: "Scheduled",
    confirmationCode: generateConfirmationCode(),
    timeline: [
      {
        status: "Scheduled",
        at: `${formatDateDisplay(TODAY_ISO)} — just now`,
        label:
          input.sourceType === "manual"
            ? "Delivery created manually"
            : `Delivery created from ${input.fromReceiptNo ?? input.fromInvoiceNo}`,
      },
    ],
    sourceType: input.sourceType,
    fromReceiptNo: input.fromReceiptNo,
    fromInvoiceNo: input.fromInvoiceNo,
  }

  for (const line of delivery.lineItems) {
    addSetAsideForDelivery(line.productId, line.quantity)
  }

  deliveriesStore = [delivery, ...deliveriesStore]
  return delivery
}

export function assignRider(deliveryId: string, riderId: string, dateISO: string, window: string): void {
  const rider = getRider(riderId)
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Assigned",
    riderId,
    scheduledDateISO: dateISO,
    window,
    timeline: [
      ...d.timeline,
      { status: "Assigned", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: `Assigned to ${rider?.name ?? riderId} · ${window}` },
    ],
  }))
}

export function markOutForDelivery(deliveryId: string): void {
  const delivery = deliveriesStore.find((d) => d.id === deliveryId)
  if (!delivery) return
  for (const line of delivery.lineItems) {
    dispatchSetAsideStock(line.productId, line.quantity)
  }
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Out for delivery",
    timeline: [
      ...d.timeline,
      { status: "Out for delivery", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: "Out for delivery — items left stock" },
    ],
  }))
}

export function markDelivered(deliveryId: string, proof: DeliveryProof): void {
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Delivered",
    proof,
    timeline: [
      ...d.timeline,
      { status: "Delivered", at: proof.deliveredAt, label: `Delivered — proof captured (${proof.method})` },
    ],
  }))
}

export function markFailed(deliveryId: string, reason: string, note?: string): void {
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Failed",
    failureReason: reason,
    failureNote: note,
    timeline: [
      ...d.timeline,
      { status: "Failed", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: `Failed — ${reason}` },
    ],
  }))
}

export function rescheduleDelivery(deliveryId: string, newDateISO: string): void {
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Scheduled",
    scheduledDateISO: newDateISO,
    riderId: undefined,
    timeline: [
      ...d.timeline,
      { status: "Scheduled", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: `Rescheduled for ${formatDateDisplay(newDateISO)}` },
    ],
  }))
}

export function returnFailedToStore(deliveryId: string): void {
  const delivery = deliveriesStore.find((d) => d.id === deliveryId)
  if (!delivery) return
  for (const line of delivery.lineItems) {
    returnStockToStore(line.productId, line.quantity)
  }
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Cancelled",
    timeline: [
      ...d.timeline,
      { status: "Cancelled", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: "Returned to store — On hand restored" },
    ],
  }))
}

export function cancelDelivery(deliveryId: string): void {
  const delivery = deliveriesStore.find((d) => d.id === deliveryId)
  if (!delivery) return
  for (const line of delivery.lineItems) {
    releaseSetAside(line.productId, line.quantity)
  }
  updateDelivery(deliveryId, (d) => ({
    ...d,
    status: "Cancelled",
    timeline: [
      ...d.timeline,
      { status: "Cancelled", at: `${formatDateDisplay(TODAY_ISO)} — just now`, label: "Cancelled — set aside stock released" },
    ],
  }))
}

export { lineItemsTotal, getProductByName }

/**
 * Online orders.
 *
 * An online order is a distinct *document*, the same way an Invoice and a
 * Quotation already are — because it carries facts a till receipt has no
 * room for: an address, a fulfilment method, a payment the shop hasn't seen
 * yet, and a lifecycle that outlives the moment of purchase. What it is NOT
 * is a second sales ledger:
 *
 *   • Money  — once payment is confirmed the order posts a normal SaleRecord
 *              (lib/sales-data.ts) tagged channel: "online", so Dashboard,
 *              Reports and Day close need no special case.
 *   • Goods  — fulfilment hands the order to the existing Deliveries module
 *              (lib/deliveries-data.ts), which already owns dispatch, proof
 *              of delivery, COD reconciliation, and the stock movements.
 *   • Stock  — reserved through the shop's existing "set aside" concept.
 *   • People — buyers are matched against the existing customer directory.
 *
 * FUTURE INTEGRATION POINTS are marked inline: payment capture, delivery
 * providers, and customer notifications.
 */

import type { StorePersona } from "@/hooks/use-demo-state"
import { createDelivery, type Delivery } from "@/lib/deliveries-data"
import { CUSTOMERS, isValidGhanaPhone, type Customer } from "@/lib/mock-data"
import { ONLINE_NOW, formatDateTime } from "@/lib/online-auctions-data"
import {
  findProductForPersona,
  onlinePriceOf,
  releaseOnlineStock,
  reserveOnlineStock,
  type ListingRow,
} from "@/lib/online-listings-data"
import type { DeliverySettings, OnlineStore } from "@/lib/online-store-data"
import { addSaleRecord, nextReceiptNo, type SaleRecord, type SaleTenderType } from "@/lib/sales-data"
import { TODAY_ISO } from "@/lib/period-utils"

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type OnlineOrderStatus =
  | "New"
  | "Processing"
  | "Ready for fulfilment"
  | "Out for delivery"
  | "Completed"
  | "Cancelled"

export const ONLINE_ORDER_STATUSES: OnlineOrderStatus[] = [
  "New",
  "Processing",
  "Ready for fulfilment",
  "Out for delivery",
  "Completed",
  "Cancelled",
]

export type OnlinePaymentStatus = "Awaiting payment" | "Paid" | "Pay on delivery" | "Refunded"

/** Only ever the methods the merchant switched on — see OnlinePaymentSettings. */
export type OnlinePaymentMethod = "Momo" | "Cash on delivery" | "Bank transfer"

export type FulfilmentMethod = "delivery" | "pickup"

export type OnlineOrderSource = "storefront" | "auction"

export interface OnlineOrderLine {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export interface OnlineOrderEvent {
  status: OnlineOrderStatus
  at: string
  label: string
}

export interface OnlineOrder {
  id: string
  /** "YYYY-MM-DD", for period filtering — same convention as SaleRecord. */
  placedOnISO: string
  placedAtLabel: string
  customerName: string
  customerPhone: string
  /** Set when the buyer matched an existing customer record. */
  customerId?: string
  lines: OnlineOrderLine[]
  itemsTotal: number
  deliveryFee: number
  total: number
  fulfilment: FulfilmentMethod
  deliveryArea?: string
  deliveryAddress?: string
  paymentMethod: OnlinePaymentMethod
  paymentStatus: OnlinePaymentStatus
  paymentReference?: string
  status: OnlineOrderStatus
  source: OnlineOrderSource
  /** Set when the order came out of a won auction. */
  fromBidId?: string
  /** The Delivery this order was handed to, once fulfilment started. */
  deliveryId?: string
  /** The SaleRecord this order posted into the shared ledger, once paid. */
  saleReceiptNo?: string
  note?: string
  timeline: OnlineOrderEvent[]
}

/** How an online payment method lands in the shared sales ledger. */
const TENDER_BY_PAYMENT_METHOD: Record<OnlinePaymentMethod, SaleTenderType> = {
  Momo: "Momo",
  "Cash on delivery": "Cash",
  "Bank transfer": "Bank transfer",
}

/** The cashier column for an order nobody stood at a till for. */
export const ONLINE_LEDGER_CASHIER = "Online store"

// ---------------------------------------------------------------------------
// Seed data — Adwoa's store has been live since June
// ---------------------------------------------------------------------------

function event(status: OnlineOrderStatus, at: string, label: string): OnlineOrderEvent {
  return { status, at, label }
}

/**
 * Seeded orders describe history, so they deliberately do NOT move stock at
 * import time — the seeded product quantities already reflect them, exactly
 * as the seeded deliveries in lib/deliveries-data.ts do.
 */
const ADWOA_ORDERS: OnlineOrder[] = [
  {
    id: "ORD-1047",
    placedOnISO: "2026-07-22",
    placedAtLabel: "22 Jul, 11:20 am",
    customerName: "Ama Serwaa",
    customerPhone: "020 987 6543",
    customerId: "cus-2",
    lines: [
      { productId: "p-9", name: "Voltic Water 750ml", quantity: 24, unitPrice: 5 },
      { productId: "p-25", name: "Gino Tomato Mix", quantity: 10, unitPrice: 6.5 },
    ],
    itemsTotal: 185,
    deliveryFee: 15,
    total: 200,
    fulfilment: "delivery",
    deliveryArea: "Osu",
    deliveryAddress: "House 4, Oxford Street, Osu",
    paymentMethod: "Momo",
    paymentStatus: "Awaiting payment",
    status: "New",
    source: "storefront",
    timeline: [event("New", "22 Jul, 11:20 am", "Order placed online — awaiting Momo payment")],
  },
  {
    id: "ORD-1046",
    placedOnISO: "2026-07-22",
    placedAtLabel: "22 Jul, 9:48 am",
    customerName: "Kwame Mensah",
    customerPhone: "024 123 4567",
    customerId: "cus-1",
    lines: [
      { productId: "p-1", name: "Ideal Milk 380g", quantity: 12, unitPrice: 14.5 },
      { productId: "p-6", name: "Key Soap", quantity: 6, unitPrice: 8.5 },
    ],
    itemsTotal: 225,
    deliveryFee: 10,
    total: 235,
    fulfilment: "delivery",
    deliveryArea: "Makola",
    deliveryAddress: "Stall row 3, Makola Market",
    paymentMethod: "Momo",
    paymentStatus: "Paid",
    paymentReference: "MM-4471209",
    status: "Processing",
    source: "storefront",
    saleReceiptNo: "RCT-10243",
    timeline: [
      event("New", "22 Jul, 9:48 am", "Order placed online"),
      event("New", "22 Jul, 9:52 am", "Momo payment confirmed — reference MM-4471209"),
      event("Processing", "22 Jul, 10:05 am", "Picking started"),
    ],
  },
  {
    id: "ORD-1045",
    placedOnISO: "2026-07-22",
    placedAtLabel: "22 Jul, 8:30 am",
    customerName: "Efua Owusu",
    customerPhone: "027 234 5678",
    customerId: "cus-4",
    lines: [{ productId: "p-17", name: "Perfumed Rice 5kg", quantity: 3, unitPrice: 78 }],
    itemsTotal: 234,
    deliveryFee: 20,
    total: 254,
    fulfilment: "delivery",
    deliveryArea: "Madina",
    deliveryAddress: "Behind Madina Market, Zongo Junction",
    paymentMethod: "Cash on delivery",
    paymentStatus: "Pay on delivery",
    status: "Ready for fulfilment",
    source: "storefront",
    timeline: [
      event("New", "22 Jul, 8:30 am", "Order placed online — pay on delivery"),
      event("Processing", "22 Jul, 8:55 am", "Picking started"),
      event("Ready for fulfilment", "22 Jul, 9:20 am", "Picked and packed — ready to send out"),
    ],
  },
  {
    id: "ORD-1044",
    placedOnISO: "2026-07-21",
    placedAtLabel: "21 Jul, 6:02 pm",
    customerName: "Kojo Antwi",
    customerPhone: "055 777 3434",
    customerId: "cus-8",
    lines: [{ productId: "p-16", name: "Tasty Tom Tomato Paste", quantity: 50, unitPrice: 4.2 }],
    itemsTotal: 210,
    deliveryFee: 0,
    total: 210,
    fulfilment: "pickup",
    paymentMethod: "Momo",
    paymentStatus: "Awaiting payment",
    status: "New",
    source: "auction",
    fromBidId: "bid-9",
    note: "Won the carton auction at GHS 210. Collecting from the stall.",
    timeline: [
      event("New", "21 Jul, 6:02 pm", "Auction won — order created from the winning bid"),
    ],
  },
  {
    id: "ORD-1043",
    placedOnISO: "2026-07-21",
    placedAtLabel: "21 Jul, 2:15 pm",
    customerName: "Akosua Frimpong",
    customerPhone: "027 888 4545",
    customerId: "cus-9",
    lines: [
      { productId: "p-5", name: "Indomie Chicken Noodles", quantity: 40, unitPrice: 6 },
      { productId: "p-24", name: "Tema Salt 1kg", quantity: 4, unitPrice: 5.5 },
    ],
    itemsTotal: 262,
    deliveryFee: 25,
    total: 287,
    fulfilment: "delivery",
    deliveryArea: "Tema",
    deliveryAddress: "Community 4, Site 2",
    paymentMethod: "Momo",
    paymentStatus: "Paid",
    paymentReference: "MM-4468812",
    status: "Out for delivery",
    source: "storefront",
    deliveryId: "DEL-1042",
    saleReceiptNo: "RCT-10242",
    timeline: [
      event("New", "21 Jul, 2:15 pm", "Order placed online"),
      event("New", "21 Jul, 2:18 pm", "Momo payment confirmed — reference MM-4468812"),
      event("Processing", "21 Jul, 3:00 pm", "Picking started"),
      event("Ready for fulfilment", "21 Jul, 4:10 pm", "Picked and packed — ready to send out"),
      event("Out for delivery", "22 Jul, 8:30 am", "Handed to Deliveries — DEL-1042"),
    ],
  },
  {
    id: "ORD-1042",
    placedOnISO: "2026-07-20",
    placedAtLabel: "20 Jul, 4:40 pm",
    customerName: "Abena Osei",
    customerPhone: "020 666 2323",
    customerId: "cus-7",
    lines: [{ productId: "p-14", name: "Sunlight Dishwashing Liquid", quantity: 12, unitPrice: 11 }],
    itemsTotal: 132,
    deliveryFee: 0,
    total: 132,
    fulfilment: "pickup",
    paymentMethod: "Momo",
    paymentStatus: "Paid",
    paymentReference: "MM-4460077",
    status: "Completed",
    source: "storefront",
    saleReceiptNo: "RCT-10231",
    timeline: [
      event("New", "20 Jul, 4:40 pm", "Order placed online — collecting from the stall"),
      event("New", "20 Jul, 4:44 pm", "Momo payment confirmed — reference MM-4460077"),
      event("Processing", "20 Jul, 5:00 pm", "Picking started"),
      event("Ready for fulfilment", "20 Jul, 5:25 pm", "Ready for collection"),
      event("Completed", "21 Jul, 10:10 am", "Collected by the customer"),
    ],
  },
  {
    id: "ORD-1041",
    placedOnISO: "2026-07-19",
    placedAtLabel: "19 Jul, 11:05 am",
    customerName: "Yaa Mansa",
    customerPhone: "050 999 5656",
    customerId: "cus-10",
    lines: [{ productId: "p-8", name: "Nido 400g", quantity: 4, unitPrice: 48 }],
    itemsTotal: 192,
    deliveryFee: 20,
    total: 212,
    fulfilment: "delivery",
    deliveryArea: "Madina",
    deliveryAddress: "Madina Estates, Block C",
    paymentMethod: "Momo",
    paymentStatus: "Refunded",
    status: "Cancelled",
    source: "storefront",
    note: "Customer changed their mind before we packed it.",
    timeline: [
      event("New", "19 Jul, 11:05 am", "Order placed online"),
      event("Cancelled", "19 Jul, 1:30 pm", "Cancelled at the customer's request — stock released"),
    ],
  },
]

let ordersByPersona: Record<StorePersona, OnlineOrder[]> = {
  adwoa: ADWOA_ORDERS.map((o) => ({ ...o, lines: [...o.lines], timeline: [...o.timeline] })),
  larry: [],
}

export function getOnlineOrders(persona: StorePersona): OnlineOrder[] {
  return ordersByPersona[persona]
}

export function setOnlineOrders(persona: StorePersona, next: OnlineOrder[]): void {
  ordersByPersona = { ...ordersByPersona, [persona]: next }
}

export function getOnlineOrder(persona: StorePersona, id: string): OnlineOrder | undefined {
  return getOnlineOrders(persona).find((o) => o.id === id)
}

function updateOrder(persona: StorePersona, id: string, patch: (o: OnlineOrder) => OnlineOrder): void {
  setOnlineOrders(
    persona,
    getOnlineOrders(persona).map((o) => (o.id === id ? patch(o) : o))
  )
}

function nextOrderNumber(persona: StorePersona): string {
  const numbers = getOnlineOrders(persona)
    .map((o) => Number.parseInt(o.id.replace("ORD-", ""), 10))
    .filter((n) => !Number.isNaN(n))
  return `ORD-${Math.max(1040, ...numbers) + 1}`
}

function stamp(): string {
  return `${formatDateTime(ONLINE_NOW)} — just now`
}

// ---------------------------------------------------------------------------
// Cart — the customer's side, before an order exists
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string
  quantity: number
}

export interface CartLineView {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  lineTotal: number
  /** Live from shared stock — the cart re-checks it at checkout. */
  available: number
}

export function cartLineViews(persona: StorePersona, items: CartItem[], rows: ListingRow[]): CartLineView[] {
  return items.flatMap((item) => {
    const row = rows.find((r) => r.product.id === item.productId)
    if (!row) return []
    const unitPrice = onlinePriceOf(row.listing, row.product)
    return [
      {
        productId: item.productId,
        name: row.product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        available: row.product.isService ? item.quantity : Math.max(0, row.product.locationStock.reduce((sum, ls) => sum + ls.onHand, 0) - row.product.locationStock.reduce((sum, ls) => sum + ls.setAside, 0)),
      },
    ]
  })
}

export function cartItemsTotal(lines: CartLineView[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0)
}

/**
 * Delivery cost for an area, honouring the free-delivery threshold. Pickup
 * is always free. Returns 0 for an area the store doesn't serve — the
 * checkout only ever offers areas that are switched on.
 */
export function deliveryFeeFor(settings: DeliverySettings, area: string | undefined, itemsTotal: number): number {
  if (!area) return 0
  const zone = settings.zones.find((z) => z.area === area && z.enabled)
  if (!zone) return 0
  if (settings.freeDeliveryOver > 0 && itemsTotal >= settings.freeDeliveryOver) return 0
  return zone.fee
}

export function enabledZones(settings: DeliverySettings) {
  return settings.zones.filter((z) => z.enabled)
}

export function availablePaymentMethods(store: OnlineStore): OnlinePaymentMethod[] {
  const methods: OnlinePaymentMethod[] = []
  if (store.payments.momo) methods.push("Momo")
  if (store.payments.bankTransfer) methods.push("Bank transfer")
  if (store.payments.cashOnDelivery) methods.push("Cash on delivery")
  return methods
}

// ---------------------------------------------------------------------------
// Placing an order
// ---------------------------------------------------------------------------

export interface PlaceOrderInput {
  customerName: string
  customerPhone: string
  fulfilment: FulfilmentMethod
  deliveryArea?: string
  deliveryAddress?: string
  paymentMethod: OnlinePaymentMethod
  note?: string
}

export type PlaceOrderResult = { ok: true; order: OnlineOrder } | { ok: false; reason: string }

/** Matches a buyer against the directory the shop already has, by phone. */
export function findCustomerByPhone(phone: string): Customer | undefined {
  const normalised = phone.replace(/\s/g, "")
  return CUSTOMERS.find((c) => c.phone.replace(/\s/g, "") === normalised)
}

/**
 * Turns a cart into an order. Every rejection here is a customer-facing
 * sentence, and the stock check runs against the live shared pool — so an
 * item that sold at the counter while the customer was browsing is caught
 * before an order exists rather than after.
 */
export function placeOrder(
  persona: StorePersona,
  store: OnlineStore,
  items: CartItem[],
  rows: ListingRow[],
  input: PlaceOrderInput
): PlaceOrderResult {
  if (items.length === 0) return { ok: false, reason: "Your basket is empty." }
  if (!input.customerName.trim()) return { ok: false, reason: "Enter your name so the shop knows who to contact." }
  if (!isValidGhanaPhone(input.customerPhone)) {
    return { ok: false, reason: "Enter a valid phone number, e.g. 024 123 4567." }
  }
  if (input.fulfilment === "delivery") {
    if (!input.deliveryArea) return { ok: false, reason: "Choose the area you want it delivered to." }
    if (!input.deliveryAddress?.trim()) return { ok: false, reason: "Add the address the rider should go to." }
  }

  const lineViews = cartLineViews(persona, items, rows)
  if (lineViews.length !== items.length) {
    return { ok: false, reason: "One of the items is no longer on sale. Remove it and try again." }
  }
  const short = lineViews.find((line) => line.quantity > line.available)
  if (short) {
    return {
      ok: false,
      reason: `Only ${short.available} of ${short.name} left. Reduce the quantity and try again.`,
    }
  }

  const itemsTotal = cartItemsTotal(lineViews)
  const deliveryFee =
    input.fulfilment === "delivery" ? deliveryFeeFor(store.delivery, input.deliveryArea, itemsTotal) : 0
  const matched = findCustomerByPhone(input.customerPhone)

  const order: OnlineOrder = {
    id: nextOrderNumber(persona),
    placedOnISO: TODAY_ISO,
    placedAtLabel: formatDateTime(ONLINE_NOW),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerId: matched?.id,
    lines: lineViews.map((line) => ({
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    itemsTotal,
    deliveryFee,
    total: itemsTotal + deliveryFee,
    fulfilment: input.fulfilment,
    deliveryArea: input.fulfilment === "delivery" ? input.deliveryArea : undefined,
    deliveryAddress: input.fulfilment === "delivery" ? input.deliveryAddress?.trim() : undefined,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "Cash on delivery" ? "Pay on delivery" : "Awaiting payment",
    status: "New",
    source: "storefront",
    note: input.note?.trim() || undefined,
    timeline: [
      event(
        "New",
        stamp(),
        input.paymentMethod === "Cash on delivery"
          ? "Order placed online — pay on delivery"
          : `Order placed online — awaiting ${input.paymentMethod} payment`
      ),
    ],
  }

  // Hold the goods against the shared pool, exactly as a counter sale
  // awaiting delivery does.
  for (const line of order.lines) {
    reserveOnlineStock(persona, line.productId, line.quantity)
  }

  setOnlineOrders(persona, [order, ...getOnlineOrders(persona)])
  return { ok: true, order }
}

/** A won auction becomes an ordinary order — one pipeline from here on. */
export function createOrderFromBid(
  persona: StorePersona,
  args: {
    productId: string
    productName: string
    quantity: number
    amount: number
    bidId: string
    bidderName: string
    bidderPhone: string
    customerId?: string
  }
): OnlineOrder {
  const order: OnlineOrder = {
    id: nextOrderNumber(persona),
    placedOnISO: TODAY_ISO,
    placedAtLabel: formatDateTime(ONLINE_NOW),
    customerName: args.bidderName,
    customerPhone: args.bidderPhone,
    customerId: args.customerId,
    lines: [
      { productId: args.productId, name: args.productName, quantity: args.quantity, unitPrice: args.amount / args.quantity },
    ],
    itemsTotal: args.amount,
    deliveryFee: 0,
    total: args.amount,
    fulfilment: "pickup",
    paymentMethod: "Momo",
    paymentStatus: "Awaiting payment",
    status: "New",
    source: "auction",
    fromBidId: args.bidId,
    note: `Winning bid on ${args.productName}.`,
    timeline: [event("New", stamp(), "Auction won — order created from the winning bid")],
  }

  reserveOnlineStock(persona, args.productId, args.quantity)
  setOnlineOrders(persona, [order, ...getOnlineOrders(persona)])
  return order
}

// ---------------------------------------------------------------------------
// Merchant actions
// ---------------------------------------------------------------------------

/**
 * FUTURE INTEGRATION POINT — with a payment provider connected this is
 * called by a webhook instead of by hand. The effect is the same either way:
 * the order posts into the shared sales ledger.
 */
export function confirmPayment(persona: StorePersona, orderId: string, reference: string): SaleRecord | undefined {
  const order = getOnlineOrder(persona, orderId)
  if (!order || order.paymentStatus === "Paid") return undefined

  const sale = postToLedger(order, reference)

  updateOrder(persona, orderId, (o) => ({
    ...o,
    paymentStatus: "Paid",
    paymentReference: reference,
    saleReceiptNo: sale.receiptNo,
    timeline: [...o.timeline, event(o.status, stamp(), `${o.paymentMethod} payment confirmed — reference ${reference}`)],
  }))

  return sale
}

/**
 * The single place online revenue enters the business's books. It writes an
 * ordinary SaleRecord, so every existing money screen picks it up without
 * knowing the online store exists.
 */
function postToLedger(order: OnlineOrder, reference?: string): SaleRecord {
  const sale: SaleRecord = {
    id: `sale-online-${order.id}`,
    receiptNo: nextReceiptNo(),
    customer: order.customerName,
    amount: order.total,
    type: TENDER_BY_PAYMENT_METHOD[order.paymentMethod],
    date: formatDateTime(ONLINE_NOW),
    dateISO: TODAY_ISO,
    cashier: ONLINE_LEDGER_CASHIER,
    status: "Completed",
    lineItems: order.lines.map((line) => ({ name: line.name, quantity: line.quantity, unitPrice: line.unitPrice })),
    momoReference: order.paymentMethod === "Momo" ? reference : undefined,
    channel: "online",
    fromOnlineOrderNo: order.id,
  }
  addSaleRecord(sale)
  return sale
}

export function startProcessing(persona: StorePersona, orderId: string): void {
  updateOrder(persona, orderId, (o) => ({
    ...o,
    status: "Processing",
    timeline: [...o.timeline, event("Processing", stamp(), "Picking started")],
  }))
}

export function markReadyForFulfilment(persona: StorePersona, orderId: string): void {
  updateOrder(persona, orderId, (o) => ({
    ...o,
    status: "Ready for fulfilment",
    timeline: [
      ...o.timeline,
      event(
        "Ready for fulfilment",
        stamp(),
        o.fulfilment === "pickup" ? "Ready for collection" : "Picked and packed — ready to send out"
      ),
    ],
  }))
}

/**
 * Hands a packed order to the existing Deliveries module. The order's own
 * reservation is released first so the Delivery becomes the single owner of
 * the set-aside stock — net effect on inventory is nil, and from here on
 * dispatch, proof of delivery and COD reconciliation all work exactly as
 * they do for a counter sale.
 */
export function sendForDelivery(
  persona: StorePersona,
  orderId: string,
  scheduledDateISO: string,
  window: string
): Delivery | undefined {
  const order = getOnlineOrder(persona, orderId)
  if (!order || order.fulfilment !== "delivery") return undefined

  for (const line of order.lines) {
    releaseOnlineStock(persona, line.productId, line.quantity)
  }

  const delivery = createDelivery({
    customer: order.customerName,
    phone: order.customerPhone,
    address: order.deliveryAddress ?? "",
    area: order.deliveryArea ?? "",
    lineItems: order.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    isCod: order.paymentStatus === "Pay on delivery",
    codAmount: order.paymentStatus === "Pay on delivery" ? order.total : 0,
    scheduledDateISO,
    window,
    note: order.note,
    sourceType: "online-order",
    fromOrderNo: order.id,
  })

  updateOrder(persona, orderId, (o) => ({
    ...o,
    status: "Out for delivery",
    deliveryId: delivery.id,
    timeline: [...o.timeline, event("Out for delivery", stamp(), `Handed to Deliveries — ${delivery.id}`)],
  }))

  return delivery
}

/** Collection orders and delivered orders both finish here. */
export function completeOrder(persona: StorePersona, orderId: string): SaleRecord | undefined {
  const order = getOnlineOrder(persona, orderId)
  if (!order) return undefined

  // A pay-on-delivery order only becomes revenue once the money is in hand.
  let sale: SaleRecord | undefined
  if (order.paymentStatus === "Pay on delivery") {
    sale = postToLedger(order)
  }

  // Collection orders never went to Deliveries, so their reservation is
  // released here — the goods have physically left with the customer.
  if (order.fulfilment === "pickup") {
    for (const line of order.lines) {
      releaseOnlineStock(persona, line.productId, line.quantity)
    }
  }

  updateOrder(persona, orderId, (o) => ({
    ...o,
    status: "Completed",
    paymentStatus: o.paymentStatus === "Pay on delivery" ? "Paid" : o.paymentStatus,
    saleReceiptNo: sale?.receiptNo ?? o.saleReceiptNo,
    timeline: [
      ...o.timeline,
      event("Completed", stamp(), o.fulfilment === "pickup" ? "Collected by the customer" : "Delivered and completed"),
    ],
  }))

  return sale
}

export function cancelOrder(persona: StorePersona, orderId: string, reason: string): void {
  const order = getOnlineOrder(persona, orderId)
  if (!order || order.status === "Cancelled") return

  // Nothing has physically moved unless it's already with a rider — release
  // the hold so the goods are sellable again.
  if (!order.deliveryId) {
    for (const line of order.lines) {
      releaseOnlineStock(persona, line.productId, line.quantity)
    }
  }

  updateOrder(persona, orderId, (o) => ({
    ...o,
    status: "Cancelled",
    paymentStatus: o.paymentStatus === "Paid" ? "Refunded" : o.paymentStatus,
    note: reason || o.note,
    timeline: [...o.timeline, event("Cancelled", stamp(), `Cancelled — ${reason || "no reason given"}`)],
  }))
}

// ---------------------------------------------------------------------------
// Derived views for the merchant's screens
// ---------------------------------------------------------------------------

/** Orders that can't move without the merchant doing something. */
export function ordersNeedingAttention(persona: StorePersona): OnlineOrder[] {
  return getOnlineOrders(persona).filter(
    (o) =>
      (o.status === "New" && o.paymentStatus === "Awaiting payment") ||
      o.status === "New" ||
      o.status === "Processing" ||
      o.status === "Ready for fulfilment"
  )
}

export function pendingFulfilmentCount(persona: StorePersona): number {
  return getOnlineOrders(persona).filter((o) => o.status === "Processing" || o.status === "Ready for fulfilment").length
}

export function awaitingPaymentCount(persona: StorePersona): number {
  return getOnlineOrders(persona).filter((o) => o.paymentStatus === "Awaiting payment").length
}

/** Online revenue only counts money actually collected. */
export function onlineRevenue(persona: StorePersona, withinISO?: (iso: string) => boolean): number {
  return getOnlineOrders(persona)
    .filter((o) => o.paymentStatus === "Paid" && o.status !== "Cancelled")
    .filter((o) => (withinISO ? withinISO(o.placedOnISO) : true))
    .reduce((sum, o) => sum + o.total, 0)
}

export function orderCount(persona: StorePersona, withinISO?: (iso: string) => boolean): number {
  return getOnlineOrders(persona).filter((o) => (withinISO ? withinISO(o.placedOnISO) : true)).length
}

/** The next action the merchant should take on an order, as a labelled button. */
export function nextActionFor(order: OnlineOrder): { label: string; action: "confirm-payment" | "process" | "ready" | "send" | "complete" } | undefined {
  if (order.status === "Cancelled" || order.status === "Completed") return undefined
  if (order.paymentStatus === "Awaiting payment") return { label: "Confirm payment received", action: "confirm-payment" }
  if (order.status === "New") return { label: "Start picking", action: "process" }
  if (order.status === "Processing") {
    return { label: order.fulfilment === "pickup" ? "Ready for collection" : "Picked and packed", action: "ready" }
  }
  if (order.status === "Ready for fulfilment") {
    return order.fulfilment === "pickup"
      ? { label: "Mark collected", action: "complete" }
      : { label: "Send for delivery", action: "send" }
  }
  if (order.status === "Out for delivery") return { label: "Mark completed", action: "complete" }
  return undefined
}

/** Products in an order that no longer resolve get shown as-is rather than dropped. */
export function orderLineProduct(persona: StorePersona, productId: string) {
  return findProductForPersona(persona, productId)
}

/**
 * Purchase orders — raised to suppliers, tracked from draft through to
 * receiving. Receiving is where cost enters the system: stock increases at
 * the chosen location and product cost recalculates per the organisation's
 * costing method (moving weighted average is the only one actually computed
 * in this prototype — see lib/settings-data.ts).
 */

import { DEFAULT_SHOP_LOCATION_ID } from "@/lib/mock-data"
import {
  getProductsStore,
  setProductsStore,
  stockAt,
  totalAvailable,
  type LocationStock,
  type Product,
} from "@/lib/pos-data"
import { getLarryProductsStore, LARRY_DEFAULT_SHOP_LOCATION_ID, setLarryProductsStore } from "@/lib/larry-data"
import { TODAY_ISO } from "@/lib/period-utils"

export type POStatus = "Draft" | "Sent" | "Partially received" | "Received" | "Closed" | "Cancelled"

export const PO_STATUSES: POStatus[] = ["Draft", "Sent", "Partially received", "Received", "Closed", "Cancelled"]

export interface POLineItem {
  productId: string
  productName: string
  /** In purchase units (cartons etc.), or base units when the product is sold by measure. */
  orderedQty: number
  receivedQty: number
  /** Cost per ordered unit — per carton, or per base unit when sold by measure. */
  unitCost: number
}

export interface SupplierBill {
  invoiceNumber: string
  invoiceDate: string
  amount: number
  paymentTerms: string
  isPaid: boolean
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  locationId: string
  status: POStatus
  createdDate: string
  expectedDate: string
  lineItems: POLineItem[]
  note?: string
  bill?: SupplierBill
}

export function poTotal(po: PurchaseOrder): number {
  return po.lineItems.reduce((sum, li) => sum + li.orderedQty * li.unitCost, 0)
}

export function poOutstandingValue(po: PurchaseOrder): number {
  return po.lineItems.reduce((sum, li) => sum + Math.max(0, li.orderedQty - li.receivedQty) * li.unitCost, 0)
}

export function poFullyReceived(po: PurchaseOrder): boolean {
  return po.lineItems.every((li) => li.receivedQty >= li.orderedQty)
}

// ---------------------------------------------------------------------------
// Adwoa's Provisions — seed data
// ---------------------------------------------------------------------------

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-1037",
    supplierId: "sup-1",
    supplierName: "Kasapreko Distributors",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Cancelled",
    createdDate: "2026-06-28",
    expectedDate: "2026-07-05",
    lineItems: [
      { productId: "p-11", productName: "Coca-Cola 500ml", orderedQty: 10, receivedQty: 0, unitCost: 120.96 },
      { productId: "p-12", productName: "Malta Guinness", orderedQty: 5, receivedQty: 0, unitCost: 164.16 },
    ],
    note: "Supplier couldn't fulfil this cycle — reordered separately.",
  },
  {
    id: "PO-1038",
    supplierId: "sup-4",
    supplierName: "Unilever Wholesale",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Closed",
    createdDate: "2026-07-02",
    expectedDate: "2026-07-09",
    lineItems: [{ productId: "p-22", productName: "Close Up Toothpaste", orderedQty: 5, receivedQty: 3, unitCost: 466.56 }],
    note: "Closed short — remaining 2 cartons not coming this cycle.",
    bill: { invoiceNumber: "UNIL-88214", invoiceDate: "2026-07-09", amount: 1399.68, paymentTerms: "14 days", isPaid: true },
  },
  {
    id: "PO-1039",
    supplierId: "sup-2",
    supplierName: "Nestlé Ghana Depot",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Received",
    createdDate: "2026-07-10",
    expectedDate: "2026-07-16",
    lineItems: [
      { productId: "p-1", productName: "Ideal Milk 380g", orderedQty: 8, receivedQty: 8, unitCost: 250.56 },
      { productId: "p-8", productName: "Nido 400g", orderedQty: 5, receivedQty: 5, unitCost: 829.44 },
    ],
    bill: { invoiceNumber: "NGD-51290", invoiceDate: "2026-07-16", amount: 6151.68, paymentTerms: "30 days", isPaid: true },
  },
  {
    id: "PO-1040",
    supplierId: "sup-7",
    supplierName: "Golden Star Wholesale",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Partially received",
    createdDate: "2026-07-15",
    expectedDate: "2026-07-21",
    lineItems: [
      { productId: "p-3", productName: "Frytol Cooking Oil 3L", orderedQty: 10, receivedQty: 6, unitCost: 397.44 },
      { productId: "p-17", productName: "Perfumed Rice 5kg", orderedQty: 5, receivedQty: 3, unitCost: 561.6 },
    ],
    bill: { invoiceNumber: "GSW-33071", invoiceDate: "2026-07-21", amount: 4067.44, paymentTerms: "30 days", isPaid: false },
  },
  {
    id: "PO-1041",
    supplierId: "sup-4",
    supplierName: "Unilever Wholesale",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Sent",
    createdDate: "2026-07-19",
    expectedDate: "2026-07-26",
    lineItems: [
      { productId: "p-6", productName: "Key Soap", orderedQty: 8, receivedQty: 0, unitCost: 440.64 },
      { productId: "p-14", productName: "Sunlight Dishwashing Liquid", orderedQty: 6, receivedQty: 0, unitCost: 95.04 },
    ],
  },
  {
    id: "PO-1042",
    supplierId: "sup-1",
    supplierName: "Kasapreko Distributors",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Draft",
    createdDate: "2026-07-22",
    expectedDate: "2026-07-29",
    lineItems: [{ productId: "p-2", productName: "Milo 400g tin", orderedQty: 10, receivedQty: 0, unitCost: 362.88 }],
  },
  {
    id: "PO-1043",
    supplierId: "sup-2",
    supplierName: "Nestlé Ghana Depot",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Received",
    createdDate: "2026-05-10",
    expectedDate: "2026-05-15",
    lineItems: [{ productId: "p-8", productName: "Nido 400g", orderedQty: 4, receivedQty: 4, unitCost: 829.44 }],
    bill: { invoiceNumber: "NGD-50117", invoiceDate: "2026-05-15", amount: 3317.76, paymentTerms: "30 days", isPaid: false },
  },
  {
    id: "PO-1044",
    supplierId: "sup-7",
    supplierName: "Golden Star Wholesale",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Received",
    createdDate: "2026-03-26",
    expectedDate: "2026-04-01",
    lineItems: [{ productId: "p-13", productName: "Titus Sardines", orderedQty: 6, receivedQty: 6, unitCost: 540 }],
    bill: { invoiceNumber: "GSW-30442", invoiceDate: "2026-04-01", amount: 3240, paymentTerms: "30 days", isPaid: false },
  },
  {
    id: "PO-1045",
    supplierId: "sup-1",
    supplierName: "Kasapreko Distributors",
    locationId: DEFAULT_SHOP_LOCATION_ID,
    status: "Received",
    createdDate: "2026-07-15",
    expectedDate: "2026-07-18",
    lineItems: [{ productId: "p-11", productName: "Coca-Cola 500ml", orderedQty: 12, receivedQty: 12, unitCost: 120.96 }],
    bill: { invoiceNumber: "KAS-71190", invoiceDate: "2026-07-18", amount: 1451.52, paymentTerms: "7 days", isPaid: false },
  },
]

let purchaseOrdersStore: PurchaseOrder[] = PURCHASE_ORDERS.map((po) => ({ ...po, lineItems: po.lineItems.map((li) => ({ ...li })) }))

export function getPurchaseOrdersStore(): PurchaseOrder[] {
  return purchaseOrdersStore
}

export function setPurchaseOrdersStore(next: PurchaseOrder[]): void {
  purchaseOrdersStore = next
}

// ---------------------------------------------------------------------------
// Larry's Curtains & Décor — seed data (smaller set)
// ---------------------------------------------------------------------------

export const LARRY_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2001",
    supplierId: "larry-sup-1",
    supplierName: "Accra Fabric House",
    locationId: LARRY_DEFAULT_SHOP_LOCATION_ID,
    status: "Sent",
    createdDate: "2026-07-18",
    expectedDate: "2026-07-27",
    lineItems: [
      { productId: "larry-p-3", productName: "Blackout Fabric — Navy", orderedQty: 30, receivedQty: 0, unitCost: 47 },
      { productId: "larry-p-5", productName: "Velvet Drape", orderedQty: 15, receivedQty: 0, unitCost: 85 },
    ],
  },
  {
    id: "PO-2002",
    supplierId: "larry-sup-3",
    supplierName: "Adabraka Hardware Supply",
    locationId: LARRY_DEFAULT_SHOP_LOCATION_ID,
    status: "Draft",
    createdDate: "2026-07-22",
    expectedDate: "2026-07-30",
    lineItems: [{ productId: "larry-p-12", productName: "Tie-back Set", orderedQty: 2, receivedQty: 0, unitCost: 560 }],
  },
]

let larryPurchaseOrdersStore: PurchaseOrder[] = LARRY_PURCHASE_ORDERS.map((po) => ({
  ...po,
  lineItems: po.lineItems.map((li) => ({ ...li })),
}))

export function getLarryPurchaseOrdersStore(): PurchaseOrder[] {
  return larryPurchaseOrdersStore
}

export function setLarryPurchaseOrdersStore(next: PurchaseOrder[]): void {
  larryPurchaseOrdersStore = next
}

// ---------------------------------------------------------------------------
// Numbering, costing, receiving
// ---------------------------------------------------------------------------

const PO_PREFIX = "PO-"

export function nextPONumber(isLarry: boolean): string {
  const all = isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore()
  const numbers = all.map((po) => Number.parseInt(po.id.replace(PO_PREFIX, ""), 10)).filter((n) => !Number.isNaN(n))
  return `${PO_PREFIX}${Math.max(0, ...numbers) + 1}`
}

/** Moving weighted average — every purchase recalculates the average cost of stock on hand. */
export function weightedAverageCost(existingQty: number, existingCost: number, receivedQty: number, receivedCost: number): number {
  const totalQty = existingQty + receivedQty
  if (totalQty <= 0) return existingCost
  return Math.round(((existingQty * existingCost + receivedQty * receivedCost) / totalQty) * 100) / 100
}

interface ProductStoreAccessor {
  get: () => Product[]
  set: (next: Product[]) => void
}

export function productStoreFor(isLarry: boolean): ProductStoreAccessor {
  return isLarry
    ? { get: getLarryProductsStore, set: setLarryProductsStore }
    : { get: getProductsStore, set: setProductsStore }
}

export function purchaseOrderStoreFor(isLarry: boolean) {
  return isLarry
    ? { get: getLarryPurchaseOrdersStore, set: setLarryPurchaseOrdersStore }
    : { get: getPurchaseOrdersStore, set: setPurchaseOrdersStore }
}

export interface ReceiveLine {
  productId: string
  receivingNow: number
  unitCost: number
}

export interface CostChangeNote {
  productName: string
  fromCost: number
  toCost: number
  existingQty: number
  existingCost: number
  receivedQty: number
  receivedCostPerBase: number
}

/**
 * Receives goods against a PO: increases stock at the receiving location (in
 * base units), recalculates each product's weighted-average cost, and
 * updates the PO's received quantities and status. Returns the cost-change
 * notes so the UI can show "Cost updated: GHS X → GHS Y (...)" per line.
 */
export function receivePurchaseOrder(
  isLarry: boolean,
  poId: string,
  receivingLocationId: string,
  lines: ReceiveLine[],
  bill: SupplierBill | undefined,
  closeShort: boolean
): CostChangeNote[] {
  const poStore = purchaseOrderStoreFor(isLarry)
  const productStore = productStoreFor(isLarry)
  const po = poStore.get().find((p) => p.id === poId)
  if (!po) return []

  const notes: CostChangeNote[] = []
  let products = productStore.get()

  for (const line of lines) {
    if (line.receivingNow <= 0) continue
    const product = products.find((p) => p.id === line.productId)
    if (!product) continue

    const unitsPerPurchase = product.pack.soldByMeasure ? 1 : product.pack.unitsPerPurchaseUnit ?? 1
    const receivedBaseQty = line.receivingNow * unitsPerPurchase
    const receivedCostPerBase = line.unitCost / unitsPerPurchase

    const existingStock = stockAt(product, receivingLocationId)
    // Weighted average is based on ALL physical stock (loose + still-sealed) — a sealed carton is inventory with a cost basis too.
    const existingTotalQty = existingStock.onHand + existingStock.sealedPurchaseUnits * unitsPerPurchase
    const newCost = weightedAverageCost(existingTotalQty, product.costPrice, receivedBaseQty, receivedCostPerBase)

    if (Math.round(newCost * 100) !== Math.round(product.costPrice * 100)) {
      notes.push({
        productName: product.name,
        fromCost: product.costPrice,
        toCost: newCost,
        existingQty: existingTotalQty,
        existingCost: product.costPrice,
        receivedQty: receivedBaseQty,
        receivedCostPerBase,
      })
    }

    // Non-measure goods arrive sealed (whole cartons) — they aren't sellable until split. Measure goods have no pack to seal.
    const nextStock: LocationStock = product.pack.soldByMeasure
      ? { ...existingStock, onHand: existingStock.onHand + receivedBaseQty }
      : { ...existingStock, sealedPurchaseUnits: existingStock.sealedPurchaseUnits + line.receivingNow }

    products = products.map((p) => {
      if (p.id !== line.productId) return p
      const others = p.locationStock.filter((ls) => ls.locationId !== receivingLocationId)
      return { ...p, costPrice: newCost, locationStock: [...others, nextStock] }
    })
  }

  productStore.set(products)

  const updatedLineItems = po.lineItems.map((li) => {
    const line = lines.find((l) => l.productId === li.productId)
    return line ? { ...li, receivedQty: li.receivedQty + line.receivingNow, unitCost: line.unitCost } : li
  })

  const fullyReceived = updatedLineItems.every((li) => li.receivedQty >= li.orderedQty)
  const anyReceived = updatedLineItems.some((li) => li.receivedQty > 0)
  const status: POStatus = fullyReceived ? "Received" : closeShort ? "Closed" : anyReceived ? "Partially received" : po.status

  poStore.set(
    poStore.get().map((p) => (p.id === poId ? { ...p, lineItems: updatedLineItems, status, locationId: receivingLocationId, bill: bill ?? p.bill } : p))
  )

  return notes
}

/**
 * "Order low stock" — every product at or below its reorder point, grouped
 * by preferred supplier, becomes one draft PO per supplier with quantities
 * enough to reach roughly double the reorder point.
 */
export function generateLowStockDraftOrders(isLarry: boolean, suppliers: { id: string; businessName: string }[]): PurchaseOrder[] {
  const products = productStoreFor(isLarry).get()
  const lowStock = products.filter((p) => !p.isService && p.isActive && totalAvailable(p) <= p.reorderPoint)

  const bySupplier = new Map<string, Product[]>()
  for (const product of lowStock) {
    const supplierId = product.preferredSupplierId
    if (!supplierId) continue
    if (!bySupplier.has(supplierId)) bySupplier.set(supplierId, [])
    bySupplier.get(supplierId)!.push(product)
  }

  const location = isLarry ? LARRY_DEFAULT_SHOP_LOCATION_ID : DEFAULT_SHOP_LOCATION_ID
  const created: PurchaseOrder[] = []
  const poStore = purchaseOrderStoreFor(isLarry)

  for (const [supplierId, prods] of bySupplier) {
    const supplier = suppliers.find((s) => s.id === supplierId)
    const lineItems: POLineItem[] = prods.map((product) => {
      const targetLevel = product.reorderPoint * 2
      const neededBase = Math.max(0, targetLevel - totalAvailable(product))
      const unitsPerPurchase = product.pack.soldByMeasure ? 1 : product.pack.unitsPerPurchaseUnit ?? 1
      const orderedQty = Math.max(1, Math.ceil(neededBase / unitsPerPurchase))
      const unitCost = Math.round(product.costPrice * unitsPerPurchase * 100) / 100
      return { productId: product.id, productName: product.name, orderedQty, receivedQty: 0, unitCost }
    })

    const due = new Date(`${TODAY_ISO}T00:00:00`)
    due.setDate(due.getDate() + 7)

    const newPO: PurchaseOrder = {
      id: nextPONumber(isLarry),
      supplierId,
      supplierName: supplier?.businessName ?? "Unknown supplier",
      locationId: location,
      status: "Draft",
      createdDate: TODAY_ISO,
      expectedDate: due.toISOString().slice(0, 10),
      lineItems,
      note: "Generated from Order low stock.",
    }
    // Push immediately so nextPONumber() sees it before the next supplier's PO is numbered.
    poStore.set([newPO, ...poStore.get()])
    created.push(newPO)
  }

  return created
}

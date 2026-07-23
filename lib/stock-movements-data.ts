/**
 * Every stock movement in one ledger — transfers, splits, adjustments, and
 * returns — differing by type, not separate modules (same pattern as Sales).
 * Transfers require a two-sided confirmation: stock leaves the source and
 * sits "in transit" until the destination confirms what actually arrived.
 */

import { DEFAULT_SHOP_LOCATION_ID } from "@/lib/mock-data"
import {
  availableAt,
  getProductsStore,
  purchaseUnitsAt,
  setProductsStore,
  stockAt,
  type LocationStock,
  type Product,
} from "@/lib/pos-data"
import { getLarryProductsStore, LARRY_DEFAULT_SHOP_LOCATION_ID, setLarryProductsStore } from "@/lib/larry-data"
import { TODAY_ISO } from "@/lib/period-utils"

export type MovementType = "Transfer" | "Split" | "Adjustment" | "Return"
export const MOVEMENT_TYPES: MovementType[] = ["Transfer", "Split", "Adjustment", "Return"]

export type TransferStatus = "Draft" | "In transit" | "Completed" | "Cancelled"

export interface TransferLine {
  productId: string
  productName: string
  quantitySent: number
  quantityReceived?: number
}

export interface Transfer {
  id: string
  type: "Transfer"
  status: TransferStatus
  fromLocationId: string
  toLocationId: string
  lines: TransferLine[]
  note?: string
  createdBy: string
  createdDateISO: string
  sentDateISO?: string
  receivedDateISO?: string
  hasDiscrepancy: boolean
  discrepancyReason?: string
}

export interface SplitMovement {
  id: string
  type: "Split"
  locationId: string
  productId: string
  productName: string
  purchaseUnitsSplit: number
  baseUnitsCreated: number
  userName: string
  dateISO: string
}

export const ADJUSTMENT_REASONS = ["Damage", "Expiry", "Breakage", "Theft", "Miscount correction", "Other"]

export interface AdjustmentMovement {
  id: string
  type: "Adjustment"
  locationId: string
  productId: string
  productName: string
  previousQty: number
  newQty: number
  delta: number
  reason: string
  note?: string
  userName: string
  dateISO: string
}

export interface ReturnMovement {
  id: string
  type: "Return"
  locationId: string
  productId: string
  productName: string
  quantity: number
  reason: string
  note?: string
  userName: string
  dateISO: string
}

export type Movement = Transfer | SplitMovement | AdjustmentMovement | ReturnMovement

export function movementProductLabel(movement: Movement): string {
  if (movement.type === "Transfer") {
    if (movement.lines.length === 1) return movement.lines[0].productName
    return `${movement.lines.length} products`
  }
  return movement.productName
}

// ---------------------------------------------------------------------------
// Adwoa's Provisions — seed data
// ---------------------------------------------------------------------------

const MAKOLA = DEFAULT_SHOP_LOCATION_ID
const WAREHOUSE = "loc-warehouse-abossey"

export const MOVEMENTS: Movement[] = [
  {
    id: "TRF-4001",
    type: "Transfer",
    status: "In transit",
    fromLocationId: WAREHOUSE,
    toLocationId: MAKOLA,
    lines: [{ productId: "p-3", productName: "Frytol Cooking Oil 3L", quantitySent: 12 }],
    createdBy: "Yaw Boadi",
    createdDateISO: "2026-07-22",
    sentDateISO: "2026-07-22",
    hasDiscrepancy: false,
  },
  {
    id: "TRF-3998",
    type: "Transfer",
    status: "Completed",
    fromLocationId: WAREHOUSE,
    toLocationId: MAKOLA,
    lines: [{ productId: "p-16", productName: "Tasty Tom Tomato Paste", quantitySent: 100, quantityReceived: 96 }],
    createdBy: "Efua Mensima",
    createdDateISO: "2026-07-18",
    sentDateISO: "2026-07-18",
    receivedDateISO: "2026-07-19",
    hasDiscrepancy: true,
    discrepancyReason: "4 tins damaged in transit",
  },
  {
    id: "TRF-3990",
    type: "Transfer",
    status: "Completed",
    fromLocationId: WAREHOUSE,
    toLocationId: MAKOLA,
    lines: [{ productId: "p-2", productName: "Milo 400g tin", quantitySent: 24, quantityReceived: 24 }],
    createdBy: "Yaw Boadi",
    createdDateISO: "2026-07-14",
    sentDateISO: "2026-07-14",
    receivedDateISO: "2026-07-15",
    hasDiscrepancy: false,
  },
  {
    id: "TRF-3982",
    type: "Transfer",
    status: "Completed",
    fromLocationId: MAKOLA,
    toLocationId: WAREHOUSE,
    lines: [{ productId: "p-19", productName: "Cowbell Milk Sachet", quantitySent: 50, quantityReceived: 50 }],
    note: "Shop floor was overstocked — moving surplus back.",
    createdBy: "Efua Mensima",
    createdDateISO: "2026-07-10",
    sentDateISO: "2026-07-10",
    receivedDateISO: "2026-07-10",
    hasDiscrepancy: false,
  },
  {
    id: "TRF-3975",
    type: "Transfer",
    status: "Cancelled",
    fromLocationId: WAREHOUSE,
    toLocationId: MAKOLA,
    lines: [{ productId: "p-21", productName: "Peak Milk 400g", quantitySent: 20 }],
    note: "Shelf still had enough stock — cancelled before sending.",
    createdBy: "Yaw Boadi",
    createdDateISO: "2026-07-07",
    hasDiscrepancy: false,
  },
  { id: "SPL-5001", type: "Split", locationId: MAKOLA, productId: "p-3", productName: "Frytol Cooking Oil 3L", purchaseUnitsSplit: 1, baseUnitsCreated: 6, userName: "Adjoa Boateng", dateISO: "2026-07-20" },
  { id: "SPL-5002", type: "Split", locationId: WAREHOUSE, productId: "p-6", productName: "Key Soap", purchaseUnitsSplit: 1, baseUnitsCreated: 72, userName: "Efua Mensima", dateISO: "2026-07-17" },
  { id: "SPL-5003", type: "Split", locationId: MAKOLA, productId: "p-16", productName: "Tasty Tom Tomato Paste", purchaseUnitsSplit: 2, baseUnitsCreated: 100, userName: "Adjoa Boateng", dateISO: "2026-07-16" },
  { id: "SPL-5004", type: "Split", locationId: WAREHOUSE, productId: "p-3", productName: "Frytol Cooking Oil 3L", purchaseUnitsSplit: 2, baseUnitsCreated: 12, userName: "Yaw Boadi", dateISO: "2026-07-12" },
  { id: "SPL-5005", type: "Split", locationId: WAREHOUSE, productId: "p-6", productName: "Key Soap", purchaseUnitsSplit: 1, baseUnitsCreated: 72, userName: "Efua Mensima", dateISO: "2026-07-08" },
  { id: "ADJ-6001", type: "Adjustment", locationId: MAKOLA, productId: "p-9", productName: "Voltic Water 750ml", previousQty: 185, newQty: 180, delta: -5, reason: "Damage", userName: "Adjoa Boateng", dateISO: "2026-07-21" },
  { id: "ADJ-6002", type: "Adjustment", locationId: MAKOLA, productId: "p-5", productName: "Indomie Chicken Noodles", previousQty: 305, newQty: 300, delta: -5, reason: "Expiry", userName: "Efua Mensima", dateISO: "2026-07-19" },
  { id: "ADJ-6003", type: "Adjustment", locationId: WAREHOUSE, productId: "p-25", productName: "Gino Tomato Mix", previousQty: 45, newQty: 40, delta: -5, reason: "Breakage", userName: "Yaw Boadi", dateISO: "2026-07-17" },
  { id: "ADJ-6004", type: "Adjustment", locationId: MAKOLA, productId: "p-23", productName: "Duracell AA (pack)", previousQty: 58, newQty: 53, delta: -5, reason: "Theft", userName: "Adjoa Boateng", dateISO: "2026-07-15" },
  { id: "ADJ-6005", type: "Adjustment", locationId: MAKOLA, productId: "p-20", productName: "Lipton Tea 25s", previousQty: 70, newQty: 75, delta: 5, reason: "Miscount correction", userName: "Efua Mensima", dateISO: "2026-07-13" },
  { id: "ADJ-6006", type: "Adjustment", locationId: WAREHOUSE, productId: "p-21", productName: "Peak Milk 400g", previousQty: 33, newQty: 30, delta: -3, reason: "Other", note: "Damaged in warehouse flooding", userName: "Yaw Boadi", dateISO: "2026-07-11" },
  { id: "ADJ-6007", type: "Adjustment", locationId: MAKOLA, productId: "p-22", productName: "Close Up Toothpaste", previousQty: 75, newQty: 70, delta: -5, reason: "Damage", userName: "Adjoa Boateng", dateISO: "2026-07-09" },
  { id: "RET-7001", type: "Return", locationId: MAKOLA, productId: "p-8", productName: "Nido 400g", quantity: 2, reason: "Customer return — unopened", userName: "Adjoa Boateng", dateISO: "2026-07-20" },
  { id: "RET-7002", type: "Return", locationId: MAKOLA, productId: "p-18", productName: "Royal Aroma Rice 5kg", quantity: 1, reason: "Customer return — wrong item", userName: "Efua Mensima", dateISO: "2026-07-16" },
  { id: "RET-7003", type: "Return", locationId: WAREHOUSE, productId: "p-13", productName: "Titus Sardines", quantity: 5, reason: "Returned to supplier — damaged batch", userName: "Yaw Boadi", dateISO: "2026-07-06" },
]

let movementsStore: Movement[] = MOVEMENTS.map((m) => (m.type === "Transfer" ? { ...m, lines: m.lines.map((l) => ({ ...l })) } : { ...m }))

export function getMovementsStore(): Movement[] {
  return movementsStore
}

export function setMovementsStore(next: Movement[]): void {
  movementsStore = next
}

// ---------------------------------------------------------------------------
// Larry's Curtains & Décor — a small seed set
// ---------------------------------------------------------------------------

const SHOWROOM = LARRY_DEFAULT_SHOP_LOCATION_ID
const WORKSHOP = "loc-larry-workshop"

export const LARRY_MOVEMENTS: Movement[] = [
  {
    id: "TRF-8001",
    type: "Transfer",
    status: "In transit",
    fromLocationId: WORKSHOP,
    toLocationId: SHOWROOM,
    lines: [{ productId: "larry-p-5", productName: "Velvet Drape", quantitySent: 5 }],
    createdBy: "Larry Ntori",
    createdDateISO: "2026-07-22",
    sentDateISO: "2026-07-22",
    hasDiscrepancy: false,
  },
  { id: "ADJ-9001", type: "Adjustment", locationId: SHOWROOM, productId: "larry-p-3", productName: "Blackout Fabric — Navy", previousQty: 24, newQty: 20, delta: -4, reason: "Damage", userName: "Larry Ntori", dateISO: "2026-07-17" },
  { id: "RET-9001", type: "Return", locationId: SHOWROOM, productId: "larry-p-9", productName: "Pole Bracket", quantity: 3, reason: "Customer return — unopened", userName: "Larry Ntori", dateISO: "2026-07-14" },
]

let larryMovementsStore: Movement[] = LARRY_MOVEMENTS.map((m) => (m.type === "Transfer" ? { ...m, lines: m.lines.map((l) => ({ ...l })) } : { ...m }))

export function getLarryMovementsStore(): Movement[] {
  return larryMovementsStore
}

export function setLarryMovementsStore(next: Movement[]): void {
  larryMovementsStore = next
}

function movementStoreFor(isLarry: boolean) {
  return isLarry
    ? { get: getLarryMovementsStore, set: setLarryMovementsStore }
    : { get: getMovementsStore, set: setMovementsStore }
}

function productStoreFor(isLarry: boolean) {
  return isLarry
    ? { get: getLarryProductsStore, set: setLarryProductsStore }
    : { get: getProductsStore, set: setProductsStore }
}

function nextId(isLarry: boolean, prefix: string): string {
  const all = movementStoreFor(isLarry).get()
  const numbers = all
    .filter((m) => m.id.startsWith(prefix))
    .map((m) => Number.parseInt(m.id.replace(prefix, ""), 10))
    .filter((n) => !Number.isNaN(n))
  return `${prefix}${Math.max(0, ...numbers) + 1}`
}

function findProduct(isLarry: boolean, productId: string): Product | undefined {
  return productStoreFor(isLarry).get().find((p) => p.id === productId)
}

// ---------------------------------------------------------------------------
// Split
// ---------------------------------------------------------------------------

export function splitStock(isLarry: boolean, locationId: string, productId: string, purchaseUnitsToSplit: number, userName: string): SplitMovement | undefined {
  const product = findProduct(isLarry, productId)
  if (!product || product.pack.soldByMeasure) return undefined
  const unitsPerPurchase = product.pack.unitsPerPurchaseUnit ?? 1
  const current = stockAt(product, locationId)
  const splitCount = Math.min(purchaseUnitsToSplit, current.sealedPurchaseUnits)
  if (splitCount <= 0) return undefined

  const baseUnitsCreated = splitCount * unitsPerPurchase
  setLocationStockFor(isLarry, productId, locationId, (s) => ({
    ...s,
    sealedPurchaseUnits: s.sealedPurchaseUnits - splitCount,
    onHand: s.onHand + baseUnitsCreated,
  }))

  const movement: SplitMovement = {
    id: nextId(isLarry, "SPL-"),
    type: "Split",
    locationId,
    productId,
    productName: product.name,
    purchaseUnitsSplit: splitCount,
    baseUnitsCreated,
    userName,
    dateISO: TODAY_ISO,
  }
  const store = movementStoreFor(isLarry)
  store.set([movement, ...store.get()])
  return movement
}

function setLocationStockFor(isLarry: boolean, productId: string, locationId: string, patch: (stock: LocationStock) => LocationStock): void {
  const store = productStoreFor(isLarry)
  store.set(
    store.get().map((p) => {
      if (p.id !== productId) return p
      const existing = stockAt(p, locationId)
      const next = patch(existing)
      const others = p.locationStock.filter((ls) => ls.locationId !== locationId)
      return { ...p, locationStock: [...others, next] }
    })
  )
}

// ---------------------------------------------------------------------------
// Adjustment
// ---------------------------------------------------------------------------

export function adjustStock(
  isLarry: boolean,
  locationId: string,
  productId: string,
  newQty: number,
  reason: string,
  note: string | undefined,
  userName: string
): AdjustmentMovement | undefined {
  const product = findProduct(isLarry, productId)
  if (!product) return undefined
  const current = stockAt(product, locationId)
  const previousQty = current.onHand
  const delta = newQty - previousQty

  setLocationStockFor(isLarry, productId, locationId, (s) => ({ ...s, onHand: Math.max(0, newQty) }))

  const movement: AdjustmentMovement = {
    id: nextId(isLarry, "ADJ-"),
    type: "Adjustment",
    locationId,
    productId,
    productName: product.name,
    previousQty,
    newQty,
    delta,
    reason,
    note,
    userName,
    dateISO: TODAY_ISO,
  }
  const store = movementStoreFor(isLarry)
  store.set([movement, ...store.get()])
  return movement
}

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export interface CreateTransferInput {
  fromLocationId: string
  toLocationId: string
  lines: { productId: string; productName: string; quantitySent: number }[]
  note?: string
  userName: string
  sendNow: boolean
}

export function createTransfer(isLarry: boolean, input: CreateTransferInput): Transfer {
  const transfer: Transfer = {
    id: nextId(isLarry, "TRF-"),
    type: "Transfer",
    status: input.sendNow ? "In transit" : "Draft",
    fromLocationId: input.fromLocationId,
    toLocationId: input.toLocationId,
    lines: input.lines.map((l) => ({ ...l })),
    note: input.note,
    createdBy: input.userName,
    createdDateISO: TODAY_ISO,
    sentDateISO: input.sendNow ? TODAY_ISO : undefined,
    hasDiscrepancy: false,
  }

  if (input.sendNow) {
    for (const line of transfer.lines) {
      setLocationStockFor(isLarry, line.productId, input.fromLocationId, (s) => ({
        ...s,
        onHand: Math.max(0, s.onHand - line.quantitySent),
      }))
    }
  }

  const store = movementStoreFor(isLarry)
  store.set([transfer, ...store.get()])
  return transfer
}

export function sendTransfer(isLarry: boolean, transferId: string): void {
  const store = movementStoreFor(isLarry)
  const transfer = store.get().find((m) => m.id === transferId && m.type === "Transfer") as Transfer | undefined
  if (!transfer || transfer.status !== "Draft") return

  for (const line of transfer.lines) {
    setLocationStockFor(isLarry, line.productId, transfer.fromLocationId, (s) => ({
      ...s,
      onHand: Math.max(0, s.onHand - line.quantitySent),
    }))
  }

  store.set(store.get().map((m) => (m.id === transferId ? { ...transfer, status: "In transit", sentDateISO: TODAY_ISO } : m)))
}

export function cancelTransfer(isLarry: boolean, transferId: string): void {
  const store = movementStoreFor(isLarry)
  store.set(
    store.get().map((m) => (m.id === transferId && m.type === "Transfer" && m.status === "Draft" ? { ...m, status: "Cancelled" } : m))
  )
}

export interface ReceiveTransferLine {
  productId: string
  quantityReceived: number
}

/** The destination confirms what actually arrived — never silently overwrites the sent quantity. */
export function receiveTransfer(isLarry: boolean, transferId: string, receivedLines: ReceiveTransferLine[], discrepancyReason?: string): void {
  const store = movementStoreFor(isLarry)
  const transfer = store.get().find((m) => m.id === transferId && m.type === "Transfer") as Transfer | undefined
  if (!transfer || transfer.status !== "In transit") return

  const updatedLines = transfer.lines.map((line) => {
    const received = receivedLines.find((r) => r.productId === line.productId)
    return { ...line, quantityReceived: received?.quantityReceived ?? line.quantitySent }
  })

  for (const line of updatedLines) {
    setLocationStockFor(isLarry, line.productId, transfer.toLocationId, (s) => ({
      ...s,
      onHand: s.onHand + (line.quantityReceived ?? 0),
    }))
  }

  const hasDiscrepancy = updatedLines.some((line) => (line.quantityReceived ?? 0) !== line.quantitySent)

  store.set(
    store.get().map((m) =>
      m.id === transferId
        ? { ...transfer, lines: updatedLines, status: "Completed", receivedDateISO: TODAY_ISO, hasDiscrepancy, discrepancyReason: hasDiscrepancy ? discrepancyReason : undefined }
        : m
    )
  )
}

export { availableAt, purchaseUnitsAt }

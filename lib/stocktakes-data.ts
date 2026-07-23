/**
 * Stocktakes — cycle counting with snapshot reconciliation, so a shop can
 * keep trading while counting. Starting a count snapshots system quantities;
 * sales, receipts, and transfers during the count are tracked separately by
 * simply comparing the live system quantity against that snapshot at review
 * time — the difference *is* "movements during the count".
 */

import {
  getProductsStore,
  setProductsStore,
  stockAt,
  type Product,
} from "@/lib/pos-data"
import { getLarryProductsStore, setLarryProductsStore } from "@/lib/larry-data"
import { TODAY_ISO } from "@/lib/period-utils"

export type StocktakeStatus = "In progress" | "Posted" | "Discarded"
export type StocktakeScope = "Full location" | "By category" | "By shelf" | "Selected products"

export const STOCKTAKE_SCOPES: StocktakeScope[] = ["Full location", "By category", "By shelf", "Selected products"]

export const VARIANCE_REASONS = [
  "Miscount",
  "Damage",
  "Expiry",
  "Theft",
  "Unrecorded sale",
  "Supplier short-delivery",
  "Other",
]

export interface StocktakeSnapshotLine {
  productId: string
  productName: string
  /** Loose (sellable) system quantity at the moment the count started. */
  systemQtyAtSnapshot: number
  /** Frozen once posted — for an in-progress count this is left undefined and computed live against the current store instead. */
  frozenExpectedNow?: number
}

export interface StocktakeCountLine {
  productId: string
  countedQty?: number
}

export interface StocktakeVarianceEntry {
  productId: string
  reason: string
  note?: string
}

export interface Stocktake {
  id: string
  locationId: string
  scope: StocktakeScope
  scopeDetail?: string
  blindCount: boolean
  status: StocktakeStatus
  startedBy: string
  startedDateISO: string
  postedDateISO?: string
  snapshot: StocktakeSnapshotLine[]
  counts: StocktakeCountLine[]
  varianceReasons: StocktakeVarianceEntry[]
}

export interface ReviewLine {
  productId: string
  productName: string
  counted?: number
  systemAtSnapshot: number
  movementsDuringCount: number
  expectedNow: number
  variance?: number
}

/** Live for an in-progress count (compares against the current store); frozen for a posted one. */
export function reviewLines(stocktake: Stocktake, productStore: () => Product[]): ReviewLine[] {
  const products = productStore()
  return stocktake.snapshot.map((snap) => {
    const counted = stocktake.counts.find((c) => c.productId === snap.productId)?.countedQty
    const product = products.find((p) => p.id === snap.productId)
    const currentQty = product ? stockAt(product, stocktake.locationId).onHand : snap.systemQtyAtSnapshot
    const expectedNow = snap.frozenExpectedNow ?? currentQty
    const movementsDuringCount = expectedNow - snap.systemQtyAtSnapshot
    return {
      productId: snap.productId,
      productName: snap.productName,
      counted,
      systemAtSnapshot: snap.systemQtyAtSnapshot,
      movementsDuringCount,
      expectedNow,
      variance: counted !== undefined ? counted - expectedNow : undefined,
    }
  })
}

export function countedProgress(stocktake: Stocktake): { counted: number; total: number } {
  const counted = stocktake.counts.filter((c) => c.countedQty !== undefined).length
  return { counted, total: stocktake.snapshot.length }
}

// ---------------------------------------------------------------------------
// Adwoa's Provisions — seed data
// ---------------------------------------------------------------------------

const MAKOLA = "loc-makola"

function snapshotFromCurrent(productIds: string[], overrides: Record<string, number> = {}): StocktakeSnapshotLine[] {
  return getProductsStore()
    .filter((p) => productIds.includes(p.id))
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      systemQtyAtSnapshot: overrides[p.id] ?? stockAt(p, MAKOLA).onHand,
    }))
}

const ALL_PRODUCT_IDS = getProductsStore().map((p) => p.id)
const FULL_SNAPSHOT = snapshotFromCurrent(ALL_PRODUCT_IDS, { "p-24": 160, "p-17": 30 })
const FULL_COUNTS: StocktakeCountLine[] = FULL_SNAPSHOT.map((s) => ({
  productId: s.productId,
  countedQty: s.productId === "p-24" ? 155 : s.productId === "p-17" ? 33 : s.systemQtyAtSnapshot,
}))

const BEVERAGES_IDS = ["p-2", "p-9", "p-10", "p-12", "p-20"]
const BEVERAGES_SNAPSHOT = snapshotFromCurrent(BEVERAGES_IDS)
const BEVERAGES_COUNTS: StocktakeCountLine[] = BEVERAGES_SNAPSHOT.map((s) => ({ productId: s.productId, countedQty: s.systemQtyAtSnapshot }))

const TOILETRIES_IDS = ["p-6", "p-14", "p-15", "p-22"]
const TOILETRIES_SNAPSHOT = snapshotFromCurrent(TOILETRIES_IDS, { "p-6": 136, "p-15": 54 })
const TOILETRIES_COUNTS: StocktakeCountLine[] = [
  { productId: "p-6", countedQty: 134 },
  { productId: "p-14", countedQty: undefined },
  { productId: "p-15", countedQty: 53 },
  { productId: "p-22", countedQty: undefined },
]

export const STOCKTAKES: Stocktake[] = [
  {
    id: "ST-1001",
    locationId: MAKOLA,
    scope: "Full location",
    blindCount: true,
    status: "Posted",
    startedBy: "Yaw Boadi",
    startedDateISO: "2026-07-05",
    postedDateISO: "2026-07-05",
    snapshot: FULL_SNAPSHOT,
    counts: FULL_COUNTS,
    varianceReasons: [
      { productId: "p-24", reason: "Theft" },
      { productId: "p-17", reason: "Miscount" },
    ],
  },
  {
    id: "ST-1002",
    locationId: MAKOLA,
    scope: "By category",
    scopeDetail: "Beverages",
    blindCount: true,
    status: "Posted",
    startedBy: "Efua Mensima",
    startedDateISO: "2026-06-25",
    postedDateISO: "2026-06-25",
    snapshot: BEVERAGES_SNAPSHOT,
    counts: BEVERAGES_COUNTS,
    varianceReasons: [],
  },
  {
    id: "ST-1003",
    locationId: MAKOLA,
    scope: "By category",
    scopeDetail: "Toiletries",
    blindCount: true,
    status: "In progress",
    startedBy: "Adjoa Boateng",
    startedDateISO: "2026-07-21",
    snapshot: TOILETRIES_SNAPSHOT,
    counts: TOILETRIES_COUNTS,
    varianceReasons: [],
  },
]

let stocktakesStore: Stocktake[] = STOCKTAKES.map((st) => ({
  ...st,
  snapshot: st.snapshot.map((s) => ({ ...s })),
  counts: st.counts.map((c) => ({ ...c })),
  varianceReasons: st.varianceReasons.map((v) => ({ ...v })),
}))

export function getStocktakesStore(): Stocktake[] {
  return stocktakesStore
}

export function setStocktakesStore(next: Stocktake[]): void {
  stocktakesStore = next
}

// ---------------------------------------------------------------------------
// Larry's Curtains & Décor — a small seed set
// ---------------------------------------------------------------------------

const SHOWROOM = "loc-larry-showroom"

function larrySnapshot(productIds: string[]): StocktakeSnapshotLine[] {
  return getLarryProductsStore()
    .filter((p) => productIds.includes(p.id))
    .map((p) => ({ productId: p.id, productName: p.name, systemQtyAtSnapshot: stockAt(p, SHOWROOM).onHand }))
}

const LARRY_SNAPSHOT = larrySnapshot(["larry-p-1", "larry-p-2", "larry-p-3", "larry-p-4"])

export const LARRY_STOCKTAKES: Stocktake[] = [
  {
    id: "ST-2001",
    locationId: SHOWROOM,
    scope: "By category",
    scopeDetail: "Fabric",
    blindCount: true,
    status: "In progress",
    startedBy: "Larry Ntori",
    startedDateISO: "2026-07-20",
    snapshot: LARRY_SNAPSHOT,
    counts: [
      { productId: "larry-p-1", countedQty: 45 },
      { productId: "larry-p-2", countedQty: undefined },
      { productId: "larry-p-3", countedQty: undefined },
      { productId: "larry-p-4", countedQty: undefined },
    ],
    varianceReasons: [],
  },
]

let larryStocktakesStore: Stocktake[] = LARRY_STOCKTAKES.map((st) => ({
  ...st,
  snapshot: st.snapshot.map((s) => ({ ...s })),
  counts: st.counts.map((c) => ({ ...c })),
  varianceReasons: st.varianceReasons.map((v) => ({ ...v })),
}))

export function getLarryStocktakesStore(): Stocktake[] {
  return larryStocktakesStore
}

export function setLarryStocktakesStore(next: Stocktake[]): void {
  larryStocktakesStore = next
}

function stocktakeStoreFor(isLarry: boolean) {
  return isLarry
    ? { get: getLarryStocktakesStore, set: setLarryStocktakesStore }
    : { get: getStocktakesStore, set: setStocktakesStore }
}

function productStoreFor(isLarry: boolean) {
  return isLarry
    ? { get: getLarryProductsStore, set: setLarryProductsStore }
    : { get: getProductsStore, set: setProductsStore }
}

function nextStocktakeId(isLarry: boolean): string {
  const all = stocktakeStoreFor(isLarry).get()
  const numbers = all.map((st) => Number.parseInt(st.id.replace("ST-", ""), 10)).filter((n) => !Number.isNaN(n))
  return `ST-${Math.max(0, ...numbers) + 1}`
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export interface StartStocktakeInput {
  locationId: string
  scope: StocktakeScope
  scopeDetail?: string
  productIds: string[]
  blindCount: boolean
  startedBy: string
}

export function startStocktake(isLarry: boolean, input: StartStocktakeInput): Stocktake {
  const products = productStoreFor(isLarry).get()
  const snapshot: StocktakeSnapshotLine[] = products
    .filter((p) => input.productIds.includes(p.id))
    .map((p) => ({ productId: p.id, productName: p.name, systemQtyAtSnapshot: stockAt(p, input.locationId).onHand }))

  const stocktake: Stocktake = {
    id: nextStocktakeId(isLarry),
    locationId: input.locationId,
    scope: input.scope,
    scopeDetail: input.scopeDetail,
    blindCount: input.blindCount,
    status: "In progress",
    startedBy: input.startedBy,
    startedDateISO: TODAY_ISO,
    snapshot,
    counts: snapshot.map((s) => ({ productId: s.productId, countedQty: undefined })),
    varianceReasons: [],
  }

  const store = stocktakeStoreFor(isLarry)
  store.set([stocktake, ...store.get()])
  return stocktake
}

/** Save-and-resume — counting happens between customers, not in one sitting. */
export function saveCountProgress(isLarry: boolean, stocktakeId: string, counts: StocktakeCountLine[]): void {
  const store = stocktakeStoreFor(isLarry)
  store.set(store.get().map((st) => (st.id === stocktakeId ? { ...st, counts } : st)))
}

export function setVarianceReason(isLarry: boolean, stocktakeId: string, productId: string, reason: string, note?: string): void {
  const store = stocktakeStoreFor(isLarry)
  store.set(
    store.get().map((st) => {
      if (st.id !== stocktakeId) return st
      const without = st.varianceReasons.filter((v) => v.productId !== productId)
      return { ...st, varianceReasons: [...without, { productId, reason, note }] }
    })
  )
}

/** Posting creates adjustment-equivalent stock corrections and brings the system in line with the count. */
export function postStocktake(isLarry: boolean, stocktakeId: string): void {
  const store = stocktakeStoreFor(isLarry)
  const stocktake = store.get().find((st) => st.id === stocktakeId)
  if (!stocktake) return

  const lines = reviewLines(stocktake, productStoreFor(isLarry).get)
  const productStore = productStoreFor(isLarry)
  let products = productStore.get()

  for (const line of lines) {
    if (line.counted === undefined || line.variance === 0 || line.variance === undefined) continue
    products = products.map((p) => {
      if (p.id !== line.productId) return p
      const existing = stockAt(p, stocktake.locationId)
      const others = p.locationStock.filter((ls) => ls.locationId !== stocktake.locationId)
      return { ...p, locationStock: [...others, { ...existing, onHand: Math.max(0, line.counted ?? existing.onHand) }] }
    })
  }
  productStore.set(products)

  const frozenSnapshot = stocktake.snapshot.map((s) => {
    const line = lines.find((l) => l.productId === s.productId)
    return { ...s, frozenExpectedNow: line?.expectedNow ?? s.systemQtyAtSnapshot }
  })

  store.set(
    store.get().map((st) => (st.id === stocktakeId ? { ...st, status: "Posted", postedDateISO: TODAY_ISO, snapshot: frozenSnapshot } : st))
  )
}

export function discardStocktake(isLarry: boolean, stocktakeId: string): void {
  const store = stocktakeStoreFor(isLarry)
  store.set(store.get().map((st) => (st.id === stocktakeId ? { ...st, status: "Discarded" } : st)))
}

export function netVarianceValue(stocktake: Stocktake, products: Product[]): number {
  const lines = reviewLines(stocktake, () => products)
  return lines.reduce((sum, line) => {
    if (line.variance === undefined) return sum
    const product = products.find((p) => p.id === line.productId)
    return sum + line.variance * (product?.costPrice ?? 0)
  }, 0)
}

export function varianceCount(stocktake: Stocktake, products: Product[]): number {
  const lines = reviewLines(stocktake, () => products)
  return lines.filter((l) => l.variance !== undefined && l.variance !== 0).length
}

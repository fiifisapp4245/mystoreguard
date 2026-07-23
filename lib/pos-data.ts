/**
 * Register (POS) mock data — the product catalogue, cart shapes, and held
 * sales the /register screen operates on. Plain typed arrays, no backend —
 * everything here is client-side state seeded from these lists.
 *
 * Stock is tracked per location (Location is a dimension, not a module — see
 * lib/mock-data.ts's LOCATIONS). Pack structure (base sellable unit vs bulk
 * purchase unit) is a product attribute set once here; it drives splitting,
 * purchase orders, and stocktaking everywhere else in the app.
 */

import { DEFAULT_SHOP_LOCATION_ID } from "@/lib/mock-data"

export interface LocationStock {
  locationId: string
  /** Loose, sellable base units — what the register can actually scan and sell. */
  onHand: number
  setAside: number
  /**
   * Whole purchase packs (cartons) sitting unopened — physically on the
   * premises and counted at a stocktake, but not sellable until split. Zero
   * for products sold by measure (nothing to seal).
   */
  sealedPurchaseUnits: number
}

export interface PackStructure {
  /** Continuous measure (fabric per yard) — no carton/piece conversion applies. */
  soldByMeasure: boolean
  /** The unit a customer buys, e.g. "Tin", "Piece", "Yard". */
  baseUnit: string
  /** The bulk unit purchased from suppliers, e.g. "Carton". Absent when soldByMeasure. */
  purchaseUnit?: string
  /** How many base units make up one purchase unit, e.g. 24. Absent when soldByMeasure. */
  unitsPerPurchaseUnit?: number
}

export type TaxTreatment = "standard" | "exempt"

export interface Product {
  id: string
  name: string
  description?: string
  /** 13-digit EAN-13-shaped string. Absent for Quick keys items and most services. */
  barcode?: string
  category: string
  /** Services (e.g. tailoring labour) aren't stocked at all. */
  isService: boolean
  /** Deactivated products are hidden from the register but remain in reports — never deleted. */
  isActive: boolean
  pack: PackStructure
  /** Current cost per base unit — moving weighted average, recalculated on each receipt. */
  costPrice: number
  /** Selling price per base unit. */
  sellingPrice: number
  reorderPoint: number
  preferredSupplierId?: string
  taxTreatment: TaxTreatment
  locationStock: LocationStock[]
  /** Quick keys item — sold without a barcode (produce, loose goods). */
  noBarcode?: boolean
}

/** Base-unit-equivalent of one location's sealed cartons — what a stocktake counts alongside loose onHand. */
function sealedAsBaseUnits(product: Product, ls: LocationStock): number {
  return ls.sealedPurchaseUnits * (product.pack.unitsPerPurchaseUnit ?? 0)
}

/** Total physical stock (loose + still-sealed), in base-unit-equivalent terms — what a stocktake would count. */
export function totalOnHand(product: Product): number {
  return product.locationStock.reduce((sum, ls) => sum + ls.onHand + sealedAsBaseUnits(product, ls), 0)
}

export function totalSetAside(product: Product): number {
  return product.locationStock.reduce((sum, ls) => sum + ls.setAside, 0)
}

/** Loose, sellable stock minus what's set aside — sealed cartons aren't available until split. */
export function totalAvailable(product: Product): number {
  const looseOnHand = product.locationStock.reduce((sum, ls) => sum + ls.onHand, 0)
  return looseOnHand - totalSetAside(product)
}

export function stockAt(product: Product, locationId: string): LocationStock {
  return product.locationStock.find((ls) => ls.locationId === locationId) ?? { locationId, onHand: 0, setAside: 0, sealedPurchaseUnits: 0 }
}

export function availableAt(product: Product, locationId: string): number {
  const stock = stockAt(product, locationId)
  return stock.onHand - stock.setAside
}

/** Whole purchase packs (cartons) on hand at a location, not yet split open. */
export function purchaseUnitsAt(product: Product, locationId: string): number {
  if (product.pack.soldByMeasure) return 0
  return stockAt(product, locationId).sealedPurchaseUnits
}

function pack(input: Omit<PackStructure, "soldByMeasure">): PackStructure {
  return { soldByMeasure: false, ...input }
}

function packByMeasure(baseUnit: string): PackStructure {
  return { soldByMeasure: true, baseUnit }
}

const MAKOLA = DEFAULT_SHOP_LOCATION_ID
const WAREHOUSE = "loc-warehouse-abossey"

function stock(shopOnHand: number, warehouseOnHand: number, shopSetAside = 0, shopSealed = 0, warehouseSealed = 0): LocationStock[] {
  const locations: LocationStock[] = [
    { locationId: MAKOLA, onHand: shopOnHand, setAside: shopSetAside, sealedPurchaseUnits: shopSealed },
  ]
  if (warehouseOnHand > 0 || warehouseSealed > 0) {
    locations.push({ locationId: WAREHOUSE, onHand: warehouseOnHand, setAside: 0, sealedPurchaseUnits: warehouseSealed })
  }
  return locations
}

export const PRODUCTS: Product[] = [
  { id: "p-1", name: "Ideal Milk 380g", barcode: "6001234500011", category: "Dairy", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 24 }), costPrice: 10.44, sellingPrice: 14.5, reorderPoint: 20, preferredSupplierId: "sup-2", taxTreatment: "standard", locationStock: stock(90, 30) },
  { id: "p-2", name: "Milo 400g tin", barcode: "6001234500028", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 12 }), costPrice: 30.24, sellingPrice: 42.0, reorderPoint: 15, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(60, 0) },
  { id: "p-3", name: "Frytol Cooking Oil 3L", barcode: "6001234500035", category: "Cooking Oil", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Carton", unitsPerPurchaseUnit: 6 }), costPrice: 66.24, sellingPrice: 92.0, reorderPoint: 40, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(38, 0, 0, 2, 4) },
  { id: "p-4", name: "Frytol Cooking Oil 5L", barcode: "6001234500042", category: "Cooking Oil", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Carton", unitsPerPurchaseUnit: 4 }), costPrice: 106.56, sellingPrice: 148.0, reorderPoint: 25, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(25, 0) },
  { id: "p-5", name: "Indomie Chicken Noodles", barcode: "6001234500059", category: "Noodles", isService: false, isActive: true, pack: pack({ baseUnit: "Pack", purchaseUnit: "Carton", unitsPerPurchaseUnit: 40 }), costPrice: 4.32, sellingPrice: 6.0, reorderPoint: 50, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(220, 80) },
  { id: "p-6", name: "Key Soap", barcode: "6001234500066", category: "Toiletries", isService: false, isActive: true, pack: pack({ baseUnit: "Bar", purchaseUnit: "Carton", unitsPerPurchaseUnit: 72 }), costPrice: 6.12, sellingPrice: 8.5, reorderPoint: 25, preferredSupplierId: "sup-4", taxTreatment: "standard", locationStock: stock(134, 0, 0, 0, 3) },
  { id: "p-7", name: "Geisha Sardines", barcode: "6001234500073", category: "Canned Fish", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 50 }), costPrice: 8.64, sellingPrice: 12.0, reorderPoint: 20, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(85, 0) },
  { id: "p-8", name: "Nido 400g", barcode: "6001234500080", category: "Dairy", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 24 }), costPrice: 34.56, sellingPrice: 48.0, reorderPoint: 60, preferredSupplierId: "sup-2", taxTreatment: "standard", locationStock: stock(55, 0) },
  { id: "p-9", name: "Voltic Water 750ml", barcode: "6001234500097", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Pack", unitsPerPurchaseUnit: 12 }), costPrice: 3.6, sellingPrice: 5.0, reorderPoint: 40, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(180, 60) },
  { id: "p-10", name: "Voltic 1.5L", barcode: "6001234500103", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Pack", unitsPerPurchaseUnit: 6 }), costPrice: 5.76, sellingPrice: 8.0, reorderPoint: 30, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(140, 40) },
  { id: "p-11", name: "Coca-Cola 500ml", barcode: "6001234500110", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Crate", unitsPerPurchaseUnit: 24 }), costPrice: 5.04, sellingPrice: 7.0, reorderPoint: 30, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(200, 0, 24) },
  { id: "p-12", name: "Malta Guinness", barcode: "6001234500127", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Crate", unitsPerPurchaseUnit: 24 }), costPrice: 6.84, sellingPrice: 9.5, reorderPoint: 25, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(100, 30) },
  { id: "p-13", name: "Titus Sardines", barcode: "6001234500134", category: "Canned Fish", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 50 }), costPrice: 10.8, sellingPrice: 15.0, reorderPoint: 55, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(51, 0) },
  { id: "p-14", name: "Sunlight Dishwashing Liquid", barcode: "6001234500141", category: "Toiletries", isService: false, isActive: true, pack: pack({ baseUnit: "Bottle", purchaseUnit: "Carton", unitsPerPurchaseUnit: 12 }), costPrice: 7.92, sellingPrice: 11.0, reorderPoint: 65, preferredSupplierId: "sup-4", taxTreatment: "standard", locationStock: stock(70, 0, 8) },
  { id: "p-15", name: "Omo 900g", barcode: "6001234500158", category: "Toiletries", isService: false, isActive: true, pack: pack({ baseUnit: "Pack", purchaseUnit: "Carton", unitsPerPurchaseUnit: 12 }), costPrice: 23.04, sellingPrice: 32.0, reorderPoint: 50, preferredSupplierId: "sup-4", taxTreatment: "standard", locationStock: stock(53, 0, 9) },
  { id: "p-16", name: "Tasty Tom Tomato Paste", barcode: "6001234500165", category: "Cooking Essentials", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 50 }), costPrice: 3.24, sellingPrice: 4.5, reorderPoint: 40, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(200, 60, 0, 3) },
  { id: "p-17", name: "Perfumed Rice 5kg", barcode: "6001234500172", category: "Grains", isService: false, isActive: true, pack: pack({ baseUnit: "Bag", purchaseUnit: "Bale", unitsPerPurchaseUnit: 10 }), costPrice: 56.16, sellingPrice: 78.0, reorderPoint: 25, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(30, 0, 11) },
  { id: "p-18", name: "Royal Aroma Rice 5kg", barcode: "6001234500189", category: "Grains", isService: false, isActive: true, pack: pack({ baseUnit: "Bag", purchaseUnit: "Bale", unitsPerPurchaseUnit: 10 }), costPrice: 59.04, sellingPrice: 82.0, reorderPoint: 45, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(40, 0) },
  { id: "p-19", name: "Cowbell Milk Sachet", barcode: "6001234500196", category: "Dairy", isService: false, isActive: true, pack: pack({ baseUnit: "Sachet", purchaseUnit: "Box", unitsPerPurchaseUnit: 100 }), costPrice: 2.16, sellingPrice: 3.0, reorderPoint: 60, preferredSupplierId: "sup-2", taxTreatment: "standard", locationStock: stock(300, 100) },
  { id: "p-20", name: "Lipton Tea 25s", barcode: "6001234500202", category: "Beverages", isService: false, isActive: true, pack: pack({ baseUnit: "Box", purchaseUnit: "Carton", unitsPerPurchaseUnit: 24 }), costPrice: 12.96, sellingPrice: 18.0, reorderPoint: 15, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(75, 0) },
  { id: "p-21", name: "Peak Milk 400g", barcode: "6001234500219", category: "Dairy", isService: false, isActive: true, pack: pack({ baseUnit: "Tin", purchaseUnit: "Carton", unitsPerPurchaseUnit: 24 }), costPrice: 11.52, sellingPrice: 16.0, reorderPoint: 20, preferredSupplierId: "sup-2", taxTreatment: "standard", locationStock: stock(70, 30) },
  { id: "p-22", name: "Close Up Toothpaste", barcode: "6001234500226", category: "Toiletries", isService: false, isActive: true, pack: pack({ baseUnit: "Tube", purchaseUnit: "Carton", unitsPerPurchaseUnit: 48 }), costPrice: 9.72, sellingPrice: 13.5, reorderPoint: 20, preferredSupplierId: "sup-4", taxTreatment: "standard", locationStock: stock(70, 25) },
  { id: "p-23", name: "Duracell AA (pack)", barcode: "6001234500233", category: "Batteries", isService: false, isActive: true, pack: pack({ baseUnit: "Pack", purchaseUnit: "Carton", unitsPerPurchaseUnit: 24 }), costPrice: 15.84, sellingPrice: 22.0, reorderPoint: 55, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(53, 0) },
  { id: "p-24", name: "Tema Salt 1kg", barcode: "6001234500240", category: "Cooking Essentials", isService: false, isActive: true, pack: pack({ baseUnit: "Bag", purchaseUnit: "Carton", unitsPerPurchaseUnit: 20 }), costPrice: 3.96, sellingPrice: 5.5, reorderPoint: 30, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(160, 60) },
  { id: "p-25", name: "Gino Tomato Mix", barcode: "6001234500257", category: "Cooking Essentials", isService: false, isActive: true, pack: pack({ baseUnit: "Sachet", purchaseUnit: "Carton", unitsPerPurchaseUnit: 100 }), costPrice: 4.68, sellingPrice: 6.5, reorderPoint: 25, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(150, 40) },
]

/** Quick keys — sold without scanning a barcode (produce, loose goods sold by portion). */
export const QUICK_KEY_ITEMS: Product[] = [
  { id: "qk-1", name: "Sachet Water (bag)", category: "Beverages", isService: false, isActive: true, pack: packByMeasure("Bag"), costPrice: 2.0, sellingPrice: 3.0, reorderPoint: 50, preferredSupplierId: "sup-1", taxTreatment: "standard", locationStock: stock(500, 0), noBarcode: true },
  { id: "qk-2", name: "Loose Rice (per olonka)", category: "Grains", isService: false, isActive: true, pack: packByMeasure("Olonka"), costPrice: 10.0, sellingPrice: 15.0, reorderPoint: 50, preferredSupplierId: "sup-7", taxTreatment: "standard", locationStock: stock(999, 0), noBarcode: true },
  { id: "qk-3", name: "Tomatoes", category: "Produce", isService: false, isActive: true, pack: packByMeasure("Basket"), costPrice: 6.0, sellingPrice: 10.0, reorderPoint: 50, preferredSupplierId: "sup-5", taxTreatment: "standard", locationStock: stock(999, 0), noBarcode: true },
  { id: "qk-4", name: "Onions", category: "Produce", isService: false, isActive: true, pack: packByMeasure("Basket"), costPrice: 5.0, sellingPrice: 8.0, reorderPoint: 50, preferredSupplierId: "sup-5", taxTreatment: "standard", locationStock: stock(999, 0), noBarcode: true },
  { id: "qk-5", name: "Charcoal (bag)", category: "Household", isService: false, isActive: true, pack: packByMeasure("Bag"), costPrice: 24.0, sellingPrice: 35.0, reorderPoint: 50, taxTreatment: "standard", locationStock: stock(999, 0), noBarcode: true },
  { id: "qk-6", name: "Ice Block", category: "Beverages", isService: false, isActive: true, pack: packByMeasure("Block"), costPrice: 3.0, sellingPrice: 5.0, reorderPoint: 50, taxTreatment: "standard", locationStock: stock(999, 0), noBarcode: true },
]

export const ALL_PRODUCTS: Product[] = [...PRODUCTS, ...QUICK_KEY_ITEMS]

/**
 * Register, Inventory, and Deliveries all mutate stock, and each of those is
 * a separate route that fully unmounts on navigation — same session-persisted
 * module-level store pattern as Invoice/Estimator's data.
 */
let productsStore: Product[] = ALL_PRODUCTS.map((p) => ({ ...p, locationStock: p.locationStock.map((ls) => ({ ...ls })) }))

export function getProductsStore(): Product[] {
  return productsStore
}

export function setProductsStore(next: Product[]): void {
  productsStore = next
}

export function getProduct(id: string): Product | undefined {
  return productsStore.find((p) => p.id === id)
}

/** Look up by catalogue name — mock sale/invoice line items only carry a name string, not a product id. */
export function getProductByName(name: string): Product | undefined {
  return productsStore.find((p) => p.name === name)
}

function adjustLocationStock(productId: string, locationId: string, patch: (stock: LocationStock) => LocationStock): void {
  productsStore = productsStore.map((p) => {
    if (p.id !== productId) return p
    const next = patch(stockAt(p, locationId))
    const others = p.locationStock.filter((ls) => ls.locationId !== locationId)
    return { ...p, locationStock: [...others, next] }
  })
}

export { adjustLocationStock as setLocationStock }

/** Over-the-counter sale — the customer walks out with the goods now, so On hand drops immediately. */
export function deductOnHandForSale(productId: string, quantity: number, locationId: string = DEFAULT_SHOP_LOCATION_ID): void {
  adjustLocationStock(productId, locationId, (s) => ({ ...s, onHand: Math.max(0, s.onHand - quantity) }))
}

/** A delivery is created (or gains a line) — goods are pulled aside, still physically in the shop. */
export function addSetAsideForDelivery(productId: string, quantity: number, locationId: string = DEFAULT_SHOP_LOCATION_ID): void {
  adjustLocationStock(productId, locationId, (s) => ({ ...s, setAside: s.setAside + quantity }))
}

/** Dispatch ("Out for delivery") — goods actually leave the shop now. */
export function dispatchSetAsideStock(productId: string, quantity: number, locationId: string = DEFAULT_SHOP_LOCATION_ID): void {
  adjustLocationStock(productId, locationId, (s) => ({
    ...s,
    onHand: Math.max(0, s.onHand - quantity),
    setAside: Math.max(0, s.setAside - quantity),
  }))
}

/** Failed delivery, returned to store — goods physically come back onto the shelf. */
export function returnStockToStore(productId: string, quantity: number, locationId: string = DEFAULT_SHOP_LOCATION_ID): void {
  adjustLocationStock(productId, locationId, (s) => ({ ...s, onHand: s.onHand + quantity }))
}

/** Cancelled (or a delivery line removed) before dispatch — release the hold, nothing physically moved. */
export function releaseSetAside(productId: string, quantity: number, locationId: string = DEFAULT_SHOP_LOCATION_ID): void {
  adjustLocationStock(productId, locationId, (s) => ({ ...s, setAside: Math.max(0, s.setAside - quantity) }))
}

export function findProductByBarcode(barcode: string): Product | undefined {
  const trimmed = barcode.trim()
  return getProductsStore().find((p) => p.barcode === trimmed && p.isActive)
}

/** Case-insensitive substring match over the active, barcoded catalogue, for the scan line's search-as-you-type fallback. */
export function searchProducts(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return getProductsStore()
    .filter((p) => p.isActive && !p.isService && p.name.toLowerCase().includes(q))
    .slice(0, limit)
}

/** A string of digits long enough to plausibly be a barcode scan rather than a name search. */
export function looksLikeBarcode(value: string): boolean {
  return /^\d{6,}$/.test(value.trim())
}

export interface CartLine {
  product: Product
  quantity: number
}

export function cartLineTotal(line: CartLine): number {
  return line.product.sellingPrice * line.quantity
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + cartLineTotal(line), 0)
}

export type TenderType = "Cash" | "Momo" | "Credit" | "Deposit" | "Split"

export const MOMO_NETWORKS = ["MTN", "Telecel", "AirtelTigo"]

export interface HeldSale {
  id: string
  customerName: string
  heldAt: string
  lines: CartLine[]
}

export function heldSaleTotal(sale: HeldSale): number {
  return cartSubtotal(sale.lines)
}

/** Seed a couple of held sales so "Resume held sale" is walkable immediately in the demo. */
export const INITIAL_HELD_SALES: HeldSale[] = [
  {
    id: "hold-1",
    customerName: "Walk-in customer",
    heldAt: "11:52 am",
    lines: [
      { product: PRODUCTS[8], quantity: 3 },
      { product: PRODUCTS[5], quantity: 2 },
    ],
  },
  {
    id: "hold-2",
    customerName: "Kwame Mensah",
    heldAt: "12:10 pm",
    lines: [
      { product: PRODUCTS[1], quantity: 1 },
      { product: PRODUCTS[16], quantity: 1 },
      { product: PRODUCTS[20], quantity: 2 },
    ],
  },
]

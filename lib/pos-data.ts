/**
 * Register (POS) mock data — the product catalogue, cart shapes, and held
 * sales the /register screen operates on. Plain typed arrays, no backend —
 * everything here is client-side state seeded from these lists.
 */

export interface Product {
  id: string
  name: string
  /** 13-digit EAN-13-shaped string. Absent for Quick keys items. */
  barcode?: string
  category: string
  price: number
  /** Physical stock in the shop right now — what a stocktake would count. */
  onHand: number
  /** Sold-but-not-yet-dispatched stock, pulled aside for a pending delivery. Still on hand, not available to sell. */
  setAside: number
  /** Quick keys item — sold without a barcode (produce, loose goods). */
  noBarcode?: boolean
}

/** What's actually available to sell right now. */
export function availableStock(product: Product): number {
  return product.onHand - product.setAside
}

export const PRODUCTS: Product[] = [
  { id: "p-1", name: "Ideal Milk 380g", barcode: "6001234500011", category: "Dairy", price: 14.5, onHand: 120, setAside: 0 },
  { id: "p-2", name: "Milo 400g tin", barcode: "6001234500028", category: "Beverages", price: 42.0, onHand: 60, setAside: 0 },
  { id: "p-3", name: "Frytol Cooking Oil 3L", barcode: "6001234500035", category: "Cooking Oil", price: 92.0, onHand: 38, setAside: 0 },
  { id: "p-4", name: "Frytol Cooking Oil 5L", barcode: "6001234500042", category: "Cooking Oil", price: 148.0, onHand: 25, setAside: 0 },
  { id: "p-5", name: "Indomie Chicken Noodles", barcode: "6001234500059", category: "Noodles", price: 6.0, onHand: 300, setAside: 0 },
  { id: "p-6", name: "Key Soap", barcode: "6001234500066", category: "Toiletries", price: 8.5, onHand: 134, setAside: 0 },
  { id: "p-7", name: "Geisha Sardines", barcode: "6001234500073", category: "Canned Fish", price: 12.0, onHand: 85, setAside: 0 },
  { id: "p-8", name: "Nido 400g", barcode: "6001234500080", category: "Dairy", price: 48.0, onHand: 55, setAside: 0 },
  { id: "p-9", name: "Voltic Water 750ml", barcode: "6001234500097", category: "Beverages", price: 5.0, onHand: 240, setAside: 0 },
  { id: "p-10", name: "Voltic 1.5L", barcode: "6001234500103", category: "Beverages", price: 8.0, onHand: 180, setAside: 0 },
  { id: "p-11", name: "Coca-Cola 500ml", barcode: "6001234500110", category: "Beverages", price: 7.0, onHand: 200, setAside: 24 },
  { id: "p-12", name: "Malta Guinness", barcode: "6001234500127", category: "Beverages", price: 9.5, onHand: 130, setAside: 0 },
  { id: "p-13", name: "Titus Sardines", barcode: "6001234500134", category: "Canned Fish", price: 15.0, onHand: 51, setAside: 0 },
  { id: "p-14", name: "Sunlight Dishwashing Liquid", barcode: "6001234500141", category: "Toiletries", price: 11.0, onHand: 70, setAside: 8 },
  { id: "p-15", name: "Omo 900g", barcode: "6001234500158", category: "Toiletries", price: 32.0, onHand: 53, setAside: 9 },
  { id: "p-16", name: "Tasty Tom Tomato Paste", barcode: "6001234500165", category: "Cooking Essentials", price: 4.5, onHand: 260, setAside: 0 },
  { id: "p-17", name: "Perfumed Rice 5kg", barcode: "6001234500172", category: "Grains", price: 78.0, onHand: 30, setAside: 11 },
  { id: "p-18", name: "Royal Aroma Rice 5kg", barcode: "6001234500189", category: "Grains", price: 82.0, onHand: 40, setAside: 0 },
  { id: "p-19", name: "Cowbell Milk Sachet", barcode: "6001234500196", category: "Dairy", price: 3.0, onHand: 400, setAside: 0 },
  { id: "p-20", name: "Lipton Tea 25s", barcode: "6001234500202", category: "Beverages", price: 18.0, onHand: 75, setAside: 0 },
  { id: "p-21", name: "Peak Milk 400g", barcode: "6001234500219", category: "Dairy", price: 16.0, onHand: 100, setAside: 0 },
  { id: "p-22", name: "Close Up Toothpaste", barcode: "6001234500226", category: "Toiletries", price: 13.5, onHand: 95, setAside: 0 },
  { id: "p-23", name: "Duracell AA (pack)", barcode: "6001234500233", category: "Batteries", price: 22.0, onHand: 53, setAside: 0 },
  { id: "p-24", name: "Tema Salt 1kg", barcode: "6001234500240", category: "Cooking Essentials", price: 5.5, onHand: 220, setAside: 0 },
  { id: "p-25", name: "Gino Tomato Mix", barcode: "6001234500257", category: "Cooking Essentials", price: 6.5, onHand: 190, setAside: 0 },
]

/** Quick keys — sold without scanning a barcode (produce, loose goods sold by portion). */
export const QUICK_KEY_ITEMS: Product[] = [
  { id: "qk-1", name: "Sachet Water (bag)", category: "Beverages", price: 3.0, onHand: 500, setAside: 0, noBarcode: true },
  { id: "qk-2", name: "Loose Rice (per olonka)", category: "Grains", price: 15.0, onHand: 999, setAside: 0, noBarcode: true },
  { id: "qk-3", name: "Tomatoes", category: "Produce", price: 10.0, onHand: 999, setAside: 0, noBarcode: true },
  { id: "qk-4", name: "Onions", category: "Produce", price: 8.0, onHand: 999, setAside: 0, noBarcode: true },
  { id: "qk-5", name: "Charcoal (bag)", category: "Household", price: 35.0, onHand: 999, setAside: 0, noBarcode: true },
  { id: "qk-6", name: "Ice Block", category: "Beverages", price: 5.0, onHand: 999, setAside: 0, noBarcode: true },
]

export const ALL_PRODUCTS: Product[] = [...PRODUCTS, ...QUICK_KEY_ITEMS]

/**
 * Register, Inventory, and Deliveries all mutate stock, and each of those is
 * a separate route that fully unmounts on navigation — same session-persisted
 * module-level store pattern as Invoice/Estimator's data.
 */
let productsStore: Product[] = ALL_PRODUCTS.map((p) => ({ ...p }))

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

function adjustStock(productId: string, patch: (product: Product) => Product): void {
  productsStore = productsStore.map((p) => (p.id === productId ? patch(p) : p))
}

/** Over-the-counter sale — the customer walks out with the goods now, so On hand drops immediately. */
export function deductOnHandForSale(productId: string, quantity: number): void {
  adjustStock(productId, (p) => ({ ...p, onHand: Math.max(0, p.onHand - quantity) }))
}

/** A delivery is created (or gains a line) — goods are pulled aside, still physically in the shop. */
export function addSetAsideForDelivery(productId: string, quantity: number): void {
  adjustStock(productId, (p) => ({ ...p, setAside: p.setAside + quantity }))
}

/** Dispatch ("Out for delivery") — goods actually leave the shop now. */
export function dispatchSetAsideStock(productId: string, quantity: number): void {
  adjustStock(productId, (p) => ({
    ...p,
    onHand: Math.max(0, p.onHand - quantity),
    setAside: Math.max(0, p.setAside - quantity),
  }))
}

/** Failed delivery, returned to store — goods physically come back onto the shelf. */
export function returnStockToStore(productId: string, quantity: number): void {
  adjustStock(productId, (p) => ({ ...p, onHand: p.onHand + quantity }))
}

/** Cancelled (or a delivery line removed) before dispatch — release the hold, nothing physically moved. */
export function releaseSetAside(productId: string, quantity: number): void {
  adjustStock(productId, (p) => ({ ...p, setAside: Math.max(0, p.setAside - quantity) }))
}

export function findProductByBarcode(barcode: string): Product | undefined {
  const trimmed = barcode.trim()
  return getProductsStore().find((p) => p.barcode === trimmed)
}

/** Case-insensitive substring match over the barcoded catalogue, for the scan line's search-as-you-type fallback. */
export function searchProducts(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return getProductsStore()
    .filter((p) => p.name.toLowerCase().includes(q))
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
  return line.product.price * line.quantity
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

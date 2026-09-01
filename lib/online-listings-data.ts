/**
 * Product ↔ Online Store. A listing is NOT a copy of a product — it holds
 * only the handful of facts that are true of a product *on this channel*:
 * whether it's visible, how it's sold there, an optional channel price, and
 * how much of the shared stock the merchant is willing to expose online.
 *
 * Everything else (name, category, pack structure, cost, stock) is read
 * straight off the Product in lib/pos-data.ts. Sell it at the counter and
 * the online availability drops; sell it online and the shelf drops. Same
 * pool, one number.
 */

import type { StorePersona } from "@/hooks/use-demo-state"
import { getLarryProductsStore, setLarryProductsStore, LARRY_DEFAULT_SHOP_LOCATION_ID } from "@/lib/larry-data"
import {
  addSetAsideForDelivery,
  getProductsStore,
  releaseSetAside,
  stockAt,
  totalAvailable,
  type Product,
} from "@/lib/pos-data"

/** The catalogue for whichever business is being viewed. */
export function productsForPersona(persona: StorePersona): Product[] {
  return persona === "larry" ? getLarryProductsStore() : getProductsStore()
}

export function findProductForPersona(persona: StorePersona, productId: string): Product | undefined {
  return productsForPersona(persona).find((p) => p.id === productId)
}

export type SellingMode = "buy-now" | "auction" | "buy-now-and-auction"

export const SELLING_MODE_LABEL: Record<SellingMode, string> = {
  "buy-now": "Buy now",
  auction: "Auction",
  "buy-now-and-auction": "Buy now + auction",
}

/** Configuration for a product the merchant wants bid on rather than simply bought. */
export interface AuctionConfig {
  startingPrice: number
  /** The smallest step a bidder must move the price by. */
  bidIncrement: number
  /** Local date-times, "YYYY-MM-DDTHH:mm" — matches the app's fixed-clock convention. */
  startsAt: string
  endsAt: string
  /** Below this the merchant isn't obliged to sell. Optional and hidden from bidders. */
  reservePrice?: number
  /** Only meaningful when the selling mode also allows buying outright. */
  buyNowPrice?: number
  /** Units on offer. Auctions in this model are single-lot. */
  quantity: number
}

export interface OnlineListing {
  productId: string
  published: boolean
  sellingMode: SellingMode
  /**
   * Optional channel price. Absent means "the same price as in the shop" —
   * the product's own sellingPrice — so a merchant never has to restate a
   * price they've already set.
   */
  onlinePrice?: number
  /**
   * Optional cap on how many of the shared units the online store may sell,
   * for a merchant who wants to keep some back for walk-in customers.
   * Absent means everything available is available online.
   */
  onlineStockLimit?: number
  auction?: AuctionConfig
  /** Free-text detail the shop's shelf label doesn't need but a web page does. */
  onlineDescription?: string
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function listing(productId: string, patch: Partial<OnlineListing> = {}): OnlineListing {
  return { productId, published: true, sellingMode: "buy-now", ...patch }
}

/**
 * Adwoa's store is live, so most of the grocery catalogue is published and
 * two items are running as auctions — a scarce imported line and a bulk lot.
 * Larry's store has never been set up, so it has no listings at all.
 */
const ADWOA_LISTINGS: OnlineListing[] = [
  listing("p-1", { onlineDescription: "Evaporated milk, 380g tin. Case discounts at the stall." }),
  listing("p-2", { onlinePrice: 44 }),
  listing("p-3"),
  // "Buy now + auction" — bid for the case, or buy a single bottle outright.
  listing("p-4", {
    sellingMode: "buy-now-and-auction",
    onlineDescription: "Case of 4 × 5L. Bid for the case, or buy a single bottle at the shelf price.",
    auction: {
      startingPrice: 480,
      bidIncrement: 25,
      startsAt: "2026-07-21T08:00",
      endsAt: "2026-07-23T17:00",
      buyNowPrice: 592,
      quantity: 4,
    },
  }),
  listing("p-5"),
  listing("p-6"),
  listing("p-7"),
  listing("p-8", { onlineStockLimit: 20 }),
  listing("p-9"),
  listing("p-10"),
  listing("p-11"),
  // Closed with bids, none of which reached the reserve — the merchant has to decide.
  listing("p-12", {
    sellingMode: "auction",
    onlineDescription: "Crate of 24. Bidding closed on Monday evening.",
    auction: {
      startingPrice: 180,
      bidIncrement: 10,
      startsAt: "2026-07-18T09:00",
      endsAt: "2026-07-20T17:00",
      reservePrice: 220,
      quantity: 24,
    },
  }),
  listing("p-13"),
  listing("p-14"),
  listing("p-15"),
  // Closed above reserve and already converted into order ORD-1044.
  listing("p-16", {
    sellingMode: "auction",
    onlineDescription: "Carton of 50 tins.",
    auction: {
      startingPrice: 150,
      bidIncrement: 15,
      startsAt: "2026-07-19T09:00",
      endsAt: "2026-07-21T18:00",
      reservePrice: 190,
      quantity: 50,
    },
  }),
  listing("p-17", { onlineDescription: "Long-grain perfumed rice, 5kg bag." }),
  listing("p-18"),
  listing("p-20"),
  // Closed above reserve, winner not yet contacted — the merchant's next move.
  listing("p-22", {
    sellingMode: "auction",
    onlineDescription: "Carton of 48 tubes.",
    auction: {
      startingPrice: 200,
      bidIncrement: 20,
      startsAt: "2026-07-19T10:00",
      endsAt: "2026-07-21T20:00",
      reservePrice: 240,
      quantity: 48,
    },
  }),
  listing("p-24"),
  listing("p-25"),
  // Unpublished on purpose — stocked in the shop but not offered online yet.
  listing("p-19", { published: false }),
  listing("p-21", { published: false }),
  // Auctions.
  listing("p-23", {
    sellingMode: "auction",
    onlineDescription: "Sealed carton of 24 packs — batteries have been scarce all month.",
    auction: {
      startingPrice: 380,
      bidIncrement: 20,
      startsAt: "2026-07-20T09:00",
      endsAt: "2026-07-22T18:00",
      reservePrice: 460,
      quantity: 24,
    },
  }),
]

/** Seeded listings reference real catalogue ids only — drop anything that doesn't resolve. */
function sanitize(persona: StorePersona, rows: OnlineListing[]): OnlineListing[] {
  const ids = new Set(productsForPersona(persona).map((p) => p.id))
  const seen = new Set<string>()
  return rows.filter((row) => {
    if (!ids.has(row.productId) || seen.has(row.productId)) return false
    seen.add(row.productId)
    return true
  })
}

let listingsByPersona: Record<StorePersona, OnlineListing[]> | null = null

function ensureStore(): Record<StorePersona, OnlineListing[]> {
  if (!listingsByPersona) {
    listingsByPersona = {
      adwoa: sanitize("adwoa", ADWOA_LISTINGS),
      larry: [],
    }
  }
  return listingsByPersona
}

export function getListings(persona: StorePersona): OnlineListing[] {
  return ensureStore()[persona]
}

export function setListings(persona: StorePersona, next: OnlineListing[]): void {
  listingsByPersona = { ...ensureStore(), [persona]: next }
}

export function getListing(persona: StorePersona, productId: string): OnlineListing | undefined {
  return getListings(persona).find((l) => l.productId === productId)
}

export function upsertListing(persona: StorePersona, listing: OnlineListing): void {
  const current = getListings(persona)
  const exists = current.some((l) => l.productId === listing.productId)
  setListings(persona, exists ? current.map((l) => (l.productId === listing.productId ? listing : l)) : [...current, listing])
}

export function updateListing(persona: StorePersona, productId: string, patch: Partial<OnlineListing>): void {
  const existing = getListing(persona, productId)
  if (!existing) return
  upsertListing(persona, { ...existing, ...patch })
}

/** Publishing a product that has never been listed creates its listing on the spot. */
export function publishProducts(persona: StorePersona, productIds: string[]): void {
  for (const productId of productIds) {
    const existing = getListing(persona, productId)
    upsertListing(persona, existing ? { ...existing, published: true } : listing(productId))
  }
}

export function unpublishProduct(persona: StorePersona, productId: string): void {
  updateListing(persona, productId, { published: false })
}

export function getPublishedListings(persona: StorePersona): OnlineListing[] {
  return getListings(persona).filter((l) => l.published)
}

export function publishedCount(persona: StorePersona): number {
  return getPublishedListings(persona).length
}

// ---------------------------------------------------------------------------
// Price and availability — always derived from the shared product record
// ---------------------------------------------------------------------------

/** What a customer pays online: the channel price if the merchant set one, otherwise the shop price. */
export function onlinePriceOf(listing: OnlineListing, product: Product): number {
  return listing.onlinePrice ?? product.sellingPrice
}

/**
 * How many units the online store can sell right now.
 *
 * This is the one place the shared-inventory promise is expressed: it starts
 * from the product's real available stock (on hand minus anything already
 * set aside for a delivery) and only then applies the merchant's optional
 * "keep some back for the shop" cap. Nothing is allocated to the channel.
 */
export function onlineAvailable(listing: OnlineListing, product: Product): number {
  if (product.isService) return Number.MAX_SAFE_INTEGER
  const shared = Math.max(0, totalAvailable(product))
  if (listing.onlineStockLimit === undefined) return shared
  return Math.min(shared, listing.onlineStockLimit)
}

/**
 * Reserving stock for an online order uses the SAME "set aside" concept the
 * shop already uses for a delivery waiting to go out: the units stay on the
 * shelf and in On hand, but stop being available to anyone else — at the
 * till or online. There is no online stock bucket to reconcile.
 */
export function reserveOnlineStock(persona: StorePersona, productId: string, quantity: number): void {
  if (persona !== "larry") {
    addSetAsideForDelivery(productId, quantity)
    return
  }
  adjustLarrySetAside(productId, quantity)
}

/** Order cancelled or handed to Deliveries — release this reservation. */
export function releaseOnlineStock(persona: StorePersona, productId: string, quantity: number): void {
  if (persona !== "larry") {
    releaseSetAside(productId, quantity)
    return
  }
  adjustLarrySetAside(productId, -quantity)
}

/** The Larry catalogue keeps its own store (see lib/larry-data.ts) and has no mutators of its own. */
function adjustLarrySetAside(productId: string, delta: number): void {
  setLarryProductsStore(
    getLarryProductsStore().map((product) => {
      if (product.id !== productId) return product
      const current = stockAt(product, LARRY_DEFAULT_SHOP_LOCATION_ID)
      const others = product.locationStock.filter((ls) => ls.locationId !== LARRY_DEFAULT_SHOP_LOCATION_ID)
      return {
        ...product,
        locationStock: [...others, { ...current, setAside: Math.max(0, current.setAside + delta) }],
      }
    })
  )
}

export type ListingAvailability = "In stock" | "Low stock" | "Out of stock"

export function availabilityOf(listing: OnlineListing, product: Product): ListingAvailability {
  const available = onlineAvailable(listing, product)
  if (available <= 0) return "Out of stock"
  if (available <= product.reorderPoint) return "Low stock"
  return "In stock"
}

export function sellsDirectly(listing: OnlineListing): boolean {
  return listing.sellingMode !== "auction"
}

export function hasAuction(listing: OnlineListing): boolean {
  return listing.sellingMode !== "buy-now" && Boolean(listing.auction)
}

export interface ListingRow {
  listing: OnlineListing
  product: Product
}

/** Listings joined to their catalogue product, dropping any that no longer resolve. */
export function listingRows(persona: StorePersona, opts: { publishedOnly?: boolean } = {}): ListingRow[] {
  const products = new Map(productsForPersona(persona).map((p) => [p.id, p]))
  return getListings(persona)
    .filter((l) => (opts.publishedOnly ? l.published : true))
    .map((l) => ({ listing: l, product: products.get(l.productId) }))
    .filter((row): row is ListingRow => Boolean(row.product) && row.product!.isActive)
}

/** Storefront browse list — published, in the merchant's catalogue order. */
export function storefrontRows(persona: StorePersona): ListingRow[] {
  return listingRows(persona, { publishedOnly: true })
}

export function storefrontRow(persona: StorePersona, productId: string): ListingRow | undefined {
  return storefrontRows(persona).find((row) => row.product.id === productId)
}

// ---------------------------------------------------------------------------
// Validation — error prevention, in the merchant's language
// ---------------------------------------------------------------------------

export interface AuctionDraft {
  startingPrice: string
  bidIncrement: string
  startsAt: string
  endsAt: string
  reservePrice: string
  buyNowPrice: string
  quantity: string
}

/** Reasons an auction can't be saved yet. Empty array means it's valid. */
export function validateAuctionDraft(draft: AuctionDraft, mode: SellingMode): string[] {
  const problems: string[] = []
  const start = Number(draft.startingPrice)
  const increment = Number(draft.bidIncrement)
  const reserve = draft.reservePrice.trim() === "" ? undefined : Number(draft.reservePrice)
  const buyNow = draft.buyNowPrice.trim() === "" ? undefined : Number(draft.buyNowPrice)
  const quantity = Number(draft.quantity)

  if (!(start > 0)) problems.push("Set a starting price above zero")
  if (!(increment > 0)) problems.push("Set a minimum bid step above zero")
  if (!(quantity > 0)) problems.push("Set how many units are on offer")
  if (!draft.startsAt) problems.push("Choose when bidding opens")
  if (!draft.endsAt) problems.push("Choose when bidding closes")
  if (draft.startsAt && draft.endsAt && draft.endsAt <= draft.startsAt) {
    problems.push("Bidding must close after it opens")
  }
  if (reserve !== undefined && Number.isNaN(reserve)) problems.push("The reserve price must be a number")
  if (reserve !== undefined && !Number.isNaN(reserve) && reserve < start) {
    problems.push("The reserve price can't be below the starting price")
  }
  if (mode === "buy-now-and-auction") {
    if (buyNow === undefined || Number.isNaN(buyNow) || buyNow <= 0) {
      problems.push("Set a buy-now price, or change the selling method to auction only")
    } else if (buyNow <= start) {
      problems.push("The buy-now price should be above the starting price")
    }
  }
  return problems
}

export function auctionDraftToConfig(draft: AuctionDraft, mode: SellingMode): AuctionConfig {
  const reserve = draft.reservePrice.trim() === "" ? undefined : Number(draft.reservePrice)
  const buyNow = draft.buyNowPrice.trim() === "" ? undefined : Number(draft.buyNowPrice)
  return {
    startingPrice: Number(draft.startingPrice),
    bidIncrement: Number(draft.bidIncrement),
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    reservePrice: reserve,
    buyNowPrice: mode === "buy-now-and-auction" ? buyNow : undefined,
    quantity: Number(draft.quantity),
  }
}

export function configToAuctionDraft(config?: AuctionConfig): AuctionDraft {
  return {
    startingPrice: config ? String(config.startingPrice) : "",
    bidIncrement: config ? String(config.bidIncrement) : "10",
    startsAt: config?.startsAt ?? "",
    endsAt: config?.endsAt ?? "",
    reservePrice: config?.reservePrice !== undefined ? String(config.reservePrice) : "",
    buyNowPrice: config?.buyNowPrice !== undefined ? String(config.buyNowPrice) : "",
    quantity: config ? String(config.quantity) : "1",
  }
}

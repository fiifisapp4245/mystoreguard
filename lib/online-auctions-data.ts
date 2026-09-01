/**
 * Bidding — the one genuinely new commerce concept the online channel adds.
 *
 * A bid is not a sale and not an order: it's an offer against a product's
 * auction configuration (lib/online-listings-data.ts). When bidding closes,
 * the winning bid converts into an ordinary online order
 * (lib/online-orders-data.ts), which is where payment, fulfilment and the
 * sales ledger take over. So auctions add a front end to the existing order
 * pipeline rather than a parallel one.
 *
 * All bid state is derived, not stored: who is leading, what the next valid
 * bid is, and whether an auction is live are all computed from the bid list
 * and the clock. Nothing can drift out of sync.
 *
 * FUTURE INTEGRATION POINT — a real auction engine owns the clock, holds
 * bids atomically, and pushes outbid notifications. Every one of those
 * responsibilities is behind the functions in this file.
 */

import type { StorePersona } from "@/hooks/use-demo-state"
import { isValidGhanaPhone } from "@/lib/mock-data"
import { formatGHS } from "@/lib/mock-data"
import type { AuctionConfig, OnlineListing } from "@/lib/online-listings-data"

/**
 * The app runs on a pinned clock (TODAY_ISO in lib/period-utils.ts) so the
 * demo never drifts. Auction countdowns are measured against this instant
 * rather than the real one, for the same reason — a real auction engine
 * supplies the authoritative time.
 */
export const ONLINE_NOW = "2026-07-22T13:00"

export interface Bid {
  id: string
  productId: string
  bidderName: string
  bidderPhone: string
  /** Set when the bidder matched an existing customer record. */
  customerId?: string
  amount: number
  /** "YYYY-MM-DDTHH:mm". */
  placedAt: string
  /** Set once a won auction has been turned into an order. */
  convertedOrderNo?: string
}

const ADWOA_BIDS: Bid[] = [
  // p-23 — Duracell carton, live, closes this evening.
  { id: "bid-1", productId: "p-23", bidderName: "Kofi Boateng", bidderPhone: "055 456 7890", customerId: "cus-3", amount: 380, placedAt: "2026-07-20T10:15" },
  { id: "bid-2", productId: "p-23", bidderName: "Yaw Asante", bidderPhone: "050 345 6789", customerId: "cus-5", amount: 400, placedAt: "2026-07-20T16:40" },
  { id: "bid-3", productId: "p-23", bidderName: "Kofi Boateng", bidderPhone: "055 456 7890", customerId: "cus-3", amount: 430, placedAt: "2026-07-21T09:05" },
  { id: "bid-4", productId: "p-23", bidderName: "Abena Osei", bidderPhone: "020 666 2323", customerId: "cus-7", amount: 470, placedAt: "2026-07-22T08:20" },
  { id: "bid-5", productId: "p-23", bidderName: "Yaw Asante", bidderPhone: "050 345 6789", customerId: "cus-5", amount: 495, placedAt: "2026-07-22T11:48" },

  // p-4 — Frytol case, live, closes tomorrow.
  { id: "bid-6", productId: "p-4", bidderName: "Kwame Mensah", bidderPhone: "024 123 4567", customerId: "cus-1", amount: 480, placedAt: "2026-07-21T09:30" },
  { id: "bid-7", productId: "p-4", bidderName: "Akosua Frimpong", bidderPhone: "027 888 4545", customerId: "cus-9", amount: 505, placedAt: "2026-07-22T07:55" },

  // p-16 — closed yesterday above reserve, already turned into an order.
  { id: "bid-8", productId: "p-16", bidderName: "Efua Owusu", bidderPhone: "027 234 5678", customerId: "cus-4", amount: 180, placedAt: "2026-07-20T12:00" },
  { id: "bid-9", productId: "p-16", bidderName: "Kojo Antwi", bidderPhone: "055 777 3434", customerId: "cus-8", amount: 210, placedAt: "2026-07-21T15:10", convertedOrderNo: "ORD-1044" },

  // p-22 — closed above reserve last night, winner not yet turned into an order.
  { id: "bid-12", productId: "p-22", bidderName: "Kwame Mensah", bidderPhone: "024 123 4567", customerId: "cus-1", amount: 220, placedAt: "2026-07-20T09:40" },
  { id: "bid-13", productId: "p-22", bidderName: "Abena Osei", bidderPhone: "020 666 2323", customerId: "cus-7", amount: 260, placedAt: "2026-07-21T18:35" },

  // p-12 — closed with bids, but none reached the reserve.
  { id: "bid-10", productId: "p-12", bidderName: "Nana Yeboah", bidderPhone: "024 555 1212", customerId: "cus-6", amount: 190, placedAt: "2026-07-19T14:20" },
  { id: "bid-11", productId: "p-12", bidderName: "Yaa Mansa", bidderPhone: "050 999 5656", customerId: "cus-10", amount: 205, placedAt: "2026-07-20T10:45" },
]

let bidsByPersona: Record<StorePersona, Bid[]> = {
  adwoa: ADWOA_BIDS.map((b) => ({ ...b })),
  larry: [],
}

export function getBids(persona: StorePersona): Bid[] {
  return bidsByPersona[persona]
}

export function setBids(persona: StorePersona, next: Bid[]): void {
  bidsByPersona = { ...bidsByPersona, [persona]: next }
}

/** Every bid on one product, highest first, then most recent first. */
export function bidsFor(persona: StorePersona, productId: string): Bid[] {
  return getBids(persona)
    .filter((b) => b.productId === productId)
    .sort((a, b) => b.amount - a.amount || b.placedAt.localeCompare(a.placedAt))
}

export function highestBid(persona: StorePersona, productId: string): Bid | undefined {
  return bidsFor(persona, productId)[0]
}

export function bidCount(persona: StorePersona, productId: string): number {
  return getBids(persona).filter((b) => b.productId === productId).length
}

/** Distinct bidders — the number a merchant actually cares about. */
export function bidderCount(persona: StorePersona, productId: string): number {
  return new Set(getBids(persona).filter((b) => b.productId === productId).map((b) => b.bidderPhone)).size
}

/** What the item stands at now: the leading bid, or the starting price if nobody has bid. */
export function currentBidAmount(auction: AuctionConfig, leading?: Bid): number {
  return leading?.amount ?? auction.startingPrice
}

/**
 * The smallest bid the next person can place. First bid may match the
 * starting price exactly; after that every bid must clear the increment.
 */
export function minimumNextBid(auction: AuctionConfig, leading?: Bid): number {
  return leading ? leading.amount + auction.bidIncrement : auction.startingPrice
}

// ---------------------------------------------------------------------------
// Auction state — derived from the clock and the bid list
// ---------------------------------------------------------------------------

export type AuctionState = "Scheduled" | "Live" | "Ending soon" | "Won" | "Reserve not met" | "No bids"

/** Under this many minutes remaining, a live auction is flagged as ending soon. */
const ENDING_SOON_MINUTES = 6 * 60

export function minutesBetween(fromISO: string, toISO: string): number {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 60000)
}

export function hasEnded(auction: AuctionConfig, now: string = ONLINE_NOW): boolean {
  return minutesBetween(now, auction.endsAt) <= 0
}

export function hasStarted(auction: AuctionConfig, now: string = ONLINE_NOW): boolean {
  return minutesBetween(now, auction.startsAt) <= 0
}

export function auctionState(
  persona: StorePersona,
  productId: string,
  auction: AuctionConfig,
  now: string = ONLINE_NOW
): AuctionState {
  if (!hasStarted(auction, now)) return "Scheduled"

  if (!hasEnded(auction, now)) {
    return minutesBetween(now, auction.endsAt) <= ENDING_SOON_MINUTES ? "Ending soon" : "Live"
  }

  const leading = highestBid(persona, productId)
  if (!leading) return "No bids"
  if (auction.reservePrice !== undefined && leading.amount < auction.reservePrice) return "Reserve not met"
  return "Won"
}

export function isAuctionOpen(auction: AuctionConfig, now: string = ONLINE_NOW): boolean {
  return hasStarted(auction, now) && !hasEnded(auction, now)
}

/** "2h 14m", "3 days", "Closed" — the countdown a bidder reads. */
export function timeRemainingLabel(auction: AuctionConfig, now: string = ONLINE_NOW): string {
  if (!hasStarted(auction, now)) {
    return `Opens in ${durationLabel(minutesBetween(now, auction.startsAt))}`
  }
  const minutes = minutesBetween(now, auction.endsAt)
  if (minutes <= 0) return "Closed"
  return durationLabel(minutes)
}

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    const remainder = minutes % 60
    return remainder === 0 ? `${hours}h` : `${hours}h ${String(remainder).padStart(2, "0")}m`
  }
  return `${Math.floor(hours / 24)} days`
}

/** Local date-time "2026-07-22T18:00" → "22 Jul, 6:00 pm". */
export function formatDateTime(value: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const time = date
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
  return `${day}, ${time}`
}

// ---------------------------------------------------------------------------
// Placing a bid
// ---------------------------------------------------------------------------

export interface PlaceBidInput {
  bidderName: string
  bidderPhone: string
  amount: number
  customerId?: string
}

export type PlaceBidResult = { ok: true; bid: Bid } | { ok: false; reason: string }

/**
 * Every rejection a bidder can hit, phrased for the bidder. Validation lives
 * here rather than in the dialog so the same rules apply wherever a bid is
 * placed from.
 */
export function placeBid(
  persona: StorePersona,
  listing: OnlineListing,
  input: PlaceBidInput,
  now: string = ONLINE_NOW
): PlaceBidResult {
  const auction = listing.auction
  if (!auction) return { ok: false, reason: "This item isn't up for auction." }

  if (!hasStarted(auction, now)) {
    return { ok: false, reason: `Bidding opens ${formatDateTime(auction.startsAt)}.` }
  }
  if (hasEnded(auction, now)) {
    return { ok: false, reason: "Bidding on this item has closed." }
  }
  if (!input.bidderName.trim()) {
    return { ok: false, reason: "Enter your name so the shop knows who's bidding." }
  }
  if (!isValidGhanaPhone(input.bidderPhone)) {
    return { ok: false, reason: "Enter a valid phone number, e.g. 024 123 4567." }
  }

  const leading = highestBid(persona, listing.productId)
  const minimum = minimumNextBid(auction, leading)
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, reason: "Enter the amount you want to bid." }
  }
  if (input.amount < minimum) {
    return { ok: false, reason: `Bids must be at least ${formatGHS(minimum)}.` }
  }
  if (leading && leading.bidderPhone.replace(/\s/g, "") === input.bidderPhone.replace(/\s/g, "")) {
    return { ok: false, reason: "You're already the highest bidder on this item." }
  }

  const bid: Bid = {
    id: `bid-${Date.now()}`,
    productId: listing.productId,
    bidderName: input.bidderName.trim(),
    bidderPhone: input.bidderPhone.trim(),
    customerId: input.customerId,
    amount: input.amount,
    placedAt: now,
  }

  setBids(persona, [...getBids(persona), bid])
  return { ok: true, bid }
}

/** The bid that won, once bidding has closed and the reserve (if any) was met. */
export function winningBid(
  persona: StorePersona,
  productId: string,
  auction: AuctionConfig,
  now: string = ONLINE_NOW
): Bid | undefined {
  if (auctionState(persona, productId, auction, now) !== "Won") return undefined
  return highestBid(persona, productId)
}

export function markBidConverted(persona: StorePersona, bidId: string, orderNo: string): void {
  setBids(
    persona,
    getBids(persona).map((b) => (b.id === bidId ? { ...b, convertedOrderNo: orderNo } : b))
  )
}

/**
 * Relisting reopens a closed auction with a new window and clears its bid
 * history — the merchant's answer to "no bids" or "reserve not met".
 */
export function clearBidsFor(persona: StorePersona, productId: string): void {
  setBids(
    persona,
    getBids(persona).filter((b) => b.productId !== productId)
  )
}

/** What the merchant's Bidding tab counts as needing attention. */
export function isAwaitingConversion(
  persona: StorePersona,
  productId: string,
  auction: AuctionConfig,
  now: string = ONLINE_NOW
): boolean {
  const winner = winningBid(persona, productId, auction, now)
  return Boolean(winner && !winner.convertedOrderNo)
}

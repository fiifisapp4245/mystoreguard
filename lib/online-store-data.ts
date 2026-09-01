/**
 * The Online Store — a second sales channel over the SAME business.
 *
 * There is deliberately no OnlineProduct, OnlineInventory, OnlineCustomer or
 * OnlineOrder-that-duplicates-a-sale here. This file holds only what the
 * online channel genuinely adds that the physical store has no equivalent
 * for: the storefront's public identity, its lifecycle, how a customer who
 * isn't standing in the shop receives goods, and how they can pay when
 * there's no cashier. Everything else points back at the existing entities
 * (lib/pos-data.ts products, lib/deliveries-data.ts fulfilment,
 * lib/sales-data.ts ledger, lib/mock-data.ts customers).
 *
 * Same prototype convention as every other module: a module-level store,
 * session-persisted, no backend. Keyed by persona (like
 * lib/business-profile-data.ts) because the persona toggle swaps the whole
 * business, storefront included.
 */

import type { StorePersona } from "@/hooks/use-demo-state"
import { getBusinessProfile } from "@/lib/business-profile-data"

/** The channel a sale came through lives with the ledger that records it. */
export { SALES_CHANNEL_LABEL, type SalesChannel } from "@/lib/sales-data"

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/** What the merchant has actually done, not a flag they set by hand. */
export type PublishState = "unpublished" | "published" | "paused"

export type StoreStatus =
  | "Not started"
  | "Setup in progress"
  | "Ready to publish"
  | "Published"
  | "Paused"

// ---------------------------------------------------------------------------
// Setup steps
// ---------------------------------------------------------------------------

export type SetupStepId = "store-info" | "products" | "storefront" | "delivery" | "payments"

export interface SetupStepDef {
  id: SetupStepId
  /** Merchant-facing name — a thing about their business, never a system. */
  label: string
  description: string
}

/** The order of the guided activation flow, and of the progress list. */
export const SETUP_STEPS: SetupStepDef[] = [
  { id: "store-info", label: "Store information", description: "Your store's name, web address, and how customers reach you." },
  { id: "products", label: "Products", description: "Choose which of your products you want to sell online." },
  { id: "storefront", label: "Storefront", description: "What customers see when they land on your store." },
  { id: "delivery", label: "Delivery", description: "Where you deliver, what you charge, and whether customers can collect." },
  { id: "payments", label: "Payments", description: "How customers pay you online." },
]

// ---------------------------------------------------------------------------
// Configuration shapes
// ---------------------------------------------------------------------------

export interface StoreInfo {
  name: string
  /** The public web address, e.g. "adwoas-provisions" → mystoreguard.shop/adwoas-provisions */
  slug: string
  tagline: string
  phone: string
  whatsapp: string
  email: string
  /** Visual only in this prototype — no real upload, same as the business profile logo. */
  logoInitials: string
}

/** Brand accent for the storefront. Deliberately a small fixed palette rather
 * than a colour picker — MVP-level, and every option is a token already in
 * the design system (see app/globals.css --chart-*). */
export type BrandAccent = "clay" | "forest" | "indigo" | "plum"

export const BRAND_ACCENTS: { id: BrandAccent; label: string; swatch: string; heroClass: string }[] = [
  { id: "clay", label: "Clay", swatch: "bg-chart-3", heroClass: "from-chart-3/20 to-chart-1/10" },
  { id: "forest", label: "Forest", swatch: "bg-success", heroClass: "from-success/20 to-success/5" },
  { id: "indigo", label: "Indigo", swatch: "bg-chart-5", heroClass: "from-chart-5/20 to-chart-4/10" },
  { id: "plum", label: "Plum", swatch: "bg-chart-4", heroClass: "from-chart-4/25 to-chart-2/10" },
]

export interface Collection {
  id: string
  name: string
  /** Product ids — always references into the shared catalogue, never copies. */
  productIds: string[]
}

export interface StorefrontConfig {
  /** Empty on a new store — that's how "Storefront" knows it isn't done yet. */
  headline: string
  subheadline: string
  accent: BrandAccent
  /** Product ids shown in the "Featured" row on the homepage. */
  featuredProductIds: string[]
  collections: Collection[]
  showStockCounts: boolean
}

export interface DeliveryZone {
  id: string
  /** Reuses the areas the business already delivers to — see AREAS in lib/mock-data.ts. */
  area: string
  fee: number
  /** Plain-language promise shown to the customer, e.g. "Same day". */
  eta: string
  enabled: boolean
}

export interface DeliverySettings {
  zones: DeliveryZone[]
  /** Customer collects from the shop — no rider, no fee. */
  pickupEnabled: boolean
  pickupNote: string
  /** Orders at or above this total ship free. 0 = off. */
  freeDeliveryOver: number
}

/**
 * Which of the store's existing payment methods a customer can use online.
 * The account details themselves are NOT duplicated — they're read from
 * lib/payment-methods-data.ts, the same place the register reads them.
 * Nothing here pretends to be a live payment integration; see
 * ONLINE_PAYMENT_INTEGRATION_NOTE.
 */
export interface OnlinePaymentSettings {
  momo: boolean
  cashOnDelivery: boolean
  bankTransfer: boolean
}

export const ONLINE_PAYMENT_INTEGRATION_NOTE =
  "Payments are confirmed by you in Orders. Connecting a payment provider so customers are charged automatically comes later."

export interface OnlineStore {
  info: StoreInfo
  storefront: StorefrontConfig
  delivery: DeliverySettings
  payments: OnlinePaymentSettings
  publishState: PublishState
  /** Set the first time the store is published, for the Overview's "Live since". */
  publishedOnISO?: string
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function zones(rows: [string, number, string, boolean][]): DeliveryZone[] {
  return rows.map(([area, fee, eta, enabled]) => ({ id: `zone-${area.toLowerCase().replace(/\s+/g, "-")}`, area, fee, eta, enabled }))
}

/**
 * Adwoa's store is already live — the mature state, so Orders, Bidding, and
 * the Overview have something real to show. Larry's has never been started,
 * so the guided activation flow is walkable from zero. Switch with
 * ?persona=larry (or the demo controls' Store persona).
 */
const ADWOA_STORE: OnlineStore = {
  info: {
    name: "Adwoa's Provisions",
    slug: "adwoas-provisions",
    tagline: "Everyday provisions, delivered across Accra.",
    phone: "024 000 1111",
    whatsapp: "024 000 1111",
    email: "hello@adwoasprovisions.com.gh",
    logoInitials: "AP",
  },
  storefront: {
    headline: "Your everyday provisions, delivered",
    subheadline: "The same shelves as our Makola stall — order before 3pm for same-day delivery.",
    accent: "clay",
    featuredProductIds: ["p-1", "p-2", "p-17", "p-3"],
    collections: [
      { id: "col-pantry", name: "Pantry staples", productIds: ["p-17", "p-18", "p-24", "p-25", "p-16"] },
      { id: "col-drinks", name: "Drinks & water", productIds: ["p-9", "p-10", "p-11", "p-12", "p-20"] },
      { id: "col-household", name: "Household", productIds: ["p-6", "p-14", "p-15", "p-22"] },
    ],
    showStockCounts: true,
  },
  delivery: {
    zones: zones([
      ["Makola", 10, "Same day", true],
      ["Osu", 15, "Same day", true],
      ["Tema", 25, "Next day", true],
      ["Madina", 20, "Next day", true],
      ["Kaneshie", 15, "Same day", true],
      ["Achimota", 20, "Next day", false],
    ]),
    pickupEnabled: true,
    pickupNote: "Collect from Stall 14, Makola Market — 8am to 6pm, Monday to Saturday.",
    freeDeliveryOver: 500,
  },
  payments: {
    momo: true,
    cashOnDelivery: true,
    bankTransfer: false,
  },
  publishState: "published",
  publishedOnISO: "2026-06-15",
}

/** A store that has never been set up — every step open, nothing invented. */
const LARRY_STORE: OnlineStore = {
  info: {
    name: "",
    slug: "",
    tagline: "",
    phone: "",
    whatsapp: "",
    email: "",
    logoInitials: "",
  },
  storefront: {
    headline: "",
    subheadline: "",
    accent: "clay",
    featuredProductIds: [],
    collections: [],
    showStockCounts: true,
  },
  delivery: {
    zones: zones([
      ["East Legon", 25, "Next day", false],
      ["Adenta", 25, "Next day", false],
      ["Osu", 30, "Next day", false],
      ["Tema", 40, "2 days", false],
    ]),
    pickupEnabled: false,
    pickupNote: "",
    freeDeliveryOver: 0,
  },
  payments: {
    momo: false,
    cashOnDelivery: false,
    bankTransfer: false,
  },
  publishState: "unpublished",
}

function clone(store: OnlineStore): OnlineStore {
  return {
    info: { ...store.info },
    storefront: {
      ...store.storefront,
      featuredProductIds: [...store.storefront.featuredProductIds],
      collections: store.storefront.collections.map((c) => ({ ...c, productIds: [...c.productIds] })),
    },
    delivery: { ...store.delivery, zones: store.delivery.zones.map((z) => ({ ...z })) },
    payments: { ...store.payments },
    publishState: store.publishState,
    publishedOnISO: store.publishedOnISO,
  }
}

let storeByPersona: Record<StorePersona, OnlineStore> = {
  adwoa: clone(ADWOA_STORE),
  larry: clone(LARRY_STORE),
}

export function getOnlineStore(persona: StorePersona): OnlineStore {
  return storeByPersona[persona]
}

export function setOnlineStore(persona: StorePersona, next: OnlineStore): void {
  storeByPersona = { ...storeByPersona, [persona]: next }
}

export function updateOnlineStore(persona: StorePersona, patch: Partial<OnlineStore>): void {
  setOnlineStore(persona, { ...storeByPersona[persona], ...patch })
}

/** Resolve a public storefront URL back to the business that owns it. */
export function getPersonaBySlug(slug: string): StorePersona | undefined {
  const personas: StorePersona[] = ["adwoa", "larry"]
  return personas.find((p) => storeByPersona[p].info.slug === slug && storeByPersona[p].info.slug !== "")
}

/**
 * Suggests a web address from the business name the merchant already gave
 * us. Accents are folded rather than dropped, so "Larry's Curtains & Décor"
 * becomes "larrys-curtains-decor" and not "larrys-curtains-d-cor".
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Prefills the setup flow from the business profile — recognition over recall. */
export function suggestedStoreInfo(persona: StorePersona): StoreInfo {
  const profile = getBusinessProfile(persona)
  return {
    name: profile.storeName,
    slug: slugify(profile.storeName),
    tagline: "",
    phone: profile.phone,
    whatsapp: profile.phone,
    email: profile.email,
    logoInitials: profile.storeName
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  }
}

export const STORE_URL_HOST = "mystoreguard.shop"

export function storeUrl(slug: string): string {
  return `${STORE_URL_HOST}/${slug}`
}

/** The in-app path the storefront is previewed and browsed at. */
export function storefrontPath(slug: string): string {
  return `/store/${slug}`
}

// ---------------------------------------------------------------------------
// Setup completeness — derived from real configuration, never a "done" flag
// ---------------------------------------------------------------------------

export interface SetupStepState extends SetupStepDef {
  done: boolean
  /** Why it isn't done yet, in the merchant's language. Undefined when done. */
  outstanding?: string
}

export function getSetupState(persona: StorePersona, publishedProductCount: number): SetupStepState[] {
  const store = storeByPersona[persona]

  const infoDone = Boolean(store.info.name.trim() && store.info.slug.trim() && store.info.phone.trim())
  const productsDone = publishedProductCount > 0
  const storefrontDone = Boolean(store.storefront.headline.trim())
  const deliveryDone = store.delivery.zones.some((z) => z.enabled) || store.delivery.pickupEnabled
  const paymentsDone = store.payments.momo || store.payments.cashOnDelivery || store.payments.bankTransfer

  const doneById: Record<SetupStepId, { done: boolean; outstanding: string }> = {
    "store-info": { done: infoDone, outstanding: "Add your store name, web address, and phone number" },
    products: { done: productsDone, outstanding: "Choose at least one product to sell online" },
    storefront: { done: storefrontDone, outstanding: "Write the welcome line customers see first" },
    delivery: { done: deliveryDone, outstanding: "Turn on at least one delivery area, or allow collection" },
    payments: { done: paymentsDone, outstanding: "Turn on at least one way for customers to pay" },
  }

  return SETUP_STEPS.map((step) => ({
    ...step,
    done: doneById[step.id].done,
    outstanding: doneById[step.id].done ? undefined : doneById[step.id].outstanding,
  }))
}

export function setupProgress(steps: SetupStepState[]): { done: number; total: number; percent: number } {
  const done = steps.filter((s) => s.done).length
  return { done, total: steps.length, percent: Math.round((done / steps.length) * 100) }
}

/** Error prevention: publishing is blocked until every step is genuinely done. */
export function canPublish(steps: SetupStepState[]): boolean {
  return steps.every((s) => s.done)
}

export function getStoreStatus(persona: StorePersona, steps: SetupStepState[]): StoreStatus {
  const store = storeByPersona[persona]
  if (store.publishState === "published") return "Published"
  if (store.publishState === "paused") return "Paused"
  const done = steps.filter((s) => s.done).length
  if (done === 0) return "Not started"
  if (canPublish(steps)) return "Ready to publish"
  return "Setup in progress"
}

/** The step the merchant should continue from — the first one still outstanding. */
export function firstOutstandingStep(steps: SetupStepState[]): SetupStepId | undefined {
  return steps.find((s) => !s.done)?.id
}

export function publishStore(persona: StorePersona, todayISO: string): void {
  const store = storeByPersona[persona]
  updateOnlineStore(persona, {
    publishState: "published",
    publishedOnISO: store.publishedOnISO ?? todayISO,
  })
}

export function pauseStore(persona: StorePersona): void {
  updateOnlineStore(persona, { publishState: "paused" })
}

export function resumeStore(persona: StorePersona): void {
  updateOnlineStore(persona, { publishState: "published" })
}

/** A paused or unpublished store is not shoppable — the storefront says so rather than 404ing. */
export function isStoreOpen(store: OnlineStore): boolean {
  return store.publishState === "published"
}

export function accentOf(store: OnlineStore) {
  return BRAND_ACCENTS.find((a) => a.id === store.storefront.accent) ?? BRAND_ACCENTS[0]
}

import { TODAY_ISO } from "@/lib/period-utils"

/**
 * The pricing engine — discounts are decided by configurable rules, not by
 * the cashier. Cashier scans, rules decide the price; this file is the
 * configuration side (Settings) plus the pure functions Register enforces
 * at checkout.
 */

export type DiscountPriorityItem = "promotional-price" | "promo-code" | "tier-discount" | "loyalty-points"

export const PRIORITY_ITEM_LABELS: Record<DiscountPriorityItem, string> = {
  "promotional-price": "Promotional price (item-level price override)",
  "promo-code": "Promo code",
  "tier-discount": "Tier / membership discount",
  "loyalty-points": "Loyalty points",
}

export const PRIORITY_ITEM_NOTES: Record<DiscountPriorityItem, string> = {
  "promotional-price": "An item-level price override, applied before anything else.",
  "promo-code": "A campaign discount code entered at checkout.",
  "tier-discount": "The customer's loyalty tier discount, e.g. Gold members save 10%.",
  "loyalty-points": "Applied last, because points behave like a payment method rather than a price reduction.",
}

export const DEFAULT_PRIORITY_ORDER: DiscountPriorityItem[] = [
  "promotional-price",
  "promo-code",
  "tier-discount",
  "loyalty-points",
]

export interface StackingRules {
  promoItemsExcludeMemberDiscount: boolean
  onePromoCodePerTransaction: boolean
  pointsExcludePromoCode: boolean
  favorCustomerOnConflict: boolean
}

export const STACKING_RULE_LABELS: Record<keyof StackingRules, string> = {
  promoItemsExcludeMemberDiscount: "Promotional items are not eligible for member discounts",
  onePromoCodePerTransaction: "Only one promo code per transaction",
  pointsExcludePromoCode: "Loyalty points cannot be combined with promo codes",
  favorCustomerOnConflict: "When discounts conflict, apply whichever benefits the customer most",
}

export type PriceFloorMode = "min-margin-percent" | "min-selling-price" | "cost-plus-markup"
export type PriceFloorBehavior = "block" | "require-override" | "cap-at-floor"

export const PRICE_FLOOR_MODE_LABELS: Record<PriceFloorMode, string> = {
  "min-margin-percent": "Minimum margin %",
  "min-selling-price": "Minimum selling price per product",
  "cost-plus-markup": "Cost + fixed markup",
}

export const PRICE_FLOOR_BEHAVIOR_LABELS: Record<PriceFloorBehavior, string> = {
  block: "Block the discount",
  "require-override": "Require manager override",
  "cap-at-floor": "Cap the discount at the floor automatically",
}

export interface PriceFloorSettings {
  mode: PriceFloorMode
  minMarginPercent: number
  fixedMarkup: number
  behavior: PriceFloorBehavior
}

export interface ManagerOverrideSettings {
  cashierMaxDiscountPercent: number
}

export interface PricingSettings {
  priorityOrder: DiscountPriorityItem[]
  stacking: StackingRules
  priceFloor: PriceFloorSettings
  managerOverride: ManagerOverrideSettings
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  priorityOrder: [...DEFAULT_PRIORITY_ORDER],
  stacking: {
    promoItemsExcludeMemberDiscount: true,
    onePromoCodePerTransaction: true,
    pointsExcludePromoCode: true,
    favorCustomerOnConflict: false,
  },
  priceFloor: {
    mode: "min-margin-percent",
    minMarginPercent: 10,
    fixedMarkup: 20,
    behavior: "require-override",
  },
  managerOverride: {
    cashierMaxDiscountPercent: 10,
  },
}

let pricingSettingsStore: PricingSettings = {
  priorityOrder: [...DEFAULT_PRICING_SETTINGS.priorityOrder],
  stacking: { ...DEFAULT_PRICING_SETTINGS.stacking },
  priceFloor: { ...DEFAULT_PRICING_SETTINGS.priceFloor },
  managerOverride: { ...DEFAULT_PRICING_SETTINGS.managerOverride },
}

export function getPricingSettings(): PricingSettings {
  return {
    ...pricingSettingsStore,
    priceFloor: priceFloorVersionAsOf()?.settings ?? pricingSettingsStore.priceFloor,
    managerOverride: { cashierMaxDiscountPercent: cashierLimitVersionAsOf()?.percent ?? pricingSettingsStore.managerOverride.cashierMaxDiscountPercent },
  }
}

/** Priority order and stacking rules only — Class C, no retroactive-history concern. */
export function setPricingSettings(next: PricingSettings): void {
  pricingSettingsStore = { ...pricingSettingsStore, priorityOrder: next.priorityOrder, stacking: next.stacking }
}

// ---------------------------------------------------------------------------
// Price floor & cashier discount limit — Class B in Settings → Pricing &
// discounts: changing them retroactively would make past sales look like
// policy violations, so each is its own version history with an effective
// date. getPricingSettings() above always resolves today's version, so
// Register, the totals rail, and the manager-override dialog keep reading a
// single flat PricingSettings shape unchanged.
// ---------------------------------------------------------------------------

export interface PriceFloorVersion {
  id: string
  settings: PriceFloorSettings
  effectiveFromISO: string
  effectiveToISO?: string
}

export interface CashierLimitVersion {
  id: string
  percent: number
  effectiveFromISO: string
  effectiveToISO?: string
}

let priceFloorVersions: PriceFloorVersion[] = [
  { id: "floor-v1", settings: { ...DEFAULT_PRICING_SETTINGS.priceFloor }, effectiveFromISO: "2022-01-01" },
]

let cashierLimitVersions: CashierLimitVersion[] = [
  { id: "climit-v1", percent: DEFAULT_PRICING_SETTINGS.managerOverride.cashierMaxDiscountPercent, effectiveFromISO: "2022-01-01" },
]

function dayBeforeIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function getPriceFloorVersions(): PriceFloorVersion[] {
  return priceFloorVersions
}

export function priceFloorVersionAsOf(asOfISO: string = TODAY_ISO): PriceFloorVersion | undefined {
  return [...priceFloorVersions].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledPriceFloorVersion(asOfISO: string = TODAY_ISO): PriceFloorVersion | undefined {
  return priceFloorVersions.find((v) => v.effectiveFromISO > asOfISO)
}

export function addPriceFloorVersion(settings: PriceFloorSettings, effectiveFromISO: string): void {
  const closed = priceFloorVersions.map((v) =>
    !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBeforeIso(effectiveFromISO) } : v
  )
  priceFloorVersions = [...closed, { id: `floor-v${closed.length + 1}-${Date.now().toString(36)}`, settings, effectiveFromISO }]
}

export function cancelScheduledPriceFloor(): void {
  const scheduled = scheduledPriceFloorVersion()
  if (!scheduled) return
  priceFloorVersions = priceFloorVersions
    .filter((v) => v.id !== scheduled.id)
    .map((v) => (v.effectiveToISO === dayBeforeIso(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
}

export function getCashierLimitVersions(): CashierLimitVersion[] {
  return cashierLimitVersions
}

export function cashierLimitVersionAsOf(asOfISO: string = TODAY_ISO): CashierLimitVersion | undefined {
  return [...cashierLimitVersions].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledCashierLimitVersion(asOfISO: string = TODAY_ISO): CashierLimitVersion | undefined {
  return cashierLimitVersions.find((v) => v.effectiveFromISO > asOfISO)
}

export function addCashierLimitVersion(percent: number, effectiveFromISO: string): void {
  const closed = cashierLimitVersions.map((v) =>
    !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBeforeIso(effectiveFromISO) } : v
  )
  cashierLimitVersions = [...closed, { id: `climit-v${closed.length + 1}-${Date.now().toString(36)}`, percent, effectiveFromISO }]
}

export function cancelScheduledCashierLimit(): void {
  const scheduled = scheduledCashierLimitVersion()
  if (!scheduled) return
  cashierLimitVersions = cashierLimitVersions
    .filter((v) => v.id !== scheduled.id)
    .map((v) => (v.effectiveToISO === dayBeforeIso(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
}

/** Cost GHS 75, minimum margin 10% → floor GHS 82.50. */
export function priceFloorFor(costPrice: number, minSellingPrice: number | undefined, settings: PricingSettings = pricingSettingsStore): number {
  if (settings.priceFloor.mode === "cost-plus-markup") return Math.round((costPrice + settings.priceFloor.fixedMarkup) * 100) / 100
  if (settings.priceFloor.mode === "min-selling-price") return minSellingPrice ?? costPrice
  return Math.round(costPrice * (1 + settings.priceFloor.minMarginPercent / 100) * 100) / 100
}

export interface OverrideLogEntry {
  id: string
  dateISO: string
  approvingUser: string
  reason: string
  note?: string
  context: string
}

export const MANAGER_OVERRIDE_REASONS = [
  "Price match",
  "Damaged/near-expiry stock",
  "Loyal customer goodwill",
  "Manager discretion",
  "Other",
]

let overrideLogStore: OverrideLogEntry[] = []

export function getOverrideLogStore(): OverrideLogEntry[] {
  return overrideLogStore
}

export function logOverride(approvingUser: string, reason: string, note: string | undefined, context: string): OverrideLogEntry {
  const entry: OverrideLogEntry = { id: `ovr-${overrideLogStore.length + 1}-${Date.now().toString(36)}`, dateISO: TODAY_ISO, approvingUser, reason, note, context }
  overrideLogStore = [entry, ...overrideLogStore]
  return entry
}

// ---------------------------------------------------------------------------
// Discount computation — the priority order + stacking rules applied to a sale
// ---------------------------------------------------------------------------

export interface DiscountLine {
  source: DiscountPriorityItem
  label: string
  amount: number
}

export interface DiscountInput {
  subtotal: number
  promotionalDiscount?: number
  promoCodeDiscount?: { label: string; amount: number }
  tierDiscount?: { label: string; amount: number }
  pointsDiscount?: { label: string; amount: number }
}

/** Builds the itemised, priority-ordered discount breakdown Register shows in the totals rail. */
export function computeDiscountBreakdown(input: DiscountInput, settings: PricingSettings = pricingSettingsStore): DiscountLine[] {
  const candidates: Partial<Record<DiscountPriorityItem, DiscountLine>> = {}

  if (input.promotionalDiscount && input.promotionalDiscount > 0) {
    candidates["promotional-price"] = { source: "promotional-price", label: "Promotional price", amount: input.promotionalDiscount }
  }
  if (input.promoCodeDiscount) {
    candidates["promo-code"] = { source: "promo-code", label: input.promoCodeDiscount.label, amount: input.promoCodeDiscount.amount }
  }
  if (input.tierDiscount) {
    candidates["tier-discount"] = { source: "tier-discount", label: input.tierDiscount.label, amount: input.tierDiscount.amount }
  }
  if (input.pointsDiscount) {
    candidates["loyalty-points"] = { source: "loyalty-points", label: input.pointsDiscount.label, amount: input.pointsDiscount.amount }
  }

  if (settings.stacking.pointsExcludePromoCode && candidates["loyalty-points"] && candidates["promo-code"]) {
    delete candidates["promo-code"]
  }
  if (settings.stacking.promoItemsExcludeMemberDiscount && candidates["promotional-price"] && candidates["tier-discount"]) {
    delete candidates["tier-discount"]
  }

  return settings.priorityOrder.map((key) => candidates[key]).filter((line): line is DiscountLine => Boolean(line))
}

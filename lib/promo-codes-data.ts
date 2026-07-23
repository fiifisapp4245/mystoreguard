import { TODAY_ISO } from "@/lib/period-utils"

export type PromoDiscountType = "percentage" | "fixed" | "free-delivery"
export type PromoScope = "all" | "category" | "products" | "min-spend"
export type PromoEligibility = "everyone" | "segment" | "tier"
export type PromoEffectiveStatus = "Active" | "Scheduled" | "Paused" | "Expired"

export interface PromoCode {
  id: string
  discountType: PromoDiscountType
  value: number
  scope: PromoScope
  scopeDetail?: string
  minSpend?: number
  validFromISO: string
  validToISO: string
  totalUsesLimit?: number
  usesPerCustomerLimit?: number
  usedCount: number
  eligibility: PromoEligibility
  eligibilityDetail?: string
  canCombine: boolean
  priority: number
  paused: boolean
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function effectiveStatus(promo: PromoCode, todayISO: string = TODAY_ISO): PromoEffectiveStatus {
  if (promo.paused) return "Paused"
  if (todayISO < promo.validFromISO) return "Scheduled"
  if (todayISO > promo.validToISO) return "Expired"
  return "Active"
}

export function promoScopeSummary(promo: PromoCode): string {
  if (promo.scope === "all") return "All products"
  if (promo.scope === "category") return `Category: ${promo.scopeDetail}`
  if (promo.scope === "products") return `Selected products (${promo.scopeDetail})`
  return `Minimum spend GHS ${promo.minSpend ?? 0}`
}

export function promoValueSummary(promo: PromoCode): string {
  if (promo.discountType === "percentage") return `${promo.value}%`
  if (promo.discountType === "fixed") return `GHS ${promo.value.toFixed(2)}`
  return "Free delivery"
}

const PROMO_CODES_SEED: PromoCode[] = [
  {
    id: "SAVE15", discountType: "percentage", value: 15, scope: "all",
    validFromISO: addDays(TODAY_ISO, -20), validToISO: addDays(TODAY_ISO, 10),
    totalUsesLimit: 200, usesPerCustomerLimit: 1, usedCount: 84,
    eligibility: "everyone", canCombine: false, priority: 1, paused: false,
  },
  {
    id: "WELCOME10", discountType: "fixed", value: 10, scope: "min-spend", minSpend: 50,
    validFromISO: addDays(TODAY_ISO, -60), validToISO: addDays(TODAY_ISO, 300),
    totalUsesLimit: undefined, usesPerCustomerLimit: 1, usedCount: 132,
    eligibility: "everyone", canCombine: true, priority: 2, paused: false,
  },
  {
    id: "BEVERAGES20", discountType: "percentage", value: 20, scope: "category", scopeDetail: "Beverages",
    validFromISO: addDays(TODAY_ISO, -15), validToISO: addDays(TODAY_ISO, 5),
    totalUsesLimit: 100, usesPerCustomerLimit: 2, usedCount: 41,
    eligibility: "everyone", canCombine: false, priority: 1, paused: false,
  },
  {
    id: "GOLDONLY", discountType: "percentage", value: 12, scope: "all",
    validFromISO: addDays(TODAY_ISO, -10), validToISO: addDays(TODAY_ISO, 20),
    totalUsesLimit: undefined, usesPerCustomerLimit: undefined, usedCount: 19,
    eligibility: "tier", eligibilityDetail: "Gold", canCombine: false, priority: 1, paused: false,
  },
  {
    id: "DECEMBER25", discountType: "percentage", value: 25, scope: "all",
    validFromISO: addDays(TODAY_ISO, 30), validToISO: addDays(TODAY_ISO, 60),
    totalUsesLimit: 500, usesPerCustomerLimit: 1, usedCount: 0,
    eligibility: "everyone", canCombine: false, priority: 1, paused: false,
  },
  {
    id: "FLASH5", discountType: "fixed", value: 5, scope: "all",
    validFromISO: addDays(TODAY_ISO, -40), validToISO: addDays(TODAY_ISO, 40),
    totalUsesLimit: 300, usesPerCustomerLimit: 3, usedCount: 58,
    eligibility: "everyone", canCombine: true, priority: 3, paused: true,
  },
  {
    id: "FREEDROP", discountType: "free-delivery", value: 0, scope: "min-spend", minSpend: 100,
    validFromISO: addDays(TODAY_ISO, -25), validToISO: addDays(TODAY_ISO, 15),
    totalUsesLimit: undefined, usesPerCustomerLimit: undefined, usedCount: 27,
    eligibility: "everyone", canCombine: true, priority: 3, paused: false,
  },
  {
    id: "EXPIRED2025", discountType: "percentage", value: 10, scope: "all",
    validFromISO: addDays(TODAY_ISO, -120), validToISO: addDays(TODAY_ISO, -30),
    totalUsesLimit: 200, usesPerCustomerLimit: 1, usedCount: 178,
    eligibility: "everyone", canCombine: false, priority: 1, paused: false,
  },
]

let promoCodesStore: PromoCode[] = PROMO_CODES_SEED.map((p) => ({ ...p }))

export function getPromoCodesStore(): PromoCode[] {
  return promoCodesStore
}

export function setPromoCodesStore(next: PromoCode[]): void {
  promoCodesStore = next
}

export function getPromoCode(id: string): PromoCode | undefined {
  return promoCodesStore.find((p) => p.id === id)
}

export function findPromoCode(code: string): PromoCode | undefined {
  const trimmed = code.trim().toUpperCase()
  return promoCodesStore.find((p) => p.id.toUpperCase() === trimmed)
}

export function pausePromoCode(id: string): void {
  promoCodesStore = promoCodesStore.map((p) => (p.id === id ? { ...p, paused: true } : p))
}

export function activatePromoCode(id: string): void {
  promoCodesStore = promoCodesStore.map((p) => (p.id === id ? { ...p, paused: false } : p))
}

export function endPromoCodeNow(id: string): void {
  promoCodesStore = promoCodesStore.map((p) => (p.id === id ? { ...p, validToISO: addDays(TODAY_ISO, -1) } : p))
}

export function duplicatePromoCode(id: string): PromoCode | undefined {
  const source = promoCodesStore.find((p) => p.id === id)
  if (!source) return undefined
  const copy: PromoCode = { ...source, id: `${source.id}-COPY`, usedCount: 0, paused: true }
  promoCodesStore = [copy, ...promoCodesStore]
  return copy
}

export function createPromoCode(input: Omit<PromoCode, "usedCount" | "paused">): PromoCode {
  const promo: PromoCode = { ...input, usedCount: 0, paused: false }
  promoCodesStore = [promo, ...promoCodesStore]
  return promo
}

export function updatePromoCode(id: string, patch: Partial<PromoCode>): void {
  promoCodesStore = promoCodesStore.map((p) => (p.id === id ? { ...p, ...patch } : p))
}

export type PromoValidationResult =
  | { ok: true; promo: PromoCode; discountAmount: number }
  | { ok: false; reason: string }

/** Register-side validation — cart total, category set, and customer tier are known at checkout time. */
export function validatePromoCode(
  code: string,
  context: { subtotal: number; categories: string[]; customerTier?: string; customerUsesOfCode?: number }
): PromoValidationResult {
  const promo = findPromoCode(code)
  if (!promo) return { ok: false, reason: "Code not recognised" }

  const status = effectiveStatus(promo)
  if (status === "Expired") return { ok: false, reason: "This code has expired" }
  if (status === "Scheduled") return { ok: false, reason: `Not valid until ${promo.validFromISO}` }
  if (status === "Paused") return { ok: false, reason: "This code isn't currently active" }

  if (promo.totalUsesLimit !== undefined && promo.usedCount >= promo.totalUsesLimit) {
    return { ok: false, reason: "Usage limit reached" }
  }
  if (promo.usesPerCustomerLimit !== undefined && (context.customerUsesOfCode ?? 0) >= promo.usesPerCustomerLimit) {
    return { ok: false, reason: "You've already used this code the maximum number of times" }
  }
  if (promo.eligibility === "tier" && context.customerTier !== promo.eligibilityDetail) {
    return { ok: false, reason: `Only valid for ${promo.eligibilityDetail} tier members` }
  }
  if (promo.scope === "min-spend" && context.subtotal < (promo.minSpend ?? 0)) {
    return { ok: false, reason: `Minimum spend of GHS ${promo.minSpend} not met` }
  }
  if (promo.scope === "category" && promo.scopeDetail && !context.categories.includes(promo.scopeDetail)) {
    return { ok: false, reason: "Not valid for these items" }
  }

  const discountAmount =
    promo.discountType === "percentage" ? Math.round(context.subtotal * (promo.value / 100) * 100) / 100 :
    promo.discountType === "fixed" ? Math.min(promo.value, context.subtotal) :
    0

  return { ok: true, promo, discountAmount }
}

export function recordPromoCodeUse(id: string): void {
  promoCodesStore = promoCodesStore.map((p) => (p.id === id ? { ...p, usedCount: p.usedCount + 1 } : p))
}

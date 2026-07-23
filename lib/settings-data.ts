/**
 * Store-level settings mock data. Tax rates here flow into every invoice
 * automatically — they're never typed per document.
 */

export interface TaxRate {
  id: string
  label: string
  ratePercent: number
  enabled: boolean
}

export const INITIAL_TAX_RATES: TaxRate[] = [
  { id: "vat", label: "VAT", ratePercent: 15, enabled: true },
  { id: "nhil", label: "NHIL", ratePercent: 2.5, enabled: true },
  { id: "getfund", label: "GETFund", ratePercent: 2.5, enabled: true },
  { id: "covid", label: "COVID levy", ratePercent: 1, enabled: true },
]

export type TaxMode = "exclusive" | "inclusive"

export const DEFAULT_TAX_MODE: TaxMode = "exclusive"

/** Sums enabled tax rates into per-levy amounts against a subtotal, tax-exclusive. */
export function computeTaxLines(
  subtotal: number,
  rates: TaxRate[] = INITIAL_TAX_RATES
): { label: string; amount: number }[] {
  return rates
    .filter((rate) => rate.enabled)
    .map((rate) => ({
      label: `${rate.label} (${rate.ratePercent}%)`,
      amount: Math.round(subtotal * (rate.ratePercent / 100) * 100) / 100,
    }))
}

export interface StoreInfo {
  name: string
  addressLine: string
  phone: string
}

export const STORE_INFO: StoreInfo = {
  name: "Adwoa's Provisions",
  addressLine: "Makola, Accra",
  phone: "024 000 1111",
}

export type CostingMethod = "weighted-average" | "fifo" | "specific-identification" | "latest-cost"

export const DEFAULT_COSTING_METHOD: CostingMethod = "weighted-average"

export interface CostingMethodOption {
  id: CostingMethod
  label: string
  description: string
  /** Shown as a muted caution note rather than a normal description. */
  caution?: string
  /** Only this method is actually computed in the prototype — see lib/purchase-orders-data.ts. */
  implemented: boolean
}

export const COSTING_METHOD_OPTIONS: CostingMethodOption[] = [
  {
    id: "weighted-average",
    label: "Moving weighted average",
    description:
      "Every purchase recalculates the average cost of stock on hand; sales use that average. Simple and stable — suits general retail and frequent replenishment.",
    implemented: true,
  },
  {
    id: "fifo",
    label: "FIFO",
    description: "Oldest stock is treated as sold first, matching physical rotation. Suits groceries, pharmacies, anything date-sensitive.",
    implemented: false,
  },
  {
    id: "specific-identification",
    label: "Specific identification",
    description: "Each item carries its own cost. Suits electronics, vehicles, jewellery, serialised goods.",
    implemented: false,
  },
  {
    id: "latest-cost",
    label: "Latest cost",
    description: "The newest purchase price replaces the old. Simple, but distorts valuation over time.",
    caution: "Not recommended for accounting.",
    implemented: false,
  },
]

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

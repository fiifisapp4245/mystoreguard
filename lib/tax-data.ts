import { TODAY_ISO } from "@/lib/period-utils"

/**
 * Tax rates — Class B: they legitimately change over time (VAT has moved
 * more than once) but must never alter documents already created. Each rate
 * carries a version history instead of a single number; documents resolve
 * "the rate in force on their own date," not "today's rate."
 */

export interface TaxRateVersion {
  id: string
  ratePercent: number
  effectiveFromISO: string
  /** Set once superseded by a later version. Absent on the current/scheduled version. */
  effectiveToISO?: string
}

export interface VersionedTaxRate {
  id: string
  label: string
  enabled: boolean
  /** Oldest first. */
  versions: TaxRateVersion[]
}

export const TAX_RATES_SEED: VersionedTaxRate[] = [
  {
    id: "vat",
    label: "VAT",
    enabled: true,
    versions: [
      { id: "vat-v1", ratePercent: 12.5, effectiveFromISO: "2020-01-01", effectiveToISO: "2023-12-31" },
      { id: "vat-v2", ratePercent: 15, effectiveFromISO: "2024-01-01", effectiveToISO: "2026-12-31" },
      { id: "vat-v3", ratePercent: 18, effectiveFromISO: "2027-01-01" },
    ],
  },
  {
    id: "nhil",
    label: "NHIL",
    enabled: true,
    versions: [{ id: "nhil-v1", ratePercent: 2.5, effectiveFromISO: "2018-01-01" }],
  },
  {
    id: "getfund",
    label: "GETFund",
    enabled: true,
    versions: [{ id: "getfund-v1", ratePercent: 2.5, effectiveFromISO: "2018-01-01" }],
  },
  {
    id: "covid",
    label: "COVID levy",
    enabled: true,
    versions: [{ id: "covid-v1", ratePercent: 1, effectiveFromISO: "2021-05-01" }],
  },
]

let taxRatesStore: VersionedTaxRate[] = TAX_RATES_SEED.map((r) => ({ ...r, versions: [...r.versions] }))

export function getTaxRatesStore(): VersionedTaxRate[] {
  return taxRatesStore
}

export function toggleTaxRateEnabled(id: string): void {
  taxRatesStore = taxRatesStore.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
}

/** The version in force on a given date — the latest version whose effective-from is on or before it. */
export function versionAsOf(rate: VersionedTaxRate, asOfISO: string = TODAY_ISO): TaxRateVersion | undefined {
  return [...rate.versions].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

/** A version dated after asOfISO — shown as "scheduled" in the UI. */
export function scheduledVersion(rate: VersionedTaxRate, asOfISO: string = TODAY_ISO): TaxRateVersion | undefined {
  return rate.versions.find((v) => v.effectiveFromISO > asOfISO)
}

export function addTaxRateVersion(id: string, ratePercent: number, effectiveFromISO: string): void {
  taxRatesStore = taxRatesStore.map((r) => {
    if (r.id !== id) return r
    // Close out whichever version was open-ended (the current one) at the new version's start.
    const versions = r.versions.map((v) =>
      !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO
        ? { ...v, effectiveToISO: dayBefore(effectiveFromISO) }
        : v
    )
    versions.push({ id: `${id}-v${versions.length + 1}-${Date.now().toString(36)}`, ratePercent, effectiveFromISO })
    return { ...r, versions }
  })
}

export function cancelScheduledVersion(id: string): void {
  taxRatesStore = taxRatesStore.map((r) => {
    if (r.id !== id) return r
    const scheduled = scheduledVersion(r)
    if (!scheduled) return r
    const versions = r.versions.filter((v) => v.id !== scheduled.id).map((v) => (v.effectiveToISO === dayBefore(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
    return { ...r, versions }
  })
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Flat resolved shape — what invoices, receipts, and reports actually consume.
// Documents keep whatever rate was effective on their own date; new
// documents always resolve against today.
// ---------------------------------------------------------------------------

export interface TaxRate {
  id: string
  label: string
  ratePercent: number
  enabled: boolean
}

export function getEffectiveTaxRates(asOfISO: string = TODAY_ISO): TaxRate[] {
  return taxRatesStore.map((r) => ({
    id: r.id,
    label: r.label,
    ratePercent: versionAsOf(r, asOfISO)?.ratePercent ?? 0,
    enabled: r.enabled,
  }))
}

/** Sums enabled tax rates into per-levy amounts against a subtotal, tax-exclusive. */
export function computeTaxLines(subtotal: number, rates: TaxRate[] = getEffectiveTaxRates()): { label: string; amount: number }[] {
  return rates
    .filter((rate) => rate.enabled)
    .map((rate) => ({
      label: `${rate.label} (${rate.ratePercent}%)`,
      amount: Math.round(subtotal * (rate.ratePercent / 100) * 100) / 100,
    }))
}

// ---------------------------------------------------------------------------
// Store-level tax defaults — Class B (they change what future documents look like).
// ---------------------------------------------------------------------------

export type TaxMode = "exclusive" | "inclusive"

export interface TaxDefaults {
  mode: TaxMode
  taxAppliesToDelivery: boolean
}

let taxDefaultsStore: TaxDefaults = { mode: "exclusive", taxAppliesToDelivery: true }

export function getTaxDefaults(): TaxDefaults {
  return taxDefaultsStore
}

export function setTaxDefaults(next: TaxDefaults): void {
  taxDefaultsStore = next
}

import { TODAY_ISO } from "@/lib/period-utils"

/**
 * Document numbering — the prefixes used across five modules (receipts,
 * invoices, quotations, purchase orders, deliveries, transfers), shown
 * together in Settings for the first time. Class B: changing a prefix takes
 * effect from a date and never renumbers records already issued.
 */

export type NumberingFormat = "continuous" | "date-based"

export interface NumberingSchemeVersion {
  id: string
  prefix: string
  effectiveFromISO: string
  effectiveToISO?: string
}

export interface NumberingScheme {
  key: string
  label: string
  format: NumberingFormat
  nextNumber: number
  versions: NumberingSchemeVersion[]
}

export const NUMBERING_SEED: NumberingScheme[] = [
  { key: "receipts", label: "Receipts (RCT)", format: "continuous", nextNumber: 5218, versions: [{ id: "rct-v1", prefix: "RCT", effectiveFromISO: "2022-01-01" }] },
  { key: "invoices", label: "Invoices (INV)", format: "continuous", nextNumber: 2043, versions: [{ id: "inv-v1", prefix: "INV", effectiveFromISO: "2022-01-01" }] },
  { key: "quotations", label: "Quotations (QUO)", format: "continuous", nextNumber: 187, versions: [{ id: "quo-v1", prefix: "QUO", effectiveFromISO: "2022-01-01" }] },
  { key: "purchase-orders", label: "Purchase orders (PO)", format: "continuous", nextNumber: 1046, versions: [{ id: "po-v1", prefix: "PO", effectiveFromISO: "2022-01-01" }] },
  { key: "deliveries", label: "Deliveries (DEL)", format: "date-based", nextNumber: 312, versions: [{ id: "del-v1", prefix: "DEL", effectiveFromISO: "2022-01-01" }] },
  { key: "transfers", label: "Transfers (TRF)", format: "continuous", nextNumber: 58, versions: [{ id: "trf-v1", prefix: "TRF", effectiveFromISO: "2022-01-01" }] },
]

let numberingStore: NumberingScheme[] = NUMBERING_SEED.map((n) => ({ ...n, versions: [...n.versions] }))

export function getNumberingStore(): NumberingScheme[] {
  return numberingStore
}

export function versionAsOf(scheme: NumberingScheme, asOfISO: string = TODAY_ISO): NumberingSchemeVersion | undefined {
  return [...scheme.versions].filter((v) => v.effectiveFromISO <= asOfISO).sort((a, b) => b.effectiveFromISO.localeCompare(a.effectiveFromISO))[0]
}

export function scheduledVersion(scheme: NumberingScheme, asOfISO: string = TODAY_ISO): NumberingSchemeVersion | undefined {
  return scheme.versions.find((v) => v.effectiveFromISO > asOfISO)
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function addNumberingVersion(key: string, prefix: string, effectiveFromISO: string): void {
  numberingStore = numberingStore.map((s) => {
    if (s.key !== key) return s
    const versions = s.versions.map((v) =>
      !v.effectiveToISO || v.effectiveToISO >= effectiveFromISO ? { ...v, effectiveToISO: dayBefore(effectiveFromISO) } : v
    )
    versions.push({ id: `${key}-v${versions.length + 1}-${Date.now().toString(36)}`, prefix, effectiveFromISO })
    return { ...s, versions }
  })
}

export function cancelScheduledNumbering(key: string): void {
  numberingStore = numberingStore.map((s) => {
    if (s.key !== key) return s
    const scheduled = scheduledVersion(s)
    if (!scheduled) return s
    const versions = s.versions.filter((v) => v.id !== scheduled.id).map((v) => (v.effectiveToISO === dayBefore(scheduled.effectiveFromISO) ? { ...v, effectiveToISO: undefined } : v))
    return { ...s, versions }
  })
}

export function setNumberingFormat(key: string, format: NumberingFormat): void {
  numberingStore = numberingStore.map((s) => (s.key === key ? { ...s, format } : s))
}

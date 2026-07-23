import { TODAY_ISO } from "@/lib/period-utils"

export type PayoutMethod = "Cash" | "Momo" | "Bank transfer"
export type CommissionModel = "percentage" | "fixed"
export type AffiliateStatus = "Active" | "Inactive"

export interface ReferredSale {
  id: string
  dateISO: string
  saleReference: string
  amount: number
  commission: number
}

export interface Payout {
  id: string
  dateISO: string
  amount: number
  method: PayoutMethod
  reference?: string
  note?: string
}

export interface AffiliatePartner {
  id: string
  name: string
  phone: string
  email?: string
  code: string
  commissionModel: CommissionModel
  rate: number
  payoutScheduleNote: string
  status: AffiliateStatus
  referredSales: ReferredSale[]
  payouts: Payout[]
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function commissionFor(model: CommissionModel, rate: number, amount: number): number {
  return model === "percentage" ? Math.round(amount * (rate / 100) * 100) / 100 : rate
}

function sale(model: CommissionModel, rate: number, num: number, daysAgo: number, amount: number, ref: string): ReferredSale {
  return { id: `refsale-${num}`, dateISO: addDays(TODAY_ISO, -daysAgo), saleReference: ref, amount, commission: commissionFor(model, rate, amount) }
}

const AFFILIATES_SEED: AffiliatePartner[] = [
  {
    id: "aff-1",
    name: "Nana Yaw Osei",
    phone: "0244001122",
    email: "nanayaw@example.com",
    code: "NANA10",
    commissionModel: "percentage",
    rate: 10,
    payoutScheduleNote: "Paid monthly, first week",
    status: "Active",
    referredSales: [
      sale("percentage", 10, 1, 5, 420, "RCT-3040"),
      sale("percentage", 10, 2, 12, 680, "RCT-3021"),
      sale("percentage", 10, 3, 25, 310, "RCT-2988"),
    ],
    payouts: [{ id: "payout-1-1", dateISO: addDays(TODAY_ISO, -30), amount: 95, method: "Momo", reference: "MM-88213" }],
  },
  {
    id: "aff-2",
    name: "Abena Fashion House",
    phone: "0209988771",
    code: "ABENA5",
    commissionModel: "fixed",
    rate: 5,
    payoutScheduleNote: "Paid on request",
    status: "Active",
    referredSales: [
      sale("fixed", 5, 4, 3, 150, "RCT-3050"),
      sale("fixed", 5, 5, 8, 200, "RCT-3033"),
      sale("fixed", 5, 6, 18, 95, "RCT-3002"),
      sale("fixed", 5, 7, 22, 175, "RCT-2991"),
    ],
    payouts: [],
  },
  {
    id: "aff-3",
    name: "Kojo Events",
    phone: "0277654321",
    email: "kojoevents@example.com",
    code: "KOJOEVT",
    commissionModel: "percentage",
    rate: 8,
    payoutScheduleNote: "Paid monthly, last week",
    status: "Active",
    referredSales: [sale("percentage", 8, 8, 2, 900, "RCT-3055"), sale("percentage", 8, 9, 15, 560, "RCT-3009")],
    payouts: [{ id: "payout-3-1", dateISO: addDays(TODAY_ISO, -20), amount: 44.8, method: "Cash" }],
  },
  {
    id: "aff-4",
    name: "Efua's Boutique",
    phone: "0244778899",
    code: "EFUAB",
    commissionModel: "percentage",
    rate: 12,
    payoutScheduleNote: "Paid quarterly",
    status: "Inactive",
    referredSales: [sale("percentage", 12, 10, 90, 260, "RCT-2870")],
    payouts: [{ id: "payout-4-1", dateISO: addDays(TODAY_ISO, -85), amount: 31.2, method: "Bank transfer", reference: "TRF-4471" }],
  },
  {
    id: "aff-5",
    name: "Kwabena Radio Promo",
    phone: "0201122334",
    code: "KWABENA",
    commissionModel: "fixed",
    rate: 10,
    payoutScheduleNote: "Paid monthly, first week",
    status: "Active",
    referredSales: [
      sale("fixed", 10, 11, 1, 300, "RCT-3058"),
      sale("fixed", 10, 12, 6, 420, "RCT-3044"),
      sale("fixed", 10, 13, 14, 180, "RCT-3015"),
    ],
    payouts: [],
  },
]

let affiliatesStore: AffiliatePartner[] = AFFILIATES_SEED.map((a) => ({
  ...a,
  referredSales: a.referredSales.map((s) => ({ ...s })),
  payouts: a.payouts.map((p) => ({ ...p })),
}))

export function getAffiliatesStore(): AffiliatePartner[] {
  return affiliatesStore
}

export function setAffiliatesStore(next: AffiliatePartner[]): void {
  affiliatesStore = next
}

export function getAffiliate(id: string): AffiliatePartner | undefined {
  return affiliatesStore.find((a) => a.id === id)
}

export function findAffiliateByCode(code: string): AffiliatePartner | undefined {
  const trimmed = code.trim().toUpperCase()
  return affiliatesStore.find((a) => a.code.toUpperCase() === trimmed && a.status === "Active")
}

export function commissionAccrued(affiliate: AffiliatePartner): number {
  return Math.round(affiliate.referredSales.reduce((sum, s) => sum + s.commission, 0) * 100) / 100
}

export function commissionPaid(affiliate: AffiliatePartner): number {
  return Math.round(affiliate.payouts.reduce((sum, p) => sum + p.amount, 0) * 100) / 100
}

export function commissionOutstanding(affiliate: AffiliatePartner): number {
  return Math.round((commissionAccrued(affiliate) - commissionPaid(affiliate)) * 100) / 100
}

export function referredRevenue(affiliate: AffiliatePartner): number {
  return affiliate.referredSales.reduce((sum, s) => sum + s.amount, 0)
}

let codeCounter = 100

function nextAffiliateId(): string {
  codeCounter += 1
  return `aff-${affiliatesStore.length + 1}-${codeCounter}`
}

export interface AddAffiliateInput {
  name: string
  phone: string
  email?: string
  code: string
  commissionModel: CommissionModel
  rate: number
  payoutScheduleNote: string
}

export function addAffiliate(input: AddAffiliateInput): AffiliatePartner {
  const affiliate: AffiliatePartner = { ...input, id: nextAffiliateId(), status: "Active", referredSales: [], payouts: [] }
  affiliatesStore = [affiliate, ...affiliatesStore]
  return affiliate
}

export function updateAffiliate(id: string, patch: Partial<AddAffiliateInput>): void {
  affiliatesStore = affiliatesStore.map((a) => (a.id === id ? { ...a, ...patch } : a))
}

export function deactivateAffiliate(id: string): void {
  affiliatesStore = affiliatesStore.map((a) => (a.id === id ? { ...a, status: "Inactive" } : a))
}

export function recordPayout(id: string, amount: number, method: PayoutMethod, reference: string | undefined, dateISO: string, note: string | undefined): void {
  affiliatesStore = affiliatesStore.map((a) => {
    if (a.id !== id) return a
    const payout: Payout = { id: `payout-${a.id}-${a.payouts.length + 1}-${Date.now().toString(36)}`, dateISO, amount, method, reference, note }
    return { ...a, payouts: [payout, ...a.payouts] }
  })
}

/** Register-side attribution — the cashier enters the code the customer quotes at the till (no link/cookie tracking). */
export function recordReferredSale(affiliateId: string, saleReference: string, amount: number): void {
  affiliatesStore = affiliatesStore.map((a) => {
    if (a.id !== affiliateId) return a
    const referred: ReferredSale = { id: `refsale-${a.id}-${a.referredSales.length + 1}-${Date.now().toString(36)}`, dateISO: TODAY_ISO, saleReference, amount, commission: commissionFor(a.commissionModel, a.rate, amount) }
    return { ...a, referredSales: [referred, ...a.referredSales] }
  })
}

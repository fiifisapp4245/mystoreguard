/**
 * Loyalty — its own enrolled-member list, distinct from the general
 * People/Customers directory. Not every buyer joins the points programme,
 * and not every enrolled member necessarily has a full Customer record —
 * keeping them separate avoids forcing a 1:1 relationship that doesn't
 * always hold in a real shop.
 */

import { AREAS } from "@/lib/mock-data"
import { TODAY_ISO } from "@/lib/period-utils"

export type MemberTier = "Bronze" | "Silver" | "Gold"
export type MemberStatus = "Active" | "Removed"
export type LedgerEntryType = "Earned" | "Redeemed" | "Adjusted" | "Expired"
export const ADJUSTMENT_REASONS = ["Goodwill", "Correction", "Complaint resolution", "Campaign bonus", "Other"]
export const TIER_CHANGE_REASONS = ["Goodwill upgrade", "Correction", "Loyalty review", "Other"]

export interface PointsLedgerEntry {
  id: string
  dateISO: string
  type: LedgerEntryType
  points: number
  source: string
  note?: string
}

export interface LoyaltyMember {
  id: string
  name: string
  phone: string
  area: string
  tier: MemberTier
  points: number
  lifetimeSpend: number
  /** Fraction (0-1) of lifetime spend paid via credit — drives the Credit-heavy segment. */
  creditShare: number
  birthMonth: number
  lastVisitISO: string
  joinedDateISO: string
  status: MemberStatus
  ledger: PointsLedgerEntry[]
  /** Money this member currently owes the store from past credit sales — the register's Credit tender reads this. */
  creditBalance: number
  /** Value held on this member's account they can spend on future purchases. */
  storeCredit: number
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00`)
  const to = new Date(`${toISO}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function tierFromSpend(spend: number): MemberTier {
  if (spend >= 2000) return "Gold"
  if (spend >= 1000) return "Silver"
  return "Bronze"
}

const FIRST_NAMES = [
  "Kwame", "Ama", "Kofi", "Akua", "Yaw", "Efua", "Kwesi", "Abena", "Kojo", "Adjoa",
  "Kwabena", "Akosua", "Kwaku", "Yaa", "Fiifi", "Esi", "Nana", "Afia", "Kobby", "Baaba",
]
const LAST_NAMES = [
  "Mensah", "Boateng", "Owusu", "Asante", "Agyemang", "Appiah", "Darko", "Osei", "Frimpong", "Adjei",
  "Nkrumah", "Sarpong", "Amoah", "Yeboah", "Gyasi", "Antwi", "Baah", "Tetteh", "Quaye", "Anim",
]

function phoneForIndex(i: number): string {
  return `024${String(1000000 + i * 137).slice(0, 7)}`
}

const LOYALTY_MEMBERS_SEED: LoyaltyMember[] = Array.from({ length: 60 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last = LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length]
  const area = AREAS[i % AREAS.length]

  // Spread lifetime spend widely, with a healthy cluster of top spenders (>2000).
  const lifetimeSpend = [180, 420, 650, 980, 1240, 1780, 2150, 2640, 3200, 3980, 4650, 5400][i % 12] + (i % 5) * 37

  // ~8 members lapsed (no visit in 60+ days); rest recent, spread across the last month.
  const lapsed = i % 7 === 0
  const lastVisitISO = lapsed ? addDays(TODAY_ISO, -(65 + (i % 40))) : addDays(TODAY_ISO, -(i % 28))

  // A third of members joined within the last 30 days ("New this month").
  const joinedDateISO =
    i % 3 === 0 ? addDays(TODAY_ISO, -(i % 25)) : addDays(TODAY_ISO, -(200 + i * 9))

  // Credit-heavy: roughly one in six members mostly pay on credit.
  const creditShare = i % 6 === 0 ? 0.55 + (i % 4) * 0.08 : (i % 4) * 0.08

  // Birthday this month: every fifth member born in July (TODAY_ISO's month).
  const birthMonth = i % 5 === 0 ? 7 : ((i * 5 + 2) % 12) + 1

  const points = Math.max(0, Math.round(lifetimeSpend / 10) - (i % 15) * 4)

  const ledger: PointsLedgerEntry[] = [
    { id: `led-${i}-1`, dateISO: joinedDateISO, type: "Earned", points: Math.round(lifetimeSpend / 20), source: "Enrolment bonus" },
    { id: `led-${i}-2`, dateISO: addDays(lastVisitISO, -3), type: "Earned", points: Math.round(lifetimeSpend / 15), source: `Sale RCT-${3000 + i}` },
  ]
  if (i % 9 === 0) {
    ledger.push({ id: `led-${i}-3`, dateISO: addDays(lastVisitISO, -1), type: "Redeemed", points: -50, source: "Redeemed at register" })
  }
  if (i % 13 === 0) {
    ledger.push({ id: `led-${i}-4`, dateISO: addDays(TODAY_ISO, -10), type: "Adjusted", points: 20, source: "Goodwill adjustment", note: "Late delivery apology" })
  }

  return {
    id: `mem-${i + 1}`,
    name: `${first} ${last}`,
    phone: phoneForIndex(i),
    area,
    tier: tierFromSpend(lifetimeSpend),
    points,
    lifetimeSpend,
    creditShare: Math.min(0.95, creditShare),
    birthMonth,
    lastVisitISO,
    joinedDateISO,
    status: "Active",
    ledger,
    creditBalance: i % 6 === 0 ? Math.round(lifetimeSpend * 0.08) : 0,
    storeCredit: i % 11 === 0 ? 20 : 0,
  }
})

let loyaltyMembersStore: LoyaltyMember[] = LOYALTY_MEMBERS_SEED.map((m) => ({ ...m, ledger: m.ledger.map((l) => ({ ...l })) }))

export function getLoyaltyMembersStore(): LoyaltyMember[] {
  return loyaltyMembersStore
}

export function setLoyaltyMembersStore(next: LoyaltyMember[]): void {
  loyaltyMembersStore = next
}

export function getMember(id: string): LoyaltyMember | undefined {
  return loyaltyMembersStore.find((m) => m.id === id)
}

export function findMemberByPhone(phone: string): LoyaltyMember | undefined {
  const trimmed = phone.replace(/\s/g, "")
  return loyaltyMembersStore.find((m) => m.phone.replace(/\s/g, "") === trimmed && m.status === "Active")
}

export function daysSinceLastVisit(member: LoyaltyMember): number {
  return daysBetween(member.lastVisitISO, TODAY_ISO)
}

export function daysSinceJoined(member: LoyaltyMember): number {
  return daysBetween(member.joinedDateISO, TODAY_ISO)
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export type SegmentField = "lifetimeSpend" | "daysSinceLastVisit" | "creditSharePercent" | "daysSinceJoined" | "points" | "birthMonth"
export type SegmentOperator = "gt" | "gte" | "lt" | "lte" | "eq"
export type SegmentMatchType = "all" | "any"

export const SEGMENT_FIELD_LABELS: Record<SegmentField, string> = {
  lifetimeSpend: "lifetime spend",
  daysSinceLastVisit: "days since last visit",
  creditSharePercent: "% of spend on credit",
  daysSinceJoined: "days since joined",
  points: "points balance",
  birthMonth: "birth month (1-12)",
}

export const SEGMENT_OPERATOR_LABELS: Record<SegmentOperator, string> = {
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  eq: "equal to",
}

export interface SegmentCondition {
  field: SegmentField
  operator: SegmentOperator
  value: number
}

export interface Segment {
  id: string
  name: string
  description: string
  conditions: SegmentCondition[]
  matchType: SegmentMatchType
  lastRecalculatedISO: string
  active: boolean
}

function fieldValue(member: LoyaltyMember, field: SegmentField): number {
  switch (field) {
    case "lifetimeSpend":
      return member.lifetimeSpend
    case "daysSinceLastVisit":
      return daysSinceLastVisit(member)
    case "creditSharePercent":
      return Math.round(member.creditShare * 100)
    case "daysSinceJoined":
      return daysSinceJoined(member)
    case "points":
      return member.points
    case "birthMonth":
      return member.birthMonth
  }
}

function conditionMatches(member: LoyaltyMember, condition: SegmentCondition): boolean {
  const value = fieldValue(member, condition.field)
  switch (condition.operator) {
    case "gt":
      return value > condition.value
    case "gte":
      return value >= condition.value
    case "lt":
      return value < condition.value
    case "lte":
      return value <= condition.value
    case "eq":
      return value === condition.value
  }
}

export function segmentMembers(segment: Pick<Segment, "conditions" | "matchType">, members: LoyaltyMember[]): LoyaltyMember[] {
  return members.filter((m) => {
    if (m.status !== "Active") return false
    if (segment.conditions.length === 0) return true
    return segment.matchType === "all"
      ? segment.conditions.every((c) => conditionMatches(m, c))
      : segment.conditions.some((c) => conditionMatches(m, c))
  })
}

export const SEGMENTS_SEED: Segment[] = [
  {
    id: "seg-top-spenders",
    name: "Top spenders",
    description: "Lifetime spend over GHS 2,000",
    conditions: [{ field: "lifetimeSpend", operator: "gt", value: 2000 }],
    matchType: "all",
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  },
  {
    id: "seg-lapsed",
    name: "Lapsed",
    description: "No purchase in 60 days",
    conditions: [{ field: "daysSinceLastVisit", operator: "gt", value: 60 }],
    matchType: "all",
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  },
  {
    id: "seg-credit-heavy",
    name: "Credit-heavy",
    description: "Majority of sales on credit",
    conditions: [{ field: "creditSharePercent", operator: "gt", value: 50 }],
    matchType: "all",
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  },
  {
    id: "seg-new-this-month",
    name: "New this month",
    description: "Joined within the last 30 days",
    conditions: [{ field: "daysSinceJoined", operator: "lte", value: 30 }],
    matchType: "all",
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  },
  {
    id: "seg-birthday-this-month",
    name: "Birthday this month",
    description: "Born in the current calendar month",
    conditions: [{ field: "birthMonth", operator: "eq", value: Number(TODAY_ISO.slice(5, 7)) }],
    matchType: "all",
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  },
]

let segmentsStore: Segment[] = SEGMENTS_SEED.map((s) => ({ ...s, conditions: s.conditions.map((c) => ({ ...c })) }))

export function getSegmentsStore(): Segment[] {
  return segmentsStore
}

export function setSegmentsStore(next: Segment[]): void {
  segmentsStore = next
}

function nextSegmentId(): string {
  const all = segmentsStore.map((s) => Number.parseInt(s.id.replace("seg-custom-", ""), 10)).filter((n) => !Number.isNaN(n))
  return `seg-custom-${Math.max(0, ...all) + 1}`
}

export function createSegment(input: { name: string; conditions: SegmentCondition[]; matchType: SegmentMatchType }): Segment {
  const segment: Segment = {
    id: nextSegmentId(),
    name: input.name,
    description: describeConditions(input.conditions, input.matchType),
    conditions: input.conditions,
    matchType: input.matchType,
    lastRecalculatedISO: TODAY_ISO,
    active: true,
  }
  segmentsStore = [segment, ...segmentsStore]
  return segment
}

export function describeConditions(conditions: SegmentCondition[], matchType: SegmentMatchType): string {
  if (conditions.length === 0) return "All members"
  const parts = conditions.map((c) => `${SEGMENT_FIELD_LABELS[c.field]} ${SEGMENT_OPERATOR_LABELS[c.operator]} ${c.value}`)
  return parts.join(matchType === "all" ? " and " : " or ")
}

export function duplicateSegment(id: string): Segment | undefined {
  const source = segmentsStore.find((s) => s.id === id)
  if (!source) return undefined
  const copy: Segment = { ...source, id: nextSegmentId(), name: `${source.name} (copy)`, conditions: source.conditions.map((c) => ({ ...c })) }
  segmentsStore = [copy, ...segmentsStore]
  return copy
}

export function deactivateSegment(id: string): void {
  segmentsStore = segmentsStore.map((s) => (s.id === id ? { ...s, active: false } : s))
}

export function updateSegment(id: string, patch: Partial<Pick<Segment, "name" | "conditions" | "matchType">>): void {
  segmentsStore = segmentsStore.map((s) => {
    if (s.id !== id) return s
    const next = { ...s, ...patch }
    return { ...next, description: patch.conditions || patch.matchType ? describeConditions(next.conditions, next.matchType) : s.description }
  })
}

// ---------------------------------------------------------------------------
// Rules & tiers settings
// ---------------------------------------------------------------------------

export type RoundingRule = "round-down" | "round-nearest" | "round-up"

export interface LoyaltyTierDefinition {
  id: string
  name: MemberTier
  lifetimeSpendThreshold: number
  discountPercent: number
  pointsMultiplier: number
  freeDelivery: boolean
  badgeColor: "slate" | "zinc" | "amber"
}

export interface LoyaltyProgrammeSettings {
  ghsPerPoint: number
  roundingRule: RoundingRule
  creditSalesEarn: boolean
  discountedItemsEarn: boolean
  pointsExpiryMonths: number
  pointValueGHS: number
  minPointsToRedeem: number
  maxRedemptionPercent: number
  tiers: LoyaltyTierDefinition[]
}

export const DEFAULT_PROGRAMME_SETTINGS: LoyaltyProgrammeSettings = {
  ghsPerPoint: 10,
  roundingRule: "round-down",
  creditSalesEarn: true,
  discountedItemsEarn: true,
  pointsExpiryMonths: 12,
  pointValueGHS: 0.05,
  minPointsToRedeem: 50,
  maxRedemptionPercent: 50,
  tiers: [
    { id: "tier-bronze", name: "Bronze", lifetimeSpendThreshold: 0, discountPercent: 0, pointsMultiplier: 1, freeDelivery: false, badgeColor: "slate" },
    { id: "tier-silver", name: "Silver", lifetimeSpendThreshold: 1000, discountPercent: 5, pointsMultiplier: 1.25, freeDelivery: false, badgeColor: "zinc" },
    { id: "tier-gold", name: "Gold", lifetimeSpendThreshold: 2000, discountPercent: 10, pointsMultiplier: 1.5, freeDelivery: true, badgeColor: "amber" },
  ],
}

let programmeSettingsStore: LoyaltyProgrammeSettings = {
  ...DEFAULT_PROGRAMME_SETTINGS,
  tiers: DEFAULT_PROGRAMME_SETTINGS.tiers.map((t) => ({ ...t })),
}

export function getProgrammeSettings(): LoyaltyProgrammeSettings {
  return programmeSettingsStore
}

export function setProgrammeSettings(next: LoyaltyProgrammeSettings): void {
  programmeSettingsStore = next
}

export function tierForSpend(lifetimeSpend: number, tiers: LoyaltyTierDefinition[] = programmeSettingsStore.tiers): LoyaltyTierDefinition {
  const sorted = [...tiers].sort((a, b) => b.lifetimeSpendThreshold - a.lifetimeSpendThreshold)
  return sorted.find((t) => lifetimeSpend >= t.lifetimeSpendThreshold) ?? tiers[0]
}

function applyRounding(value: number, rule: RoundingRule): number {
  if (rule === "round-up") return Math.ceil(value)
  if (rule === "round-nearest") return Math.round(value)
  return Math.floor(value)
}

/** Points a purchase of `amount` GHS would earn, given the member's current tier multiplier. */
export function computeEarnedPoints(amount: number, member: LoyaltyMember, settings: LoyaltyProgrammeSettings = programmeSettingsStore): number {
  const tier = tierForSpend(member.lifetimeSpend, settings.tiers)
  const basePoints = applyRounding(amount / settings.ghsPerPoint, settings.roundingRule)
  return Math.round(basePoints * tier.pointsMultiplier)
}

export function pointsToGHS(points: number, settings: LoyaltyProgrammeSettings = programmeSettingsStore): number {
  return Math.round(points * settings.pointValueGHS * 100) / 100
}

export function redemptionValueForMax(points: number, transactionTotal: number, settings: LoyaltyProgrammeSettings = programmeSettingsStore): number {
  const requestedValue = pointsToGHS(points, settings)
  const cap = (transactionTotal * settings.maxRedemptionPercent) / 100
  return Math.min(requestedValue, cap)
}

// ---------------------------------------------------------------------------
// Member lifecycle
// ---------------------------------------------------------------------------

let ledgerCounter = 1000

function nextLedgerId(): string {
  ledgerCounter += 1
  return `led-${ledgerCounter}`
}

export function adjustMemberPoints(memberId: string, delta: number, reason: string, note: string | undefined, userName: string): void {
  loyaltyMembersStore = loyaltyMembersStore.map((m) => {
    if (m.id !== memberId) return m
    const entry: PointsLedgerEntry = { id: nextLedgerId(), dateISO: TODAY_ISO, type: "Adjusted", points: delta, source: `${reason} — ${userName}`, note }
    return { ...m, points: Math.max(0, m.points + delta), ledger: [entry, ...m.ledger] }
  })
}

export function redeemPointsOnBehalf(memberId: string, points: number, userName: string): void {
  loyaltyMembersStore = loyaltyMembersStore.map((m) => {
    if (m.id !== memberId) return m
    const entry: PointsLedgerEntry = { id: nextLedgerId(), dateISO: TODAY_ISO, type: "Redeemed", points: -points, source: `Redeemed on behalf — ${userName}` }
    return { ...m, points: Math.max(0, m.points - points), ledger: [entry, ...m.ledger] }
  })
}

export function changeTierManually(memberId: string, newTier: MemberTier, reason: string, note: string | undefined): void {
  loyaltyMembersStore = loyaltyMembersStore.map((m) => (m.id === memberId ? { ...m, tier: newTier } : m))
  void reason
  void note
}

export function removeFromProgramme(memberId: string): void {
  loyaltyMembersStore = loyaltyMembersStore.map((m) => (m.id === memberId ? { ...m, status: "Removed" } : m))
}

export interface EnrolMemberInput {
  phone: string
  name: string
  area?: string
}

export function enrolMember(input: EnrolMemberInput): LoyaltyMember {
  const member: LoyaltyMember = {
    id: `mem-${loyaltyMembersStore.length + 1}-${Date.now().toString(36)}`,
    name: input.name,
    phone: input.phone,
    area: input.area ?? "Other",
    tier: "Bronze",
    points: 0,
    lifetimeSpend: 0,
    creditShare: 0,
    birthMonth: 1,
    lastVisitISO: TODAY_ISO,
    joinedDateISO: TODAY_ISO,
    status: "Active",
    ledger: [{ id: nextLedgerId(), dateISO: TODAY_ISO, type: "Earned", points: 0, source: "Enrolled at register" }],
    creditBalance: 0,
    storeCredit: 0,
  }
  loyaltyMembersStore = [member, ...loyaltyMembersStore]
  return member
}

/** A Credit-tender sale adds to what the member owes the store. */
export function addCreditBalanceForSale(memberId: string, amount: number): void {
  loyaltyMembersStore = loyaltyMembersStore.map((m) => (m.id === memberId ? { ...m, creditBalance: m.creditBalance + amount } : m))
}

/** The register-integration entry point: records a sale against a member, earning points and recalculating tier. */
export function recordSaleForMember(memberId: string, saleAmount: number, isCredit: boolean, settings: LoyaltyProgrammeSettings = programmeSettingsStore): number {
  let earned = 0
  loyaltyMembersStore = loyaltyMembersStore.map((m) => {
    if (m.id !== memberId) return m
    if (isCredit && !settings.creditSalesEarn) return { ...m, lifetimeSpend: m.lifetimeSpend + saleAmount, lastVisitISO: TODAY_ISO }
    earned = computeEarnedPoints(saleAmount, m, settings)
    const nextSpend = m.lifetimeSpend + saleAmount
    const nextTier = tierForSpend(nextSpend, settings.tiers).name
    const entry: PointsLedgerEntry = { id: nextLedgerId(), dateISO: TODAY_ISO, type: "Earned", points: earned, source: "Register sale" }
    return { ...m, points: m.points + earned, lifetimeSpend: nextSpend, tier: nextTier, lastVisitISO: TODAY_ISO, ledger: [entry, ...m.ledger] }
  })
  return earned
}

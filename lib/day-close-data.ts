/**
 * Day close — the missing control at the one point where physical cash
 * changes hands. The expected-cash figure is always a transparent sum of
 * named lines, never one opaque number, and every line links back to the
 * records behind it.
 */

import { cashExpensesFromTillToday } from "@/lib/expenses-data"
import { getGiftCardsStore } from "@/lib/gift-cards-data"
import { getPaymentsStore } from "@/lib/invoice-data"
import { getRiderCodSummary } from "@/lib/deliveries-data"
import { getSalesRecordsStore } from "@/lib/sales-data"
import { RETURNS_RECORDS } from "@/lib/sales-data"
import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"

export const NOTE_DENOMINATIONS = [200, 100, 50, 20, 10, 5, 2, 1] as const
export const COIN_DENOMINATIONS = [2, 1, 0.5, 0.2, 0.1] as const

export interface DenominationCount {
  value: number
  quantity: number
}

export const VARIANCE_REASONS = ["Miscount", "Wrong change given", "Unrecorded expense", "Unrecorded sale", "Theft suspected", "Other"]

export interface CashDrop {
  id: string
  amount: number
  note?: string
  timeLabel: string
  recordedBy: string
}

export type DaySessionStatus = "Open" | "Closed"

export interface DaySession {
  id: string
  dateISO: string
  openedBy: string
  openedAtLabel: string
  openingFloat: number
  closedBy?: string
  closedAtLabel?: string
  status: DaySessionStatus
  denominationCounts: DenominationCount[]
  cashDrops: CashDrop[]
  variance?: number
  varianceReason?: string
  varianceNote?: string
  reopenedBy?: string
  reopenedReason?: string
}

export interface ExpectedCashLine {
  label: string
  amount: number
  href?: string
}

/** Every line that should have changed the drawer's cash today, shown transparently. */
export function computeExpectedCashBreakdown(session: DaySession): ExpectedCashLine[] {
  const dateISO = session.dateISO

  const cashSales = getSalesRecordsStore()
    .filter((s) => s.dateISO === dateISO && s.status === "Completed" && s.type === "Cash")
    .reduce((sum, s) => sum + s.amount, 0)

  // Gift-card issuance doesn't currently record which tender paid for the
  // card — treated as cash for this prototype's Day close breakdown.
  const giftCardsCash = getGiftCardsStore()
    .flatMap((c) => c.transactions)
    .filter((t) => t.type === "Issued" && t.dateISO === dateISO)
    .reduce((sum, t) => sum + t.amount, 0)

  const creditCollectionsCash = getPaymentsStore()
    .filter((p) => p.dateISO === dateISO && p.method === "Cash")
    .reduce((sum, p) => sum + p.amount, 0)

  const riderCodCollected = getRiderCodSummary(dateISO).reduce((sum, row) => sum + row.collected, 0)

  const cashExpenses = cashExpensesFromTillToday(dateISO)

  const cashRefunds = RETURNS_RECORDS.filter((r) => r.dateISO === dateISO && r.refundMethod === "Cash refund").reduce(
    (sum, r) => sum + r.amount,
    0
  )

  const cashDropsTotal = session.cashDrops.reduce((sum, d) => sum + d.amount, 0)

  return [
    { label: "Opening float", amount: session.openingFloat },
    { label: "Cash sales", amount: cashSales, href: "/sales/all" },
    { label: "Gift cards sold (cash)", amount: giftCardsCash, href: "/offers-rewards/gift-cards" },
    { label: "Credit collections (cash)", amount: creditCollectionsCash, href: "/money/money-owed" },
    { label: "Rider COD collected", amount: riderCodCollected, href: "/deliveries" },
    { label: "Cash expenses from till", amount: -cashExpenses, href: "/money/expenses" },
    { label: "Cash refunds", amount: -cashRefunds, href: "/sales/returns" },
    { label: "Cash drops to safe", amount: -cashDropsTotal },
  ]
}

export function expectedCashTotal(session: DaySession): number {
  return Math.round(computeExpectedCashBreakdown(session).reduce((sum, l) => sum + l.amount, 0) * 100) / 100
}

export function countedCashTotal(counts: DenominationCount[]): number {
  return Math.round(counts.reduce((sum, c) => sum + c.value * c.quantity, 0) * 100) / 100
}

export function emptyDenominationCounts(): DenominationCount[] {
  return [...NOTE_DENOMINATIONS, ...COIN_DENOMINATIONS].map((value) => ({ value, quantity: 0 }))
}

// ---------------------------------------------------------------------------
// Seed sessions — 10 past + today's in-progress session
// ---------------------------------------------------------------------------

function countsFromTotal(total: number): DenominationCount[] {
  let remaining = Math.round(total * 100)
  const denomsCents = [...NOTE_DENOMINATIONS, ...COIN_DENOMINATIONS].map((v) => Math.round(v * 100))
  const counts: DenominationCount[] = []
  for (const [i, denomCents] of denomsCents.entries()) {
    const value = [...NOTE_DENOMINATIONS, ...COIN_DENOMINATIONS][i]
    const qty = Math.floor(remaining / denomCents)
    counts.push({ value, quantity: qty })
    remaining -= qty * denomCents
  }
  return counts
}

function buildPastSession(input: {
  num: number
  daysAgo: number
  openedBy: string
  closedBy: string
  expected: number
  variance: number
  varianceReason?: string
  varianceNote?: string
}): DaySession {
  const dateISO = addDaysISO(TODAY_ISO, -input.daysAgo)
  const counted = input.expected + input.variance
  return {
    id: `session-${input.num}`,
    dateISO,
    openedBy: input.openedBy,
    openedAtLabel: "7:45 am",
    openingFloat: 200,
    closedBy: input.closedBy,
    closedAtLabel: "8:10 pm",
    status: "Closed",
    denominationCounts: countsFromTotal(counted),
    cashDrops: input.expected > 1000 ? [{ id: `drop-${input.num}-1`, amount: 500, timeLabel: "3:00 pm", recordedBy: input.closedBy, note: "Midday drop to safe" }] : [],
    variance: Math.round(input.variance * 100) / 100,
    varianceReason: input.varianceReason,
    varianceNote: input.varianceNote,
  }
}

const PAST_SESSIONS: DaySession[] = [
  buildPastSession({ num: 1, daysAgo: 21, openedBy: "Adjoa Boateng", closedBy: "Adjoa Boateng", expected: 2840, variance: 0 }),
  buildPastSession({ num: 2, daysAgo: 20, openedBy: "Adjoa Boateng", closedBy: "Yaw Boadi", expected: 3110, variance: -3 }),
  buildPastSession({ num: 3, daysAgo: 19, openedBy: "Yaw Boadi", closedBy: "Yaw Boadi", expected: 2620, variance: 2 }),
  buildPastSession({ num: 4, daysAgo: 18, openedBy: "Adjoa Boateng", closedBy: "Adjoa Boateng", expected: 3340, variance: 0 }),
  buildPastSession({ num: 5, daysAgo: 17, openedBy: "Yaw Boadi", closedBy: "Adjoa Boateng", expected: 2980, variance: -85, varianceReason: "Unrecorded expense", varianceNote: "Okada fare paid from till, not logged until the next day." }),
  buildPastSession({ num: 6, daysAgo: 16, openedBy: "Adjoa Boateng", closedBy: "Adjoa Boateng", expected: 3050, variance: 0 }),
  buildPastSession({ num: 7, daysAgo: 15, openedBy: "Adjoa Boateng", closedBy: "Yaw Boadi", expected: 2790, variance: -4 }),
  buildPastSession({ num: 8, daysAgo: 14, openedBy: "Yaw Boadi", closedBy: "Yaw Boadi", expected: 3210, variance: 5 }),
  buildPastSession({ num: 9, daysAgo: 13, openedBy: "Adjoa Boateng", closedBy: "Adjoa Boateng", expected: 2930, variance: -2 }),
  buildPastSession({ num: 10, daysAgo: 12, openedBy: "Adjoa Boateng", closedBy: "Adjoa Boateng", expected: 3400, variance: 0 }),
]

const TODAY_SESSION_SEED: DaySession = {
  id: "session-today",
  dateISO: TODAY_ISO,
  openedBy: "Adjoa Boateng",
  openedAtLabel: "7:40 am",
  openingFloat: 200,
  status: "Open",
  denominationCounts: emptyDenominationCounts(),
  cashDrops: [],
}

let daySessionsStore: DaySession[] = [
  { ...TODAY_SESSION_SEED, cashDrops: [] },
  ...PAST_SESSIONS.map((s) => ({ ...s, denominationCounts: s.denominationCounts.map((c) => ({ ...c })), cashDrops: s.cashDrops.map((d) => ({ ...d })) })),
]

export function getDaySessionsStore(): DaySession[] {
  return daySessionsStore
}

export function setDaySessionsStore(next: DaySession[]): void {
  daySessionsStore = next
}

export function getTodaySession(): DaySession | undefined {
  return daySessionsStore.find((s) => s.dateISO === TODAY_ISO)
}

export function getPastSessions(): DaySession[] {
  return daySessionsStore.filter((s) => s.dateISO !== TODAY_ISO).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
}

export function openDay(openedBy: string, openingFloat: number): DaySession {
  const session: DaySession = {
    id: `session-${Date.now().toString(36)}`,
    dateISO: TODAY_ISO,
    openedBy,
    openedAtLabel: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    openingFloat,
    status: "Open",
    denominationCounts: emptyDenominationCounts(),
    cashDrops: [],
  }
  daySessionsStore = [session, ...daySessionsStore]
  return session
}

export function recordCashDrop(sessionId: string, amount: number, note: string | undefined, recordedBy: string): void {
  daySessionsStore = daySessionsStore.map((s) =>
    s.id === sessionId
      ? {
          ...s,
          cashDrops: [
            ...s.cashDrops,
            { id: `drop-${sessionId}-${s.cashDrops.length + 1}`, amount, note, timeLabel: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), recordedBy },
          ],
        }
      : s
  )
}

export function saveDenominationCounts(sessionId: string, counts: DenominationCount[]): void {
  daySessionsStore = daySessionsStore.map((s) => (s.id === sessionId ? { ...s, denominationCounts: counts } : s))
}

export function closeDay(sessionId: string, closedBy: string, variance: number, varianceReason: string | undefined, varianceNote: string | undefined): void {
  daySessionsStore = daySessionsStore.map((s) =>
    s.id === sessionId
      ? {
          ...s,
          status: "Closed",
          closedBy,
          closedAtLabel: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          variance,
          varianceReason,
          varianceNote,
        }
      : s
  )
}

export function reopenDay(sessionId: string, reopenedBy: string, reason: string): void {
  daySessionsStore = daySessionsStore.map((s) => (s.id === sessionId ? { ...s, status: "Open", reopenedBy, reopenedReason: reason } : s))
}

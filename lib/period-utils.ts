/**
 * Shared period-selector convention used by every module's stat cards
 * (Dashboard, Sales, Invoice, Estimator) — Today / This week / This month /
 * Custom, defaulting to Today. Point-in-time balances (credit outstanding,
 * invoice outstanding) don't use this — they stay "as of now" with no delta.
 */

export type StandardPeriod = "today" | "week" | "month" | "custom"

export const STANDARD_PERIOD_OPTIONS: { value: StandardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
]

/**
 * A fixed reference date matching the rest of the app's mock narrative
 * ("today" throughout the dashboard/reports) rather than the real current
 * date, so the demo doesn't drift when opened on a different day.
 */
export const TODAY_ISO = "2026-07-22"

export interface DateRange {
  from: Date
  to: Date
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** Resolves a period into an inclusive date range. Custom falls back to "this month" until both dates are picked. */
export function getStandardPeriodRange(
  period: StandardPeriod,
  customFrom?: string,
  customTo?: string
): DateRange {
  const today = toDate(TODAY_ISO)

  switch (period) {
    case "today":
      return { from: today, to: today }
    case "week": {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from, to: today }
    }
    case "custom": {
      if (customFrom && customTo) {
        return { from: toDate(customFrom), to: toDate(customTo) }
      }
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
    }
    case "month":
    default:
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
  }
}

export function isDateInRange(dateISO: string, range: DateRange): boolean {
  const d = toDate(dateISO)
  return d >= range.from && d <= range.to
}

/** "2026-07-22" -> "22 Jul 2026". */
export function formatDateDisplay(iso: string): string {
  if (!iso) return "—"
  return toDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}


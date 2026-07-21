import { getModule, type Tier } from "@/lib/modules"

/**
 * PROVISIONAL — pending team sign-off. Prices are monthly, in USD.
 * Structure (seats, annual discount, GHS conversion) is a placeholder
 * until the team decides — see TODOs below.
 */
export interface TierPricing {
  id: Tier
  name: string
  summary: string
  monthlyPrice: number
  seats: string
  locations: string
  headlineInclusions: string[]
}

export const TIERS: TierPricing[] = [
  {
    id: "light",
    name: "Light",
    summary: "Everything a single shop needs to track stock, sales, and money.",
    monthlyPrice: 46,
    seats: "3 staff seats",
    locations: "1 location",
    headlineInclusions: [
      "Dashboard, Inventory, Sales, Users & Expenses",
      "Settings & Guide — audit logs included",
      "3 staff seats, 1 location",
    ],
  },
  {
    id: "prime",
    name: "Prime",
    summary: "For shops ready to invoice, deliver, and report properly.",
    monthlyPrice: 146,
    seats: "10 staff seats",
    locations: "1 location",
    headlineInclusions: [
      "Everything in Light",
      "Invoicing, Deliveries & Estimator",
      "Offers & Rewards, Message, Reports",
      "10 staff seats, 1 location",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    summary: "For growing stores running loyalty, affiliates, and multiple teams.",
    monthlyPrice: 346,
    seats: "Seat bundles per location",
    locations: "Multiple locations",
    headlineInclusions: [
      "Everything in Prime",
      "Store & Warehouse, Loyalty, Affiliates",
      "Workflow for internal approvals",
      "Seat bundles per location",
    ],
  },
]

/** TODO: confirm the real annual discount structure — "2 months free" is a placeholder assumption. */
export const ANNUAL_MONTHS_FREE = 2

export function annualPrice(monthlyPrice: number): number {
  return monthlyPrice * (12 - ANNUAL_MONTHS_FREE)
}

/** TODO: replace with a real, current exchange rate before this ships with currency=GHS live. */
export const GHS_PER_USD = 15

export function formatPrice(amountUsd: number, currency: "USD" | "GHS"): string {
  if (currency === "GHS") {
    return `GHS ${Math.round(amountUsd * GHS_PER_USD).toLocaleString("en-GH")}`
  }
  return `$${amountUsd.toLocaleString("en-US")}`
}

export interface Addon {
  name: string
  description: string
  note: string
}

const appointmentsModule = getModule("appointments")

export const ADDONS: Addon[] = [
  {
    name: "Appointments",
    description: appointmentsModule?.description ?? "Customer bookings for services and consultations.",
    note: "Paid add-on, available on any tier — not bundled into Light, Prime, or Ultra.",
  },
  {
    name: "Extra seats",
    description: "Add more staff logins beyond the seats included in your plan.",
    note: "Priced per seat, cheap to add on every tier.",
  },
  {
    name: "Extra locations",
    description: "Add another shop, warehouse, or branch to your account.",
    note: "TODO: confirm per-location pricing — talk to us for a quote in the meantime.",
  },
]

export interface FaqEntry {
  question: string
  answer: string
  todo?: string
}

export const FAQ: FaqEntry[] = [
  {
    question: "What happens after my first free month?",
    answer:
      "You'll move onto the paid tier you picked when you started — Light, Prime, or Ultra. We'll let you know before the free month ends so there are no surprises.",
    todo: "Confirm the exact billing trigger — do we collect card details upfront, or only once the free month ends?",
  },
  {
    question: "Can I change tiers later?",
    answer:
      "Yes. Move up to a bigger tier as your store grows, or down if you need less — your data stays exactly as it is.",
    todo: "Confirm whether a downgrade takes effect immediately or at the next billing date.",
  },
  {
    question: "Do you help with setup?",
    answer:
      "Yes. We'll help you set up your first stock count and get your staff added as accounts, so you're not starting from a blank screen.",
  },
  {
    question: "Does it work on my phone?",
    answer: "Yes — MyStoreGuard works in any modern phone browser. No app download needed.",
    todo: "Confirm whether a dedicated mobile app is planned, or browser-only is the permanent approach.",
  },
  {
    question: "What about my data if I leave?",
    answer: "Your records belong to you, not us.",
    todo: "Confirm the exact data export process and how long records are retained after a cancellation.",
  },
  {
    question: "Can my staff each have their own login?",
    answer:
      "Yes — every plan includes staff seats, and every sale, edit, and delivery is tied to the staff member who did it, with a full audit log. Extra seats are cheap to add on any tier.",
  },
]

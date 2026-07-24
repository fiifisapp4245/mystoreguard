import { getModule, type Tier } from "@/lib/modules"

/**
 * PROVISIONAL — pending team sign-off. Prices are monthly, in USD.
 * Structure (seats, annual discount, GHS conversion) is a placeholder
 * until the team decides on real figures.
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

/** Placeholder assumption pending team sign-off on the real annual discount structure. */
export const ANNUAL_MONTHS_FREE = 2

export function annualPrice(monthlyPrice: number): number {
  return monthlyPrice * (12 - ANNUAL_MONTHS_FREE)
}

/**
 * Illustrative only — not a live rate. `currency=GHS` is gated off by
 * `siteConfig.showPrices`/`currency` (see lib/site-config.ts) until the
 * team decides on real GHS pricing; replace with a current rate (or a
 * proper FX lookup) before that ships.
 */
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
    note: "Talk to us for a quote — priced per location.",
  },
]

export interface FaqEntry {
  question: string
  answer: string
}

export const FAQ: FaqEntry[] = [
  {
    question: "What happens after my first free month?",
    answer:
      "You'll move onto the paid tier you picked when you started — Light, Prime, or Ultra. We'll let you know before the free month ends so there are no surprises.",
  },
  {
    question: "Can I change tiers later?",
    answer:
      "Yes. Move up to a bigger tier as your store grows, or down if you need less — your data stays exactly as it is.",
  },
  {
    question: "Do you help with setup?",
    answer:
      "Yes. We'll help you set up your first stock count and get your staff added as accounts, so you're not starting from a blank screen.",
  },
  {
    question: "Does it work on my phone?",
    answer: "Yes — MyStoreGuard works in any modern phone browser. No app download needed.",
  },
  {
    question: "What about my data if I leave?",
    answer: "Your records belong to you, not us. Talk to us any time for an export of everything you've recorded.",
  },
  {
    question: "Can my staff each have their own login?",
    answer:
      "Yes — every plan includes staff seats, and every sale, edit, and delivery is tied to the staff member who did it, with a full audit log. Extra seats are cheap to add on any tier.",
  },
]

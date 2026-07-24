/**
 * Contextual help — the layer that covers being stuck, not browsing. Guide
 * itself (lib/guide-data.ts) is the browsable index; this file maps specific
 * screens and terms to the articles that actually help there.
 */

export interface ScreenHelpMapping {
  screenKey: string
  title: string
  articleIds: string[]
}

export const SCREEN_HELP: ScreenHelpMapping[] = [
  { screenKey: "register", title: "Register", articleIds: ["pricing-rules-price-floor", "how-points-tiers-work", "recording-a-return"] },
  { screenKey: "receiving-goods", title: "Receiving goods", articleIds: ["moving-weighted-average", "set-aside-for-delivery"] },
  { screenKey: "stocktake", title: "Stocktakes", articleIds: ["running-a-stocktake", "blind-counting-explained"] },
  { screenKey: "template-builder", title: "Template builder", articleIds: ["building-estimator-template", "quotation-to-invoice"] },
  { screenKey: "pricing-settings", title: "Pricing & discounts", articleIds: ["pricing-rules-price-floor", "moving-weighted-average"] },
  { screenKey: "day-close", title: "Day close", articleIds: ["day-close-cash-variance", "who-owes-me-who-i-owe"] },
  { screenKey: "permissions-matrix", title: "Roles & permissions", articleIds: ["roles-and-permissions", "inviting-staff"] },
]

export function getScreenHelp(screenKey: string): ScreenHelpMapping | undefined {
  return SCREEN_HELP.find((s) => s.screenKey === screenKey)
}

export interface ConceptTooltipEntry {
  key: string
  term: string
  explanation: string
  articleId: string
}

export const CONCEPT_TOOLTIPS: ConceptTooltipEntry[] = [
  {
    key: "set-aside",
    term: "Set aside for delivery",
    explanation: "Stock that's sold but not yet collected for delivery — still on the shelf, but no longer available to sell to anyone else.",
    articleId: "set-aside-for-delivery",
  },
  {
    key: "available-vs-onhand",
    term: "Available vs On hand",
    explanation: "On hand is everything physically in the location. Available is on hand minus anything set aside for a delivery — what you can actually sell right now.",
    articleId: "set-aside-for-delivery",
  },
  {
    key: "price-floor",
    term: "Price floor / minimum margin",
    explanation: "The point past which a discount cannot go, however it's combined with other discounts — protects margin regardless of how generous a cashier or promotion tries to be.",
    articleId: "pricing-rules-price-floor",
  },
  {
    key: "weighted-average",
    term: "Moving weighted average",
    explanation: "Every new purchase recalculates a single blended cost for all stock on hand — the method this store uses to value inventory and compute margin.",
    articleId: "moving-weighted-average",
  },
  {
    key: "blind-count",
    term: "Blind count",
    explanation: "The counter doesn't see the system's expected quantity while counting — so what gets written down is what's really on the shelf, not a guess anchored to the expected number.",
    articleId: "blind-counting-explained",
  },
  {
    key: "snapshot-reconciliation",
    term: "Snapshot reconciliation",
    explanation: "Sales and receipts that happen while a stocktake is in progress are tracked separately against the snapshot taken at the start, so trading doesn't have to stop to count.",
    articleId: "running-a-stocktake",
  },
  {
    key: "points-liability",
    term: "Points liability",
    explanation: "Loyalty points already earned but not yet redeemed represent value the store still owes its customers — worth tracking the same way you'd track any other debt.",
    articleId: "how-points-tiers-work",
  },
  {
    key: "receivable-payable",
    term: "Accounts receivable / payable",
    explanation: "Receivable is money owed to you (unpaid invoices, customer credit). Payable is money you owe (supplier bills). Money owed tracks both in one place, aged the same way.",
    articleId: "who-owes-me-who-i-owe",
  },
  {
    key: "effective-date",
    term: "Effective date",
    explanation: "The date a change to this setting starts applying. Documents created before this date keep the value that was in force when they were created.",
    articleId: "return-policy",
  },
  {
    key: "locked-setting",
    term: "Locked setting",
    explanation: "This determined how existing transactions were valued — changing it now would rewrite history, so it's fixed once real activity exists.",
    articleId: "moving-weighted-average",
  },
]

export function getConceptTooltip(key: string): ConceptTooltipEntry | undefined {
  return CONCEPT_TOOLTIPS.find((c) => c.key === key)
}

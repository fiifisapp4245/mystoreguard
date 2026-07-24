/**
 * Inventory costing method — Class A in Settings → Inventory costing. Fixed
 * once real activity exists, since it determines how existing stock was
 * valued; changing it would rewrite history. See components/settings/locked-field.tsx.
 */

export type CostingMethod = "weighted-average" | "fifo" | "specific-identification" | "latest-cost"

export const DEFAULT_COSTING_METHOD: CostingMethod = "weighted-average"

export interface CostingMethodOption {
  id: CostingMethod
  label: string
  description: string
  /** Shown as a muted caution note rather than a normal description. */
  caution?: string
  /** Only this method is actually computed in the prototype — see lib/purchase-orders-data.ts. */
  implemented: boolean
}

export const COSTING_METHOD_OPTIONS: CostingMethodOption[] = [
  {
    id: "weighted-average",
    label: "Moving weighted average",
    description:
      "Every purchase recalculates the average cost of stock on hand; sales use that average. Simple and stable — suits general retail and frequent replenishment.",
    implemented: true,
  },
  {
    id: "fifo",
    label: "FIFO",
    description: "Oldest stock is treated as sold first, matching physical rotation. Suits groceries, pharmacies, anything date-sensitive.",
    implemented: false,
  },
  {
    id: "specific-identification",
    label: "Specific identification",
    description: "Each item carries its own cost. Suits electronics, vehicles, jewellery, serialised goods.",
    implemented: false,
  },
  {
    id: "latest-cost",
    label: "Latest cost",
    description: "The newest purchase price replaces the old. Simple, but distorts valuation over time.",
    caution: "Not recommended for accounting.",
    implemented: false,
  },
]

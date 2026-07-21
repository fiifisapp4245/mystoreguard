import {
  Award,
  BarChart3,
  BookOpen,
  Calculator,
  CalendarCheck,
  FileText,
  Gift,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for MyStoreGuard's navigation structure.
 * Edit this file to change the modules, groups, tiers, or flat order —
 * every screen (sidebar, module pages, demo controls) reads from here.
 */

export type Tier = "light" | "prime" | "ultra"

export interface ModuleFeature {
  name: string
  description: string
}

export interface ModuleConfig {
  id: string
  name: string
  icon: LucideIcon
  description: string
  /** Granular features from the feature catalogue — drives both the generic
   * fallback page and the custom-designed pages. */
  features: ModuleFeature[]
  tier: Tier
  /** Always shown with an "Add-on" badge, independent of tier locking. */
  addon?: boolean
}

export const MODULES: ModuleConfig[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    description: "Revenue, expenses, profit, and top products at a glance.",
    features: [
      {
        name: "Store statistics cards",
        description:
          "Headline numbers for the period: items sold, revenue, invoices, expenses, products, customers, appointments, and gross profit.",
      },
      {
        name: "Sales & revenue trend",
        description: "A month-by-month chart of sales and revenue, so you can see whether the business is growing.",
      },
      {
        name: "Revenue vs expenses",
        description: "Money coming in against money going out over time, showing whether the store is profitable.",
      },
      {
        name: "Invoice status distribution",
        description: "A breakdown of invoices by state, so you can see how much is still owed to the business.",
      },
      {
        name: "Top products",
        description: "A ranking of the best-performing products by quantity sold and by sales value.",
      },
    ],
    tier: "light",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    description: "Products, purchase orders, and splitting cartons into sellable units.",
    features: [
      {
        name: "Product",
        description: "The catalogue of everything the store sells: names, descriptions, and identifying details.",
      },
      {
        name: "Product split",
        description: "Breaking one purchased unit into smaller sellable units, so stock counts stay accurate.",
      },
      {
        name: "Purchase orders",
        description: "Orders raised to suppliers, tracked from ordering through to receiving the goods.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to products and purchase orders. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "store-warehouse",
    name: "Store & Warehouse",
    icon: Warehouse,
    description: "Transfers to the shop floor and stocktaking across locations.",
    features: [
      {
        name: "Split items",
        description: "Splitting bulk stock into smaller sellable units at store or warehouse level.",
      },
      {
        name: "Transfers",
        description: "Moving stock between the warehouse and stores, with a record of what moved, when, and by whom.",
      },
      {
        name: "Stocktaking",
        description: "Physically counting shelf and warehouse stock against system records, exposing theft and errors.",
      },
      {
        name: "Settings",
        description: "Configuration specific to each store or warehouse location.",
      },
      {
        name: "Audit logs",
        description: "A record of all stock movements and adjustments. Included in every tier.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "sales",
    name: "Sales",
    icon: ShoppingCart,
    description: "Daily sales, credit sales, deposit sales, and store returns.",
    features: [
      {
        name: "Daily sales",
        description: "The day-to-day selling screen: recording what was sold, to whom, and for how much.",
      },
      {
        name: "On-hold sales",
        description: "Parking an unfinished sale so the cashier can serve the next person and return to it later.",
      },
      {
        name: "Credit sales",
        description: "Selling to a trusted customer who pays later, with the debt tracked until it's settled.",
      },
      {
        name: "Deposit sales",
        description: "A customer pays part up front and collects the goods when they finish paying.",
      },
      {
        name: "Statistics",
        description: "Summaries and analysis of sales performance over time.",
      },
      {
        name: "Store returns",
        description: "Refunding or crediting returned goods according to the return policy.",
      },
      {
        name: "Audit logs",
        description: "A record of every sale, hold, credit, deposit, and return. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "invoice",
    name: "Invoice",
    icon: FileText,
    description: "Invoicing customers for goods and services.",
    features: [
      {
        name: "Invoices",
        description: "Creating and tracking invoices through draft, sent, partially paid, and paid.",
      },
      {
        name: "Audit logs",
        description: "A record of invoice creation, edits, and status changes. Included in every tier.",
      },
    ],
    tier: "prime",
  },
  {
    id: "expenses",
    name: "Expenses",
    icon: Receipt,
    description: "Recording day-to-day business expenses.",
    features: [
      {
        name: "Expenses",
        description: "Recording business costs so they can be set against revenue to show true profitability.",
      },
      {
        name: "Audit logs",
        description: "A record of expense entries and changes. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "users",
    name: "Users",
    icon: Users,
    description: "Customers, suppliers, and staff accounts in one place.",
    features: [
      {
        name: "Customers",
        description: "A directory of everyone who buys from the store — contact details and purchase history.",
      },
      {
        name: "Suppliers",
        description: "A directory of the businesses the store buys stock from.",
      },
      {
        name: "Audit logs",
        description: "A record of who added, changed, or removed customer and supplier records. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "deliveries",
    name: "Deliveries",
    icon: Truck,
    description: "Getting goods into the customer's hands.",
    features: [
      {
        name: "Deliveries",
        description: "Recording and tracking orders that must reach a customer, from dispatch to confirmed receipt.",
      },
      {
        name: "Audit logs",
        description: "A record of delivery creation and status changes. Included in every tier.",
      },
    ],
    tier: "prime",
  },
  {
    id: "loyalty",
    name: "Loyalty",
    icon: Award,
    description: "Points, tiers, and customer segments that reward repeat buyers.",
    features: [
      {
        name: "Segments",
        description: "Automatic grouping of customers by criteria you set, kept current without manual work.",
      },
      {
        name: "Points",
        description: "Customers earn points on purchases and redeem them for value later.",
      },
      {
        name: "Point rules",
        description: "Your own settings for how points are earned and redeemed.",
      },
      {
        name: "Tiers",
        description: "Ranked levels such as Bronze / Silver / Gold, based on lifetime spend.",
      },
      {
        name: "Analytics",
        description: "Reports on your best customers, who's slipping away, and overall customer health.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to loyalty settings, points, and tiers. Included in every tier.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "offers-rewards",
    name: "Offers & Rewards",
    icon: Gift,
    description: "Promo codes and gift cards to drive repeat purchases.",
    features: [
      {
        name: "Gift cards",
        description: "Selling stored-value cards a customer can spend in store later — cash up front for the store.",
      },
      {
        name: "Promo codes",
        description: "Discount codes for campaigns, with control over what they apply to and for how long.",
      },
      {
        name: "Affiliates",
        description: "Letting referral partners bring in customers, with referrals tracked for reward.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to gift cards, promo codes, and affiliate arrangements. Included in every tier.",
      },
    ],
    tier: "prime",
  },
  {
    id: "affiliates",
    name: "Affiliates",
    icon: Handshake,
    description: "Referral partners who bring in new customers.",
    features: [
      {
        name: "Referral partners",
        description: "Third parties such as influencers or partner businesses who refer customers to the store.",
      },
      {
        name: "Commission tracking",
        description: "Tracking referred sales so partners can be rewarded for what they bring in.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "appointments",
    name: "Appointments",
    icon: CalendarCheck,
    description: "Customer bookings for services and consultations.",
    features: [
      {
        name: "Appointments",
        description: "Booking and managing customer appointments, with a schedule of who is coming in and when.",
      },
      {
        name: "Audit logs",
        description: "A record of bookings, changes, and cancellations. Included in every tier.",
      },
    ],
    tier: "light",
    addon: true,
  },
  {
    id: "workflow",
    name: "Workflow",
    icon: Workflow,
    description: "Internal task and approval flows for your team.",
    features: [
      {
        name: "Templates",
        description: "Reusable checklists for things the business does repeatedly, like opening or receiving stock.",
      },
      {
        name: "Tasks",
        description: "Individual pieces of work assigned to staff and tracked to completion.",
      },
      {
        name: "Settings",
        description: "Configuration for how workflows behave.",
      },
      {
        name: "Audit logs",
        description: "A record of task creation, assignment, and completion. Included in every tier.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "estimator",
    name: "Estimator",
    icon: Calculator,
    description: "Quotations and estimates prepared before a sale is made.",
    features: [
      {
        name: "Template",
        description: "Reusable structures for building estimates quickly and consistently.",
      },
      {
        name: "Estimate",
        description: "A formal quotation showing what a job or order will cost before it becomes a sale.",
      },
      {
        name: "Audit logs",
        description: "A record of estimates created and modified. Included in every tier.",
      },
    ],
    tier: "prime",
  },
  {
    id: "reports",
    name: "Reports",
    icon: BarChart3,
    description: "Cross-module business reports for informed decisions.",
    features: [
      {
        name: "Reports",
        description: "Business reports drawn from across all modules, giving deeper views than the dashboard summaries.",
      },
    ],
    tier: "prime",
  },
  {
    id: "message",
    name: "Message",
    icon: MessageSquare,
    description: "Messages and notifications sent to customers and staff.",
    features: [
      {
        name: "Message",
        description: "Sending notifications or promotional communication to customers and staff from within the system.",
      },
    ],
    tier: "prime",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description:
      "Product metadata, prices, pricing rules, tax & tax rules, return policy, store credit, and audit logs.",
    features: [
      {
        name: "Product metadata",
        description: "The descriptive attributes used to organise products — categories, brands, units.",
      },
      {
        name: "Product prices",
        description: "The selling prices attached to products.",
      },
      {
        name: "Pricing rules",
        description: "Automatic pricing logic for different customer groups, quantities, or conditions.",
      },
      {
        name: "Tax",
        description: "The taxes the business must charge, such as VAT and levies.",
      },
      {
        name: "Tax rules",
        description: "When and how each tax applies, so receipts and invoices calculate tax correctly.",
      },
      {
        name: "Return policy",
        description: "Your own rules for accepting returns — time limits, conditions, refund vs credit.",
      },
      {
        name: "Store credit",
        description: "Value held on a customer's account that they can spend on future purchases.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to business rules and settings. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "guide",
    name: "Guide",
    icon: BookOpen,
    description: "Step-by-step in-app guidance for getting the most from MyStoreGuard.",
    features: [
      {
        name: "Loyalty program",
        description: "How to set up points, tiers, and segments.",
      },
      {
        name: "Pricing setup",
        description: "How to configure product prices and pricing rules.",
      },
      {
        name: "Return policy",
        description: "How to define your store's return rules.",
      },
      {
        name: "Store returns",
        description: "How to process a customer return at the till.",
      },
      {
        name: "Store sales",
        description: "How to record daily, credit, and deposit sales.",
      },
      {
        name: "Estimator",
        description: "How to build and send an estimate before a sale.",
      },
    ],
    tier: "light",
  },
]

export interface GroupConfig {
  id: string
  label: string
  moduleIds: string[]
}

/**
 * Proposed grouped structure. "home" and "system" are pinned (top/bottom)
 * rather than rendered as collapsible groups — see resolveNav().
 */
export const GROUPS: GroupConfig[] = [
  { id: "home", label: "Home", moduleIds: ["dashboard"] },
  { id: "sell", label: "Sell", moduleIds: ["sales", "invoice", "deliveries", "estimator"] },
  { id: "stock", label: "Stock", moduleIds: ["inventory", "store-warehouse"] },
  { id: "people", label: "People", moduleIds: ["users"] },
  { id: "grow", label: "Grow", moduleIds: ["loyalty", "offers-rewards", "affiliates", "appointments", "message"] },
  { id: "money", label: "Money", moduleIds: ["expenses", "reports"] },
  { id: "system", label: "System", moduleIds: ["settings", "workflow", "guide"] },
]

/** Current sidebar: a flat, ungrouped list in this exact order. */
export const FLAT_ORDER: string[] = [
  "dashboard",
  "inventory",
  "store-warehouse",
  "sales",
  "invoice",
  "expenses",
  "users",
  "deliveries",
  "loyalty",
  "offers-rewards",
  "affiliates",
  "appointments",
  "workflow",
  "estimator",
  "reports",
  "message",
  "settings",
  "guide",
]

const MODULES_BY_ID = new Map(MODULES.map((module) => [module.id, module]))

export function getModule(id: string): ModuleConfig | undefined {
  return MODULES_BY_ID.get(id)
}

export const TIER_LABEL: Record<Tier, string> = {
  light: "Light",
  prime: "Prime",
  ultra: "Ultra",
}

const TIER_RANK: Record<Tier, number> = { light: 0, prime: 1, ultra: 2 }

/** Addon modules are never tier-locked — they always show with an "Add-on" badge instead. */
export function isModuleLocked(module: ModuleConfig, viewingAsTier: Tier): boolean {
  if (module.addon) return false
  return TIER_RANK[module.tier] > TIER_RANK[viewingAsTier]
}

export type EstimatorLocation = "sell" | "system"
export type MessageLocation = "grow" | "bottom"

export interface NavToggles {
  estimatorLocation: EstimatorLocation
  messageLocation: MessageLocation
}

export interface ResolvedNav {
  /** Pinned at the very top of the sidebar, outside any group. */
  pinned: ModuleConfig[]
  /** Scrollable collapsible groups, in config order (excludes "home" and "system"). */
  groups: { id: string; label: string; modules: ModuleConfig[] }[]
  /** Pinned near the bottom, above the System group (e.g. Message as a utility item). */
  bottomUtility: ModuleConfig[]
  /** Always pinned at the very bottom. */
  system: { id: string; label: string; modules: ModuleConfig[] }
}

/**
 * Resolves GROUPS + the two placement toggles into the exact structure the
 * grouped sidebar should render. This is the only place group membership is
 * adjusted at runtime — GROUPS itself is never mutated.
 */
export function resolveNav(toggles: NavToggles): ResolvedNav {
  const home = GROUPS.find((g) => g.id === "home")
  const system = GROUPS.find((g) => g.id === "system")
  const middleGroups = GROUPS.filter((g) => g.id !== "home" && g.id !== "system")

  let bottomUtilityIds: string[] = []

  const idsByGroup = new Map(middleGroups.map((g) => [g.id, [...g.moduleIds]]))
  let systemIds = system ? [...system.moduleIds] : []

  if (toggles.estimatorLocation === "system") {
    const sellIds = idsByGroup.get("sell")
    if (sellIds) idsByGroup.set("sell", sellIds.filter((id) => id !== "estimator"))
    if (!systemIds.includes("estimator")) systemIds = ["estimator", ...systemIds]
  }

  if (toggles.messageLocation === "bottom") {
    const growIds = idsByGroup.get("grow")
    if (growIds) idsByGroup.set("grow", growIds.filter((id) => id !== "message"))
    bottomUtilityIds = ["message"]
  }

  const toModules = (ids: string[]) => ids.map(getModule).filter((m): m is ModuleConfig => Boolean(m))

  return {
    pinned: home ? toModules(home.moduleIds) : [],
    groups: middleGroups.map((g) => ({
      id: g.id,
      label: g.label,
      modules: toModules(idsByGroup.get(g.id) ?? g.moduleIds),
    })),
    bottomUtility: toModules(bottomUtilityIds),
    system: {
      id: system?.id ?? "system",
      label: system?.label ?? "System",
      modules: toModules(systemIds),
    },
  }
}

export function resolveFlat(): ModuleConfig[] {
  return FLAT_ORDER.map(getModule).filter((m): m is ModuleConfig => Boolean(m))
}

import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CalendarCheck,
  FileText,
  Gift,
  Handshake,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Ruler,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  Truck,
  Undo2,
  UserCog,
  Users,
  Wallet,
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
  /** Overrides the default `/m/${id}` link target. Used for the flat-view
   * "Users" entry, which now routes to the People hub instead of its own page. */
  href?: string
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
    id: "products",
    name: "Products",
    icon: Package,
    description: "The catalogue of everything the store sells, its pack structure, and stock across locations.",
    features: [
      {
        name: "Product catalogue",
        description: "Names, categories, barcodes, and pack structure — one definition that drives selling, purchasing, and counting.",
      },
      {
        name: "Import products",
        description: "Bring in a whole catalogue from a spreadsheet instead of typing each product in by hand.",
      },
    ],
    tier: "light",
  },
  {
    id: "purchase-orders",
    name: "Purchase orders",
    icon: FileText,
    description: "Orders raised to suppliers, tracked from ordering through to receiving the goods.",
    features: [
      {
        name: "Purchase orders",
        description: "Orders raised to suppliers, tracked from draft through to received.",
      },
      {
        name: "Order low stock",
        description: "Turn every product at or below its reorder point into draft orders, grouped by supplier, in one click.",
      },
      {
        name: "Receive goods",
        description: "Recording what actually arrived, at what cost, and the supplier bill it created.",
      },
    ],
    tier: "light",
  },
  {
    id: "stock-levels",
    name: "Stock levels",
    icon: Warehouse,
    description: "On hand, set aside, and available stock, by location.",
    features: [
      {
        name: "Stock levels",
        description: "On hand, set aside, and available quantities for every product, broken down by location.",
      },
      {
        name: "Adjust stock",
        description: "Correcting a quantity with a required reason — damage, expiry, theft, or a miscount.",
      },
    ],
    tier: "light",
  },
  {
    id: "movements",
    name: "Movements",
    icon: Warehouse,
    description: "Transfers, splits, adjustments, and returns — every stock movement in one ledger.",
    features: [
      {
        name: "Transfers",
        description: "Moving stock between locations, with a two-sided confirmation so nothing goes missing in transit. Ultra only.",
      },
      {
        name: "Split stock",
        description: "Breaking a purchased pack into its sellable units on the shelf.",
      },
      {
        name: "Adjustments & returns",
        description: "Every correction and return recorded with a reason, in the same ledger as transfers and splits.",
      },
    ],
    tier: "light",
  },
  {
    id: "stocktakes",
    name: "Stocktakes",
    icon: Warehouse,
    description: "Cycle counts against a snapshot, with blind counting and reconciliation for what moved during the count.",
    features: [
      {
        name: "Stocktaking",
        description: "Counting shelf and warehouse stock against system records, exposing theft and errors. Available at every tier.",
      },
      {
        name: "Snapshot reconciliation",
        description: "Sales and receipts during a count are tracked separately, so trading doesn't have to stop to count.",
      },
    ],
    tier: "light",
  },
  {
    id: "all",
    name: "All sales",
    icon: ShoppingCart,
    description: "Cash, Momo, credit, and deposit sales — one table, filtered by type instead of split across separate screens.",
    features: [
      {
        name: "Sales register",
        description: "Cash, Momo, credit, and deposit sales recorded through the register and listed here as one stream.",
      },
      {
        name: "On-hold sales",
        description: "Parking an unfinished sale so the cashier can serve the next person and return to it later.",
      },
      {
        name: "Credit & deposit tracking",
        description: "Debts and part-payments tracked until they're settled, filterable alongside every other sale.",
      },
    ],
    tier: "light",
  },
  {
    id: "returns",
    name: "Returns",
    icon: Undo2,
    description: "Goods brought back and refunded or credited according to the return policy.",
    features: [
      {
        name: "Store returns",
        description: "Refunding or crediting returned goods according to the return policy.",
      },
    ],
    tier: "light",
  },
  {
    id: "invoices",
    name: "Invoices",
    icon: FileText,
    description: "Creating and tracking invoices through draft, sent, partially paid, and paid.",
    features: [
      {
        name: "Invoices",
        description: "Creating and tracking invoices through draft, sent, partially paid, and paid.",
      },
      {
        name: "Record payment",
        description: "Recording a payment against an invoice, recalculating its status automatically.",
      },
    ],
    tier: "prime",
  },
  {
    id: "payments",
    name: "Payments received",
    icon: Receipt,
    description: "Every payment recorded against an invoice, across every method.",
    features: [
      {
        name: "Payments received",
        description: "A record of every payment taken against an invoice, with method and reference.",
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
    id: "customers",
    name: "Customers",
    icon: Users,
    description: "Everyone who buys from the store — contact details, purchase history, and loyalty status.",
    features: [
      {
        name: "Customer directory",
        description: "Contact details, purchase history, and loyalty status for every customer.",
      },
      {
        name: "Audit logs",
        description: "A record of who added, changed, or removed customer records. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "suppliers",
    name: "Suppliers",
    icon: Building2,
    description: "The businesses the store buys stock from.",
    features: [
      {
        name: "Supplier directory",
        description: "Contact details, categories supplied, and payment terms for every supplier.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to supplier records. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "staff",
    name: "Staff",
    icon: UserCog,
    description: "Staff accounts and what each person can see and do in the system.",
    features: [
      {
        name: "Staff accounts",
        description: "A seat for every staff member, with a role controlling what they can access.",
      },
      {
        name: "Audit logs",
        description: "A record of staff account changes. Included in every tier.",
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
    href: "/deliveries",
  },
  {
    id: "loyalty-members",
    name: "Members",
    icon: Award,
    description: "Enrolled customers, their points balance, tier, and history.",
    features: [
      {
        name: "Member directory",
        description: "Every enrolled customer, their tier, points balance, lifetime spend, and last visit.",
      },
      {
        name: "Points ledger",
        description: "A full history of points earned, redeemed, adjusted, and expired for each member.",
      },
      {
        name: "Manual adjustments",
        description: "Adjusting points or tier by hand, always with a required reason.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to member points and tiers. Included in every tier.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "loyalty-segments",
    name: "Segments",
    icon: Layers,
    description: "Automatic customer groups you can act on directly.",
    features: [
      {
        name: "Segments",
        description: "Automatic grouping of customers by criteria you set, kept current on a schedule.",
      },
      {
        name: "Rule builder",
        description: "Plain-language conditions — no syntax — with a live count of matching customers.",
      },
      {
        name: "Send message",
        description: "Messaging a segment directly, so a group you can see is a group you can act on.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "loyalty-rules",
    name: "Rules & tiers",
    icon: SlidersHorizontal,
    description: "How points are earned and redeemed, and the tiers customers move through.",
    features: [
      {
        name: "Point rules",
        description: "Your own settings for how points are earned and redeemed.",
      },
      {
        name: "Tiers",
        description: "Ranked levels such as Bronze / Silver / Gold, based on lifetime spend, with their own benefits.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "loyalty-analytics",
    name: "Analytics",
    icon: BarChart3,
    description: "How the programme is performing, in plain panels.",
    features: [
      {
        name: "Analytics",
        description: "Reports on your best customers, who's slipping away, and overall programme ROI.",
      },
    ],
    tier: "ultra",
  },
  {
    id: "gift-cards",
    name: "Gift cards",
    icon: Gift,
    description: "Stored-value cards a customer can spend in store later.",
    features: [
      {
        name: "Gift cards",
        description: "Selling stored-value cards a customer can spend in store later — cash up front for the store.",
      },
      {
        name: "Audit logs",
        description: "A record of gift card issuance, top-ups, and redemptions. Included in every tier.",
      },
    ],
    tier: "light",
  },
  {
    id: "promo-codes",
    name: "Promo codes",
    icon: Tag,
    description: "Discount codes for campaigns, with control over what they apply to and for how long.",
    features: [
      {
        name: "Promo codes",
        description: "Discount codes for campaigns, with control over what they apply to and for how long.",
      },
    ],
    tier: "prime",
  },
  {
    id: "affiliates",
    name: "Affiliates",
    icon: Handshake,
    description: "Referral partners who bring in new customers, tracked by a code quoted at the till.",
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
    description: "Customer bookings for services and consultations, calendar-first.",
    features: [
      {
        name: "Calendar",
        description: "Day, week, and list views of bookings, with staff assigned to each one.",
      },
      {
        name: "Convert to quotation",
        description: "Turning an attended appointment straight into a quotation, with the customer and link carried over.",
      },
      {
        name: "Audit logs",
        description: "A record of bookings, changes, and cancellations. Included in every tier.",
      },
    ],
    tier: "light",
    addon: true,
    href: "/appointments",
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
    id: "quotations",
    name: "Quotations",
    icon: Calculator,
    description: "Parametric quotations computed from measurements — curtains, aluminium, printing, and similar trades.",
    features: [
      {
        name: "Quotations",
        description: "Customer-facing quotations built from templates or the product catalogue, trackable through to conversion.",
      },
      {
        name: "Convert to invoice",
        description: "Turning an accepted quotation into an invoice without retyping anything.",
      },
    ],
    tier: "prime",
  },
  {
    id: "templates",
    name: "Templates",
    icon: Ruler,
    description: "Reusable pricing templates — input fields and formulas that compute yardage, area, and price from measurements.",
    features: [
      {
        name: "Template fields & formulas",
        description: "The input fields (e.g. height, width) and computation formulas each template runs to produce a price.",
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
        description: "How discounts stack and apply in priority order, and the price floor that protects margin.",
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
        name: "Locations",
        description: "Every shop and warehouse the business operates, and what each one is set up to do.",
      },
      {
        name: "Inventory costing",
        description: "How the cost of stock on hand is calculated as purchases come in at different prices.",
      },
      {
        name: "Audit logs",
        description: "A record of changes to business rules and settings, and every stock movement across locations. Included in every tier.",
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

export type GroupType = "single" | "group" | "hub"

export interface GroupConfig {
  id: string
  label: string
  moduleIds: string[]
  /**
   * "single" — one module, pinned (Dashboard).
   * "group" — a collapsible sidebar group; members have their own interior
   *   depth, so each gets its own sidebar link.
   * "hub" — one sidebar item; members are flat sibling lists, so they render
   *   as tabs inside a single page instead of separate sidebar links.
   */
  type: GroupType
  /** Icon for the hub's own single sidebar entry. Only meaningful when type is "hub". */
  icon?: LucideIcon
  /** Page-header subtitle for the hub's tab page. Only meaningful when type is "hub". */
  description?: string
  /**
   * True for a hub that's referenced inside another group's moduleIds (e.g.
   * Sales/Invoice/Estimator nested inside Sell) — it still exists and routes
   * as a real hub, it just isn't rendered as its own top-level sidebar row.
   */
  nestedOnly?: boolean
}

/**
 * Proposed grouped structure. "home" and "system" are pinned (top/bottom)
 * rather than rendered as collapsible groups — see resolveNav().
 */
export const GROUPS: GroupConfig[] = [
  { id: "home", label: "Home", moduleIds: ["dashboard"], type: "single" },
  {
    id: "sales",
    label: "Sales",
    moduleIds: ["all", "returns"],
    type: "hub",
    icon: ShoppingCart,
    description: "Every sale in one place — cash, momo, credit, and deposit — plus returns.",
    nestedOnly: true,
  },
  {
    id: "invoice",
    label: "Invoice",
    moduleIds: ["invoices", "payments"],
    type: "hub",
    icon: FileText,
    description: "Invoices and the payments recorded against them, in one place.",
    nestedOnly: true,
  },
  {
    id: "estimator",
    label: "Estimator",
    moduleIds: ["quotations", "templates"],
    type: "hub",
    icon: Calculator,
    description: "Parametric quotations and the templates that compute them.",
    nestedOnly: true,
  },
  {
    id: "inventory",
    label: "Inventory",
    moduleIds: ["products", "purchase-orders"],
    type: "hub",
    icon: Package,
    description: "Products, their pack structure, and the purchase orders that restock them.",
    nestedOnly: true,
  },
  {
    id: "stock",
    label: "Store & Warehouse",
    moduleIds: ["stock-levels", "movements", "stocktakes"],
    type: "hub",
    icon: Warehouse,
    description: "Stock levels, movements, and stocktakes across every location.",
    nestedOnly: true,
  },
  {
    id: "loyalty",
    label: "Loyalty",
    moduleIds: ["loyalty-members", "loyalty-segments", "loyalty-rules", "loyalty-analytics"],
    type: "hub",
    icon: Award,
    description: "Members, segments, and the rules that drive points and tiers.",
    nestedOnly: true,
  },
  {
    id: "offers-rewards",
    label: "Offers & Rewards",
    moduleIds: ["gift-cards", "promo-codes", "affiliates"],
    type: "hub",
    icon: Gift,
    description: "Gift cards, promo codes, and affiliate partners — configuration that only matters at the register.",
    nestedOnly: true,
  },
  {
    id: "sell",
    label: "Sell",
    moduleIds: ["sales", "invoice", "deliveries", "estimator"],
    type: "group",
  },
  {
    id: "stock-group",
    label: "Stock",
    moduleIds: ["inventory", "stock"],
    type: "group",
  },
  {
    id: "people",
    label: "People",
    moduleIds: ["customers", "suppliers", "staff"],
    type: "hub",
    icon: Users,
    description: "Customers, suppliers, and staff accounts in one place.",
  },
  {
    id: "grow",
    label: "Grow",
    moduleIds: ["loyalty", "offers-rewards", "appointments", "message"],
    type: "group",
  },
  {
    id: "money",
    label: "Money",
    moduleIds: ["expenses", "reports"],
    type: "hub",
    icon: Wallet,
    description: "Expenses and cross-module reports for the business.",
  },
  {
    id: "system",
    label: "System",
    moduleIds: ["settings", "workflow", "guide"],
    type: "group",
  },
]

/** Hub tab labels, keyed by the module id used as that tab's content. */
export const HUB_TABS: Record<string, { hubId: string; tabId: string }> = Object.fromEntries(
  GROUPS.filter((g) => g.type === "hub").flatMap((g) =>
    g.moduleIds.map((moduleId) => [moduleId, { hubId: g.id, tabId: moduleId }])
  )
)

export function getHub(hubId: string): GroupConfig | undefined {
  return GROUPS.find((g) => g.id === hubId && g.type === "hub")
}

/** The path a hub's sidebar entry (and any legacy link to it) should go to — always its first tab. */
export function hubFirstTabPath(hubId: string): string {
  const hub = getHub(hubId)
  const firstTab = hub?.moduleIds[0]
  return firstTab ? `/${hubId}/${firstTab}` : `/${hubId}`
}

/**
 * Resolves an id referenced inside a group's moduleIds. Most ids are real
 * modules; a few (Sales, Invoice, Estimator) are actually hubs nested inside
 * the "Sell" group — for those, build a module-shaped link to that hub's
 * first tab instead, the same shape hubAsModule builds for a standalone
 * top-level hub.
 */
function resolveGroupMember(id: string): ModuleConfig | undefined {
  const hub = getHub(id)
  if (hub) {
    const firstTabModule = getModule(hub.moduleIds[0])
    return {
      id: hub.id,
      name: hub.label,
      icon: hub.icon ?? firstTabModule?.icon ?? Package,
      description: hub.description ?? "",
      features: [],
      tier: firstTabModule?.tier ?? "light",
      href: hubFirstTabPath(hub.id),
    }
  }
  return getModule(id)
}

/** Current sidebar: a flat, ungrouped list in this exact order. */
export const FLAT_ORDER: string[] = [
  "dashboard",
  "inventory",
  "stock",
  "sales",
  "invoice",
  "expenses",
  "users",
  "deliveries",
  "loyalty",
  "offers-rewards",
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

/**
 * The flat view still shows a single "Users" item (matching the current live
 * platform) — it now routes to the People hub instead of its own page. Not a
 * real module, so it isn't in MODULES; resolveFlat() substitutes it in.
 */
const USERS_FLAT_ENTRY: ModuleConfig = {
  id: "users",
  name: "Users",
  icon: Users,
  description: "Customers, suppliers, and staff accounts in one place.",
  features: [
    { name: "Customers", description: "A directory of everyone who buys from the store." },
    { name: "Suppliers", description: "A directory of the businesses the store buys stock from." },
    { name: "Staff", description: "A seat for every staff member, tied to what they do in the system." },
  ],
  tier: "light",
  href: hubFirstTabPath("people"),
}

/**
 * The flat view still shows a single "Sales" item — it now routes to the
 * Sales hub instead of its own page. Not a real module, so it isn't in
 * MODULES; resolveFlat() substitutes it in.
 */
const SALES_FLAT_ENTRY: ModuleConfig = {
  id: "sales",
  name: "Sales",
  icon: ShoppingCart,
  description: "Every sale in one place — cash, momo, credit, and deposit — plus returns.",
  features: [
    { name: "All sales", description: "Cash, Momo, credit, and deposit sales in one filterable table." },
    { name: "Returns", description: "Goods brought back and refunded or credited according to the return policy." },
  ],
  tier: "light",
  href: hubFirstTabPath("sales"),
}

/**
 * The flat view still shows single "Invoice" and "Estimator" items — they
 * now route to their hubs instead of their own pages. Not real modules, so
 * they aren't in MODULES; resolveFlat() substitutes them in.
 */
const INVOICE_FLAT_ENTRY: ModuleConfig = {
  id: "invoice",
  name: "Invoice",
  icon: FileText,
  description: "Invoices and the payments recorded against them, in one place.",
  features: [
    { name: "Invoices", description: "Creating and tracking invoices through draft, sent, partially paid, and paid." },
    { name: "Payments received", description: "Every payment recorded against an invoice, across every method." },
  ],
  tier: "prime",
  href: hubFirstTabPath("invoice"),
}

const ESTIMATOR_FLAT_ENTRY: ModuleConfig = {
  id: "estimator",
  name: "Estimator",
  icon: Calculator,
  description: "Parametric quotations and the templates that compute them.",
  features: [
    { name: "Quotations", description: "Customer-facing quotations built from templates or the product catalogue." },
    { name: "Templates", description: "Reusable pricing templates — input fields and formulas that compute price from measurements." },
  ],
  tier: "prime",
  href: hubFirstTabPath("estimator"),
}

/**
 * The flat view still shows single "Inventory" and "Store & Warehouse" items
 * — they now route to their hubs instead of their own pages. Not real
 * modules, so they aren't in MODULES; resolveFlat() substitutes them in.
 */
const INVENTORY_FLAT_ENTRY: ModuleConfig = {
  id: "inventory",
  name: "Inventory",
  icon: Package,
  description: "Products, their pack structure, and the purchase orders that restock them.",
  features: [
    { name: "Products", description: "The catalogue of everything the store sells, its pack structure, and stock across locations." },
    { name: "Purchase orders", description: "Orders raised to suppliers, tracked from ordering through to receiving the goods." },
  ],
  tier: "light",
  href: hubFirstTabPath("inventory"),
}

const STOCK_FLAT_ENTRY: ModuleConfig = {
  id: "stock",
  name: "Store & Warehouse",
  icon: Warehouse,
  description: "Stock levels, movements, and stocktakes across every location.",
  features: [
    { name: "Stock levels", description: "On hand, set aside, and available quantities for every product, broken down by location." },
    { name: "Movements", description: "Transfers, splits, adjustments, and returns — every stock movement in one ledger." },
    { name: "Stocktakes", description: "Cycle counts against a snapshot, with blind counting and reconciliation for what moved during the count." },
  ],
  tier: "light",
  href: hubFirstTabPath("stock"),
}

/**
 * The flat view still shows single "Loyalty" and "Offers & Rewards" items —
 * they now route to their hubs instead of their own pages. Not real modules,
 * so they aren't in MODULES; resolveFlat() substitutes them in.
 */
const LOYALTY_FLAT_ENTRY: ModuleConfig = {
  id: "loyalty",
  name: "Loyalty",
  icon: Award,
  description: "Members, segments, and the rules that drive points and tiers.",
  features: [
    { name: "Members", description: "Enrolled customers, their points balance, tier, and history." },
    { name: "Segments", description: "Automatic customer groups you can act on directly." },
    { name: "Rules & tiers", description: "How points are earned and redeemed, and the tiers customers move through." },
    { name: "Analytics", description: "How the programme is performing, in plain panels." },
  ],
  tier: "ultra",
  href: hubFirstTabPath("loyalty"),
}

const OFFERS_REWARDS_FLAT_ENTRY: ModuleConfig = {
  id: "offers-rewards",
  name: "Offers & Rewards",
  icon: Gift,
  description: "Gift cards, promo codes, and affiliate partners — configuration that only matters at the register.",
  features: [
    { name: "Gift cards", description: "Stored-value cards a customer can spend in store later." },
    { name: "Promo codes", description: "Discount codes for campaigns, with control over what they apply to and for how long." },
    { name: "Affiliates", description: "Referral partners who bring in new customers, tracked by a code quoted at the till." },
  ],
  tier: "light",
  href: hubFirstTabPath("offers-rewards"),
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

/**
 * Stocktaking and adjustments work at every tier for a single location —
 * only Ultra unlocks multiple locations and transfers between them. This is
 * content-level gating inside Store & Warehouse, not a module lock.
 */
export function isMultiLocationTier(tier: Tier): boolean {
  return tier === "ultra"
}

/**
 * A hub renders as one sidebar entry that always opens its first tab, so its
 * lock state (and badge) tracks that first tab's tier, not its other tabs.
 */
export function hubModule(group: GroupConfig): ModuleConfig | undefined {
  return getModule(group.moduleIds[0])
}

export type EstimatorLocation = "sell" | "system"
export type MessageLocation = "grow" | "bottom"

export interface NavToggles {
  estimatorLocation: EstimatorLocation
  messageLocation: MessageLocation
}

export interface ResolvedGroup {
  id: string
  label: string
  type: GroupType
  /** Only meaningful when type is "hub" — the icon for its single sidebar entry. */
  icon?: LucideIcon
  modules: ModuleConfig[]
}

export interface ResolvedNav {
  /** Pinned at the very top of the sidebar, outside any group. */
  pinned: ModuleConfig[]
  /** Scrollable collapsible groups and hubs, in config order (excludes "home" and "system"). */
  groups: ResolvedGroup[]
  /** Pinned near the bottom, above the System group (e.g. Message as a utility item). */
  bottomUtility: ModuleConfig[]
  /** Always pinned at the very bottom. */
  system: ResolvedGroup
}

/**
 * Resolves GROUPS + the two placement toggles into the exact structure the
 * grouped sidebar should render. This is the only place group membership is
 * adjusted at runtime — GROUPS itself is never mutated.
 */
export function resolveNav(toggles: NavToggles): ResolvedNav {
  const home = GROUPS.find((g) => g.id === "home")
  const system = GROUPS.find((g) => g.id === "system")
  const middleGroups = GROUPS.filter((g) => g.id !== "home" && g.id !== "system" && !g.nestedOnly)

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

  const toModules = (ids: string[]) => ids.map(resolveGroupMember).filter((m): m is ModuleConfig => Boolean(m))

  return {
    pinned: home ? toModules(home.moduleIds) : [],
    groups: middleGroups.map((g) => ({
      id: g.id,
      label: g.label,
      type: g.type,
      icon: g.icon,
      modules: toModules(idsByGroup.get(g.id) ?? g.moduleIds),
    })),
    bottomUtility: toModules(bottomUtilityIds),
    system: {
      id: system?.id ?? "system",
      label: system?.label ?? "System",
      type: system?.type ?? "group",
      modules: toModules(systemIds),
    },
  }
}

export function resolveFlat(): ModuleConfig[] {
  return FLAT_ORDER.map((id) => {
    if (id === "users") return USERS_FLAT_ENTRY
    if (id === "sales") return SALES_FLAT_ENTRY
    if (id === "invoice") return INVOICE_FLAT_ENTRY
    if (id === "estimator") return ESTIMATOR_FLAT_ENTRY
    if (id === "inventory") return INVENTORY_FLAT_ENTRY
    if (id === "stock") return STOCK_FLAT_ENTRY
    if (id === "loyalty") return LOYALTY_FLAT_ENTRY
    if (id === "offers-rewards") return OFFERS_REWARDS_FLAT_ENTRY
    return getModule(id)
  }).filter((m): m is ModuleConfig => Boolean(m))
}

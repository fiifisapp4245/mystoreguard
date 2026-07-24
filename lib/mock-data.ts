/**
 * Mock data for the People hub. Plain typed arrays, no backend — "Add"
 * actions append to React state seeded from these lists, and are lost on
 * refresh. That's expected for a prototype and isn't called out in the UI.
 */

export function formatGHS(amount: number): string {
  return `GHS ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Headline-number formatter for KPI cards. Small stores see their exact
 * figure; once a number crosses into millions/billions, exact digits stop
 * helping and an abbreviation reads faster at a glance.
 */
export function formatGHSCompact(amount: number): string {
  const abs = Math.abs(amount)

  if (abs >= 1_000_000_000) {
    return `GHS ${trimTrailingZero((amount / 1_000_000_000).toFixed(1))}B`
  }
  if (abs >= 1_000_000) {
    return `GHS ${trimTrailingZero((amount / 1_000_000).toFixed(1))}M`
  }
  return formatGHS(amount)
}

function trimTrailingZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Ghana phone shape: 0 followed by 9 more digits, spaces allowed while typing. */
export function isValidGhanaPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.replace(/\s/g, ""))
}

export type LoyaltyTier = "Bronze" | "Silver" | "Gold"
export type CustomerStatus = "Active" | "Inactive"

export interface Customer {
  id: string
  name: string
  phone: string
  area: string
  totalSpend: number
  lastPurchase: string
  loyaltyTier: LoyaltyTier
  loyaltyPoints: number
  storeCredit: number
  /** Money this customer currently owes the store from past credit sales — the reverse of storeCredit. */
  creditBalance: number
  status: CustomerStatus
  /** "Send me offers and updates" — unchecked by default (undefined/false). Only gates promotional sends; transactional messages (receipt, delivery status) are unaffected. */
  marketingConsent?: boolean
}

export const AREAS = ["Makola", "Osu", "Tema", "Madina", "Kaneshie", "Achimota", "Other"]

export const CUSTOMERS: Customer[] = [
  {
    id: "cus-1",
    name: "Kwame Mensah",
    phone: "024 123 4567",
    area: "Makola",
    totalSpend: 4820,
    lastPurchase: "21 Jul 2026",
    loyaltyTier: "Gold",
    loyaltyPoints: 2840,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-2",
    name: "Ama Serwaa",
    phone: "020 987 6543",
    area: "Osu",
    totalSpend: 2150,
    lastPurchase: "21 Jul 2026",
    loyaltyTier: "Silver",
    loyaltyPoints: 1120,
    storeCredit: 0,
    creditBalance: 450,
    status: "Active",
  },
  {
    id: "cus-3",
    name: "Kofi Boateng",
    phone: "055 456 7890",
    area: "Tema",
    totalSpend: 6340,
    lastPurchase: "20 Jul 2026",
    loyaltyTier: "Gold",
    loyaltyPoints: 3960,
    storeCredit: 45,
    creditBalance: 320,
    status: "Active",
  },
  {
    id: "cus-4",
    name: "Efua Owusu",
    phone: "027 234 5678",
    area: "Madina",
    totalSpend: 980,
    lastPurchase: "20 Jul 2026",
    loyaltyTier: "Bronze",
    loyaltyPoints: 340,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-5",
    name: "Yaw Asante",
    phone: "050 345 6789",
    area: "Kaneshie",
    totalSpend: 1760,
    lastPurchase: "19 Jul 2026",
    loyaltyTier: "Silver",
    loyaltyPoints: 980,
    storeCredit: 20,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-6",
    name: "Nana Yeboah",
    phone: "024 555 1212",
    area: "Achimota",
    totalSpend: 310,
    lastPurchase: "2 Jun 2026",
    loyaltyTier: "Bronze",
    loyaltyPoints: 120,
    storeCredit: 0,
    creditBalance: 0,
    status: "Inactive",
  },
  {
    id: "cus-7",
    name: "Abena Osei",
    phone: "020 666 2323",
    area: "Makola",
    totalSpend: 3420,
    lastPurchase: "18 Jul 2026",
    loyaltyTier: "Gold",
    loyaltyPoints: 2100,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-8",
    name: "Kojo Antwi",
    phone: "055 777 3434",
    area: "Osu",
    totalSpend: 640,
    lastPurchase: "17 Jul 2026",
    loyaltyTier: "Bronze",
    loyaltyPoints: 210,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-9",
    name: "Akosua Frimpong",
    phone: "027 888 4545",
    area: "Tema",
    totalSpend: 1980,
    lastPurchase: "16 Jul 2026",
    loyaltyTier: "Silver",
    loyaltyPoints: 890,
    storeCredit: 15,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "cus-10",
    name: "Yaa Mansa",
    phone: "050 999 5656",
    area: "Madina",
    totalSpend: 210,
    lastPurchase: "28 May 2026",
    loyaltyTier: "Bronze",
    loyaltyPoints: 60,
    storeCredit: 0,
    creditBalance: 0,
    status: "Inactive",
  },
]

export interface Supplier {
  id: string
  businessName: string
  contactPerson: string
  phone: string
  categories: string[]
  paymentTerms: string
  lastOrder: string
  openPurchaseOrders: number
}

export const SUPPLIER_CATEGORIES = [
  "Beverages",
  "Dairy",
  "Toiletries",
  "Packaging",
  "Fresh produce",
  "Cooking oil",
  "Grains",
  "Cooking essentials",
  "Noodles",
  "Canned fish",
  "Batteries",
]

export const PAYMENT_TERMS = ["Cash on delivery", "14 days", "30 days"]

export const SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    businessName: "Kasapreko Distributors",
    contactPerson: "Mr. Owusu",
    phone: "030 222 1111",
    categories: ["Beverages"],
    paymentTerms: "30 days",
    lastOrder: "20 Jul 2026",
    openPurchaseOrders: 2,
  },
  {
    id: "sup-2",
    businessName: "Nestlé Ghana Depot",
    contactPerson: "Mr. Tetteh",
    phone: "030 444 3333",
    categories: ["Dairy", "Beverages", "Packaging"],
    paymentTerms: "30 days",
    lastOrder: "18 Jul 2026",
    openPurchaseOrders: 1,
  },
  {
    id: "sup-3",
    businessName: "Fan Milk Agent — Accra",
    contactPerson: "Ms. Adjei",
    phone: "030 555 4444",
    categories: ["Dairy"],
    paymentTerms: "Cash on delivery",
    lastOrder: "21 Jul 2026",
    openPurchaseOrders: 0,
  },
  {
    id: "sup-4",
    businessName: "Unilever Wholesale",
    contactPerson: "Ms. Addo",
    phone: "030 333 2222",
    categories: ["Toiletries"],
    paymentTerms: "14 days",
    lastOrder: "15 Jul 2026",
    openPurchaseOrders: 3,
  },
  {
    id: "sup-5",
    businessName: "Blue Skies Fresh",
    contactPerson: "Mr. Amponsah",
    phone: "030 666 5555",
    categories: ["Fresh produce"],
    paymentTerms: "Cash on delivery",
    lastOrder: "19 Jul 2026",
    openPurchaseOrders: 0,
  },
  {
    id: "sup-6",
    businessName: "Accra Plastics & Packaging",
    contactPerson: "Mr. Darko",
    phone: "030 777 6666",
    categories: ["Packaging"],
    paymentTerms: "14 days",
    lastOrder: "10 Jul 2026",
    openPurchaseOrders: 1,
  },
  {
    id: "sup-7",
    businessName: "Golden Star Wholesale",
    contactPerson: "Mr. Asare",
    phone: "030 888 7777",
    categories: ["Cooking oil", "Grains", "Cooking essentials", "Noodles", "Canned fish", "Batteries"],
    paymentTerms: "30 days",
    lastOrder: "17 Jul 2026",
    openPurchaseOrders: 2,
  },
]

export type LocationType = "shop" | "warehouse"
export type LocationStatus = "active" | "inactive"

export interface Location {
  id: string
  name: string
  type: LocationType
  address: string
  area?: string
  /** Whether the register/register-like flows can sell from this location. */
  canSell: boolean
  /** Where goods land by default when a purchase order is received. */
  isDefaultReceiving: boolean
  status: LocationStatus
}

export const LOCATIONS: Location[] = [
  {
    id: "loc-makola",
    name: "Makola Shop",
    type: "shop",
    address: "Makola, Accra",
    area: "Makola",
    canSell: true,
    isDefaultReceiving: true,
    status: "active",
  },
  {
    id: "loc-warehouse-abossey",
    name: "Warehouse — Abossey Okai",
    type: "warehouse",
    address: "Abossey Okai, Accra",
    area: "Abossey Okai",
    canSell: false,
    isDefaultReceiving: false,
    status: "active",
  },
]

export const DEFAULT_SHOP_LOCATION_ID = "loc-makola"

/** Light/Prime tiers see a single (shop) location; Ultra unlocks every location and transfers between them. */
export function getVisibleLocations(locations: Location[], isMultiLocation: boolean): Location[] {
  if (isMultiLocation) return locations
  return locations.filter((location) => location.type === "shop")
}

export type StaffRole = "Owner" | "Manager" | "Cashier" | "Stockkeeper"
export type StaffStatus = "Active" | "Invited"

export interface StaffMember {
  id: string
  name: string
  phone: string
  role: StaffRole
  status: StaffStatus
  lastActive: string
}

export const STAFF_ROLES: StaffRole[] = ["Owner", "Manager", "Cashier", "Stockkeeper"]

export const ROLE_PERMISSIONS: Record<StaffRole, string> = {
  Owner: "Full access to everything, including billing and staff management.",
  Manager: "Everything except billing and staff management.",
  Cashier: "Can record sales and look up customers. Cannot see reports, change prices, or manage staff.",
  Stockkeeper: "Can manage inventory and stock transfers. Cannot record sales, see reports, or manage staff.",
}

export const STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Kesewaa Adjei",
    phone: "024 666 7777",
    role: "Owner",
    status: "Active",
    lastActive: "Today, 8:00 AM",
  },
  {
    id: "staff-2",
    name: "Kwabena Owusu",
    phone: "020 222 3333",
    role: "Manager",
    status: "Active",
    lastActive: "Today, 9:00 AM",
  },
  {
    id: "staff-3",
    name: "Adjoa Boateng",
    phone: "024 111 2222",
    role: "Cashier",
    status: "Active",
    lastActive: "Today, 1:12 PM",
  },
  {
    id: "staff-4",
    name: "Abena Darko",
    phone: "055 333 4444",
    role: "Cashier",
    status: "Active",
    lastActive: "Yesterday",
  },
  {
    id: "staff-5",
    name: "Yaw Boadi",
    phone: "027 444 5555",
    role: "Stockkeeper",
    status: "Active",
    lastActive: "3 days ago",
  },
  {
    id: "staff-6",
    name: "Efua Mensima",
    phone: "050 555 6666",
    role: "Stockkeeper",
    status: "Invited",
    lastActive: "—",
  },
]

/**
 * Dashboard mock data. Keyed by period so the period selector swaps
 * real-feeling numbers rather than recomputing anything. Kept internally
 * consistent: revenue − expenses ≈ gross profit, payment-type amounts sum to
 * revenue, and chart buckets sum to their period's revenue/expenses totals.
 */
export type DashboardPeriod = "today" | "week" | "month"

export interface DashboardKpi {
  value: number
  deltaPercent: number
  direction: "up" | "down"
}

export interface DashboardChartPoint {
  period: string
  income: number
  expenses: number
}

export interface TopProduct {
  name: string
  units: number
  revenue: number
}

export interface PaymentTypeAmount {
  type: string
  amount: number
}

export interface DashboardPeriodData {
  label: string
  revenue: DashboardKpi
  grossProfit: DashboardKpi
  expenses: DashboardKpi
  chart: DashboardChartPoint[]
  topProducts: TopProduct[]
  paymentBreakdown: PaymentTypeAmount[]
}

export const DASHBOARD_DATA: Record<DashboardPeriod, DashboardPeriodData> = {
  today: {
    label: "Today",
    revenue: { value: 3240, deltaPercent: 8, direction: "up" },
    grossProfit: { value: 2600, deltaPercent: 9, direction: "up" },
    expenses: { value: 640, deltaPercent: 5, direction: "up" },
    chart: [
      { period: "8am", income: 180, expenses: 40 },
      { period: "9am", income: 220, expenses: 0 },
      { period: "10am", income: 310, expenses: 120 },
      { period: "11am", income: 380, expenses: 0 },
      { period: "12pm", income: 420, expenses: 200 },
      { period: "1pm", income: 390, expenses: 0 },
      { period: "2pm", income: 340, expenses: 80 },
      { period: "3pm", income: 310, expenses: 0 },
      { period: "4pm", income: 280, expenses: 150 },
      { period: "5pm", income: 250, expenses: 0 },
      { period: "6pm", income: 160, expenses: 50 },
    ],
    topProducts: [
      { name: "Ideal Milk 380g", units: 43, revenue: 623.5 },
      { name: "Voltic Water 750ml", units: 96, revenue: 480 },
      { name: "Milo 400g tin", units: 9, revenue: 378 },
      { name: "Indomie Chicken Noodles", units: 57, revenue: 342 },
      { name: "Key Soap", units: 32, revenue: 272 },
    ],
    paymentBreakdown: [
      { type: "Cash", amount: 1450 },
      { type: "Momo", amount: 980 },
      { type: "Credit", amount: 560 },
      { type: "Deposit", amount: 250 },
    ],
  },
  week: {
    label: "This week",
    revenue: { value: 21850, deltaPercent: 6, direction: "up" },
    grossProfit: { value: 16670, deltaPercent: 7, direction: "up" },
    expenses: { value: 5180, deltaPercent: 4, direction: "up" },
    chart: [
      { period: "Mon", income: 2800, expenses: 620 },
      { period: "Tue", income: 2650, expenses: 580 },
      { period: "Wed", income: 3100, expenses: 700 },
      { period: "Thu", income: 3400, expenses: 750 },
      { period: "Fri", income: 3850, expenses: 850 },
      { period: "Sat", income: 4200, expenses: 900 },
      { period: "Sun", income: 1850, expenses: 780 },
    ],
    topProducts: [
      { name: "Ideal Milk 380g", units: 300, revenue: 4350 },
      { name: "Voltic Water 750ml", units: 640, revenue: 3200 },
      { name: "Milo 400g tin", units: 68, revenue: 2856 },
      { name: "Indomie Chicken Noodles", units: 390, revenue: 2340 },
      { name: "Key Soap", units: 218, revenue: 1853 },
    ],
    paymentBreakdown: [
      { type: "Cash", amount: 9800 },
      { type: "Momo", amount: 6600 },
      { type: "Credit", amount: 3850 },
      { type: "Deposit", amount: 1600 },
    ],
  },
  month: {
    label: "This month",
    revenue: { value: 96400, deltaPercent: 9, direction: "up" },
    grossProfit: { value: 72300, deltaPercent: 10, direction: "up" },
    expenses: { value: 24100, deltaPercent: 6, direction: "up" },
    chart: [
      { period: "Week 1", income: 21500, expenses: 5400 },
      { period: "Week 2", income: 23800, expenses: 5900 },
      { period: "Week 3", income: 25200, expenses: 6300 },
      { period: "Week 4", income: 25900, expenses: 6500 },
    ],
    topProducts: [
      { name: "Ideal Milk 380g", units: 1324, revenue: 19198 },
      { name: "Voltic Water 750ml", units: 2820, revenue: 14100 },
      { name: "Milo 400g tin", units: 299, revenue: 12558 },
      { name: "Indomie Chicken Noodles", units: 1725, revenue: 10350 },
      { name: "Key Soap", units: 965, revenue: 8202.5 },
    ],
    paymentBreakdown: [
      { type: "Cash", amount: 43200 },
      { type: "Momo", amount: 29100 },
      { type: "Credit", amount: 16960 },
      { type: "Deposit", amount: 7140 },
    ],
  },
}

/** A balance as of now, not scoped to any period — never changes with the period selector. */
export const OUTSTANDING_CREDIT = {
  amount: 6840,
  customerCount: 14,
}

export interface DashboardSale {
  customer: string
  amount: string
  type: string
  date: string
  status: string
}

export const DASHBOARD_RECENT_SALES: DashboardSale[] = [
  { customer: "Kwame Mensah", amount: "GHS 320.00", type: "Cash", date: "22 Jul, 11:40 am", status: "Completed" },
  { customer: "Ama Serwaa", amount: "GHS 450.00", type: "Credit", date: "22 Jul, 11:05 am", status: "Pending" },
  { customer: "Kofi Boateng", amount: "GHS 180.00", type: "Momo", date: "22 Jul, 10:22 am", status: "Completed" },
  { customer: "Efua Owusu", amount: "GHS 96.00", type: "Cash", date: "22 Jul, 9:47 am", status: "Completed" },
  { customer: "Yaw Asante", amount: "GHS 240.00", type: "Deposit", date: "22 Jul, 8:58 am", status: "Completed" },
]

/**
 * "Needs attention" rows. Not period-scoped. `moduleId` drives tier-lock
 * checks — a row is hidden entirely (not greyed) if its module is locked at
 * the current viewing tier.
 */
export interface AttentionItem {
  id: string
  moduleId: string
  href: string
  line: string
  amount: string
}

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "low-stock",
    moduleId: "products",
    href: "/inventory/products",
    line: "Products low on stock",
    amount: "9",
  },
  {
    id: "credit-overdue",
    moduleId: "all",
    href: "/sales/all",
    line: "Credit sales overdue past 30 days",
    amount: "GHS 4,280 · 5 customers",
  },
  {
    id: "invoices-unpaid",
    moduleId: "invoices",
    href: "/invoice/invoices",
    line: "Invoices unpaid",
    amount: "3 · GHS 12,400",
  },
  {
    id: "transfers-pending",
    moduleId: "movements",
    href: "/stock/movements",
    line: "Stock transfers awaiting approval",
    amount: "1",
  },
  {
    id: "appointments-today",
    moduleId: "appointments",
    href: "/appointments",
    line: "Appointments today",
    amount: "0",
  },
  {
    id: "staff-invite",
    moduleId: "staff",
    href: "/people/staff",
    line: "Staff invitation pending",
    amount: "1",
  },
]

/** Shown instead of ATTENTION_ITEMS when the demo's store state is "new". */
export interface GettingStartedItem {
  id: string
  href: string
  line: string
}

export const NEW_STORE_ATTENTION_ITEMS: GettingStartedItem[] = [
  { id: "add-products", href: "/inventory/products", line: "Add your first products" },
  { id: "add-supplier", href: "/people/suppliers", line: "Add a supplier" },
  { id: "first-sale", href: "/register", line: "Record your first sale" },
]

/** Full "This month" ranking behind the Dashboard's top-5 — the Reports page's "View all" destination. */
export const TOP_PRODUCTS_MONTH: TopProduct[] = [
  { name: "Ideal Milk 380g", units: 1324, revenue: 19198 },
  { name: "Voltic Water 750ml", units: 2820, revenue: 14100 },
  { name: "Milo 400g tin", units: 299, revenue: 12558 },
  { name: "Indomie Chicken Noodles", units: 1725, revenue: 10350 },
  { name: "Key Soap", units: 965, revenue: 8202.5 },
  { name: "Perfumed Rice 5kg", units: 98, revenue: 7644 },
  { name: "Frytol Cooking Oil 3L", units: 74, revenue: 6808 },
  { name: "Royal Aroma Rice 5kg", units: 68, revenue: 5576 },
  { name: "Sunlight Dishwashing Liquid", units: 470, revenue: 5170 },
  { name: "Nido 400g", units: 96, revenue: 4608 },
  { name: "Lipton Tea 25s", units: 238, revenue: 4284 },
  { name: "Omo 900g", units: 128, revenue: 4096 },
  { name: "Titus Sardines", units: 251, revenue: 3765 },
  { name: "Peak Milk 400g", units: 210, revenue: 3360 },
  { name: "Geisha Sardines", units: 256, revenue: 3072 },
  { name: "Malta Guinness", units: 288, revenue: 2736 },
  { name: "Close Up Toothpaste", units: 190, revenue: 2565 },
  { name: "Coca-Cola 500ml", units: 340, revenue: 2380 },
  { name: "Gino Tomato Mix", units: 310, revenue: 2015 },
  { name: "Tasty Tom Tomato Paste", units: 410, revenue: 1845 },
]

/**
 * Mock data for the People hub. Plain typed arrays, no backend — "Add"
 * actions append to React state seeded from these lists, and are lost on
 * refresh. That's expected for a prototype and isn't called out in the UI.
 */

export function formatGHS(amount: number): string {
  return `GHS ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  status: CustomerStatus
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

export const SUPPLIER_CATEGORIES = ["Beverages", "Dairy", "Toiletries", "Packaging", "Fresh produce"]

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
]

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

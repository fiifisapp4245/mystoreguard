/**
 * Persona dataset for "Larry's Curtains & Décor" — the second store persona
 * (see hooks/use-demo-state.ts). The persona toggle swaps the *whole*
 * dataset, not just the sidebar name: locations, suppliers, products
 * (several sold by measure, not by carton), and sales.
 */

import type { Location, Supplier } from "@/lib/mock-data"
import type { PackStructure, Product } from "@/lib/pos-data"

export { LARRY_AREAS, LARRY_CUSTOMERS } from "@/lib/estimator-data"

export const LARRY_LOCATIONS: Location[] = [
  {
    id: "loc-larry-showroom",
    name: "Showroom — East Legon",
    type: "shop",
    address: "East Legon, Accra",
    canSell: true,
    isDefaultReceiving: true,
  },
  {
    id: "loc-larry-workshop",
    name: "Workshop — Adenta",
    type: "warehouse",
    address: "Adenta, Accra",
    canSell: false,
    isDefaultReceiving: false,
  },
]

export const LARRY_DEFAULT_SHOP_LOCATION_ID = "loc-larry-showroom"
const SHOWROOM = LARRY_DEFAULT_SHOP_LOCATION_ID
const WORKSHOP = "loc-larry-workshop"

export const LARRY_SUPPLIERS: Supplier[] = [
  {
    id: "larry-sup-1",
    businessName: "Accra Fabric House",
    contactPerson: "Mrs. Ampofo",
    phone: "030 211 4400",
    categories: ["Fabric"],
    paymentTerms: "30 days",
    lastOrder: "16 Jul 2026",
    openPurchaseOrders: 1,
  },
  {
    id: "larry-sup-2",
    businessName: "Tema Textiles Ltd",
    contactPerson: "Mr. Quaye",
    phone: "030 322 5500",
    categories: ["Fabric"],
    paymentTerms: "14 days",
    lastOrder: "9 Jul 2026",
    openPurchaseOrders: 0,
  },
  {
    id: "larry-sup-3",
    businessName: "Adabraka Hardware Supply",
    contactPerson: "Mr. Nortey",
    phone: "030 433 6600",
    categories: ["Hardware", "Accessories"],
    paymentTerms: "Cash on delivery",
    lastOrder: "20 Jul 2026",
    openPurchaseOrders: 1,
  },
]

function measure(baseUnit: string): PackStructure {
  return { soldByMeasure: true, baseUnit }
}

function packed(baseUnit: string, purchaseUnit: string, unitsPerPurchaseUnit: number): PackStructure {
  return { soldByMeasure: false, baseUnit, purchaseUnit, unitsPerPurchaseUnit }
}

function ls(showroom: number, workshop: number): Product["locationStock"] {
  const out: Product["locationStock"] = [{ locationId: SHOWROOM, onHand: showroom, setAside: 0, sealedPurchaseUnits: 0 }]
  if (workshop > 0) out.push({ locationId: WORKSHOP, onHand: workshop, setAside: 0, sealedPurchaseUnits: 0 })
  return out
}

export const LARRY_PRODUCTS: Product[] = [
  { id: "larry-p-1", name: "Blackout Fabric — Cream", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 45, sellingPrice: 65, reorderPoint: 25, preferredSupplierId: "larry-sup-1", taxTreatment: "standard", locationStock: ls(45, 30) },
  { id: "larry-p-2", name: "Blackout Fabric — Grey", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 45, sellingPrice: 65, reorderPoint: 25, preferredSupplierId: "larry-sup-1", taxTreatment: "standard", locationStock: ls(38, 25) },
  { id: "larry-p-3", name: "Blackout Fabric — Navy", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 47, sellingPrice: 68, reorderPoint: 30, preferredSupplierId: "larry-sup-1", taxTreatment: "standard", locationStock: ls(20, 15) },
  { id: "larry-p-4", name: "Sheer Voile", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 24, sellingPrice: 38, reorderPoint: 20, preferredSupplierId: "larry-sup-1", taxTreatment: "standard", locationStock: ls(60, 20) },
  { id: "larry-p-5", name: "Velvet Drape", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 85, sellingPrice: 120, reorderPoint: 20, preferredSupplierId: "larry-sup-2", taxTreatment: "standard", locationStock: ls(15, 10) },
  { id: "larry-p-6", name: "Linen Blend", category: "Fabric", isService: false, isActive: true, pack: measure("Yard"), costPrice: 52, sellingPrice: 75, reorderPoint: 20, preferredSupplierId: "larry-sup-2", taxTreatment: "standard", locationStock: ls(35, 20) },
  { id: "larry-p-7", name: "Curtain Pole 1.5m", category: "Hardware", isService: false, isActive: true, pack: packed("Piece", "Box", 10), costPrice: 58, sellingPrice: 85, reorderPoint: 15, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(40, 20) },
  { id: "larry-p-8", name: "Curtain Pole 2.4m", category: "Hardware", isService: false, isActive: true, pack: packed("Piece", "Box", 10), costPrice: 78, sellingPrice: 110, reorderPoint: 15, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(25, 15) },
  { id: "larry-p-9", name: "Pole Bracket", category: "Hardware", isService: false, isActive: true, pack: packed("Piece", "Box", 50), costPrice: 10, sellingPrice: 18, reorderPoint: 40, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(120, 80) },
  { id: "larry-p-10", name: "Finial Set", category: "Hardware", isService: false, isActive: true, pack: packed("Piece", "Box", 20), costPrice: 22, sellingPrice: 35, reorderPoint: 15, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(30, 10) },
  { id: "larry-p-11", name: "Curtain Rings (pack of 20)", category: "Accessories", isService: false, isActive: true, pack: packed("Pack", "Box", 10), costPrice: 15, sellingPrice: 25, reorderPoint: 15, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(50, 30) },
  { id: "larry-p-12", name: "Tie-back Set", category: "Hardware", isService: false, isActive: true, pack: packed("Piece", "Box", 20), costPrice: 28, sellingPrice: 45, reorderPoint: 25, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(25, 10) },
  { id: "larry-p-13", name: "Curtain Hooks (pack of 100)", category: "Accessories", isService: false, isActive: true, pack: packed("Pack", "Box", 10), costPrice: 12, sellingPrice: 20, reorderPoint: 20, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(60, 40) },
  { id: "larry-p-14", name: "Lead Weight Tape (per metre)", category: "Accessories", isService: false, isActive: true, pack: measure("Metre"), costPrice: 4.5, sellingPrice: 8, reorderPoint: 30, preferredSupplierId: "larry-sup-3", taxTreatment: "standard", locationStock: ls(80, 40) },
]

let larryProductsStore: Product[] = LARRY_PRODUCTS.map((p) => ({ ...p, locationStock: p.locationStock.map((l) => ({ ...l })) }))

export function getLarryProductsStore(): Product[] {
  return larryProductsStore
}

export function setLarryProductsStore(next: Product[]): void {
  larryProductsStore = next
}

export interface LarrySaleLineItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface LarrySaleRecord {
  id: string
  receiptNo: string
  customer: string
  amount: number
  type: "Cash" | "Momo" | "Credit" | "Deposit"
  date: string
  dateISO: string
  cashier: string
  status: "Completed" | "Pending"
  lineItems: LarrySaleLineItem[]
  momoReference?: string
}

export const LARRY_SALES_RECORDS: LarrySaleRecord[] = [
  {
    id: "larry-sale-1",
    receiptNo: "LRC-3041",
    customer: "Larry Ntori",
    amount: 910,
    type: "Cash",
    date: "22 Jul, 10:15 am",
    dateISO: "2026-07-22",
    cashier: "Larry Ntori",
    status: "Completed",
    lineItems: [
      { name: "Blackout Fabric — Cream", quantity: 12, unitPrice: 65 },
      { name: "Curtain Rings (pack of 20)", quantity: 5, unitPrice: 25 },
    ],
  },
  {
    id: "larry-sale-2",
    receiptNo: "LRC-3040",
    customer: "Efe Adjetey",
    amount: 476,
    type: "Momo",
    date: "21 Jul, 3:40 pm",
    dateISO: "2026-07-21",
    cashier: "Larry Ntori",
    status: "Completed",
    lineItems: [{ name: "Sheer Voile", quantity: 8, unitPrice: 38 }, { name: "Tie-back Set", quantity: 4, unitPrice: 45 }],
    momoReference: "7723140",
  },
  {
    id: "larry-sale-3",
    receiptNo: "LRC-3039",
    customer: "Kwesi Yankah",
    amount: 1240,
    type: "Deposit",
    date: "20 Jul, 1:05 pm",
    dateISO: "2026-07-20",
    cashier: "Larry Ntori",
    status: "Completed",
    lineItems: [{ name: "Velvet Drape", quantity: 10, unitPrice: 120 }, { name: "Curtain Pole 2.4m", quantity: 2, unitPrice: 110 }],
  },
  {
    id: "larry-sale-4",
    receiptNo: "LRC-3038",
    customer: "Naa Adjeley",
    amount: 340,
    type: "Credit",
    date: "18 Jul, 11:20 am",
    dateISO: "2026-07-18",
    cashier: "Larry Ntori",
    status: "Pending",
    lineItems: [{ name: "Linen Blend", quantity: 4, unitPrice: 75 }, { name: "Finial Set", quantity: 1, unitPrice: 35 }],
  },
]

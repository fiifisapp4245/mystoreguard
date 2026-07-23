/**
 * Mock data for the Estimator hub — a parametric pricing engine, not a
 * lightweight invoice tool. Templates define input fields and computations
 * (e.g. "Enter Height", "Enter Width" -> yardage -> price) so a salesperson
 * measures something and the system computes the line price.
 *
 * Formulas are stored as plain strings for display in the template builder
 * (no formula validator/evaluator UI, per spec) — but the three built-in
 * templates' actual computations below are real arithmetic, not hardcoded
 * lookup results, so the quotation-creation screen can compute live as the
 * user types.
 */

import type { Customer } from "@/lib/mock-data"
import { TODAY_ISO } from "@/lib/period-utils"

export type FieldType = "number" | "text" | "select"

export interface TemplateField {
  key: string
  label: string
  type: FieldType
  unit?: string
}

export interface TemplateComputation {
  /** Human-readable formula, e.g. "width * ifelse(height > 100, 3.6, 3) / 36". Display-only. */
  formula: string
  outputUnit: string
}

export interface TemplateLineItem {
  name: string
  /** Variable key other line items' formulas can reference, e.g. "curtains_yards". */
  variableKey: string
  unit: string
  defaultDiscountPercent: number
  fields: TemplateField[]
  computation: TemplateComputation
  /** GHS charged per computed unit — only meaningful for the line item that produces the price. */
  ratePerUnit?: number
}

export interface Template {
  id: string
  name: string
  domain: string
  status: "Active" | "Inactive"
  validityDays: number
  markupPercent: number
  discountPercent: number
  minimumCharge: number
  currency: "GHS"
  createdDate: string
  lineItems: TemplateLineItem[]
}

export const TEMPLATES: Template[] = [
  {
    id: "tpl-curtains",
    name: "Curtains & Décor",
    domain: "Décor",
    status: "Active",
    validityDays: 30,
    markupPercent: 20,
    discountPercent: 5,
    minimumCharge: 150,
    currency: "GHS",
    createdDate: "2026-04-10",
    lineItems: [
      {
        name: "Curtains Total Yards",
        variableKey: "curtains_yards",
        unit: "Yards",
        defaultDiscountPercent: 0,
        fields: [
          { key: "height", label: "Enter Height", type: "number", unit: "inch" },
          { key: "width", label: "Enter Width", type: "number", unit: "inch" },
        ],
        computation: { formula: "width * ifelse(height > 100, 3.6, 3) / 36", outputUnit: "Yards" },
      },
      {
        name: "Curtains Yard Cost",
        variableKey: "curtains_yard_cost",
        unit: "GHS",
        defaultDiscountPercent: 5,
        fields: [],
        computation: { formula: "curtains_yards * 45", outputUnit: "GHS" },
        ratePerUnit: 45,
      },
    ],
  },
  {
    id: "tpl-aluminium",
    name: "Aluminium Windows",
    domain: "Aluminium",
    status: "Active",
    validityDays: 21,
    markupPercent: 25,
    discountPercent: 0,
    minimumCharge: 300,
    currency: "GHS",
    createdDate: "2026-05-02",
    lineItems: [
      {
        name: "Window Area",
        variableKey: "window_area",
        unit: "m²",
        defaultDiscountPercent: 0,
        fields: [
          { key: "width", label: "Enter Width", type: "number", unit: "mm" },
          { key: "height", label: "Enter Height", type: "number", unit: "mm" },
        ],
        computation: { formula: "(width * height) / 1000000", outputUnit: "m²" },
      },
      {
        name: "Aluminium Frame Cost",
        variableKey: "aluminium_cost",
        unit: "GHS",
        defaultDiscountPercent: 0,
        fields: [],
        computation: { formula: "window_area * 850", outputUnit: "GHS" },
        ratePerUnit: 850,
      },
    ],
  },
  {
    id: "tpl-printing",
    name: "Large Format Printing",
    domain: "Printing",
    status: "Active",
    validityDays: 14,
    markupPercent: 30,
    discountPercent: 0,
    minimumCharge: 80,
    currency: "GHS",
    createdDate: "2026-05-20",
    lineItems: [
      {
        name: "Print Area",
        variableKey: "print_area",
        unit: "ft²",
        defaultDiscountPercent: 0,
        fields: [
          { key: "width", label: "Enter Width", type: "number", unit: "ft" },
          { key: "height", label: "Enter Height", type: "number", unit: "ft" },
        ],
        computation: { formula: "width * height", outputUnit: "ft²" },
      },
      {
        name: "Printing Cost",
        variableKey: "printing_cost",
        unit: "GHS",
        defaultDiscountPercent: 0,
        fields: [],
        computation: { formula: "max(print_area * 18, 80)", outputUnit: "GHS" },
        ratePerUnit: 18,
      },
    ],
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id)
}

/** Real arithmetic mirroring each template's formula string — not a lookup table — so quotation creation computes live. */
export function computeCurtainsYards(height: number, width: number): number {
  const factor = height > 100 ? 3.6 : 3
  return (width * factor) / 36
}

export function computeAluminiumAreaM2(widthMm: number, heightMm: number): number {
  return (widthMm * heightMm) / 1_000_000
}

export function computePrintingAreaFt2(widthFt: number, heightFt: number): number {
  return widthFt * heightFt
}

export function applyTemplatePricing(
  baseCost: number,
  template: Pick<Template, "markupPercent" | "discountPercent" | "minimumCharge">
): { subtotal: number; discount: number; total: number } {
  const subtotal = Math.round(baseCost * (1 + template.markupPercent / 100) * 100) / 100
  const discountAmount = Math.round(subtotal * (template.discountPercent / 100) * 100) / 100
  const preMinimum = Math.round((subtotal - discountAmount) * 100) / 100
  const total = Math.max(preMinimum, template.minimumCharge)
  const discount = Math.round((subtotal - total) * 100) / 100
  return { subtotal, discount, total }
}

export interface ComputedLineItem {
  name: string
  quantity: number
  unitPrice: number
  computedDetail?: string
}

/**
 * Live computation for the 3 built-in templates — real arithmetic, run as
 * the user types measurements, matching each template's formula exactly.
 * A template created via the builder (any id outside these three) has no
 * live evaluator wired up in this prototype — its formula is stored and
 * displayed, not executed.
 */
export function computeTemplateLineItems(
  template: Template,
  fieldValues: Record<string, number>
): ComputedLineItem[] {
  if (template.id === "tpl-curtains") {
    const height = fieldValues.height ?? 0
    const width = fieldValues.width ?? 0
    const yards = Math.round(computeCurtainsYards(height, width) * 100) / 100
    const rate = template.lineItems.find((li) => li.variableKey === "curtains_yard_cost")?.ratePerUnit ?? 0
    const cost = Math.round(yards * rate * 100) / 100
    return [
      {
        name: "Curtains Total Yards",
        quantity: yards,
        unitPrice: 0,
        computedDetail: `${yards.toFixed(1)} yards from ${height}in × ${width}in`,
      },
      { name: "Curtains Yard Cost", quantity: 1, unitPrice: cost },
    ]
  }

  if (template.id === "tpl-aluminium") {
    const width = fieldValues.width ?? 0
    const height = fieldValues.height ?? 0
    const area = Math.round(computeAluminiumAreaM2(width, height) * 100) / 100
    const rate = template.lineItems.find((li) => li.variableKey === "aluminium_cost")?.ratePerUnit ?? 0
    const cost = Math.round(area * rate * 100) / 100
    return [
      {
        name: "Window Area",
        quantity: area,
        unitPrice: 0,
        computedDetail: `${area.toFixed(2)} m² from ${width}mm × ${height}mm`,
      },
      { name: "Aluminium Frame Cost", quantity: 1, unitPrice: cost },
    ]
  }

  if (template.id === "tpl-printing") {
    const width = fieldValues.width ?? 0
    const height = fieldValues.height ?? 0
    const area = Math.round(computePrintingAreaFt2(width, height) * 100) / 100
    const rate = template.lineItems.find((li) => li.variableKey === "printing_cost")?.ratePerUnit ?? 0
    const cost = Math.round(Math.max(area * rate, template.minimumCharge) * 100) / 100
    return [
      {
        name: "Print Area",
        quantity: area,
        unitPrice: 0,
        computedDetail: `${area.toFixed(1)} ft² from ${width}ft × ${height}ft`,
      },
      { name: "Printing Cost", quantity: 1, unitPrice: cost },
    ]
  }

  return []
}

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted"

export interface QuotationLineItem {
  name: string
  quantity: number
  unitPrice: number
  /** Shown for template-computed lines, e.g. "14.0 yards from 110in × 140in". */
  computedDetail?: string
}

export interface Quotation {
  id: string
  customer: string
  templateId?: string
  lineItems: QuotationLineItem[]
  subtotal: number
  discount: number
  total: number
  validUntil: string
  createdDate: string
  status: QuotationStatus
  note?: string
  convertedToInvoiceId?: string
}

export const QUOTATIONS: Quotation[] = [
  {
    id: "QUO-20260701-001",
    customer: "Larry Ntori",
    templateId: "tpl-curtains",
    lineItems: [
      { name: "Curtains Total Yards", quantity: 14, unitPrice: 0, computedDetail: "14.0 yards from 110in × 140in" },
      { name: "Curtains Yard Cost", quantity: 1, unitPrice: 756 },
    ],
    subtotal: 756,
    discount: 37.8,
    total: 718.2,
    validUntil: "2026-07-31",
    createdDate: "2026-07-01",
    status: "Accepted",
  },
  {
    id: "QUO-20260703-002",
    customer: "Kwesi Yankah",
    templateId: "tpl-printing",
    lineItems: [
      { name: "Print Area", quantity: 18, unitPrice: 0, computedDetail: "18.0 ft² from 6ft × 3ft" },
      { name: "Printing Cost", quantity: 1, unitPrice: 421.2 },
    ],
    subtotal: 421.2,
    discount: 0,
    total: 421.2,
    validUntil: "2026-08-02",
    createdDate: "2026-07-03",
    status: "Draft",
  },
  {
    id: "QUO-20260705-003",
    customer: "Efe Adjetey",
    templateId: "tpl-aluminium",
    lineItems: [
      { name: "Window Area", quantity: 1.8, unitPrice: 0, computedDetail: "1.8 m² from 1500mm × 1200mm" },
      { name: "Aluminium Frame Cost", quantity: 1, unitPrice: 1912.5 },
    ],
    subtotal: 1912.5,
    discount: 0,
    total: 1912.5,
    validUntil: "2026-07-26",
    createdDate: "2026-07-05",
    status: "Sent",
  },
  {
    id: "QUO-20260628-004",
    customer: "Naa Adjeley",
    templateId: "tpl-printing",
    lineItems: [
      { name: "Print Area", quantity: 32, unitPrice: 0, computedDetail: "32.0 ft² from 8ft × 4ft" },
      { name: "Printing Cost", quantity: 1, unitPrice: 748.8 },
    ],
    subtotal: 748.8,
    discount: 0,
    total: 748.8,
    validUntil: "2026-07-12",
    createdDate: "2026-06-28",
    status: "Rejected",
  },
  {
    id: "QUO-20260615-005",
    customer: "Abena Konadu",
    templateId: "tpl-curtains",
    lineItems: [
      { name: "Curtains Total Yards", quantity: 5, unitPrice: 0, computedDetail: "5.0 yards from 90in × 60in" },
      { name: "Curtains Yard Cost", quantity: 1, unitPrice: 270 },
    ],
    subtotal: 270,
    discount: 13.5,
    total: 256.5,
    validUntil: "2026-06-29",
    createdDate: "2026-06-15",
    status: "Expired",
  },
  {
    id: "QUO-20260618-006",
    customer: "Nii Armah",
    templateId: "tpl-aluminium",
    lineItems: [
      { name: "Window Area", quantity: 3, unitPrice: 0, computedDetail: "3.0 m² from 2000mm × 1500mm" },
      { name: "Aluminium Frame Cost", quantity: 1, unitPrice: 3187.5 },
    ],
    subtotal: 3187.5,
    discount: 0,
    total: 3187.5,
    validUntil: "2026-07-18",
    createdDate: "2026-06-18",
    status: "Converted",
    convertedToInvoiceId: "INV-2044",
  },
]

const QUOTATION_PREFIX = "QUO-"

/** QUO-YYYYMMDD-NNN, sequence resets to 001 per day. */
export function nextQuotationNumber(dateISO: string = TODAY_ISO): string {
  const datePart = dateISO.replace(/-/g, "")
  const todaysCount = quotationsStore.filter((q) => q.id.startsWith(`${QUOTATION_PREFIX}${datePart}`)).length
  const sequence = String(todaysCount + 1).padStart(3, "0")
  return `${QUOTATION_PREFIX}${datePart}-${sequence}`
}

/** Estimator/Templates tabs are separate routes that fully unmount on tab switch — same session-persisted store pattern as Invoice. */
let quotationsStore: Quotation[] = QUOTATIONS.map((q) => ({ ...q }))
let templatesStore: Template[] = TEMPLATES.map((t) => ({ ...t }))

export function getQuotationsStore(): Quotation[] {
  return quotationsStore
}

export function setQuotationsStore(next: Quotation[]): void {
  quotationsStore = next
}

export function getTemplatesStore(): Template[] {
  return templatesStore
}

export function setTemplatesStore(next: Template[]): void {
  templatesStore = next
}

/** Line items + customer to seed a new invoice from an accepted quotation — carries everything across, nothing retyped. */
export function buildInvoiceLineItemsFromQuotation(quotation: Quotation): { name: string; quantity: number; unitPrice: number }[] {
  return quotation.lineItems
    .filter((item) => item.unitPrice > 0)
    .map((item) => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }))
}

export const LARRY_AREAS = ["East Legon", "Airport Residential", "Cantonments", "Spintex", "Other"]

export const LARRY_CUSTOMERS: Customer[] = [
  {
    id: "larry-cus-1",
    name: "Larry Ntori",
    phone: "024 887 1200",
    area: "East Legon",
    totalSpend: 4200,
    lastPurchase: "1 Jul 2026",
    loyaltyTier: "Gold",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "larry-cus-2",
    name: "Efe Adjetey",
    phone: "020 445 8890",
    area: "Airport Residential",
    totalSpend: 1912.5,
    lastPurchase: "5 Jul 2026",
    loyaltyTier: "Silver",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "larry-cus-3",
    name: "Naa Adjeley",
    phone: "055 223 4471",
    area: "Cantonments",
    totalSpend: 0,
    lastPurchase: "Not yet",
    loyaltyTier: "Bronze",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "larry-cus-4",
    name: "Kwesi Yankah",
    phone: "027 991 3345",
    area: "Spintex",
    totalSpend: 0,
    lastPurchase: "Not yet",
    loyaltyTier: "Bronze",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "larry-cus-5",
    name: "Abena Konadu",
    phone: "024 667 2210",
    area: "East Legon",
    totalSpend: 256.5,
    lastPurchase: "15 Jun 2026",
    loyaltyTier: "Bronze",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
  {
    id: "larry-cus-6",
    name: "Nii Armah",
    phone: "020 334 7789",
    area: "East Legon",
    totalSpend: 3187.5,
    lastPurchase: "18 Jun 2026",
    loyaltyTier: "Gold",
    loyaltyPoints: 0,
    storeCredit: 0,
    creditBalance: 0,
    status: "Active",
  },
]

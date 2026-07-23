/**
 * Mock data for the Estimator hub — a parametric pricing engine, not a
 * lightweight invoice tool. Templates define input fields and a rule-block
 * computation (measure -> compute yardage/area -> price) so a salesperson
 * measures something and the system computes the line price.
 *
 * Computations are plain-language rule blocks (Set a value / Set by
 * condition / Calculate), stored as structured JSON — never a typed
 * formula string. A small hardcoded interpreter below evaluates the three
 * block types with basic arithmetic; this is deliberately not a general
 * formula parser (per spec).
 */

import type { Customer } from "@/lib/mock-data"
import { TODAY_ISO } from "@/lib/period-utils"

// ---------------------------------------------------------------------------
// Rule blocks
// ---------------------------------------------------------------------------

export type RuleOperator = "+" | "-" | "×" | "÷"
export type ConditionOperator =
  | "greater than"
  | "less than"
  | "greater than or equal to"
  | "less than or equal to"
  | "equal to"

export const RULE_OPERATORS: RuleOperator[] = ["+", "-", "×", "÷"]
export const CONDITION_OPERATORS: ConditionOperator[] = [
  "greater than",
  "less than",
  "greater than or equal to",
  "less than or equal to",
  "equal to",
]

export interface UnitConversionPreset {
  id: string
  label: string
  factor: number
  operator: RuleOperator
}

/** "Convert [inches] → [yards]" style presets — the factor is applied silently, no typed numbers. */
export const UNIT_CONVERSION_PRESETS: UnitConversionPreset[] = [
  { id: "in-to-yd", label: "inches → yards", factor: 36, operator: "÷" },
  { id: "yd-to-in", label: "yards → inches", factor: 36, operator: "×" },
  { id: "in-to-ft", label: "inches → feet", factor: 12, operator: "÷" },
  { id: "ft-to-in", label: "feet → inches", factor: 12, operator: "×" },
  { id: "mm-to-m", label: "mm → m", factor: 1000, operator: "÷" },
  { id: "m-to-mm", label: "m → mm", factor: 1000, operator: "×" },
  { id: "ft-to-m", label: "feet → metres", factor: 3.28084, operator: "÷" },
  { id: "m-to-ft", label: "metres → feet", factor: 3.28084, operator: "×" },
  { id: "sqft", label: "sq ft (area, no conversion)", factor: 1, operator: "×" },
  { id: "sqm", label: "sq m (area, no conversion)", factor: 1, operator: "×" },
]

export function getUnitConversionPreset(id: string): UnitConversionPreset | undefined {
  return UNIT_CONVERSION_PRESETS.find((p) => p.id === id)
}

export type Operand =
  | { kind: "variable"; key: string; label: string }
  | { kind: "number"; value: number }
  | { kind: "unitConversion"; presetId: string }

export interface SetValueBlock {
  type: "set"
  id: string
  targetKey: string
  targetLabel: string
  value: Operand
}

export interface ConditionTier {
  compareVariableKey: string
  compareVariableLabel: string
  operator: ConditionOperator
  compareValue: Operand
  thenValue: Operand
}

export interface SetByConditionBlock {
  type: "condition"
  id: string
  targetKey: string
  targetLabel: string
  tiers: ConditionTier[]
  elseValue: Operand
}

export interface CalculateTerm {
  operand: Operand
  /** Combines with the running result so far. Absent on the first term. */
  operator?: RuleOperator
}

export interface CalculateBlock {
  type: "calculate"
  id: string
  targetKey: string
  targetLabel: string
  targetUnit: string
  terms: CalculateTerm[]
}

export type RuleBlock = SetValueBlock | SetByConditionBlock | CalculateBlock

export interface RuleIntermediate {
  label: string
  value: number
  unit?: string
}

function resolveOperand(operand: Operand, vars: Record<string, number>): number {
  if (operand.kind === "number") return operand.value
  if (operand.kind === "variable") return vars[operand.key] ?? 0
  return getUnitConversionPreset(operand.presetId)?.factor ?? 1
}

function applyOperator(a: number, op: RuleOperator, b: number): number {
  if (op === "+") return a + b
  if (op === "-") return a - b
  if (op === "×") return a * b
  return b === 0 ? 0 : a / b
}

function compareValues(a: number, op: ConditionOperator, b: number): boolean {
  if (op === "greater than") return a > b
  if (op === "less than") return a < b
  if (op === "greater than or equal to") return a >= b
  if (op === "less than or equal to") return a <= b
  return a === b
}

/** Runs an ordered list of rule blocks against a variable environment — the "hardcoded interpreter" for the 3 block types. */
export function evaluateRuleBlocks(
  blocks: RuleBlock[],
  initialVars: Record<string, number>
): { vars: Record<string, number>; intermediates: RuleIntermediate[] } {
  const vars = { ...initialVars }
  const intermediates: RuleIntermediate[] = []

  for (const block of blocks) {
    if (block.type === "set") {
      const value = resolveOperand(block.value, vars)
      vars[block.targetKey] = value
      intermediates.push({ label: block.targetLabel, value })
    } else if (block.type === "condition") {
      let result: number | undefined
      for (const tier of block.tiers) {
        const left = vars[tier.compareVariableKey] ?? 0
        const right = resolveOperand(tier.compareValue, vars)
        if (compareValues(left, tier.operator, right)) {
          result = resolveOperand(tier.thenValue, vars)
          break
        }
      }
      if (result === undefined) result = resolveOperand(block.elseValue, vars)
      vars[block.targetKey] = result
      intermediates.push({ label: block.targetLabel, value: result })
    } else {
      let result = 0
      block.terms.forEach((term, index) => {
        const value = resolveOperand(term.operand, vars)
        result = index === 0 ? value : applyOperator(result, term.operator ?? "+", value)
      })
      vars[block.targetKey] = result
      intermediates.push({ label: block.targetLabel, value: result, unit: block.targetUnit })
    }
  }

  return { vars, intermediates }
}

function operandToReadable(operand: Operand): string {
  if (operand.kind === "number") return String(operand.value)
  if (operand.kind === "variable") return operand.label
  return getUnitConversionPreset(operand.presetId)?.label ?? "?"
}

/** Plain-language description of one block, e.g. "Total yards = Width × Fullness ÷ inches → yards". */
export function describeBlock(block: RuleBlock): string {
  if (block.type === "set") return `Set ${block.targetLabel} to ${operandToReadable(block.value)}`
  if (block.type === "condition") {
    const tierParts = block.tiers.map(
      (tier, index) =>
        `${index === 0 ? "If" : "else if"} ${tier.compareVariableLabel} is ${tier.operator} ${operandToReadable(tier.compareValue)}, set ${block.targetLabel} to ${operandToReadable(tier.thenValue)}`
    )
    return `${tierParts.join("; ")}, otherwise ${operandToReadable(block.elseValue)}`
  }
  const expr = block.terms
    .map((term, index) => (index === 0 ? operandToReadable(term.operand) : `${term.operator} ${operandToReadable(term.operand)}`))
    .join(" ")
  return `${block.targetLabel} = ${expr}`
}

function operandToFormula(operand: Operand): string {
  if (operand.kind === "number") return String(operand.value)
  if (operand.kind === "variable") return operand.key
  return String(getUnitConversionPreset(operand.presetId)?.factor ?? 1)
}

const CONDITION_SYMBOL: Record<ConditionOperator, string> = {
  "greater than": ">",
  "less than": "<",
  "greater than or equal to": ">=",
  "less than or equal to": "<=",
  "equal to": "==",
}

const RULE_SYMBOL: Record<RuleOperator, string> = { "+": "+", "-": "-", "×": "*", "÷": "/" }

function describeBlockFormula(block: RuleBlock): string {
  if (block.type === "set") return `${block.targetKey} = ${operandToFormula(block.value)}`
  if (block.type === "condition") {
    let expr = operandToFormula(block.elseValue)
    for (let i = block.tiers.length - 1; i >= 0; i--) {
      const tier = block.tiers[i]
      expr = `${tier.compareVariableKey} ${CONDITION_SYMBOL[tier.operator]} ${operandToFormula(tier.compareValue)} ? ${operandToFormula(tier.thenValue)} : ${expr}`
    }
    return `${block.targetKey} = ${expr}`
  }
  const expr = block.terms
    .map((term, index) => (index === 0 ? operandToFormula(term.operand) : `${RULE_SYMBOL[term.operator ?? "+"]} ${operandToFormula(term.operand)}`))
    .join(" ")
  return `${block.targetKey} = ${expr}`
}

/** The read-only "Advanced formula" equivalent expression for a line item's blocks. */
export function describeBlocksFormula(blocks: RuleBlock[]): string {
  return blocks.map(describeBlockFormula).join(";  ")
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export type FieldType = "number" | "text" | "select"

export interface TemplateField {
  key: string
  label: string
  type: FieldType
  unit?: string
  required: boolean
}

export interface TemplateComputation {
  blocks: RuleBlock[]
  outputUnit: string
}

export interface TemplateLineItem {
  name: string
  /** Variable key other line items' blocks can reference, e.g. "curtains_yards". */
  variableKey: string
  unit: string
  defaultDiscountPercent: number
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
  /** Measured inputs shared across every line item's calculation. */
  fields: TemplateField[]
  lineItems: TemplateLineItem[]
}

function conditionBlock(
  id: string,
  targetKey: string,
  targetLabel: string,
  compareVariableKey: string,
  compareVariableLabel: string,
  operator: ConditionOperator,
  compareValue: number,
  thenValue: number,
  elseValue: number
): SetByConditionBlock {
  return {
    type: "condition",
    id,
    targetKey,
    targetLabel,
    tiers: [
      {
        compareVariableKey,
        compareVariableLabel,
        operator,
        compareValue: { kind: "number", value: compareValue },
        thenValue: { kind: "number", value: thenValue },
      },
    ],
    elseValue: { kind: "number", value: elseValue },
  }
}

function variableOperand(key: string, label: string): Operand {
  return { kind: "variable", key, label }
}

function numberOperand(value: number): Operand {
  return { kind: "number", value }
}

function presetOperand(presetId: string): Operand {
  return { kind: "unitConversion", presetId }
}

const CURTAINS_FIELDS: TemplateField[] = [
  { key: "height", label: "Enter Height", type: "number", unit: "inch", required: true },
  { key: "width", label: "Enter Width", type: "number", unit: "inch", required: true },
]

const CURTAINS_LINE_ITEMS: TemplateLineItem[] = [
  {
    name: "Curtains Total Yards",
    variableKey: "curtains_yards",
    unit: "Yards",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "Yards",
      blocks: [
        conditionBlock("b1", "fullness", "Fullness", "height", "Height", "greater than", 100, 3.6, 3),
        {
          type: "calculate",
          id: "b2",
          targetKey: "curtains_yards",
          targetLabel: "Total yards",
          targetUnit: "Yards",
          terms: [
            { operand: variableOperand("width", "Width") },
            { operator: "×", operand: variableOperand("fullness", "Fullness") },
            { operator: "÷", operand: presetOperand("in-to-yd") },
          ],
        },
      ],
    },
  },
  {
    name: "Curtains Yard Cost",
    variableKey: "curtains_yard_cost",
    unit: "GHS",
    defaultDiscountPercent: 5,
    computation: {
      outputUnit: "GHS",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "curtains_yard_cost",
          targetLabel: "Yard cost",
          targetUnit: "GHS",
          terms: [{ operand: variableOperand("curtains_yards", "Total yards") }, { operator: "×", operand: numberOperand(45) }],
        },
      ],
    },
    ratePerUnit: 45,
  },
]

const ALUMINIUM_FIELDS: TemplateField[] = [
  { key: "width", label: "Enter Width", type: "number", unit: "mm", required: true },
  { key: "height", label: "Enter Height", type: "number", unit: "mm", required: true },
]

const ALUMINIUM_LINE_ITEMS: TemplateLineItem[] = [
  {
    name: "Window Area",
    variableKey: "window_area",
    unit: "m²",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "m²",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "width_m",
          targetLabel: "Width (m)",
          targetUnit: "m",
          terms: [{ operand: variableOperand("width", "Width") }, { operator: "÷", operand: presetOperand("mm-to-m") }],
        },
        {
          type: "calculate",
          id: "b2",
          targetKey: "height_m",
          targetLabel: "Height (m)",
          targetUnit: "m",
          terms: [{ operand: variableOperand("height", "Height") }, { operator: "÷", operand: presetOperand("mm-to-m") }],
        },
        {
          type: "calculate",
          id: "b3",
          targetKey: "window_area",
          targetLabel: "Window area",
          targetUnit: "m²",
          terms: [{ operand: variableOperand("width_m", "Width (m)") }, { operator: "×", operand: variableOperand("height_m", "Height (m)") }],
        },
      ],
    },
  },
  {
    name: "Aluminium Frame Cost",
    variableKey: "aluminium_cost",
    unit: "GHS",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "GHS",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "aluminium_cost",
          targetLabel: "Frame cost",
          targetUnit: "GHS",
          terms: [{ operand: variableOperand("window_area", "Window area") }, { operator: "×", operand: numberOperand(850) }],
        },
      ],
    },
    ratePerUnit: 850,
  },
]

const PRINTING_FIELDS: TemplateField[] = [
  { key: "width", label: "Enter Width", type: "number", unit: "ft", required: true },
  { key: "height", label: "Enter Height", type: "number", unit: "ft", required: true },
]

const PRINTING_LINE_ITEMS: TemplateLineItem[] = [
  {
    name: "Print Area",
    variableKey: "print_area",
    unit: "ft²",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "ft²",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "print_area",
          targetLabel: "Print area",
          targetUnit: "ft²",
          terms: [{ operand: variableOperand("width", "Width") }, { operator: "×", operand: variableOperand("height", "Height") }],
        },
      ],
    },
  },
  {
    name: "Printing Cost",
    variableKey: "printing_cost",
    unit: "GHS",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "GHS",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "printing_cost",
          targetLabel: "Printing cost",
          targetUnit: "GHS",
          terms: [{ operand: variableOperand("print_area", "Print area") }, { operator: "×", operand: numberOperand(18) }],
        },
      ],
    },
    ratePerUnit: 18,
  },
]

const UPHOLSTERY_FIELDS: TemplateField[] = [
  { key: "width", label: "Enter Width", type: "number", unit: "inch", required: true },
  { key: "height", label: "Enter Height", type: "number", unit: "inch", required: true },
]

const UPHOLSTERY_LINE_ITEMS: TemplateLineItem[] = [
  {
    name: "Fabric Yards",
    variableKey: "fabric_yards",
    unit: "Yards",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "Yards",
      blocks: [
        conditionBlock("b1", "fabric_factor", "Fabric factor", "width", "Width", "greater than", 80, 4, 3),
        {
          type: "calculate",
          id: "b2",
          targetKey: "fabric_yards",
          targetLabel: "Fabric yards",
          targetUnit: "Yards",
          terms: [
            { operand: variableOperand("height", "Height") },
            { operator: "×", operand: variableOperand("fabric_factor", "Fabric factor") },
            { operator: "÷", operand: presetOperand("in-to-yd") },
          ],
        },
      ],
    },
  },
  {
    name: "Upholstery Cost",
    variableKey: "upholstery_cost",
    unit: "GHS",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "GHS",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "upholstery_cost",
          targetLabel: "Upholstery cost",
          targetUnit: "GHS",
          terms: [{ operand: variableOperand("fabric_yards", "Fabric yards") }, { operator: "×", operand: numberOperand(60) }],
        },
      ],
    },
    ratePerUnit: 60,
  },
]

const FLOORING_FIELDS: TemplateField[] = [
  { key: "length", label: "Enter Length", type: "number", unit: "m", required: true },
  { key: "width", label: "Enter Width", type: "number", unit: "m", required: true },
]

const FLOORING_LINE_ITEMS: TemplateLineItem[] = [
  {
    name: "Floor Area",
    variableKey: "floor_area",
    unit: "m²",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "m²",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "floor_area",
          targetLabel: "Floor area",
          targetUnit: "m²",
          terms: [{ operand: variableOperand("length", "Length") }, { operator: "×", operand: variableOperand("width", "Width") }],
        },
      ],
    },
  },
  {
    name: "Tiling Cost",
    variableKey: "tiling_cost",
    unit: "GHS",
    defaultDiscountPercent: 0,
    computation: {
      outputUnit: "GHS",
      blocks: [
        {
          type: "calculate",
          id: "b1",
          targetKey: "tiling_cost",
          targetLabel: "Tiling cost",
          targetUnit: "GHS",
          terms: [{ operand: variableOperand("floor_area", "Floor area") }, { operator: "×", operand: numberOperand(120) }],
        },
      ],
    },
    ratePerUnit: 120,
  },
]

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
    fields: CURTAINS_FIELDS,
    lineItems: CURTAINS_LINE_ITEMS,
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
    fields: ALUMINIUM_FIELDS,
    lineItems: ALUMINIUM_LINE_ITEMS,
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
    fields: PRINTING_FIELDS,
    lineItems: PRINTING_LINE_ITEMS,
  },
]

/** Starter templates offered from "Start from a library template" — duplicated and adjusted, not built from scratch. */
export const LIBRARY_TEMPLATES: Template[] = [
  { ...TEMPLATES[0], id: "lib-curtains" },
  { ...TEMPLATES[1], id: "lib-aluminium" },
  { ...TEMPLATES[2], id: "lib-printing" },
  {
    id: "lib-upholstery",
    name: "Upholstery",
    domain: "Upholstery",
    status: "Active",
    validityDays: 21,
    markupPercent: 25,
    discountPercent: 0,
    minimumCharge: 200,
    currency: "GHS",
    createdDate: "2026-05-25",
    fields: UPHOLSTERY_FIELDS,
    lineItems: UPHOLSTERY_LINE_ITEMS,
  },
  {
    id: "lib-flooring",
    name: "Tiling / Flooring",
    domain: "Flooring",
    status: "Active",
    validityDays: 30,
    markupPercent: 20,
    discountPercent: 0,
    minimumCharge: 250,
    currency: "GHS",
    createdDate: "2026-05-28",
    fields: FLOORING_FIELDS,
    lineItems: FLOORING_LINE_ITEMS,
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id)
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
 * Runs every line item's rule blocks in order against a shared variable
 * environment (so later line items — e.g. a cost line — can reference an
 * earlier line item's output, like curtains_yard_cost referencing
 * curtains_yards). Works for ANY template, built-in or custom, since the
 * computation is now structured data rather than an opaque formula string.
 */
export function computeTemplate(
  template: Template,
  fieldValues: Record<string, number>
): { lineItems: ComputedLineItem[]; intermediates: RuleIntermediate[] } {
  let vars: Record<string, number> = { ...fieldValues }
  const lineItems: ComputedLineItem[] = []
  const intermediates: RuleIntermediate[] = []

  for (const lineItem of template.lineItems) {
    const evaluated = evaluateRuleBlocks(lineItem.computation.blocks, vars)
    vars = evaluated.vars
    intermediates.push(...evaluated.intermediates)

    const lastBlock = lineItem.computation.blocks[lineItem.computation.blocks.length - 1]
    const rawValue = lastBlock ? (vars[lastBlock.targetKey] ?? 0) : 0
    const rounded = Math.round(rawValue * 100) / 100
    const isCostLine = lineItem.unit === template.currency

    lineItems.push({
      name: lineItem.name,
      quantity: isCostLine ? 1 : rounded,
      unitPrice: isCostLine ? rounded : 0,
      computedDetail: isCostLine
        ? undefined
        : evaluated.intermediates.map((i) => `${i.label} = ${i.value.toFixed(1)}${i.unit ? ` ${i.unit}` : ""}`).join(" · "),
    })
  }

  return { lineItems, intermediates }
}

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted"

export interface QuotationLineItem {
  name: string
  quantity: number
  unitPrice: number
  /** Shown for template-computed lines, e.g. "Fullness = 3.6 · Total yards = 20.0 Yards". */
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
  /** Deposit taken while Accepted, ahead of conversion to invoice. */
  depositAmount?: number
  /** Set when this quotation was created from an Attended appointment's "Create quotation" action. */
  fromAppointmentId?: string
}

export const QUOTATIONS: Quotation[] = [
  {
    id: "QUO-20260701-001",
    customer: "Larry Ntori",
    templateId: "tpl-curtains",
    lineItems: [
      { name: "Curtains Total Yards", quantity: 14, unitPrice: 0, computedDetail: "Fullness = 3.6 · Total yards = 14.0 Yards" },
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
      { name: "Print Area", quantity: 18, unitPrice: 0, computedDetail: "Print area = 18.0 ft²" },
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
      { name: "Window Area", quantity: 1.8, unitPrice: 0, computedDetail: "Width (m) = 1.5 m · Height (m) = 1.2 m · Window area = 1.8 m²" },
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
      { name: "Print Area", quantity: 32, unitPrice: 0, computedDetail: "Print area = 32.0 ft²" },
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
      { name: "Curtains Total Yards", quantity: 5, unitPrice: 0, computedDetail: "Fullness = 3.0 · Total yards = 5.0 Yards" },
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
      { name: "Window Area", quantity: 3, unitPrice: 0, computedDetail: "Width (m) = 2.0 m · Height (m) = 1.5 m · Window area = 3.0 m²" },
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

export function recordDeposit(quotationId: string, amount: number): void {
  quotationsStore = quotationsStore.map((q) => (q.id === quotationId ? { ...q, depositAmount: amount } : q))
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

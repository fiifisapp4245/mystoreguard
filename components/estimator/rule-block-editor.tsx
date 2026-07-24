"use client"

import { Plus, X } from "lucide-react"

import { AdvancedFormulaToggle } from "@/components/estimator/advanced-formula-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONDITION_OPERATORS,
  RULE_OPERATORS,
  UNIT_CONVERSION_PRESETS,
  describeBlocksFormula,
  type CalculateBlock,
  type ConditionOperator,
  type Operand,
  type RuleBlock,
  type RuleOperator,
  type SetByConditionBlock,
  type SetValueBlock,
} from "@/lib/estimator-data"

export interface AvailableVariable {
  key: string
  label: string
}

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "value"
}

function OperandPicker({
  operand,
  onChange,
  availableVariables,
}: {
  operand: Operand
  onChange: (operand: Operand) => void
  availableVariables: AvailableVariable[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={operand.kind}
        onValueChange={(kind) => {
          if (kind === "variable") {
            const first = availableVariables[0]
            onChange({ kind: "variable", key: first?.key ?? "", label: first?.label ?? "" })
          } else if (kind === "number") {
            onChange({ kind: "number", value: 0 })
          } else {
            onChange({ kind: "unitConversion", presetId: UNIT_CONVERSION_PRESETS[0].id })
          }
        }}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="variable">Variable</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="unitConversion">Convert</SelectItem>
        </SelectContent>
      </Select>

      {operand.kind === "variable" && (
        <Select
          value={operand.key}
          onValueChange={(key) => {
            const variable = availableVariables.find((v) => v.key === key)
            onChange({ kind: "variable", key, label: variable?.label ?? key })
          }}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {availableVariables.map((variable) => (
              <SelectItem key={variable.key} value={variable.key}>
                {variable.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {operand.kind === "number" && (
        <Input
          type="number"
          value={operand.value}
          onChange={(event) => onChange({ kind: "number", value: Number.parseFloat(event.target.value) || 0 })}
          className="h-8 w-20 text-xs"
        />
      )}

      {operand.kind === "unitConversion" && (
        <Select value={operand.presetId} onValueChange={(presetId) => onChange({ kind: "unitConversion", presetId })}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_CONVERSION_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                Convert {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function OperatorSelect({ value, onChange }: { value: RuleOperator; onChange: (op: RuleOperator) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RuleOperator)}>
      <SelectTrigger className="h-8 w-16 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RULE_OPERATORS.map((op) => (
          <SelectItem key={op} value={op}>
            {op}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ConditionOperatorSelect({ value, onChange }: { value: ConditionOperator; onChange: (op: ConditionOperator) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ConditionOperator)}>
      <SelectTrigger className="h-8 w-[190px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CONDITION_OPERATORS.map((op) => (
          <SelectItem key={op} value={op}>
            {op}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function BlockShell({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove block">
          <X className="size-3.5" />
        </Button>
      </div>
      {children}
    </div>
  )
}

function SetValueBlockEditor({
  block,
  onChange,
  onRemove,
  availableVariables,
}: {
  block: SetValueBlock
  onChange: (block: SetValueBlock) => void
  onRemove: () => void
  availableVariables: AvailableVariable[]
}) {
  return (
    <BlockShell label="Set a value" onRemove={onRemove}>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Set</span>
        <Input
          value={block.targetLabel}
          onChange={(event) =>
            onChange({ ...block, targetLabel: event.target.value, targetKey: slugify(event.target.value) })
          }
          placeholder="Variable name" aria-label="Variable name"
          className="h-8 w-32 text-xs"
        />
        <span className="text-muted-foreground">to</span>
        <OperandPicker
          operand={block.value}
          onChange={(value) => onChange({ ...block, value })}
          availableVariables={availableVariables}
        />
      </div>
    </BlockShell>
  )
}

function SetByConditionBlockEditor({
  block,
  onChange,
  onRemove,
  availableVariables,
}: {
  block: SetByConditionBlock
  onChange: (block: SetByConditionBlock) => void
  onRemove: () => void
  availableVariables: AvailableVariable[]
}) {
  function updateTier(index: number, patch: Partial<SetByConditionBlock["tiers"][number]>) {
    onChange({ ...block, tiers: block.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) })
  }

  function addTier() {
    const first = availableVariables[0]
    onChange({
      ...block,
      tiers: [
        ...block.tiers,
        {
          compareVariableKey: first?.key ?? "",
          compareVariableLabel: first?.label ?? "",
          operator: "greater than",
          compareValue: { kind: "number", value: 0 },
          thenValue: { kind: "number", value: 0 },
        },
      ],
    })
  }

  function removeTier(index: number) {
    onChange({ ...block, tiers: block.tiers.filter((_, i) => i !== index) })
  }

  return (
    <BlockShell label="Set by condition" onRemove={onRemove}>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Result variable</span>
        <Input
          value={block.targetLabel}
          onChange={(event) =>
            onChange({ ...block, targetLabel: event.target.value, targetKey: slugify(event.target.value) })
          }
          placeholder="Variable name" aria-label="Variable name"
          className="h-8 w-32 text-xs"
        />
      </div>

      {block.tiers.map((tier, index) => (
        <div key={index} className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{index === 0 ? "If" : "else if"}</span>
          <Select
            value={tier.compareVariableKey}
            onValueChange={(key) => {
              const variable = availableVariables.find((v) => v.key === key)
              updateTier(index, { compareVariableKey: key, compareVariableLabel: variable?.label ?? key })
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {availableVariables.map((variable) => (
                <SelectItem key={variable.key} value={variable.key}>
                  {variable.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">is</span>
          <ConditionOperatorSelect value={tier.operator} onChange={(operator) => updateTier(index, { operator })} />
          <OperandPicker
            operand={tier.compareValue}
            onChange={(compareValue) => updateTier(index, { compareValue })}
            availableVariables={availableVariables}
          />
          <span className="text-muted-foreground">, set to</span>
          <OperandPicker
            operand={tier.thenValue}
            onChange={(thenValue) => updateTier(index, { thenValue })}
            availableVariables={availableVariables}
          />
          {block.tiers.length > 1 && (
            <Button variant="ghost" size="icon-sm" onClick={() => removeTier(index)} aria-label="Remove condition">
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ))}

      <button type="button" onClick={addTier} className="flex w-fit items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="size-3" />
        Add another condition
      </button>

      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Otherwise, set to</span>
        <OperandPicker
          operand={block.elseValue}
          onChange={(elseValue) => onChange({ ...block, elseValue })}
          availableVariables={availableVariables}
        />
      </div>
    </BlockShell>
  )
}

function CalculateBlockEditor({
  block,
  onChange,
  onRemove,
  availableVariables,
}: {
  block: CalculateBlock
  onChange: (block: CalculateBlock) => void
  onRemove: () => void
  availableVariables: AvailableVariable[]
}) {
  function updateTerm(index: number, patch: Partial<CalculateBlock["terms"][number]>) {
    onChange({ ...block, terms: block.terms.map((term, i) => (i === index ? { ...term, ...patch } : term)) })
  }

  function addTerm() {
    onChange({ ...block, terms: [...block.terms, { operator: "×", operand: { kind: "number", value: 0 } }] })
  }

  function removeTerm(index: number) {
    onChange({ ...block, terms: block.terms.filter((_, i) => i !== index) })
  }

  return (
    <BlockShell label="Calculate" onRemove={onRemove}>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <Input
          value={block.targetLabel}
          onChange={(event) =>
            onChange({ ...block, targetLabel: event.target.value, targetKey: slugify(event.target.value) })
          }
          placeholder="Result name" aria-label="Result name"
          className="h-8 w-32 text-xs"
        />
        <span className="text-muted-foreground">=</span>
        {block.terms.map((term, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && <OperatorSelect value={term.operator ?? "+"} onChange={(operator) => updateTerm(index, { operator })} />}
            <OperandPicker
              operand={term.operand}
              onChange={(operand) => updateTerm(index, { operand })}
              availableVariables={availableVariables}
            />
            {block.terms.length > 1 && (
              <Button variant="ghost" size="icon-sm" onClick={() => removeTerm(index)} aria-label="Remove term">
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="icon-sm" onClick={addTerm} aria-label="Add term">
          <Plus className="size-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Output unit</span>
        <Input
          value={block.targetUnit}
          onChange={(event) => onChange({ ...block, targetUnit: event.target.value })}
          placeholder="e.g. Yards" aria-label="e.g. Yards"
          className="h-8 w-28 text-xs"
        />
      </div>
    </BlockShell>
  )
}

let blockIdCounter = 0
function nextBlockId(): string {
  blockIdCounter += 1
  return `block-${blockIdCounter}`
}

export function RuleBlockEditor({
  blocks,
  onChange,
  availableVariables,
}: {
  blocks: RuleBlock[]
  onChange: (blocks: RuleBlock[]) => void
  availableVariables: AvailableVariable[]
}) {
  function addBlock(type: RuleBlock["type"]) {
    const first = availableVariables[0]
    if (type === "set") {
      const block: SetValueBlock = {
        type: "set",
        id: nextBlockId(),
        targetKey: "value",
        targetLabel: "Value",
        value: { kind: "number", value: 0 },
      }
      onChange([...blocks, block])
    } else if (type === "condition") {
      const block: SetByConditionBlock = {
        type: "condition",
        id: nextBlockId(),
        targetKey: "value",
        targetLabel: "Value",
        tiers: [
          {
            compareVariableKey: first?.key ?? "",
            compareVariableLabel: first?.label ?? "",
            operator: "greater than",
            compareValue: { kind: "number", value: 0 },
            thenValue: { kind: "number", value: 0 },
          },
        ],
        elseValue: { kind: "number", value: 0 },
      }
      onChange([...blocks, block])
    } else {
      const block: CalculateBlock = {
        type: "calculate",
        id: nextBlockId(),
        targetKey: "result",
        targetLabel: "Result",
        targetUnit: "",
        terms: [{ operand: first ? { kind: "variable", key: first.key, label: first.label } : { kind: "number", value: 0 } }],
      }
      onChange([...blocks, block])
    }
  }

  function updateBlock(index: number, next: RuleBlock) {
    onChange(blocks.map((b, i) => (i === index ? next : b)))
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index))
  }

  // Variables available to block N: fields/prior line-item outputs, plus every earlier block's own target in this line item.
  function variablesUpTo(index: number): AvailableVariable[] {
    const priorTargets = blocks.slice(0, index).map((b) => ({ key: b.targetKey, label: b.targetLabel }))
    return [...availableVariables, ...priorTargets]
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        const vars = variablesUpTo(index)
        if (block.type === "set") {
          return (
            <SetValueBlockEditor
              key={block.id}
              block={block}
              onChange={(next) => updateBlock(index, next)}
              onRemove={() => removeBlock(index)}
              availableVariables={vars}
            />
          )
        }
        if (block.type === "condition") {
          return (
            <SetByConditionBlockEditor
              key={block.id}
              block={block}
              onChange={(next) => updateBlock(index, next)}
              onRemove={() => removeBlock(index)}
              availableVariables={vars}
            />
          )
        }
        return (
          <CalculateBlockEditor
            key={block.id}
            block={block}
            onChange={(next) => updateBlock(index, next)}
            onRemove={() => removeBlock(index)}
            availableVariables={vars}
          />
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            <Plus />
            Add block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => addBlock("set")}>Set a value</DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("condition")}>Set by condition</DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("calculate")}>Calculate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {blocks.length > 0 && <AdvancedFormulaToggle formula={describeBlocksFormula(blocks)} />}
    </div>
  )
}

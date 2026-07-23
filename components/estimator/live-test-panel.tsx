"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatGHS } from "@/lib/mock-data"
import { applyTemplatePricing, computeTemplate, type Template } from "@/lib/estimator-data"

export function LiveTestPanel({ template }: { template: Template }) {
  const [values, setValues] = useState<Record<string, string>>({})

  const numericValues: Record<string, number> = {}
  for (const field of template.fields) {
    numericValues[field.key] = Number.parseFloat(values[field.key] || "0") || 0
  }

  const { lineItems, intermediates } = computeTemplate(template, numericValues)
  const baseCost = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)
  const pricing = applyTemplatePricing(baseCost, template)

  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader>
        <CardTitle className="font-sans text-base">Live test</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">Sample inputs</p>
          {template.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">Add fields to test the calculation.</p>
          )}
          {template.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <Label htmlFor={`test-${field.key}`} className="text-xs">
                {field.label}
                {field.unit ? ` (${field.unit})` : ""}
              </Label>
              <Input
                id={`test-${field.key}`}
                type="number"
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="h-8"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Computed result</p>
          {intermediates.length === 0 && <p className="text-muted-foreground">No line items yet.</p>}
          {intermediates.map((intermediate, index) => (
            <p key={index}>
              <span className="text-muted-foreground">{intermediate.label} = </span>
              <span className="font-medium">
                {intermediate.value.toFixed(2)}
                {intermediate.unit ? ` ${intermediate.unit}` : ""}
              </span>
            </p>
          ))}
          {lineItems.length > 0 && (
            <p className="mt-1 border-t pt-1.5 font-medium">Line price {formatGHS(pricing.total)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

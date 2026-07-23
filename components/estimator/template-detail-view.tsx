"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { AdvancedFormulaToggle } from "@/components/estimator/advanced-formula-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatGHS } from "@/lib/mock-data"
import { describeBlock, describeBlocksFormula, getTemplatesStore } from "@/lib/estimator-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"

export function TemplateDetailView({ templateId }: { templateId: string }) {
  const { state } = useDemoState()
  const demoQuery = demoStateToParams(state).toString()
  const editHref = demoQuery
    ? `/estimator/templates/${templateId}/edit?${demoQuery}`
    : `/estimator/templates/${templateId}/edit`

  const template = getTemplatesStore().find((t) => t.id === templateId)

  if (!template) {
    return (
      <Card className="items-center gap-3 py-16 text-center">
        <CardContent className="px-5">
          <p className="text-sm text-muted-foreground">Template not found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={template.name}
        subtitle={`${template.domain} · ${template.status}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>
              <Pencil />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Line items" value={String(template.lineItems.length)} />
        <StatCard label="Status" value={template.status} />
        <StatCard label="Valid for" value={`${template.validityDays} days`} />
        <StatCard label="Created" value={formatDateDisplay(template.createdDate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Markup</p>
            <p className="font-medium">{template.markupPercent}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Default discount</p>
            <p className="font-medium">{template.discountPercent}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Minimum charge</p>
            <p className="font-medium">{formatGHS(template.minimumCharge)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-medium">{template.currency}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Fields</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {template.fields.map((field) => (
            <p key={field.key} className="text-sm">
              {field.label}{" "}
              <span className="text-muted-foreground">
                ({field.type}
                {field.unit ? `, ${field.unit}` : ""}
                {field.required ? "" : ", optional"})
              </span>
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">Line items</p>
        {template.lineItems.map((lineItem, index) => (
          <Card key={lineItem.variableKey}>
            <CardHeader className="gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-sans text-base">{lineItem.name}</CardTitle>
                <Badge variant="outline" className="font-mono text-xs font-normal">
                  {lineItem.variableKey}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {lineItem.unit}
                </Badge>
                {lineItem.defaultDiscountPercent > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {lineItem.defaultDiscountPercent}% default discount
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Computation</p>
                <div className="flex flex-col gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm">
                  {lineItem.computation.blocks.map((block, index) => (
                    <p key={index}>{describeBlock(block)}</p>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outputs a quantity in <span className="font-medium text-foreground">{lineItem.computation.outputUnit}</span>
                  {lineItem.ratePerUnit
                    ? ` · ${formatGHS(lineItem.ratePerUnit)} per ${template.lineItems[index - 1]?.unit ?? lineItem.unit}`
                    : ""}
                </p>
                <AdvancedFormulaToggle formula={describeBlocksFormula(lineItem.computation.blocks)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

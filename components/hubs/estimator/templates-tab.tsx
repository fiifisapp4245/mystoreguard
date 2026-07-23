"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTemplatesStore } from "@/lib/estimator-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"

export function TemplatesTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const templates = useMemo(() => (isLarry ? getTemplatesStore() : []), [isLarry])
  const demoQuery = demoStateToParams(state).toString()
  const withDemoQuery = (path: string) => (demoQuery ? `${path}${path.includes("?") ? "&" : "?"}${demoQuery}` : path)

  const domains = useMemo(() => new Set(templates.map((template) => template.domain)).size, [templates])
  const active = templates.filter((template) => template.status === "Active").length
  const inactive = templates.length - active

  if (!isLarry) {
    return (
      <Card className="items-center gap-3 py-16 text-center">
        <CardContent className="flex flex-col items-center gap-2 px-5">
          <p className="max-w-sm text-sm text-muted-foreground">
            No pricing templates for Adwoa&apos;s Provisions — switch the &quot;Store persona&quot; demo control to
            Larry&apos;s Curtains &amp; Décor to see how measurement-based templates work.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total templates" value={String(templates.length)} />
        <StatCard label="Active" value={String(active)} />
        <StatCard label="Inactive" value={String(inactive)} />
        <StatCard label="Domains" value={String(domains)} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Input fields and formulas that compute yardage, area, and price from measurements.
        </p>
        <Button asChild>
          <Link href={withDemoQuery("/estimator/templates/new")}>
            <Plus />
            New template
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Link key={template.id} href={withDemoQuery(`/estimator/templates/${template.id}`)}>
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{template.name}</p>
                  <Badge variant={template.status === "Active" ? "default" : "secondary"} className="font-normal">
                    {template.status}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit font-normal">
                  {template.domain}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {template.lineItems.length} line item{template.lineItems.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-muted-foreground">Created {formatDateDisplay(template.createdDate)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

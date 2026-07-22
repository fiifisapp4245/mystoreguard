import {
  Award,
  Calculator,
  RotateCcw,
  ShoppingCart,
  Tag,
  Undo2,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const ICONS: Record<string, typeof Award> = {
  "Loyalty program": Award,
  "Pricing setup": Tag,
  "Return policy": Undo2,
  "Store returns": RotateCcw,
  "Store sales": ShoppingCart,
  Estimator: Calculator,
}

export function GuidePage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search guides..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {module.features.map((feature) => {
          const Icon = ICONS[feature.name] ?? Tag

          return (
            <Card key={feature.name}>
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  <CardTitle className="font-sans text-base">
                    {feature.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.description}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

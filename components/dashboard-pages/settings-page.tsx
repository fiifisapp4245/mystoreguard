import {
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Tags,
  Undo2,
  Wallet,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { TaxSettingsCard } from "@/components/dashboard-pages/tax-settings-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const ICONS: Record<string, typeof Tag> = {
  "Product metadata": Tags,
  "Product prices": Tag,
  "Pricing rules": SlidersHorizontal,
  "Return policy": Undo2,
  "Store credit": Wallet,
  "Audit logs": ShieldCheck,
}

// "Tax" and "Tax rules" are folded into the bespoke, interactive TaxSettingsCard below instead of the generic read-only card.
const BESPOKE_FEATURES = new Set(["Tax", "Tax rules"])

export function SettingsPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={module.name} subtitle={module.description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {module.features
          .filter((feature) => !BESPOKE_FEATURES.has(feature.name))
          .map((feature) => {
            const Icon = ICONS[feature.name] ?? Tags
            const isAuditLogs = feature.name === "Audit logs"

            return (
              <Card key={feature.name}>
                <CardHeader className="gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" aria-hidden="true" />
                    <CardTitle className="font-sans text-base">
                      {feature.name}
                    </CardTitle>
                  </div>
                  {isAuditLogs && (
                    <Badge variant="secondary" className="w-fit font-normal">
                      Included in every tier
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            )
          })}
        <TaxSettingsCard />
      </div>
    </div>
  )
}

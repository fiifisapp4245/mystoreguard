import {
  Percent,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Tags,
  Undo2,
  Wallet,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const ICONS: Record<string, typeof Tag> = {
  "Product metadata": Tags,
  "Product prices": Tag,
  "Pricing rules": SlidersHorizontal,
  Tax: Percent,
  "Tax rules": ReceiptText,
  "Return policy": Undo2,
  "Store credit": Wallet,
  "Audit logs": ShieldCheck,
}

export function SettingsPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={module.name} subtitle={module.description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {module.features.map((feature) => {
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
      </div>
    </div>
  )
}

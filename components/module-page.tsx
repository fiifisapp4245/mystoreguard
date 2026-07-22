import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DASHBOARD_PAGES, type ModulePageData } from "@/components/dashboard-pages/registry"
import { TIER_LABEL, type ModuleConfig } from "@/lib/modules"

export function ModulePage({ module }: { module: ModuleConfig }) {
  const CustomPage = DASHBOARD_PAGES[module.id]

  if (CustomPage) {
    // `icon` is a component reference — some custom pages are Client
    // Components, and functions can't cross that boundary as props, so build
    // a plain object without it rather than passing `module` through as-is.
    const moduleData: ModulePageData = {
      id: module.id,
      name: module.name,
      description: module.description,
      features: module.features,
      tier: module.tier,
      addon: module.addon,
    }
    return <CustomPage module={moduleData} />
  }

  const Icon = module.icon

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Icon className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">{module.name}</h1>
        <Badge variant="secondary">{TIER_LABEL[module.tier]}</Badge>
        {module.addon && <Badge variant="outline">Add-on</Badge>}
      </div>

      <p className="max-w-xl text-muted-foreground">{module.description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {module.features.map((feature) => (
          <Card key={feature.name}>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="text-sm font-medium">{feature.name}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-auto pt-6 text-xs text-muted-foreground italic">
        Interior intentionally unbuilt — this prototype is for deciding navigation structure only.
      </p>
    </div>
  )
}

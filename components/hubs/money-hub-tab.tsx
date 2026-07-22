import { Card, CardContent } from "@/components/ui/card"
import { getModule } from "@/lib/modules"

export function MoneyHubTab({ moduleId }: { moduleId: string }) {
  const moduleConfig = getModule(moduleId)

  if (!moduleConfig) return null

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-muted-foreground">{moduleConfig.description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {moduleConfig.features.map((feature) => (
          <Card key={feature.name}>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="text-sm font-medium">{feature.name}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground italic">
        Interior intentionally unbuilt — this prototype is for deciding navigation structure only.
      </p>
    </div>
  )
}

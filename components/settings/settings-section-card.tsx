import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingClassBadge } from "@/components/settings/class-badge"
import type { SettingClass } from "@/lib/settings-registry"

/** Consistent card shell for one governance-class group of fields within a Settings section. Sections may render several of these. */
export function SettingsSectionCard({
  title,
  settingClass,
  description,
  children,
}: {
  title: string
  settingClass?: SettingClass
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-sans text-base">{title}</CardTitle>
          {settingClass && <SettingClassBadge settingClass={settingClass} />}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

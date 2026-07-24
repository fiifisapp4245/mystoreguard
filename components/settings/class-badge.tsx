import { History, Lock, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SettingClass } from "@/lib/settings-registry"
import { cn } from "@/lib/utils"

const CLASS_META: Record<SettingClass, { label: string; icon: typeof Lock }> = {
  A: { label: "Locked", icon: Lock },
  B: { label: "Versioned", icon: History },
  C: { label: "Editable", icon: Pencil },
}

export function SettingClassBadge({ settingClass, className }: { settingClass: SettingClass; className?: string }) {
  const meta = CLASS_META[settingClass]
  const Icon = meta.icon
  return (
    <Badge variant="secondary" className={cn("flex w-fit items-center gap-1 font-normal", className)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

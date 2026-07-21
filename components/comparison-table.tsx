import { Fragment } from "react"
import { Check, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GROUPS, MODULES, TIER_LABEL, getModule, isModuleLocked, type Tier } from "@/lib/modules"
import { cn } from "@/lib/utils"

const TIERS: Tier[] = ["light", "prime", "ultra"]

export function ComparisonTable() {
  const groups = GROUPS.map((group) => ({
    ...group,
    modules: group.moduleIds
      .map(getModule)
      .filter((m): m is NonNullable<typeof m> => Boolean(m) && !m!.addon),
  })).filter((group) => group.modules.length > 0)

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="p-3 text-left font-medium">Module</th>
            {TIERS.map((tier) => (
              <th key={tier} className="p-3 text-center font-medium">
                {TIER_LABEL[tier]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.id}>
              <tr className="border-b bg-muted/20">
                <td colSpan={TIERS.length + 1} className="px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </td>
              </tr>
              {group.modules.map((module) => (
                <tr key={module.id} className="border-b last:border-b-0">
                  <td className="p-3">{module.name}</td>
                  {TIERS.map((tier) => (
                    <td key={tier} className="p-3 text-center">
                      {isModuleLocked(module, tier) ? (
                        <span className="text-muted-foreground/40" aria-label="Not included">
                          —
                        </span>
                      ) : (
                        <Check className="mx-auto size-4 text-primary" aria-label="Included" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {group.id === "system" && (
                <tr key="audit-logs" className="border-b bg-primary/5 last:border-b-0">
                  <td className="p-3">
                    <span className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                      Audit logs
                      <Badge variant="secondary" className="font-normal">
                        Included in every tier
                      </Badge>
                    </span>
                  </td>
                  {TIERS.map((tier) => (
                    <td key={tier} className="p-3 text-center">
                      <Check className="mx-auto size-4 text-primary" aria-label="Included" />
                    </td>
                  ))}
                </tr>
              )}
            </Fragment>
          ))}
          <tr className={cn("bg-muted/20")}>
            <td className="p-3 font-medium">Appointments</td>
            <td colSpan={TIERS.length} className="p-3 text-center text-sm text-muted-foreground">
              Paid add-on on any tier — see Add-ons below
            </td>
          </tr>
        </tbody>
      </table>
      <p className="sr-only">
        Total modules compared: {MODULES.length}, excluding Appointments which is an add-on.
      </p>
    </div>
  )
}

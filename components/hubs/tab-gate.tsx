"use client"

import { useState } from "react"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { useDemoState } from "@/hooks/use-demo-state"
import { getModule, isModuleLocked, TIER_LABEL } from "@/lib/modules"

/** Gates a hub tab's real content behind its module's tier — covers direct
 * URL entry and the demo tier changing while the tab is active, both of which
 * bypass the tab-pill-level locking in HubTabsNav. */
export function TabGate({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  const { state } = useDemoState()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const moduleConfig = getModule(moduleId)

  if (!moduleConfig) return null
  if (!isModuleLocked(moduleConfig, state.tier)) return <>{children}</>

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Lock className="size-6 text-muted-foreground" />
        <div>
          <p className="font-medium">{moduleConfig.name} requires {TIER_LABEL[moduleConfig.tier]}</p>
          <p className="text-sm text-muted-foreground">Upgrade your plan to unlock this tab.</p>
        </div>
        <Button variant="outline" onClick={() => setUpgradeOpen(true)}>
          See what&apos;s included
        </Button>
      </div>
      <UpgradeDialog module={upgradeOpen ? moduleConfig : null} onOpenChange={(open) => !open && setUpgradeOpen(false)} />
    </>
  )
}

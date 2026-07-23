"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { useDemoState } from "@/hooks/use-demo-state"
import { getModule, isModuleLocked, TIER_LABEL, type ModuleConfig, type Tier } from "@/lib/modules"

export function HubTabsNav({
  hubId,
  tabs,
  activeTab,
}: {
  hubId: string
  tabs: { id: string; label: string; tier?: Tier }[]
  activeTab: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state } = useDemoState()
  const [lockedModule, setLockedModule] = useState<ModuleConfig | null>(null)

  function isLocked(tab: { id: string; tier?: Tier }): boolean {
    if (!tab.tier) return false
    const moduleConfig = getModule(tab.id)
    return moduleConfig ? isModuleLocked(moduleConfig, state.tier) : false
  }

  const visibleTabs = tabs.filter((tab) => !(isLocked(tab) && state.lockMode === "hidden"))

  function handleValueChange(value: string) {
    const tab = tabs.find((t) => t.id === value)
    if (tab && isLocked(tab)) {
      setLockedModule(getModule(tab.id) ?? null)
      return
    }
    const qs = searchParams.toString()
    router.push(`/${hubId}/${value}${qs ? `?${qs}` : ""}`)
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleValueChange}>
        <TabsList>
          {visibleTabs.map((tab) => {
            const locked = isLocked(tab)
            const moduleConfig = locked ? getModule(tab.id) : undefined
            return (
              <TabsTrigger key={tab.id} value={tab.id} className={locked ? "text-muted-foreground" : undefined}>
                {tab.label}
                {locked && moduleConfig && (
                  <span className="ml-1.5 inline-flex items-center gap-1">
                    <Lock className="size-3" />
                    <Badge variant="secondary" className="text-[10px]">
                      {TIER_LABEL[moduleConfig.tier]}
                    </Badge>
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
      <UpgradeDialog module={lockedModule} onOpenChange={(open) => !open && setLockedModule(null)} />
    </>
  )
}

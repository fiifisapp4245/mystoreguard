"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HubTabsNav({
  hubId,
  tabs,
  activeTab,
}: {
  hubId: string
  tabs: { id: string; label: string }[]
  activeTab: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        const qs = searchParams.toString()
        router.push(`/${hubId}/${value}${qs ? `?${qs}` : ""}`)
      }}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

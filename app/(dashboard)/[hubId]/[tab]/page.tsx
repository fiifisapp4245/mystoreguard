import { notFound } from "next/navigation"

import { PageHeader } from "@/components/dashboard/page-header"
import { HubTabsNav } from "@/components/hubs/hub-tabs-nav"
import { MoneyHubTab } from "@/components/hubs/money-hub-tab"
import { CustomersTab } from "@/components/hubs/people/customers-tab"
import { StaffTab } from "@/components/hubs/people/staff-tab"
import { SuppliersTab } from "@/components/hubs/people/suppliers-tab"
import { GROUPS, getHub, getModule } from "@/lib/modules"

export function generateStaticParams() {
  return GROUPS.filter((g) => g.type === "hub").flatMap((g) =>
    g.moduleIds.map((tab) => ({ hubId: g.id, tab }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hubId: string; tab: string }>
}) {
  const { hubId, tab } = await params
  const hub = getHub(hubId)
  const tabModule = hub?.moduleIds.includes(tab) ? getModule(tab) : undefined

  return {
    title: tabModule ? `${tabModule.name} — MyStoreGuard` : "Not found — MyStoreGuard",
  }
}

export default async function HubTabPage({
  params,
}: {
  params: Promise<{ hubId: string; tab: string }>
}) {
  const { hubId, tab } = await params
  const hub = getHub(hubId)

  if (!hub || !hub.moduleIds.includes(tab)) {
    notFound()
  }

  const tabs = hub.moduleIds.map((id) => ({ id, label: getModule(id)?.name ?? id }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={hub.label} subtitle={hub.description} />
      <HubTabsNav hubId={hubId} tabs={tabs} activeTab={tab} />

      {hubId === "people" && tab === "customers" && <CustomersTab />}
      {hubId === "people" && tab === "suppliers" && <SuppliersTab />}
      {hubId === "people" && tab === "staff" && <StaffTab />}
      {hubId === "money" && <MoneyHubTab moduleId={tab} />}
    </div>
  )
}

import { notFound } from "next/navigation"

import { PageHeader } from "@/components/dashboard/page-header"
import { QuotationsTab } from "@/components/hubs/estimator/quotations-tab"
import { TemplatesTab } from "@/components/hubs/estimator/templates-tab"
import { HubTabsNav } from "@/components/hubs/hub-tabs-nav"
import { ProductsTab } from "@/components/hubs/inventory/products-tab"
import { PurchaseOrdersTab } from "@/components/hubs/inventory/purchase-orders-tab"
import { InvoicesTab } from "@/components/hubs/invoice/invoices-tab"
import { PaymentsTab } from "@/components/hubs/invoice/payments-tab"
import { AnalyticsTab } from "@/components/hubs/loyalty/analytics-tab"
import { MembersTab } from "@/components/hubs/loyalty/members-tab"
import { RulesTiersTab } from "@/components/hubs/loyalty/rules-tiers-tab"
import { SegmentsTab } from "@/components/hubs/loyalty/segments-tab"
import { MoneyHubTab } from "@/components/hubs/money-hub-tab"
import { AffiliatesTab } from "@/components/hubs/offers/affiliates-tab"
import { GiftCardsTab } from "@/components/hubs/offers/gift-cards-tab"
import { PromoCodesTab } from "@/components/hubs/offers/promo-codes-tab"
import { CustomersTab } from "@/components/hubs/people/customers-tab"
import { StaffTab } from "@/components/hubs/people/staff-tab"
import { SuppliersTab } from "@/components/hubs/people/suppliers-tab"
import { AllSalesTab } from "@/components/hubs/sales/all-sales-tab"
import { ReturnsTab } from "@/components/hubs/sales/returns-tab"
import { MovementsTab } from "@/components/hubs/stock/movements-tab"
import { StockLevelsTab } from "@/components/hubs/stock/stock-levels-tab"
import { StocktakesTab } from "@/components/hubs/stock/stocktakes-tab"
import { TabGate } from "@/components/hubs/tab-gate"
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

  const tabs = hub.moduleIds.map((id) => ({ id, label: getModule(id)?.name ?? id, tier: getModule(id)?.tier }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={hub.label} subtitle={hub.description} />
      <HubTabsNav hubId={hubId} tabs={tabs} activeTab={tab} />

      {hubId === "people" && tab === "customers" && <CustomersTab />}
      {hubId === "people" && tab === "suppliers" && <SuppliersTab />}
      {hubId === "people" && tab === "staff" && <StaffTab />}
      {hubId === "sales" && tab === "all" && <AllSalesTab />}
      {hubId === "sales" && tab === "returns" && <ReturnsTab />}
      {hubId === "invoice" && tab === "invoices" && <InvoicesTab />}
      {hubId === "invoice" && tab === "payments" && <PaymentsTab />}
      {hubId === "estimator" && tab === "quotations" && <QuotationsTab />}
      {hubId === "estimator" && tab === "templates" && <TemplatesTab />}
      {hubId === "inventory" && tab === "products" && <ProductsTab />}
      {hubId === "inventory" && tab === "purchase-orders" && <PurchaseOrdersTab />}
      {hubId === "stock" && tab === "stock-levels" && <StockLevelsTab />}
      {hubId === "stock" && tab === "movements" && <MovementsTab />}
      {hubId === "stock" && tab === "stocktakes" && <StocktakesTab />}
      {hubId === "loyalty" && tab === "loyalty-members" && <TabGate moduleId="loyalty-members"><MembersTab /></TabGate>}
      {hubId === "loyalty" && tab === "loyalty-segments" && <TabGate moduleId="loyalty-segments"><SegmentsTab /></TabGate>}
      {hubId === "loyalty" && tab === "loyalty-rules" && <TabGate moduleId="loyalty-rules"><RulesTiersTab /></TabGate>}
      {hubId === "loyalty" && tab === "loyalty-analytics" && <TabGate moduleId="loyalty-analytics"><AnalyticsTab /></TabGate>}
      {hubId === "offers-rewards" && tab === "gift-cards" && <TabGate moduleId="gift-cards"><GiftCardsTab /></TabGate>}
      {hubId === "offers-rewards" && tab === "promo-codes" && <TabGate moduleId="promo-codes"><PromoCodesTab /></TabGate>}
      {hubId === "offers-rewards" && tab === "affiliates" && <TabGate moduleId="affiliates"><AffiliatesTab /></TabGate>}
      {hubId === "money" && <MoneyHubTab moduleId={tab} />}
    </div>
  )
}

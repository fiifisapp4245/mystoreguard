import type { ComponentType } from "react"

import { AffiliatesPage } from "@/components/dashboard-pages/affiliates-page"
import { DashboardOverviewPage } from "@/components/dashboard-pages/dashboard-overview"
import { DeliveriesPage } from "@/components/dashboard-pages/deliveries-page"
import { EstimatorPage } from "@/components/dashboard-pages/estimator-page"
import { ExpensesPage } from "@/components/dashboard-pages/expenses-page"
import { GuidePage } from "@/components/dashboard-pages/guide-page"
import { InventoryPage } from "@/components/dashboard-pages/inventory-page"
import { InvoicePage } from "@/components/dashboard-pages/invoice-page"
import { LoyaltyPage } from "@/components/dashboard-pages/loyalty-page"
import { MessagePage } from "@/components/dashboard-pages/message-page"
import { OffersRewardsPage } from "@/components/dashboard-pages/offers-rewards-page"
import { ReportsPage } from "@/components/dashboard-pages/reports-page"
import { SettingsPage } from "@/components/dashboard-pages/settings-page"
import { StoreWarehousePage } from "@/components/dashboard-pages/store-warehouse-page"
import { WorkflowPage } from "@/components/dashboard-pages/workflow-page"
import type { ModuleConfig } from "@/lib/modules"

/**
 * Custom pages receive everything except `icon` — a few of them are Client
 * Components, and a component/function reference can't cross the server →
 * client boundary as a prop.
 */
export type ModulePageData = Omit<ModuleConfig, "icon">

/**
 * Custom-designed pages, keyed by module id. All 18 modules are covered now
 * (Light, Prime, and Ultra) — the generic placeholder in ModulePage is kept
 * as a fallback for any future module added without a custom page yet.
 */
export const DASHBOARD_PAGES: Record<
  string,
  ComponentType<{ module: ModulePageData }>
> = {
  // Light
  dashboard: DashboardOverviewPage,
  inventory: InventoryPage,
  expenses: ExpensesPage,
  settings: SettingsPage,
  guide: GuidePage,
  // Prime
  invoice: InvoicePage,
  deliveries: DeliveriesPage,
  reports: ReportsPage,
  message: MessagePage,
  "offers-rewards": OffersRewardsPage,
  estimator: EstimatorPage,
  // Ultra
  "store-warehouse": StoreWarehousePage,
  loyalty: LoyaltyPage,
  affiliates: AffiliatesPage,
  workflow: WorkflowPage,
}

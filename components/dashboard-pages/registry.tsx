import type { ComponentType } from "react"

import { DashboardOverviewPage } from "@/components/dashboard-pages/dashboard-overview"
import { GuidePage } from "@/components/dashboard-pages/guide-page"
import { SettingsPage } from "@/components/dashboard-pages/settings-page"
import { WorkflowPage } from "@/components/dashboard-pages/workflow-page"
import type { ModuleConfig } from "@/lib/modules"

/**
 * Custom pages receive everything except `icon` — a few of them are Client
 * Components, and a component/function reference can't cross the server →
 * client boundary as a prop.
 */
export type ModulePageData = Omit<ModuleConfig, "icon">

/**
 * Custom-designed pages, keyed by module id. Loyalty, Offers & Rewards,
 * Money, and Message are all hubs (see lib/modules.ts) with their own tab
 * pages, not flat modules — they're no longer registered here. The generic
 * placeholder in ModulePage is kept as a fallback for any future module
 * added without a custom page yet.
 */
export const DASHBOARD_PAGES: Record<
  string,
  ComponentType<{ module: ModulePageData }>
> = {
  dashboard: DashboardOverviewPage,
  settings: SettingsPage,
  guide: GuidePage,
  workflow: WorkflowPage,
}

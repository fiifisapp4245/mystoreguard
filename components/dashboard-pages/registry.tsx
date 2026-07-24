import type { ComponentType } from "react"

import { DashboardOverviewPage } from "@/components/dashboard-pages/dashboard-overview"
import type { ModuleConfig } from "@/lib/modules"

/**
 * Custom pages receive everything except `icon` — a few of them are Client
 * Components, and a component/function reference can't cross the server →
 * client boundary as a prop.
 */
export type ModulePageData = Omit<ModuleConfig, "icon">

/**
 * Custom-designed pages, keyed by module id. Loyalty, Offers & Rewards,
 * Money, Message, and Workflow are all hubs (see lib/modules.ts) with their
 * own tab pages, not flat modules — they're no longer registered here.
 * Settings, Audit log, and Guide are bespoke top-level routes with their own
 * page files, not flat modules either. The generic placeholder in
 * ModulePage is kept as a fallback for any future module added without a
 * custom page yet.
 */
export const DASHBOARD_PAGES: Record<
  string,
  ComponentType<{ module: ModulePageData }>
> = {
  dashboard: DashboardOverviewPage,
}

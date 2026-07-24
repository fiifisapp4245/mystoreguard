"use client"

import Link from "next/link"

import { PageHeader } from "@/components/dashboard/page-header"
import { SettingsClassLegend } from "@/components/settings/class-legend"
import { ApprovalsSection } from "@/components/settings/sections/approvals-section"
import { BusinessProfileSection } from "@/components/settings/sections/business-profile-section"
import { DataExportSection } from "@/components/settings/sections/data-export-section"
import { InventoryCostingSection } from "@/components/settings/sections/inventory-costing-section"
import { LocationsSection } from "@/components/settings/sections/locations-section"
import { NotificationsSection } from "@/components/settings/sections/notifications-section"
import { PaymentMethodsSection } from "@/components/settings/sections/payment-methods-section"
import { PricingDiscountsSection } from "@/components/settings/sections/pricing-discounts-section"
import { ReceiptsDocumentsSection } from "@/components/settings/sections/receipts-documents-section"
import { ReturnPolicySection } from "@/components/settings/sections/return-policy-section"
import { RolesPermissionsSection } from "@/components/settings/sections/roles-permissions-section"
import { SmsGatewaySection } from "@/components/settings/sections/sms-gateway-section"
import { StockRulesSection } from "@/components/settings/sections/stock-rules-section"
import { SubscriptionTierSection } from "@/components/settings/sections/subscription-tier-section"
import { TaxSection } from "@/components/settings/sections/tax-section"
import { useDemoState } from "@/hooks/use-demo-state"
import { getSettingsSectionAccess } from "@/lib/permissions-data"
import { getSettingsSection, SETTINGS_GROUPS, SETTINGS_SECTIONS } from "@/lib/settings-registry"
import { cn } from "@/lib/utils"

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  "business-profile": BusinessProfileSection,
  locations: LocationsSection,
  tax: TaxSection,
  "receipts-documents": ReceiptsDocumentsSection,
  "pricing-discounts": PricingDiscountsSection,
  "return-policy": ReturnPolicySection,
  "payment-methods": PaymentMethodsSection,
  "inventory-costing": InventoryCostingSection,
  "stock-rules": StockRulesSection,
  "roles-permissions": RolesPermissionsSection,
  approvals: ApprovalsSection,
  "sms-gateway": SmsGatewaySection,
  notifications: NotificationsSection,
  "subscription-tier": SubscriptionTierSection,
  "data-export": DataExportSection,
}

/**
 * Settings is role-gated at the index itself: a role with "None" access on
 * the Settings row (Cashier, Stockkeeper) sees no sections at all — that
 * emptiness is the point, not a bug. Manager's one finer-grained exception
 * (no Subscription & billing) is filtered the same way via
 * getSettingsSectionAccess's per-section override.
 */
export function SettingsShell({ activeSectionId }: { activeSectionId: string }) {
  const { state } = useDemoState()
  const role = state.role

  const visibleSections = SETTINGS_SECTIONS.filter((s) => getSettingsSectionAccess(role, s.id) !== "None")
  const visibleGroups = SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: visibleSections.filter((s) => s.groupId === group.id),
  })).filter((group) => group.sections.length > 0)

  const activeSection = getSettingsSection(activeSectionId)
  const isAccessible = visibleSections.some((s) => s.id === activeSectionId)
  const ActiveComponent = isAccessible ? SECTION_COMPONENTS[activeSectionId] : undefined

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Settings"
        subtitle="Business profile, tax, pricing rules, return policy, payment methods, roles, and everything else that governs how the store runs."
      />
      <SettingsClassLegend />

      {visibleSections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          You don&apos;t have access to Settings. Ask an Owner or Manager.
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
          <nav className="flex shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-56">
            {visibleGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</p>
                {group.sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`/settings/${section.id}`}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors",
                      section.id === activeSectionId
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            {ActiveComponent ? (
              <ActiveComponent />
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {activeSection ? "This section isn't available for your role." : "Section not found."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

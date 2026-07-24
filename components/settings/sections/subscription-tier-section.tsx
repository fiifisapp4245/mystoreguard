"use client"

import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDemoState } from "@/hooks/use-demo-state"
import { CUSTOMERS, STAFF } from "@/lib/mock-data"
import { MODULES, TIER_LABEL, type Tier } from "@/lib/modules"
import { getProductsStore } from "@/lib/pos-data"

const TIERS: Tier[] = ["light", "prime", "ultra"]

function handleUpgradeClick() {
  toast("This is a visual demo — upgrading isn't wired to billing.")
}

/** Class C — plan comparison drawn directly from lib/modules.ts so it never drifts from what the sidebar locks. */
export function SubscriptionTierSection() {
  const { state } = useDemoState()

  const productCount = getProductsStore().length
  const staffCount = STAFF.length
  const customerCount = CUSTOMERS.length

  return (
    <div className="flex flex-col gap-4">
      <SettingsSectionCard title="Current plan" settingClass="C">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">{TIER_LABEL[state.tier]}</p>
            <p className="text-sm text-muted-foreground">
              This reflects the tier simulated in the demo controls — there is no live billing in this prototype.
            </p>
          </div>
          <Badge variant="secondary">{TIER_LABEL[state.tier]}</Badge>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Light / Prime / Ultra comparison"
        settingClass="C"
        description="The exact same module list the sidebar reads from — this table can never drift from what's actually locked."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {TIERS.map((tier) => {
            const modules = MODULES.filter((m) => m.tier === tier)
            return (
              <div key={tier} className="flex flex-col gap-2 rounded-md border p-3">
                <p className="text-sm font-semibold">{TIER_LABEL[tier]}</p>
                <ul className="flex flex-col gap-2">
                  {modules.map((m) => (
                    <li key={m.id}>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleUpgradeClick}>
            Upgrade to Prime
          </Button>
          <Button variant="outline" onClick={handleUpgradeClick}>
            Upgrade to Ultra
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Your usage"
        settingClass="C"
        description="This prototype doesn't model real plan limits — just counts, with no artificial cap."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{productCount}</p>
            <p className="text-sm text-muted-foreground">products</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{staffCount}</p>
            <p className="text-sm text-muted-foreground">staff</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{customerCount}</p>
            <p className="text-sm text-muted-foreground">customers</p>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  )
}

"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TIER_LABEL, type ModuleConfig } from "@/lib/modules"

export function UpgradeDialog({
  module,
  onOpenChange,
}: {
  module: ModuleConfig | null
  onOpenChange: (open: boolean) => void
}) {
  const tierLabel = module ? TIER_LABEL[module.tier] : ""

  return (
    <Dialog open={module !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to {tierLabel}</DialogTitle>
          <DialogDescription>
            {module?.name} is available on the {tierLabel} plan. This is a demo dialog only —
            no real upgrade flow is wired up.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatGHS, initials, type Customer } from "@/lib/mock-data"

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

const RECENT_ACTIVITY = [
  "Purchase — GHS 214.00 — 21 Jul",
  "Purchase — GHS 96.00 — 14 Jul",
  "Loyalty points redeemed — 200 pts — 2 Jul",
]

export function CustomerDetailSheet({
  customer,
  onOpenChange,
}: {
  customer: Customer | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={customer !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {customer && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>{initials(customer.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="font-sans">{customer.name}</SheetTitle>
                  <SheetDescription>
                    {customer.phone} · {customer.area}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total spend</span>
                  <span className="font-medium">{formatGHS(customer.totalSpend)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Loyalty</span>
                  <span className="flex items-center gap-2 font-medium">
                    {customer.loyaltyPoints.toLocaleString()} pts
                    <Badge variant={TIER_BADGE_VARIANT[customer.loyaltyTier]}>
                      {customer.loyaltyTier}
                    </Badge>
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Store credit</span>
                  <span className="font-medium">{formatGHS(customer.storeCredit)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Recent activity</p>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {RECENT_ACTIVITY.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

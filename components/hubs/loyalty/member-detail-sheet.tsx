"use client"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { getProgrammeSettings, type LoyaltyMember, type LedgerEntryType } from "@/lib/loyalty-data"

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

const LEDGER_TYPE_TONE: Record<LedgerEntryType, string> = {
  Earned: "bg-success/15 text-success",
  Redeemed: "bg-muted text-muted-foreground",
  Adjusted: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Expired: "bg-destructive/15 text-destructive",
}

function tierProgressLine(member: LoyaltyMember): string {
  const settings = getProgrammeSettings()
  const sortedTiers = [...settings.tiers].sort((a, b) => a.lifetimeSpendThreshold - b.lifetimeSpendThreshold)
  const currentIndex = sortedTiers.findIndex((t) => t.name === member.tier)
  const nextTier = sortedTiers[currentIndex + 1]

  if (!nextTier) return "Top tier reached."

  const remaining = Math.max(0, nextTier.lifetimeSpendThreshold - member.lifetimeSpend)
  return `${formatGHS(remaining)} more to reach ${nextTier.name}.`
}

export function MemberDetailSheet({
  member,
  onOpenChange,
}: {
  member: LoyaltyMember | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={member !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        {member && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{member.name}</SheetTitle>
              <SheetDescription>{member.phone}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tier</p>
                  <Badge variant={TIER_BADGE_VARIANT[member.tier]} className="mt-1">
                    {member.tier}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Points balance</p>
                  <p className="mt-1 font-medium">{member.points} pts</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lifetime spend</p>
                  <p className="mt-1 font-medium">{formatGHS(member.lifetimeSpend)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">{member.status}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{tierProgressLine(member)}</p>

              <div>
                <p className="mb-2 text-sm font-medium">Points history</p>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {member.ledger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateDisplay(entry.dateISO)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border-transparent font-normal ${LEDGER_TYPE_TONE[entry.type]}`}>
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={entry.points >= 0 ? "text-success" : "text-muted-foreground"}>
                            {entry.points >= 0 ? "+" : ""}
                            {entry.points}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.source}
                            {entry.note && <span className="block text-xs">{entry.note}</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {member.ledger.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                            No points activity yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

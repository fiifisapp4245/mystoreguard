"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS } from "@/lib/mock-data"
import { daysSinceLastVisit, getLoyaltyMembersStore, type MemberTier } from "@/lib/loyalty-data"

const TIER_ORDER: MemberTier[] = ["Gold", "Silver", "Bronze"]

const TIER_BAR_CLASS: Record<MemberTier, string> = {
  Gold: "bg-amber-500",
  Silver: "bg-zinc-400",
  Bronze: "bg-muted-foreground/40",
}

// Illustrative only — no time-series aggregation exists in the data layer for this.
const POINTS_OVER_TIME = [
  { month: "Apr 2026", issued: 4820, redeemed: 1640 },
  { month: "May 2026", issued: 5310, redeemed: 2020 },
  { month: "Jun 2026", issued: 5090, redeemed: 2380 },
  { month: "Jul 2026", issued: 5640, redeemed: 2110 },
]

const AT_RISK_SPEND_THRESHOLD = 500
const LAPSED_DAYS_THRESHOLD = 60

export function AnalyticsTab() {
  const members = useMemo(() => getLoyaltyMembersStore().filter((m) => m.status === "Active"), [])

  const topCustomers = useMemo(
    () => [...members].sort((a, b) => b.lifetimeSpend - a.lifetimeSpend).slice(0, 5),
    [members]
  )

  const atRiskCustomers = useMemo(
    () =>
      members
        .filter((m) => daysSinceLastVisit(m) > LAPSED_DAYS_THRESHOLD && m.lifetimeSpend > AT_RISK_SPEND_THRESHOLD)
        .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
        .slice(0, 5),
    [members]
  )

  const tierDistribution = useMemo(() => {
    const total = members.length
    return TIER_ORDER.map((tier) => {
      const count = members.filter((m) => m.tier === tier).length
      const percent = total > 0 ? Math.round((count / total) * 100) : 0
      return { tier, count, percent }
    })
  }, [members])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Top customers by spend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {topCustomers.map((member, index) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                <span className="font-medium">{member.name}</span>
              </span>
              <span className="text-muted-foreground">{formatGHS(member.lifetimeSpend)}</span>
            </div>
          ))}
          {topCustomers.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">At-risk customers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="mb-1 text-xs text-muted-foreground">
            Previously valuable spenders with no visit in over {LAPSED_DAYS_THRESHOLD} days.
          </p>
          {atRiskCustomers.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{member.name}</span>
              <span className="text-muted-foreground">
                {formatGHS(member.lifetimeSpend)} · {daysSinceLastVisit(member)}d ago
              </span>
            </div>
          ))}
          {atRiskCustomers.length === 0 && <p className="text-sm text-muted-foreground">No at-risk customers right now.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Points issued vs redeemed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">Illustrative monthly figures, GHS-equivalent value.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Redeemed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {POINTS_OVER_TIME.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="text-muted-foreground">{row.month}</TableCell>
                  <TableCell>{formatGHS(row.issued)}</TableCell>
                  <TableCell>{formatGHS(row.redeemed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Tier distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tierDistribution.map(({ tier, count, percent }) => (
            <div key={tier} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{tier}</span>
                <span className="text-muted-foreground">
                  {count} members · {percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${TIER_BAR_CLASS[tier]}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-sans text-base">Programme ROI</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Avg. spend per visit — members</p>
            <p className="text-xl font-semibold">{formatGHS(142)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. spend per visit — non-members</p>
            <p className="text-xl font-semibold">{formatGHS(116)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estimated incremental spend</p>
            <p className="text-xl font-semibold text-success">+22%</p>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Estimate — members spend an estimated 22% more per visit than non-members. Not derived from ledger data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

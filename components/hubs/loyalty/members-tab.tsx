"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { ConceptTooltip } from "@/components/help/concept-tooltip"
import { AdjustPointsDialog } from "@/components/hubs/loyalty/adjust-points-dialog"
import { ChangeTierDialog } from "@/components/hubs/loyalty/change-tier-dialog"
import { EnrolMemberDialog } from "@/components/hubs/loyalty/enrol-member-dialog"
import { MemberDetailSheet } from "@/components/hubs/loyalty/member-detail-sheet"
import { RedeemPointsDialog } from "@/components/hubs/loyalty/redeem-points-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS, initials } from "@/lib/mock-data"
import { getStandardPeriodRange, isDateInRange, formatDateDisplay, type StandardPeriod } from "@/lib/period-utils"
import {
  getLoyaltyMembersStore,
  pointsToGHS,
  removeFromProgramme,
  type LoyaltyMember,
  type MemberTier,
} from "@/lib/loyalty-data"

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

type TierFilter = "all" | MemberTier
type StatusFilter = "all" | "Active" | "Removed"

const USER_NAME = "Adjoa Boateng"

export function MembersTab() {
  const [members, setMembers] = useState<LoyaltyMember[]>(() => getLoyaltyMembersStore())

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active")

  const [enrolOpen, setEnrolOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adjustTargetId, setAdjustTargetId] = useState<string | null>(null)
  const [redeemTargetId, setRedeemTargetId] = useState<string | null>(null)
  const [tierTargetId, setTierTargetId] = useState<string | null>(null)

  function refresh() {
    setMembers([...getLoyaltyMembersStore()])
  }

  const selected = selectedId ? (members.find((m) => m.id === selectedId) ?? null) : null
  const adjustTarget = adjustTargetId ? (members.find((m) => m.id === adjustTargetId) ?? null) : null
  const redeemTarget = redeemTargetId ? (members.find((m) => m.id === redeemTargetId) ?? null) : null
  const tierTarget = tierTargetId ? (members.find((m) => m.id === tierTargetId) ?? null) : null

  const periodRange = useMemo(() => getStandardPeriodRange(period), [period])

  const stats = useMemo(() => {
    const active = members.filter((m) => m.status === "Active")
    const newThisPeriod = active.filter((m) => isDateInRange(m.joinedDateISO, periodRange))
    const pointsOutstanding = active.reduce((sum, m) => sum + m.points, 0)

    let earned = 0
    let redeemed = 0
    members.forEach((m) => {
      m.ledger.forEach((entry) => {
        if (entry.type === "Earned" || (entry.type === "Adjusted" && entry.points > 0)) {
          earned += entry.points
        } else if (entry.type === "Redeemed") {
          redeemed += Math.abs(entry.points)
        }
      })
    })
    const redemptionRate = earned > 0 ? Math.round((redeemed / earned) * 1000) / 10 : 0

    return [
      { label: "Total members", value: String(active.length) },
      { label: "New this period", caption: period === "today" ? "today" : undefined, value: String(newThisPeriod.length) },
      {
        label: "Points outstanding",
        caption: "as of now",
        value: `${pointsOutstanding} pts`,
        footnote: `Value if fully redeemed: ${formatGHS(pointsToGHS(pointsOutstanding))}`,
        labelExtra: <ConceptTooltip conceptKey="points-liability" />,
      },
      { label: "Redemption rate", value: `${redemptionRate}%`, footnote: "redeemed ÷ earned, all-time" },
    ]
  }, [members, periodRange, period])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const queryDigits = query.replace(/\s/g, "")
    return members.filter((m) => {
      const matchesSearch =
        !query || m.name.toLowerCase().includes(query) || m.phone.replace(/\s/g, "").includes(queryDigits)
      const matchesTier = tierFilter === "all" || m.tier === tierFilter
      const matchesStatus = statusFilter === "all" || m.status === statusFilter
      return matchesSearch && matchesTier && matchesStatus
    })
  }, [members, search, tierFilter, statusFilter])

  function handleEnrolled(member: LoyaltyMember) {
    setEnrolOpen(false)
    refresh()
    toast.success("Customer enrolled", { description: `${member.name} joined the loyalty programme.` })
  }

  function handleRemove(member: LoyaltyMember) {
    removeFromProgramme(member.id)
    refresh()
    toast.success("Removed from programme", { description: `${member.name} is no longer an active member.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as TierFilter)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Removed">Removed</SelectItem>
            </SelectContent>
          </Select>
          <PeriodSelect value={period} onValueChange={setPeriod} />
        </div>
        <Button onClick={() => setEnrolOpen(true)}>
          <Plus />
          Enrol customer
        </Button>
      </div>

      {filtered.length === 0 ? (
        <TeachingEmptyState
          message="Customers join when a cashier takes their phone number at checkout."
          actionLabel="Enrol a customer"
          onAction={() => setEnrolOpen(true)}
        />
      ) : (
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Lifetime spend</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => (
              <TableRow key={member.id} className="cursor-pointer" onClick={() => setSelectedId(member.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium whitespace-nowrap">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                <TableCell>
                  <Badge variant={TIER_BADGE_VARIANT[member.tier]}>{member.tier}</Badge>
                </TableCell>
                <TableCell>{member.points} pts</TableCell>
                <TableCell>{formatGHS(member.lifetimeSpend)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(member.lastVisitISO)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(member.joinedDateISO)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setAdjustTargetId(member.id)}>Adjust points</DropdownMenuItem>
                      <DropdownMenuItem disabled={member.points <= 0} onClick={() => setRedeemTargetId(member.id)}>
                        Redeem on behalf
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTierTargetId(member.id)}>Change tier manually</DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={member.status === "Removed"}
                        onClick={() => handleRemove(member)}
                      >
                        Remove from programme
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      <EnrolMemberDialog open={enrolOpen} onOpenChange={setEnrolOpen} onEnrolled={handleEnrolled} />

      <MemberDetailSheet member={selected} onOpenChange={(open) => !open && setSelectedId(null)} />

      <AdjustPointsDialog
        member={adjustTarget}
        userName={USER_NAME}
        onOpenChange={(open) => !open && setAdjustTargetId(null)}
        onAdjusted={() => {
          refresh()
          setAdjustTargetId(null)
          toast.success("Points adjusted")
        }}
      />

      <RedeemPointsDialog
        member={redeemTarget}
        userName={USER_NAME}
        onOpenChange={(open) => !open && setRedeemTargetId(null)}
        onRedeemed={() => {
          refresh()
          setRedeemTargetId(null)
          toast.success("Points redeemed")
        }}
      />

      <ChangeTierDialog
        member={tierTarget}
        onOpenChange={(open) => !open && setTierTargetId(null)}
        onChanged={() => {
          refresh()
          setTierTargetId(null)
          toast.success("Tier updated")
        }}
      />
    </div>
  )
}

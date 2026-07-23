"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, Send } from "lucide-react"
import { toast } from "sonner"

import { SegmentRuleDialog, type SegmentDialogTarget } from "@/components/hubs/loyalty/segment-rule-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import {
  deactivateSegment,
  duplicateSegment,
  getLoyaltyMembersStore,
  getSegmentsStore,
  segmentMembers,
  type Segment,
} from "@/lib/loyalty-data"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

export function SegmentsTab() {
  const router = useRouter()
  const { state } = useDemoState()
  const demoQuery = demoStateToParams(state).toString()
  const withDemoQuery = (path: string) => (demoQuery ? `${path}${path.includes("?") ? "&" : "?"}${demoQuery}` : path)

  const [segments, setSegments] = useState<Segment[]>(() => getSegmentsStore())
  const [ruleTarget, setRuleTarget] = useState<SegmentDialogTarget>(null)
  const [membersSheetId, setMembersSheetId] = useState<string | null>(null)

  function refresh() {
    setSegments([...getSegmentsStore()])
  }

  const members = getLoyaltyMembersStore()

  const rows = useMemo(
    () =>
      segments.map((segment) => {
        const matching = segmentMembers(segment, members)
        const avgSpend = matching.length > 0 ? matching.reduce((sum, m) => sum + m.lifetimeSpend, 0) / matching.length : 0
        return { segment, matching, avgSpend }
      }),
    [segments, members]
  )

  const membersSheetSegment = membersSheetId ? segments.find((s) => s.id === membersSheetId) : undefined
  const membersSheetMatching = membersSheetSegment ? segmentMembers(membersSheetSegment, members) : []

  function handleDuplicate(segment: Segment) {
    const copy = duplicateSegment(segment.id)
    refresh()
    if (copy) toast.success("Segment duplicated", { description: `Created "${copy.name}".` })
  }

  function handleDeactivate(segment: Segment) {
    deactivateSegment(segment.id)
    refresh()
    toast.success("Segment deactivated", { description: `"${segment.name}" is hidden from active use but kept for reference.` })
  }

  function handleSaved() {
    setRuleTarget(null)
    refresh()
    toast.success(ruleTarget?.mode === "edit" ? "Segment updated" : "Segment created")
  }

  function handleSendMessage(segment: Segment, count: number) {
    router.push(withDemoQuery(`/message/message-compose?segment=${segment.id}&count=${count}`))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Segments recompute live from current member data — the counts below always reflect who matches right now.
        </p>
        <Button onClick={() => setRuleTarget({ mode: "create" })}>
          <Plus />
          Create segment
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Avg. spend</TableHead>
              <TableHead>Last recalculated</TableHead>
              <TableHead />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ segment, matching, avgSpend }) => (
              <TableRow key={segment.id} className={cn(!segment.active && "opacity-60")}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium whitespace-nowrap">{segment.name}</span>
                    {!segment.active && (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Deactivated
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs text-muted-foreground">{segment.description}</TableCell>
                <TableCell>{matching.length}</TableCell>
                <TableCell>{matching.length > 0 ? formatGHS(avgSpend) : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(segment.lastRecalculatedISO)}</TableCell>
                <TableCell>
                  <Button size="sm" disabled={!segment.active} onClick={() => handleSendMessage(segment, matching.length)}>
                    <Send />
                    Send message
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${segment.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setRuleTarget({ mode: "edit", segment })}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(segment)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMembersSheetId(segment.id)}>View members</DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={!segment.active}
                        onClick={() => handleDeactivate(segment)}
                      >
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No segments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SegmentRuleDialog
        target={ruleTarget}
        onOpenChange={(open) => !open && setRuleTarget(null)}
        onSaved={handleSaved}
      />

      <Sheet open={membersSheetId !== null} onOpenChange={(open) => !open && setMembersSheetId(null)}>
        <SheetContent className="sm:max-w-md">
          {membersSheetSegment && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{membersSheetSegment.name}</SheetTitle>
                <SheetDescription>{membersSheetMatching.length} matching members</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {membersSheetMatching.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={TIER_BADGE_VARIANT[member.tier]}>{member.tier}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{member.points} pts</p>
                    </div>
                  </div>
                ))}
                {membersSheetMatching.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No members currently match this segment.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

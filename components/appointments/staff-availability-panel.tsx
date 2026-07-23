"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BLOCKED_DATES,
  LARRY_STAFF_MEMBERS,
  STAFF_MEMBERS,
  WORKING_HOURS,
} from "@/lib/appointments-data"
import { formatDateDisplay } from "@/lib/period-utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** "Mon, Tue, Wed, Thu, Fri, Sat" -> "Mon–Sat" style contiguous-range summary. */
function summarizeDays(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0) return "No working days set"
  const sorted = [...daysOfWeek].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]

  function pushRange() {
    ranges.push(start === prev ? DAY_LABELS[start] : `${DAY_LABELS[start]}–${DAY_LABELS[prev]}`)
  }

  for (let i = 1; i < sorted.length; i++) {
    const day = sorted[i]
    if (day === prev + 1) {
      prev = day
      continue
    }
    pushRange()
    start = day
    prev = day
  }
  pushRange()
  return ranges.join(", ")
}

export function StaffAvailabilityPanel({ isLarry }: { isLarry: boolean }) {
  const staff = isLarry ? LARRY_STAFF_MEMBERS : STAFF_MEMBERS

  return (
    <div className="flex flex-col gap-3">
      {staff.map((member) => {
        const hours = WORKING_HOURS.find((h) => h.staffId === member.id)
        const blocked = BLOCKED_DATES.filter((b) => b.staffId === member.id)

        return (
          <Card key={member.id} className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">{member.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Working hours</span>
                <span className="text-right font-medium">
                  {hours ? `${summarizeDays(hours.daysOfWeek)}, ${hours.startTime}–${hours.endTime}` : "Not set"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Blocked dates</span>
                {blocked.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None on record.</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    {blocked.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-md bg-muted/60 px-2 py-1 text-xs"
                      >
                        <span className="font-medium">{formatDateDisplay(b.dateISO)}</span>
                        {b.note && <span className="text-muted-foreground">{b.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

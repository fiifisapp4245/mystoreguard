import { formatDateDisplay } from "@/lib/period-utils"
import { cn } from "@/lib/utils"

export interface VersionRowData {
  id: string
  /** Pre-formatted by the caller — "15%", "GHS 82.50", "INV", etc. */
  valueLabel: string
  fromISO: string
  toISO?: string
  status: "current" | "scheduled" | "past"
}

const STATUS_LABEL: Record<VersionRowData["status"], string> = {
  current: "current",
  scheduled: "scheduled",
  past: "past",
}

/**
 * Renders the Class B version list exactly as specified:
 *   15%   1 Jan 2024 – 31 Dec 2026     (current)
 *   18%   from 1 Jan 2027               (scheduled)
 */
export function VersionHistoryList({ rows }: { rows: VersionRowData[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div
          key={row.id}
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 rounded-md px-2.5 py-1.5 text-sm",
            row.status === "current" && "bg-primary/5",
            row.status === "past" && "text-muted-foreground"
          )}
        >
          <span className="font-medium tabular-nums">{row.valueLabel}</span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span>
              {row.toISO ? `${formatDateDisplay(row.fromISO)} – ${formatDateDisplay(row.toISO)}` : `from ${formatDateDisplay(row.fromISO)}`}
            </span>
            <span className={cn("text-xs italic", row.status === "scheduled" && "text-primary not-italic font-medium")}>
              ({STATUS_LABEL[row.status]})
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

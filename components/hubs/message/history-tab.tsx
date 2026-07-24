"use client"

import { Fragment, useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { Button } from "@/components/ui/button"
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
import { formatGHS } from "@/lib/mock-data"
import {
  getMessagesStore,
  retryMessage,
  type MessageChannel,
  type MessageRecord,
  type MessageStatus,
  type MessageType,
} from "@/lib/message-data"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  type StandardPeriod,
} from "@/lib/period-utils"
import { cn } from "@/lib/utils"

type ChannelFilter = "All" | MessageChannel
type TypeFilter = "All" | MessageType
type StatusFilter = "All" | MessageStatus

const STATUS_OPTIONS: StatusFilter[] = ["All", "Sent", "Delivered", "Failed", "Scheduled", "Queued"]

export function HistoryTab() {
  const [messages, setMessages] = useState<MessageRecord[]>(() => getMessagesStore())

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const periodRange = useMemo(() => getStandardPeriodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Today"

  const periodMessages = useMemo(() => messages.filter((m) => isDateInRange(m.dateISO, periodRange)), [messages, periodRange])

  const stats = useMemo(() => {
    const delivered = periodMessages.filter((m) => m.status === "Delivered").length
    const failed = periodMessages.filter((m) => m.status === "Failed").length
    const cost = periodMessages.reduce((sum, m) => sum + m.cost, 0)
    return [
      { label: "Sent this period", value: String(periodMessages.length), caption: periodLabel },
      { label: "Delivered", value: String(delivered), caption: periodLabel },
      { label: "Failed", value: String(failed), caption: periodLabel },
      { label: "Cost this period", value: formatGHS(cost), caption: periodLabel },
    ]
  }, [periodMessages, periodLabel])

  const filtered = useMemo(
    () =>
      periodMessages
        .filter((m) => channelFilter === "All" || m.channel === channelFilter)
        .filter((m) => typeFilter === "All" || m.type === typeFilter)
        .filter((m) => statusFilter === "All" || m.status === statusFilter)
        .sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0)),
    [periodMessages, channelFilter, typeFilter, statusFilter]
  )

  function toggleExpand(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleRetry(id: string) {
    retryMessage(id)
    setMessages(getMessagesStore())
    toast.success("Message retried", { description: "Marked as delivered." })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All channels</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All types</SelectItem>
              <SelectItem value="Automated">Automated</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodSelect value={period} onValueChange={setPeriod} />
        </div>
        {period === "custom" && (
          <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
        )}
        <LiveResultCount count={filtered.length} itemLabel="message" />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / time</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Trigger / campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Segments</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => {
              const expandable = Boolean(m.campaignRecipients)
              const expanded = expandedIds.includes(m.id)
              return (
                <Fragment key={m.id}>
                  <TableRow
                    className={cn(expandable && "cursor-pointer")}
                    onClick={() => expandable && toggleExpand(m.id)}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateDisplay(m.dateISO)}
                      <br />
                      <span className="text-xs">{m.timeLabel}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        {expandable &&
                          (expanded ? (
                            <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          ))}
                        <div>
                          <p className="font-medium">{m.recipientName}</p>
                          {m.recipientPhone !== "—" && <p className="text-xs text-muted-foreground">{m.recipientPhone}</p>}
                          {m.status === "Failed" && m.failureReason && (
                            <p className="text-xs text-destructive">{m.failureReason}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{m.channel}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">{m.triggerOrCampaign}</TableCell>
                    <TableCell>
                      <StatusBadge label={m.status} />
                    </TableCell>
                    <TableCell>{m.segments}</TableCell>
                    <TableCell>{formatGHS(m.cost)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {m.status === "Failed" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetry(m.id)}>
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandable && expanded && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-0">
                        <div className="flex flex-col gap-1 p-3">
                          {m.campaignRecipients!.map((r, i) => (
                            <div key={`${m.id}-${i}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm">
                              <div>
                                <span className="font-medium">{r.name}</span>{" "}
                                <span className="text-xs text-muted-foreground">{r.phone}</span>
                              </div>
                              <StatusBadge label={r.status} />
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No messages match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Replies of <span className="font-medium text-foreground">STOP</span> automatically turn off marketing consent for
        that customer — transactional messages (receipts, delivery updates, invoices) are unaffected.
      </p>
    </div>
  )
}

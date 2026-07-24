"use client"

import { useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, BookmarkPlus, CalendarClock, CheckSquare, Coins, Save, Search, Send, Square } from "lucide-react"
import { toast } from "sonner"

import { CreditTopUpDialog } from "@/components/hubs/message/credit-topup-dialog"
import { insertAtCursor, MergeFieldChips } from "@/components/hubs/message/merge-field-chips"
import { SendCostPanel } from "@/components/hubs/message/send-cost-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatGHS, STAFF } from "@/lib/mock-data"
import {
  CHARS_PER_SEGMENT,
  CREDIT_COST_GHS,
  LOW_BALANCE_WARNING_THRESHOLD,
  deductCredits,
  getSmsCreditBalance,
  getMessagesStore,
  getTemplatesStore,
  saveTemplate,
  segmentCount,
  sendMessage,
  setMessagesStore,
  type CampaignRecipient,
  type MessageChannel,
  type MessageRecord,
  type MessageTemplate,
} from "@/lib/message-data"
import {
  getLoyaltyMembersStore,
  getSegmentsStore,
  segmentMembers,
  type LoyaltyMember,
  type Segment,
} from "@/lib/loyalty-data"
import { getBusinessProfile } from "@/lib/business-profile-data"
import { useDemoState } from "@/hooks/use-demo-state"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"
import { cn } from "@/lib/utils"

type RecipientMode = "segment" | "selected" | "all" | "staff" | "manual"

const NO_TEMPLATE = "__none__"

interface ResolvedRecipient {
  name: string
  phone: string
  consent: boolean
}

function parseManualNumbers(text: string): string[] {
  return Array.from(new Set(text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)))
}

function formatTimeLabel(time: string): string {
  const [hStr, mStr = "00"] = time.split(":")
  const h = Number(hStr)
  if (Number.isNaN(h)) return time
  const suffix = h >= 12 ? "pm" : "am"
  const h12 = h % 12 || 12
  return `${h12}:${mStr.padStart(2, "0")} ${suffix}`
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
}

export function ComposeTab() {
  const { state } = useDemoState()
  const businessProfile = getBusinessProfile(state.storePersona)
  const searchParams = useSearchParams()
  const segmentParam = searchParams.get("segment")
  const countParam = searchParams.get("count")
  const customerNameParam = searchParams.get("customerName")
  const amountOwedParam = searchParams.get("amountOwed")
  const invoiceNoParam = searchParams.get("invoiceNo")
  const dueDateParam = searchParams.get("dueDate")

  const [segments] = useState<Segment[]>(() => getSegmentsStore().filter((s) => s.active))
  const [loyaltyMembers] = useState<LoyaltyMember[]>(() => getLoyaltyMembersStore())
  const activeMembers = useMemo(() => loyaltyMembers.filter((m) => m.status === "Active"), [loyaltyMembers])

  const matchedByName = useMemo(() => {
    if (!customerNameParam) return undefined
    return activeMembers.find((m) => m.name.toLowerCase() === customerNameParam.toLowerCase())
  }, [customerNameParam, activeMembers])

  const [recipientMode, setRecipientMode] = useState<RecipientMode>(() => {
    if (segmentParam) return "segment"
    if (customerNameParam) return "selected"
    return "segment"
  })
  const [segmentId, setSegmentId] = useState<string>(() => segmentParam ?? segments[0]?.id ?? "")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => (matchedByName ? [matchedByName.id] : []))
  const [customerSearch, setCustomerSearch] = useState("")
  const [manualNumbersText, setManualNumbersText] = useState("")

  const [channel, setChannel] = useState<MessageChannel>("SMS")
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => getTemplatesStore())
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [body, setBody] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [creditBalance, setCreditBalance] = useState(() => getSmsCreditBalance())
  const [topUpOpen, setTopUpOpen] = useState(false)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(TODAY_ISO)
  const [scheduleTime, setScheduleTime] = useState("09:00")

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")

  const filteredMembers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase()
    if (!term) return activeMembers
    return activeMembers.filter(
      (m) => m.name.toLowerCase().includes(term) || m.phone.replace(/\s/g, "").includes(term.replace(/\s/g, ""))
    )
  }, [activeMembers, customerSearch])

  function handleTemplateChange(id: string) {
    setSelectedTemplateId(id === NO_TEMPLATE ? "" : id)
    if (id === NO_TEMPLATE) return
    const tpl = templates.find((t) => t.id === id)
    if (tpl) {
      setBody(tpl.body)
      setChannel(tpl.channel)
    }
  }

  function handleInsertField(field: string) {
    insertAtCursor(bodyRef.current, body, field, setBody)
  }

  const resolved: ResolvedRecipient[] = useMemo(() => {
    switch (recipientMode) {
      case "segment": {
        const segment = segments.find((s) => s.id === segmentId)
        if (!segment) return []
        return segmentMembers(segment, loyaltyMembers).map((m) => ({ name: m.name, phone: m.phone, consent: m.marketingConsent === true }))
      }
      case "selected":
        return loyaltyMembers
          .filter((m) => selectedMemberIds.includes(m.id))
          .map((m) => ({ name: m.name, phone: m.phone, consent: m.marketingConsent === true }))
      case "all":
        return activeMembers.map((m) => ({ name: m.name, phone: m.phone, consent: m.marketingConsent === true }))
      case "staff":
        return STAFF.filter((s) => s.status === "Active").map((s) => ({ name: s.name, phone: s.phone, consent: true }))
      case "manual":
        return parseManualNumbers(manualNumbersText).map((n) => ({ name: "Manual recipient", phone: n, consent: true }))
    }
  }, [recipientMode, segments, segmentId, loyaltyMembers, selectedMemberIds, activeMembers, manualNumbersText])

  const consentApplicable = recipientMode === "segment" || recipientMode === "selected" || recipientMode === "all"
  const excludedCount = consentApplicable ? resolved.filter((r) => !r.consent).length : 0
  const sendable = consentApplicable ? resolved.filter((r) => r.consent) : resolved

  const segmentsPerMessage = segmentCount(body)
  const totalCost = Math.round(sendable.length * segmentsPerMessage * CREDIT_COST_GHS * 100) / 100
  const creditBalanceAfter = creditBalance - sendable.length * segmentsPerMessage
  const insufficient = creditBalanceAfter < 0
  const showCostPanel = resolved.length > 0 && body.trim() !== ""
  const recipientChannelBlockers = [
    channel !== "SMS" && "the SMS channel (WhatsApp isn't wired up in this prototype)",
    sendable.length === 0 && "at least one sendable recipient",
  ].filter(Boolean) as string[]
  const missingBody = body.trim() === ""
  const canSchedule = recipientChannelBlockers.length === 0 && !missingBody
  const canSend = canSchedule && !insufficient

  const sampleLoyaltyMember: LoyaltyMember | undefined = useMemo(() => {
    if (recipientMode === "segment") {
      const segment = segments.find((s) => s.id === segmentId)
      return segment ? segmentMembers(segment, loyaltyMembers)[0] : undefined
    }
    if (recipientMode === "selected") return loyaltyMembers.find((m) => selectedMemberIds.includes(m.id))
    if (recipientMode === "all") return activeMembers[0]
    return undefined
  }, [recipientMode, segments, segmentId, loyaltyMembers, selectedMemberIds, activeMembers])

  const previewMember = sampleLoyaltyMember ?? loyaltyMembers[0]
  const previewText = body
    .replaceAll("{customer name}", previewMember.name)
    .replaceAll("{points balance}", String(previewMember.points))
    .replaceAll("{amount owed}", amountOwedParam ?? "0.00")
    .replaceAll("{store name}", businessProfile.storeName)
    .replaceAll("{invoice no.}", invoiceNoParam ?? "INV-0000")
    .replaceAll("{due date}", dueDateParam ?? formatDateDisplay(TODAY_ISO))

  function campaignLabel(): string {
    switch (recipientMode) {
      case "segment": {
        const segment = segments.find((s) => s.id === segmentId)
        return segment ? `${segment.name} campaign` : "Segment campaign"
      }
      case "selected":
        return "Selected customers"
      case "all":
        return "All customers broadcast"
      case "staff":
        return "Staff broadcast"
      case "manual":
        return "Manual numbers"
    }
  }

  function handleSendNow() {
    if (!canSend) return
    const segs = segmentsPerMessage
    if (sendable.length === 1) {
      sendMessage({
        recipientName: sendable[0].name,
        recipientPhone: sendable[0].phone,
        channel: "SMS",
        type: "Manual",
        triggerOrCampaign: campaignLabel(),
        segments: segs,
      })
    } else {
      const campaignRecipients: CampaignRecipient[] = sendable.map((r) => ({ name: r.name, phone: r.phone, status: "Sent" }))
      const record: MessageRecord = {
        id: nextId("msg-campaign"),
        dateISO: TODAY_ISO,
        timeLabel: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        recipientName: `${sendable.length} recipients`,
        recipientPhone: "—",
        channel: "SMS",
        type: "Manual",
        triggerOrCampaign: campaignLabel(),
        status: "Sent",
        segments: segs,
        cost: totalCost,
        campaignRecipients,
      }
      setMessagesStore([record, ...getMessagesStore()])
      deductCredits(sendable.length * segs)
    }
    setCreditBalance(getSmsCreditBalance())
    toast.success(`Sent to ${sendable.length} recipient${sendable.length === 1 ? "" : "s"}`, {
      description: formatGHS(totalCost),
    })
  }

  function handleSchedule() {
    if (!canSchedule || !scheduleDate || !scheduleTime) {
      toast.error("Pick a date and time to schedule.")
      return
    }
    const segs = segmentsPerMessage
    const timeLabel = formatTimeLabel(scheduleTime)
    if (sendable.length === 1) {
      const r = sendable[0]
      const record: MessageRecord = {
        id: nextId("msg-sched"),
        dateISO: scheduleDate,
        timeLabel,
        recipientName: r.name,
        recipientPhone: r.phone,
        channel: "SMS",
        type: "Manual",
        triggerOrCampaign: campaignLabel(),
        status: "Scheduled",
        segments: segs,
        cost: totalCost,
      }
      setMessagesStore([record, ...getMessagesStore()])
    } else {
      const campaignRecipients: CampaignRecipient[] = sendable.map((r) => ({ name: r.name, phone: r.phone, status: "Scheduled" }))
      const record: MessageRecord = {
        id: nextId("msg-sched"),
        dateISO: scheduleDate,
        timeLabel,
        recipientName: `${sendable.length} recipients`,
        recipientPhone: "—",
        channel: "SMS",
        type: "Manual",
        triggerOrCampaign: campaignLabel(),
        status: "Scheduled",
        segments: segs,
        cost: totalCost,
        campaignRecipients,
      }
      setMessagesStore([record, ...getMessagesStore()])
    }
    toast.success(`Scheduled for ${formatDateDisplay(scheduleDate)}, ${timeLabel}`, {
      description: `${sendable.length} recipient${sendable.length === 1 ? "" : "s"} — ${formatGHS(totalCost)}`,
    })
    setScheduleOpen(false)
  }

  function handleConfirmSaveTemplate() {
    if (!newTemplateName.trim()) return
    const template: MessageTemplate = {
      id: nextId("tpl-custom"),
      name: newTemplateName.trim(),
      body,
      channel,
      category: "Promotional",
    }
    saveTemplate(template)
    setTemplates(getTemplatesStore())
    setSaveTemplateOpen(false)
    toast.success("Template saved", { description: `"${template.name}" is ready to reuse from Templates.` })
  }

  function handleSaveDraft() {
    toast.success("Draft saved", { description: "You can pick this up again next time you open Compose." })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="size-4 text-muted-foreground" />
            <span className="font-medium">SMS credits: {creditBalance.toLocaleString()}</span>
            <span className="text-muted-foreground">· {formatGHS(CREDIT_COST_GHS)} each</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setTopUpOpen(true)}>
            Top up
          </Button>
        </div>
        {creditBalance < LOW_BALANCE_WARNING_THRESHOLD && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            Credit balance is low — top up soon to avoid interrupted sends.
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={recipientMode}
            onValueChange={(v) => v && setRecipientMode(v as RecipientMode)}
            className="flex-wrap"
          >
            <ToggleGroupItem value="segment">Loyalty segment</ToggleGroupItem>
            <ToggleGroupItem value="selected">Selected customers</ToggleGroupItem>
            <ToggleGroupItem value="all">All customers</ToggleGroupItem>
            <ToggleGroupItem value="staff">Staff</ToggleGroupItem>
            <ToggleGroupItem value="manual">Manual numbers</ToggleGroupItem>
          </ToggleGroup>

          {recipientMode === "segment" &&
            (segments.length > 0 ? (
              <Select value={segmentId} onValueChange={setSegmentId}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {segmentMembers(s, loyaltyMembers).length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No active segments yet — create one in Loyalty → Segments.</p>
            ))}

          {recipientMode === "selected" && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone" aria-label="Search by name or phone"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border p-1.5">
                {filteredMembers.map((m) => {
                  const checked = selectedMemberIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setSelectedMemberIds((prev) => (checked ? prev.filter((id) => id !== m.id) : [...prev, m.id]))
                      }
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                        checked ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.phone}</span>
                      </span>
                      {checked ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4 text-muted-foreground" />}
                    </button>
                  )
                })}
                {filteredMembers.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">No matching members.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{selectedMemberIds.length} selected</p>
            </div>
          )}

          {recipientMode === "all" && (
            <p className="text-sm text-muted-foreground">Sends to all {activeMembers.length} active loyalty members.</p>
          )}

          {recipientMode === "staff" && (
            <p className="rounded-lg border p-3 text-sm text-muted-foreground">
              Sends to all active staff: {STAFF.filter((s) => s.status === "Active").map((s) => s.name).join(", ")}
            </p>
          )}

          {recipientMode === "manual" && (
            <div className="flex flex-col gap-1.5">
              <Textarea
                placeholder="One number per line, or comma-separated"
                rows={4}
                value={manualNumbersText}
                onChange={(e) => setManualNumbersText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{parseManualNumbers(manualNumbersText).length} number(s) parsed.</p>
            </div>
          )}

          <p className="text-sm">
            <span className="font-medium">{resolved.length}</span> <span className="text-muted-foreground">recipient(s) match this scope{countParam && resolved.length === 0 ? ` (expected ${countParam})` : ""}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as MessageChannel)}>
                <SelectTrigger id="compose-channel" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-template">Template</Label>
              <Select value={selectedTemplateId || NO_TEMPLATE} onValueChange={handleTemplateChange}>
                <SelectTrigger id="compose-template" className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE}>Free text (no template)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {channel === "WhatsApp" && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3.5 shrink-0" />
              WhatsApp sending isn&apos;t wired up in this prototype — Send and Schedule are disabled for this channel.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-body">Message body</Label>
            <Textarea
              id="compose-body"
              ref={bodyRef}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message, or insert a merge field below…"
            />
            <p className="text-xs text-muted-foreground">
              {body.length} characters · {segmentsPerMessage} segment{segmentsPerMessage === 1 ? "" : "s"} (~{CHARS_PER_SEGMENT} chars each)
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Merge fields</Label>
            <MergeFieldChips onInsert={handleInsertField} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Preview</Label>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {previewText || <span className="text-muted-foreground">Nothing to preview yet.</span>}
            </div>
            <p className="text-xs text-muted-foreground">Sample recipient: {previewMember.name}</p>
          </div>
        </CardContent>
      </Card>

      {showCostPanel && (
        <SendCostPanel
          recipientCount={sendable.length}
          segmentsPerMessage={segmentsPerMessage}
          totalCostGHS={totalCost}
          creditBalanceAfter={creditBalanceAfter}
          insufficient={insufficient}
          consentExcluded={consentApplicable ? excludedCount : undefined}
          consentTotal={consentApplicable ? resolved.length : undefined}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSendNow} disabled={!canSend}>
            <Send />
            Send now
          </Button>
          <Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={!canSchedule}>
            <CalendarClock />
            Schedule
          </Button>
          <Button variant="outline" onClick={() => setSaveTemplateOpen(true)} disabled={body.trim() === ""}>
            <BookmarkPlus />
            Save as template
          </Button>
          <Button variant="ghost" onClick={handleSaveDraft}>
            <Save />
            Save draft
          </Button>
        </div>
        {recipientChannelBlockers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Send now / Schedule need: {recipientChannelBlockers.join(", ")}
          </p>
        )}
        {missingBody && (
          <p className="text-xs text-muted-foreground">Send now / Schedule / Save as template need: a message body</p>
        )}
        {!missingBody && recipientChannelBlockers.length === 0 && insufficient && (
          <p className="text-xs text-muted-foreground">Send now needs: more SMS credit balance — top up to continue</p>
        )}
      </div>

      <CreditTopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onTopUp={() => setCreditBalance(getSmsCreditBalance())} />

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule message</DialogTitle>
            <DialogDescription>
              No live scheduler runs in this prototype — this creates a Scheduled record in History.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-date">Date</Label>
              <Input id="sched-date" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-time">Time</Label>
              <Input id="sched-time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>Confirm schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>Saves the current message body as a reusable template.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-tpl-name">Template name</Label>
            <Input
              id="new-tpl-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g. Weekend promo"
            />
          </div>
          {!newTemplateName.trim() && (
            <p className="text-xs text-muted-foreground">Still needs: a template name</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveTemplate} disabled={!newTemplateName.trim()}>
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

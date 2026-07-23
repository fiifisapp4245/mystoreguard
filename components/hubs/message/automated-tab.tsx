"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { insertAtCursor, MergeFieldChips } from "@/components/hubs/message/merge-field-chips"
import { SendCostPanel } from "@/components/hubs/message/send-cost-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import {
  CREDIT_COST_GHS,
  getAutomatedTriggersStore,
  getQuietHours,
  getSmsCreditBalance,
  getTemplatesStore,
  saveTemplate,
  segmentCount,
  sendMessage,
  setQuietHours,
  toggleTrigger,
  type AutomatedTrigger,
  type MessageChannel,
  type MessageTemplate,
  type QuietHoursSettings,
} from "@/lib/message-data"

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourLabel(h: number): string {
  const suffix = h >= 12 ? "pm" : "am"
  const h12 = h % 12 || 12
  return `${h12}:00 ${suffix}`
}

function templatePreview(body: string): string {
  return body.length > 60 ? `${body.slice(0, 60)}…` : body
}

export function AutomatedTab() {
  const [quietHours, setQuietHoursState] = useState<QuietHoursSettings>(() => getQuietHours())
  const [triggers, setTriggers] = useState<AutomatedTrigger[]>(() => getAutomatedTriggersStore())
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => getTemplatesStore())
  const [creditBalance, setCreditBalance] = useState(() => getSmsCreditBalance())

  const [editTriggerId, setEditTriggerId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [editChannel, setEditChannel] = useState<MessageChannel>("SMS")
  const [testPhone, setTestPhone] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const editTrigger = editTriggerId ? triggers.find((t) => t.id === editTriggerId) : undefined
  const editTemplate = editTrigger ? templates.find((t) => t.id === editTrigger.templateId) : undefined

  // Reset the editor fields whenever a different trigger is opened, without a full close/reopen cycle.
  const [prevEditId, setPrevEditId] = useState<string | null>(null)
  if (editTriggerId !== prevEditId) {
    setPrevEditId(editTriggerId)
    setEditBody(editTemplate?.body ?? "")
    setEditChannel(editTemplate?.channel ?? "SMS")
    setTestPhone("")
  }

  function updateQuietHours(patch: Partial<QuietHoursSettings>) {
    const next = { ...quietHours, ...patch }
    setQuietHoursState(next)
    setQuietHours(next)
  }

  function handleToggle(trigger: AutomatedTrigger, enabled: boolean) {
    toggleTrigger(trigger.id, enabled)
    setTriggers(getAutomatedTriggersStore())
  }

  function handleSaveTemplate() {
    if (!editTemplate) return
    const updated: MessageTemplate = { ...editTemplate, body: editBody, channel: editChannel }
    saveTemplate(updated)
    setTemplates(getTemplatesStore())
    toast.success("Template updated", { description: `"${updated.name}" saved.` })
  }

  const testSegments = segmentCount(editBody)
  const testCost = Math.round(testSegments * CREDIT_COST_GHS * 100) / 100
  const testBalanceAfter = creditBalance - testSegments
  const testInsufficient = testBalanceAfter < 0

  function handleTestSend() {
    if (!editTrigger || !testPhone.trim() || testInsufficient) return
    sendMessage({
      recipientName: "Test recipient",
      recipientPhone: testPhone.trim(),
      channel: "SMS",
      type: "Automated",
      triggerOrCampaign: `${editTrigger.name} (test)`,
      segments: testSegments,
    })
    setCreditBalance(getSmsCreditBalance())
    toast.success("Test message sent", { description: `${formatGHS(testCost)} deducted from SMS credits.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiet hours</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Respect quiet hours</p>
              <p className="text-xs text-muted-foreground">
                Non-urgent automated messages queue until morning instead of sending during quiet hours.
              </p>
            </div>
            <Switch checked={quietHours.enabled} onCheckedChange={(checked) => updateQuietHours({ enabled: checked })} />
          </div>
          {quietHours.enabled && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quiet-start">Starts at</Label>
                <Select value={String(quietHours.startHour)} onValueChange={(v) => updateQuietHours({ startHour: Number(v) })}>
                  <SelectTrigger id="quiet-start" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quiet-end">Ends at</Label>
                <Select value={String(quietHours.endHour)} onValueChange={(v) => updateQuietHours({ endHour: Number(v) })}>
                  <SelectTrigger id="quiet-end" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        SMS credits: {creditBalance.toLocaleString()} · {formatGHS(CREDIT_COST_GHS)} each — top up from Compose.
      </p>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trigger</TableHead>
              <TableHead>Template preview</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Sent this month</TableHead>
              <TableHead>Cost this month</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggers.map((trigger) => {
              const template = templates.find((t) => t.id === trigger.templateId)
              return (
                <TableRow key={trigger.id} className="cursor-pointer" onClick={() => setEditTriggerId(trigger.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium whitespace-nowrap">{trigger.name}</span>
                      {trigger.isStaffFacing && (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                          Staff
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {template ? templatePreview(template.body) : "—"}
                  </TableCell>
                  <TableCell>{trigger.channel}</TableCell>
                  <TableCell>{trigger.sentThisMonth}</TableCell>
                  <TableCell>{formatGHS(trigger.costThisMonth)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch checked={trigger.enabled} onCheckedChange={(checked) => handleToggle(trigger, checked)} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setEditTriggerId(trigger.id)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editTrigger !== undefined} onOpenChange={(open) => !open && setEditTriggerId(null)}>
        <SheetContent className="flex flex-col gap-0 sm:max-w-lg">
          {editTrigger && editTemplate && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{editTrigger.name}</SheetTitle>
                <SheetDescription>Editing the linked template — changes apply to every future automated send.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="trig-channel">Channel</Label>
                  <Select value={editChannel} onValueChange={(v) => setEditChannel(v as MessageChannel)}>
                    <SelectTrigger id="trig-channel" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="trig-body">Template body</Label>
                  <Textarea id="trig-body" ref={bodyRef} rows={5} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    {editBody.length} characters · {segmentCount(editBody)} segment(s)
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Merge fields</Label>
                  <MergeFieldChips onInsert={(field) => insertAtCursor(bodyRef.current, editBody, field, setEditBody)} />
                </div>
                <Button onClick={handleSaveTemplate} className="self-start">
                  Save template
                </Button>

                <div className="flex flex-col gap-3 border-t pt-4">
                  <Label htmlFor="trig-test-phone">Test send</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trig-test-phone"
                      placeholder="024 000 0000"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleTestSend} disabled={!testPhone.trim() || testInsufficient}>
                      Send test
                    </Button>
                  </div>
                  <SendCostPanel
                    recipientCount={1}
                    segmentsPerMessage={testSegments}
                    totalCostGHS={testCost}
                    creditBalanceAfter={testBalanceAfter}
                    insufficient={testInsufficient}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

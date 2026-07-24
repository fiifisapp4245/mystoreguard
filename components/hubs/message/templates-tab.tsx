"use client"

import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { insertAtCursor, MergeFieldChips } from "@/components/hubs/message/merge-field-chips"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  getAutomatedTriggersStore,
  getTemplatesStore,
  saveTemplate,
  type MessageCategory,
  type MessageChannel,
  type MessageTemplate,
} from "@/lib/message-data"

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
}

export function TemplatesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => getTemplatesStore())
  const [triggers] = useState(() => getAutomatedTriggersStore())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MessageTemplate | undefined>(undefined)
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [channel, setChannel] = useState<MessageChannel>("SMS")
  const [category, setCategory] = useState<MessageCategory>("Promotional")
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  function triggerName(triggerId?: string): string | undefined {
    if (!triggerId) return undefined
    return triggers.find((t) => t.id === triggerId)?.name
  }

  function openNew() {
    setEditTarget(undefined)
    setName("")
    setBody("")
    setChannel("SMS")
    setCategory("Promotional")
    setDialogOpen(true)
  }

  function openEdit(t: MessageTemplate) {
    setEditTarget(t)
    setName(t.name)
    setBody(t.body)
    setChannel(t.channel)
    setCategory(t.category)
    setDialogOpen(true)
  }

  const missingTemplateFields = [
    !name.trim() && "a name",
    !body.trim() && "a body",
  ].filter(Boolean) as string[]

  function handleSave() {
    if (!name.trim() || !body.trim()) return
    const template: MessageTemplate = {
      id: editTarget?.id ?? nextId("tpl-custom"),
      name: name.trim(),
      body,
      channel,
      category,
      triggerId: editTarget?.triggerId,
    }
    saveTemplate(template)
    setTemplates(getTemplatesStore())
    setDialogOpen(false)
    toast.success(editTarget ? "Template updated" : "Template created", { description: `"${template.name}" saved.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Reusable message bodies — the ones linked to an automated trigger power Automated sends; the rest are available
          to pick from Compose.
        </p>
        <Button onClick={openNew}>
          <Plus />
          New template
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Body preview</TableHead>
              <TableHead>Linked trigger</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => openEdit(t)}>
                <TableCell className="font-medium whitespace-nowrap">{t.name}</TableCell>
                <TableCell>{t.channel}</TableCell>
                <TableCell>
                  <Badge variant={t.category === "Transactional" ? "secondary" : "outline"}>{t.category}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{t.body}</TableCell>
                <TableCell className="text-muted-foreground">{triggerName(t.triggerId) ?? "—"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No templates yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              {editTarget?.triggerId
                ? "This template is linked to an automated trigger — edits apply there too."
                : "Available to pick from Compose once saved."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tpl-channel">Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as MessageChannel)}>
                  <SelectTrigger id="tpl-channel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tpl-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as MessageCategory)}>
                  <SelectTrigger id="tpl-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transactional">Transactional</SelectItem>
                    <SelectItem value="Promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-body">Body</Label>
              <Textarea id="tpl-body" ref={bodyRef} rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Merge fields</Label>
              <MergeFieldChips onInsert={(field) => insertAtCursor(bodyRef.current, body, field, setBody)} />
            </div>
          </div>
          {missingTemplateFields.length > 0 && (
            <p className="text-right text-xs text-muted-foreground">Still needs: {missingTemplateFields.join(", ")}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || !body.trim()}>
              {editTarget ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

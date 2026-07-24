"use client"

import { useState } from "react"
import { toast } from "sonner"

import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { EffectiveDateDialog } from "@/components/settings/effective-date-dialog"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatDateDisplay } from "@/lib/period-utils"
import {
  addNumberingVersion,
  cancelScheduledNumbering,
  getNumberingStore,
  scheduledVersion,
  setNumberingFormat,
  versionAsOf,
  type NumberingFormat,
  type NumberingScheme,
} from "@/lib/numbering-data"
import {
  getReceiptsDocumentsSettings,
  setReceiptsDocumentsSettings,
  type ReceiptChannel,
  type ReceiptsDocumentsSettings,
} from "@/lib/receipts-documents-data"

/**
 * Class C for the receipt/invoice/quotation cosmetics and defaults; Class B
 * for numbering, which spans every document type and must never renumber
 * records already issued.
 */
export function ReceiptsDocumentsSection() {
  const [settings, setSettings] = useState<ReceiptsDocumentsSettings>(() => getReceiptsDocumentsSettings())
  const [schemes, setSchemes] = useState<NumberingScheme[]>(() => getNumberingStore())
  const [prefixDialogFor, setPrefixDialogFor] = useState<string | null>(null)
  const [newPrefix, setNewPrefix] = useState("")

  function update<K extends keyof ReceiptsDocumentsSettings>(key: K, value: ReceiptsDocumentsSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setReceiptsDocumentsSettings(settings)
    toast.success("Receipts & documents settings saved")
  }

  function refreshSchemes() {
    setSchemes([...getNumberingStore()])
  }

  const editingScheme = schemes.find((s) => s.key === prefixDialogFor) ?? null

  function handlePrefixSubmit(effectiveFromISO: string) {
    if (!editingScheme || !newPrefix.trim()) return
    addNumberingVersion(editingScheme.key, newPrefix.trim(), effectiveFromISO)
    refreshSchemes()
    setPrefixDialogFor(null)
    setNewPrefix("")
    toast.success(`New prefix scheduled for ${editingScheme.label}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSectionCard title="Receipts & documents" settingClass="C">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="receipt-header">Receipt header text</Label>
          <Textarea
            id="receipt-header"
            value={settings.receiptHeaderText}
            onChange={(e) => update("receiptHeaderText", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="receipt-footer">Receipt footer text</Label>
          <Textarea
            id="receipt-footer"
            value={settings.receiptFooterText}
            onChange={(e) => update("receiptFooterText", e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="show-logo">Show logo on receipt</Label>
          <Switch
            id="show-logo"
            checked={settings.showLogoOnReceipt}
            onCheckedChange={(checked) => update("showLogoOnReceipt", checked)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="print-automatically">Print automatically after sale</Label>
          <Switch
            id="print-automatically"
            checked={settings.printAutomaticallyAfterSale}
            onCheckedChange={(checked) => update("printAutomaticallyAfterSale", checked)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="default-channel">Default receipt channel</Label>
          <Select
            value={settings.defaultReceiptChannel}
            onValueChange={(value: ReceiptChannel) => update("defaultReceiptChannel", value)}
          >
            <SelectTrigger id="default-channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Print">Print</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="Ask">Ask</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invoice-terms">Invoice terms & notes default</Label>
          <Textarea
            id="invoice-terms"
            value={settings.invoiceTermsAndNotesDefault}
            onChange={(e) => update("invoiceTermsAndNotesDefault", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quotation-validity">Quotation validity (days)</Label>
          <Input
            id="quotation-validity"
            type="number"
            value={settings.quotationValidityDays}
            onChange={(e) => update("quotationValidityDays", Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payment-instructions">Payment instructions</Label>
          <Textarea
            id="payment-instructions"
            value={settings.paymentInstructions}
            onChange={(e) => update("paymentInstructions", e.target.value)}
          />
        </div>

        <div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Numbering" settingClass="B">
        <p className="text-xs text-muted-foreground">
          Changing a prefix takes effect from a date you choose and never renumbers records already issued.
        </p>
        {schemes.length === 0 ? (
          <TeachingEmptyState message="Numbering schemes set the prefix and format for every receipt, invoice, quotation and purchase order your store issues." />
        ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Current prefix</TableHead>
                <TableHead>Next number</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemes.map((scheme) => {
                const current = versionAsOf(scheme)
                const scheduled = scheduledVersion(scheme)
                return (
                  <TableRow key={scheme.key}>
                    <TableCell className="font-medium">{scheme.label}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span>{current?.prefix ?? "—"}</span>
                        {current && (
                          <span className="text-xs text-muted-foreground">from {formatDateDisplay(current.effectiveFromISO)}</span>
                        )}
                        {scheduled && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-primary">
                            <span>
                              {scheduled.prefix} from {formatDateDisplay(scheduled.effectiveFromISO)} (scheduled)
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                cancelScheduledNumbering(scheme.key)
                                refreshSchemes()
                                toast.success("Scheduled prefix cancelled")
                              }}
                            >
                              Cancel scheduled
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{scheme.nextNumber}</TableCell>
                    <TableCell>
                      <Select
                        value={scheme.format}
                        onValueChange={(value: NumberingFormat) => {
                          setNumberingFormat(scheme.key, value)
                          refreshSchemes()
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="continuous">Continuous</SelectItem>
                          <SelectItem value="date-based">Date-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setPrefixDialogFor(scheme.key)}>
                        Edit prefix
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </SettingsSectionCard>

      <EffectiveDateDialog
        open={prefixDialogFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPrefixDialogFor(null)
            setNewPrefix("")
          }
        }}
        title={editingScheme ? `New prefix for ${editingScheme.label}` : "New prefix"}
        description="Schedule a new prefix to take effect from a future date."
        canSubmit={newPrefix.trim() !== ""}
        onSubmit={handlePrefixSubmit}
        submitLabel="Add new prefix"
      >
        {() => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-prefix">Prefix</Label>
            <Input id="new-prefix" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} />
          </div>
        )}
      </EffectiveDateDialog>
    </div>
  )
}

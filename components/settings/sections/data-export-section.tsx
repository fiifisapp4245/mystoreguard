"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { getExpensesStore } from "@/lib/expenses-data"
import { getInvoicesStore } from "@/lib/invoice-data"
import { CUSTOMERS } from "@/lib/mock-data"
import { getProductsStore } from "@/lib/pos-data"
import { getSalesRecordsStore } from "@/lib/sales-data"

function handleExport() {
  toast.success("Export started", {
    description: "This is visual only in the prototype — no file is generated.",
  })
}

/** Class C — visual-only data exports. */
export function DataExportSection() {
  const exportRows: { label: string; count: number; noun: string }[] = [
    { label: "Export products (CSV)", count: getProductsStore().length, noun: "products" },
    { label: "Export customers (CSV)", count: CUSTOMERS.length, noun: "customers" },
    { label: "Export sales (CSV)", count: getSalesRecordsStore().length, noun: "sales" },
    { label: "Export invoices (CSV)", count: getInvoicesStore().length, noun: "invoices" },
    { label: "Export expenses (CSV)", count: getExpensesStore().length, noun: "expenses" },
  ]

  return (
    <SettingsSectionCard title="Data export" settingClass="C" description="Downloadable copies of your store records — visual only in this prototype.">
      <div className="flex flex-col gap-2">
        {exportRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-sm text-muted-foreground">
                {row.count} {row.noun}
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Backup</p>
        <p>
          This export stores all of the store&apos;s sales, inventory, customer, and financial records. In
          production, every change is saved immediately and backed up nightly to encrypted, geographically-redundant
          storage. Nothing is stored only on this device.
        </p>
      </div>
    </SettingsSectionCard>
  )
}

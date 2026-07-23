"use client"

import { FileSpreadsheet, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ImportProductsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            Bring in a whole catalogue from a spreadsheet instead of typing each product in one at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drop a spreadsheet here, or browse</p>
            <p className="text-xs text-muted-foreground">.xlsx or .csv — name, category, pack structure, cost, price, reorder point</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm">
            <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">Visual only in this prototype — no file is actually parsed or uploaded.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled>
            <Upload />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

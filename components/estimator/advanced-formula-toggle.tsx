"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function AdvancedFormulaToggle({ formula }: { formula: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        Advanced formula
      </button>
      {open && (
        <code className="mt-1.5 block rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {formula}
        </code>
      )}
    </div>
  )
}

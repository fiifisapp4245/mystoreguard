"use client"

import { HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Enter", description: "Add scanned/searched item, or charge when cart is non-empty" },
  { keys: "Esc", description: "Close panel, or exit the register" },
  { keys: "F2", description: "Hold the current sale" },
  { keys: "F3", description: "Resume a held sale" },
  { keys: "1–5", description: "Select tender in the payment panel" },
  { keys: "?", description: "Show this list" },
]

export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Keyboard shortcuts">
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-2 text-sm font-medium">Keyboard shortcuts</p>
        <div className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <Kbd>{shortcut.keys}</Kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

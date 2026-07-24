import { History, Lock, Pencil } from "lucide-react"

/**
 * Sits once at the top of the Settings page. Without this, the mixed
 * behaviour across sections — some locked, some requiring an effective
 * date, most just saving normally — reads as inconsistent rather than
 * deliberate.
 */
export function SettingsClassLegend() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">Locked</span> — fixed once real activity exists, to protect historical figures.
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <History className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">Versioned</span> — changes apply from a date you choose; past documents keep the old value.
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <Pencil className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">Editable</span> — saves immediately, no history to protect.
        </span>
      </span>
    </div>
  )
}

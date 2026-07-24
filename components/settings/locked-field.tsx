"use client"

import { Lock } from "lucide-react"
import { toast } from "sonner"

import { ConceptTooltip } from "@/components/help/concept-tooltip"

/**
 * Class A — locked after first transaction. This prototype assumes real
 * activity already exists, so every field wrapped here renders read-only
 * with an explanation rather than an editable control.
 */
export function LockedField({
  label,
  value,
  description,
}: {
  label: string
  value: React.ReactNode
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium">
          {label} <ConceptTooltip conceptKey="locked-setting" />
        </span>
        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <div className="text-sm text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <p className="text-xs text-muted-foreground">
        Locked — this determined how existing transactions were valued. Changing it would rewrite history.{" "}
        <button
          type="button"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          onClick={() =>
            toast("Request sent to support", { description: "This is visual only in the prototype — no request is actually sent." })
          }
        >
          Contact support if you need to change it
        </button>
        .
      </p>
    </div>
  )
}

import { ChevronRight } from "lucide-react"

import { FLOW_STEPS } from "@/lib/flow"
import { cn } from "@/lib/utils"

/** Quiet, screenshot-free echo of the home page flow motif — for section intros elsewhere. */
export function FlowStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground",
        className
      )}
    >
      {FLOW_STEPS.map((step, index) => (
        <span key={step.step} className="flex items-center gap-2">
          <span>{step.title}</span>
          {index < FLOW_STEPS.length - 1 && <ChevronRight className="size-3" aria-hidden="true" />}
        </span>
      ))}
    </div>
  )
}

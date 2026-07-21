import { ArrowRight } from "lucide-react"

import { Reveal } from "@/components/reveal"
import { Screenshot } from "@/components/screenshot"
import { FLOW_STEPS } from "@/lib/flow"

export function FlowDiagram() {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
      {FLOW_STEPS.map((step, index) => (
        <Reveal key={step.step} delay={index * 120} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
              {step.step}
            </span>
            <h3 className="font-heading text-lg font-medium">{step.title}</h3>
            {index < FLOW_STEPS.length - 1 && (
              <ArrowRight
                className="ml-auto hidden size-4 text-muted-foreground/50 md:block"
                aria-hidden="true"
              />
            )}
          </div>
          <Screenshot name={step.screenshot} aspect="standard" />
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </Reveal>
      ))}
    </div>
  )
}

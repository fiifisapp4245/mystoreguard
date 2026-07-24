"use client"

import Link from "next/link"
import { Info } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getConceptTooltip } from "@/lib/help-data"

/**
 * A small info icon beside a term that genuinely confuses — a one-or-two
 * sentence explanation plus a "Learn more" link into Guide. Requires a
 * <TooltipProvider> ancestor (mounted once in components/shell.tsx).
 */
export function ConceptTooltip({ conceptKey }: { conceptKey: string }) {
  const entry = getConceptTooltip(conceptKey)
  if (!entry) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center align-middle text-muted-foreground hover:text-foreground" aria-label={`What is ${entry.term}?`}>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="flex max-w-64 flex-col items-start gap-1.5 px-3 py-2">
        <p className="text-xs">{entry.explanation}</p>
        <Link href={`/guide/${entry.articleId}`} className="text-xs font-medium underline underline-offset-2">
          Learn more
        </Link>
      </TooltipContent>
    </Tooltip>
  )
}

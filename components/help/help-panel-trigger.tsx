"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getGuideArticle } from "@/lib/guide-data"
import { getScreenHelp } from "@/lib/help-data"

/**
 * A "?" icon for the page header of a complex screen. Opens a side panel —
 * not a new page, so the user never loses their place — with 2-4 articles
 * relevant to that screen and a link into the full Guide.
 */
export function HelpPanelTrigger({ screenKey }: { screenKey: string }) {
  const [open, setOpen] = useState(false)
  const mapping = getScreenHelp(screenKey)
  if (!mapping) return null

  const articles = mapping.articleIds.map((id) => getGuideArticle(id)).filter((a) => a !== undefined)

  return (
    <>
      <Button variant="outline" size="icon-sm" onClick={() => setOpen(true)} aria-label={`Help for ${mapping.title}`}>
        <CircleHelp className="size-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="font-sans">Help — {mapping.title}</SheetTitle>
            <SheetDescription>A few articles relevant to this screen.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/guide/${article.id}`}
                className="flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:bg-accent/40"
              >
                <span className="font-medium">{article.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{article.body[0]}</span>
              </Link>
            ))}
          </div>
          <div className="mt-auto px-4 pb-4">
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link href="/guide">
                Browse all help
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

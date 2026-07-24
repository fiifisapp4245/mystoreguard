"use client"

import Link from "next/link"
import { CheckCircle2, ChevronRight, Circle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getSetupChecklistDone,
  isSetupChecklistComplete,
  SETUP_CHECKLIST_ITEMS,
} from "@/lib/setup-checklist-data"

export function SetupChecklistCard() {
  if (isSetupChecklistComplete()) return null

  const done = getSetupChecklistDone()

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="font-sans">Get set up</CardTitle>
        <CardDescription>A few things to finish before your store is fully ready.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y px-0">
        {SETUP_CHECKLIST_ITEMS.map((item) => {
          const isDone = done.has(item.id)
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={isDone ? "text-muted-foreground line-through" : "font-medium"}>{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

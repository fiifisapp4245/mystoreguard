"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookOpen, LayoutGrid } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"
import { GUIDE_ARTICLES } from "@/lib/guide-data"
import { resolveFlat } from "@/lib/modules"

/**
 * Cmd/Ctrl+K — searches help articles and navigates to modules. Mounted
 * once, globally, in components/shell.tsx.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { state } = useDemoState()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const modules = resolveFlat()
  const params = demoStateToParams(state).toString()
  const query = params ? `?${params}` : ""

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search help articles and navigate the app">
      <CommandInput placeholder="Search articles and modules..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Modules">
          {modules.map((module) => (
            <CommandItem key={module.id} value={module.name} onSelect={() => go(`${module.href ?? `/m/${module.id}`}${query}`)}>
              <LayoutGrid />
              {module.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Help articles">
          {GUIDE_ARTICLES.map((article) => (
            <CommandItem key={article.id} value={article.title} onSelect={() => go(`/guide/${article.id}`)}>
              <BookOpen />
              {article.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

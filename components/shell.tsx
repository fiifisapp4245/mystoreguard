"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ClipboardCheck } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContentContainer } from "@/components/dashboard/content-container"
import { DemoControls } from "@/components/demo-controls"
import { CommandPalette } from "@/components/help/command-palette"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TaskBellPopover } from "@/components/workflow/task-bell-popover"
import { DEMO_DEFAULTS, useDemoState } from "@/hooks/use-demo-state"
import { isSetupChecklistComplete, setupChecklistProgress } from "@/lib/setup-checklist-data"

/**
 * Every one of these small pieces calls useDemoState() (→ useSearchParams()),
 * which needs a Suspense boundary. Each gets its OWN tight boundary — with a
 * fallback built from DEMO_DEFAULTS, the same real chrome a fresh visitor
 * would see anyway — rather than one boundary wrapping the whole Shell. That
 * way `{children}` (the actual page — a plain sibling below, not nested
 * inside any of these) always server-renders immediately, regardless of
 * whether the sidebar/header/demo-controls have hydrated yet. See ID-01 in
 * the July 2026 QA audit: the previous version wrapped {children} inside
 * this same boundary with a `null` fallback, so nothing rendered server-side
 * on any dashboard route.
 */

function ShellSidebarLive() {
  const { state } = useDemoState()
  return <AppSidebar state={state} />
}

function ShellHeaderExtrasLive() {
  const { state } = useDemoState()
  const showSetupChip = state.storeState === "new" && !isSetupChecklistComplete()
  const progress = setupChecklistProgress()

  return (
    <div className="ml-auto flex items-center gap-1">
      {showSetupChip && (
        <Link href="/">
          <Badge variant="secondary" className="flex items-center gap-1 font-normal">
            <ClipboardCheck className="size-3" />
            Setup {progress.done}/{progress.total}
          </Badge>
        </Link>
      )}
      <TaskBellPopover />
    </div>
  )
}

function ShellDemoControlsLive() {
  const { state, update } = useDemoState()
  // Hidden by default — add ?demo=1 to reveal it. Once set, it's carried
  // through every further update() call (see demoStateToParams), so a
  // stakeholder doesn't lose the panel the moment they toggle a control.
  if (!state.demoMode) return null
  return <DemoControls state={state} update={update} />
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Suspense fallback={<AppSidebar state={DEMO_DEFAULTS} />}>
          <ShellSidebarLive />
        </Suspense>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="size-4" />
            </Button>
            <Separator orientation="vertical" className="h-4!" />
            <span className="text-sm text-muted-foreground">
              Navigation-structure prototype — for internal review only
            </span>
            <Suspense fallback={null}>
              <ShellHeaderExtrasLive />
            </Suspense>
          </header>
          <div id="main-content" className="flex flex-1 flex-col">
            <ContentContainer className="flex flex-1 flex-col py-6 md:py-10">
              {children}
            </ContentContainer>
          </div>
        </SidebarInset>
        <Suspense fallback={null}>
          <ShellDemoControlsLive />
        </Suspense>
      </SidebarProvider>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </TooltipProvider>
  )
}

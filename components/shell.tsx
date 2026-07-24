"use client"

import Link from "next/link"
import { ClipboardCheck } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { ContentContainer } from "@/components/dashboard/content-container"
import { DemoControls } from "@/components/demo-controls"
import { CommandPalette } from "@/components/help/command-palette"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TaskBellPopover } from "@/components/workflow/task-bell-popover"
import { useDemoState } from "@/hooks/use-demo-state"
import { isSetupChecklistComplete, setupChecklistProgress } from "@/lib/setup-checklist-data"

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, update } = useDemoState()
  const isNewStore = state.storeState === "new"
  const showSetupChip = isNewStore && !isSetupChecklistComplete()
  const progress = setupChecklistProgress()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar state={state} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4!" />
            <span className="text-sm text-muted-foreground">
              Navigation-structure prototype — for internal review only
            </span>
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
          </header>
          <div className="flex flex-1 flex-col">
            <ContentContainer className="flex flex-1 flex-col py-6 md:py-10">
              {children}
            </ContentContainer>
          </div>
        </SidebarInset>
        <DemoControls state={state} update={update} />
      </SidebarProvider>
      <CommandPalette />
    </TooltipProvider>
  )
}

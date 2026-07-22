"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ContentContainer } from "@/components/dashboard/content-container"
import { DemoControls } from "@/components/demo-controls"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useDemoState } from "@/hooks/use-demo-state"

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, update } = useDemoState()

  return (
    <SidebarProvider>
      <AppSidebar state={state} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4!" />
          <span className="text-sm text-muted-foreground">
            Navigation-structure prototype — for internal review only
          </span>
        </header>
        <div className="flex flex-1 flex-col">
          <ContentContainer className="flex flex-1 flex-col py-6 md:py-10">
            {children}
          </ContentContainer>
        </div>
      </SidebarInset>
      <DemoControls state={state} update={update} />
    </SidebarProvider>
  )
}

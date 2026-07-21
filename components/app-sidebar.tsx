"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Lock } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { demoStateToParams, type DemoState } from "@/hooks/use-demo-state"
import {
  TIER_LABEL,
  isModuleLocked,
  resolveFlat,
  resolveNav,
  type ModuleConfig,
} from "@/lib/modules"

function isActivePath(pathname: string, id: string) {
  return pathname === `/m/${id}` || (id === "dashboard" && pathname === "/")
}

function ModuleLink({
  module,
  active,
  locked,
  lockMode,
  query,
  onLockedClick,
}: {
  module: ModuleConfig
  active: boolean
  locked: boolean
  lockMode: DemoState["lockMode"]
  query: string
  onLockedClick: (module: ModuleConfig) => void
}) {
  const Icon = module.icon
  const showLockBadge = locked && lockMode === "greyed"

  const content = (
    <>
      <Icon />
      <span className="truncate">{module.name}</span>
      <span className="ml-auto flex items-center gap-1">
        {showLockBadge && <Lock className="size-3 text-muted-foreground" />}
        {showLockBadge && (
          <Badge variant="secondary" className="pointer-events-none px-1.5 text-[10px]">
            {TIER_LABEL[module.tier]}
          </Badge>
        )}
        {module.addon && (
          <Badge variant="outline" className="pointer-events-none px-1.5 text-[10px]">
            Add-on
          </Badge>
        )}
      </span>
    </>
  )

  if (showLockBadge) {
    return (
      <SidebarMenuButton onClick={() => onLockedClick(module)} className="text-muted-foreground">
        {content}
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      className="data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary"
    >
      <Link href={`/m/${module.id}${query}`}>{content}</Link>
    </SidebarMenuButton>
  )
}

function ModuleMenu({
  modules,
  pathname,
  state,
  onLockedClick,
}: {
  modules: ModuleConfig[]
  pathname: string
  state: DemoState
  onLockedClick: (module: ModuleConfig) => void
}) {
  const visible =
    state.lockMode === "hidden"
      ? modules.filter((module) => !isModuleLocked(module, state.tier))
      : modules

  const params = demoStateToParams(state).toString()
  const query = params ? `?${params}` : ""

  return (
    <SidebarMenu>
      {visible.map((module) => (
        <SidebarMenuItem key={module.id}>
          <ModuleLink
            module={module}
            active={isActivePath(pathname, module.id)}
            locked={isModuleLocked(module, state.tier)}
            lockMode={state.lockMode}
            query={query}
            onLockedClick={onLockedClick}
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function CollapsibleGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="group/trigger cursor-pointer">
            {label}
            <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/trigger:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar({ state }: { state: DemoState }) {
  const pathname = usePathname()
  const [lockedModule, setLockedModule] = React.useState<ModuleConfig | null>(null)

  const handleLockedClick = React.useCallback((module: ModuleConfig) => {
    setLockedModule(module)
  }, [])

  const nav = React.useMemo(
    () =>
      resolveNav({
        estimatorLocation: state.estimatorLocation,
        messageLocation: state.messageLocation,
      }),
    [state.estimatorLocation, state.messageLocation]
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0.5 px-3 py-3 group-data-[collapsible=icon]:px-2">
        <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
          MyStoreGuard
        </span>
        <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Adwoa&apos;s Provisions — Makola, Accra
        </span>
      </SidebarHeader>

      <SidebarContent>
        {state.nav === "flat" ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <ModuleMenu
                modules={resolveFlat()}
                pathname={pathname}
                state={state}
                onLockedClick={handleLockedClick}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <ModuleMenu
                  modules={nav.pinned}
                  pathname={pathname}
                  state={state}
                  onLockedClick={handleLockedClick}
                />
              </SidebarGroupContent>
            </SidebarGroup>

            {nav.groups.map((group) => (
              <CollapsibleGroup key={group.id} label={group.label}>
                <ModuleMenu
                  modules={group.modules}
                  pathname={pathname}
                  state={state}
                  onLockedClick={handleLockedClick}
                />
              </CollapsibleGroup>
            ))}
          </>
        )}
      </SidebarContent>

      {state.nav === "grouped" && (
        <SidebarFooter>
          {nav.bottomUtility.length > 0 && (
            <ModuleMenu
              modules={nav.bottomUtility}
              pathname={pathname}
              state={state}
              onLockedClick={handleLockedClick}
            />
          )}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>{nav.system.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <ModuleMenu
                modules={nav.system.modules}
                pathname={pathname}
                state={state}
                onLockedClick={handleLockedClick}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}

      <UpgradeDialog module={lockedModule} onOpenChange={(open) => !open && setLockedModule(null)} />
    </Sidebar>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Lock, Plus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
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
import { Button } from "@/components/ui/button"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { demoStateToParams, STORE_PERSONA_LABEL, type DemoState } from "@/hooks/use-demo-state"
import {
  TIER_LABEL,
  isModuleLocked,
  resolveFlat,
  resolveNav,
  type ModuleConfig,
  type ResolvedGroup,
} from "@/lib/modules"

/** Hub entries link via `module.href` (their first tab) rather than `/m/${id}` — matches on the hub's path prefix so any of its tabs count as active. */
function isModuleActive(pathname: string, module: ModuleConfig) {
  if (module.href) {
    const hubId = module.href.split("/")[1]
    return pathname.startsWith(`/${hubId}`)
  }
  return pathname === `/m/${module.id}` || (module.id === "dashboard" && pathname === "/")
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

  const href = module.href ?? `/m/${module.id}`

  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      className="data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary"
    >
      <Link href={`${href}${query}`}>{content}</Link>
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
            active={isModuleActive(pathname, module)}
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

/** A hub renders as one sidebar entry — build a module-shaped object for it so ModuleLink can render it identically to a regular item. */
function hubAsModule(group: ResolvedGroup): ModuleConfig {
  const firstTab = group.modules[0]
  return {
    id: group.id,
    name: group.label,
    icon: group.icon ?? firstTab?.icon,
    description: "",
    features: [],
    tier: firstTab?.tier ?? "light",
    href: `/${group.id}/${firstTab?.id ?? ""}`,
  }
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
      <SidebarHeader className="gap-3 px-3 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            MyStoreGuard
          </span>
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {STORE_PERSONA_LABEL[state.storePersona].name} — {STORE_PERSONA_LABEL[state.storePersona].location}
          </span>
        </div>

        <Button
          asChild
          className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
        >
          <Link href="/register">
            <Plus />
            <span className="group-data-[collapsible=icon]:hidden">New sale</span>
          </Link>
        </Button>
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
          <div className="flex min-h-full flex-1 flex-col">
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

            {nav.groups.map((group) => {
              if (group.type === "hub") {
                const hubModule = hubAsModule(group)
                const params = demoStateToParams(state).toString()

                return (
                  <SidebarGroup key={group.id}>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <ModuleLink
                            module={hubModule}
                            active={isModuleActive(pathname, hubModule)}
                            locked={isModuleLocked(hubModule, state.tier)}
                            lockMode={state.lockMode}
                            query={params ? `?${params}` : ""}
                            onLockedClick={handleLockedClick}
                          />
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )
              }

              return (
                <CollapsibleGroup key={group.id} label={group.label}>
                  <ModuleMenu
                    modules={group.modules}
                    pathname={pathname}
                    state={state}
                    onLockedClick={handleLockedClick}
                  />
                </CollapsibleGroup>
              )
            })}

            {/* Pinned near the bottom when there's room (mt-auto); once the
                nav above doesn't fit, this scrolls with everything else in
                SidebarContent instead of being clipped outside it. */}
            <div className="mt-auto pb-2">
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
            </div>
          </div>
        )}
      </SidebarContent>

      <UpgradeDialog module={lockedModule} onOpenChange={(open) => !open && setLockedModule(null)} />
    </Sidebar>
  )
}

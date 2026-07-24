"use client"

import { useState } from "react"
import { toast } from "sonner"

import { HelpPanelTrigger } from "@/components/help/help-panel-trigger"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StaffRole } from "@/lib/mock-data"
import {
  getCrossCuttingSettings,
  getPermissionMatrix,
  PERMISSION_LEVELS,
  PERMISSION_MODULES,
  PERMISSION_ROLES,
  setCrossCuttingSettings,
  setPermissionLevel,
  type PermissionLevel,
  type PermissionMatrix,
  type RoleCrossCuttingSettings,
} from "@/lib/permissions-data"

/**
 * Class C — the permission matrix and its cross-cutting toggles are just
 * data configuration, no retroactive-history concern. The Owner column is
 * always Full and never editable, so it renders as a plain badge rather
 * than a control.
 */
export function RolesPermissionsSection() {
  const [matrix, setMatrix] = useState<PermissionMatrix>(() => getPermissionMatrix())
  const [crossCutting, setCrossCutting] = useState<Record<StaffRole, RoleCrossCuttingSettings>>(() => getCrossCuttingSettings())

  function refresh() {
    setMatrix({ ...getPermissionMatrix() })
    setCrossCutting({ ...getCrossCuttingSettings() })
  }

  function handleLevelChange(role: StaffRole, moduleKey: string, level: PermissionLevel) {
    setPermissionLevel(role, moduleKey, level)
    refresh()
    toast.success("Permission updated")
  }

  function handleCrossCuttingChange(role: StaffRole, patch: Partial<RoleCrossCuttingSettings>) {
    setCrossCuttingSettings(role, patch)
    refresh()
    toast.success("Permission updated")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Settings itself is gated by this matrix — a role with None on Settings sees an empty Settings index when viewing as that role via the
          demo control.
        </p>
        <HelpPanelTrigger screenKey="permissions-matrix" />
      </div>

      <SettingsSectionCard title="Permission matrix" settingClass="C" description="What each role can see and do, module by module.">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                {PERMISSION_ROLES.map((role) => (
                  <TableHead key={role}>{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_MODULES.map((module) => (
                <TableRow key={module.key}>
                  <TableCell className="font-medium">{module.label}</TableCell>
                  {PERMISSION_ROLES.map((role) =>
                    role === "Owner" ? (
                      <TableCell key={role}>
                        <Badge variant="secondary" className="font-normal text-muted-foreground">
                          Full
                        </Badge>
                      </TableCell>
                    ) : (
                      <TableCell key={role}>
                        <Select value={matrix[role][module.key]} onValueChange={(value: PermissionLevel) => handleLevelChange(role, module.key, value)}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERMISSION_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Cross-cutting toggles"
        settingClass="C"
        description="Governance questions that cut across modules rather than belonging to one of them."
      >
        <div className="flex flex-col gap-5">
          {PERMISSION_ROLES.map((role) => {
            const roleSettings = crossCutting[role]
            return (
              <div key={role} className="flex flex-col gap-3 rounded-lg border p-3">
                <p className="text-sm font-semibold">{role}</p>

                <div className="flex items-center justify-between gap-2">
                  <Label>Can apply discounts</Label>
                  <div className="flex items-center gap-2">
                    {roleSettings.canApplyDiscounts && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">up to</span>
                        <Input
                          type="number"
                          className="w-16"
                          value={roleSettings.maxDiscountPercent}
                          onChange={(e) => handleCrossCuttingChange(role, { maxDiscountPercent: Number(e.target.value) })}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                    <Switch
                      checked={roleSettings.canApplyDiscounts}
                      onCheckedChange={(checked) => handleCrossCuttingChange(role, { canApplyDiscounts: checked })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label>Can approve overrides</Label>
                  <Switch
                    checked={roleSettings.canApproveOverrides}
                    onCheckedChange={(checked) => handleCrossCuttingChange(role, { canApproveOverrides: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label>Can void sales</Label>
                  <Switch
                    checked={roleSettings.canVoidSales}
                    onCheckedChange={(checked) => handleCrossCuttingChange(role, { canVoidSales: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label>Can record expenses</Label>
                  <Switch
                    checked={roleSettings.canRecordExpenses}
                    onCheckedChange={(checked) => handleCrossCuttingChange(role, { canRecordExpenses: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Label>Can see cost prices and margins</Label>
                    <p className="text-xs text-muted-foreground">This is the field that most often leaks — off by default for Cashier.</p>
                  </div>
                  <Switch
                    checked={roleSettings.canSeeCostPricesAndMargins}
                    onCheckedChange={(checked) => handleCrossCuttingChange(role, { canSeeCostPricesAndMargins: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label>Can open and close the day</Label>
                  <Switch
                    checked={roleSettings.canOpenCloseDay}
                    onCheckedChange={(checked) => handleCrossCuttingChange(role, { canOpenCloseDay: checked })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SettingsSectionCard>
    </div>
  )
}

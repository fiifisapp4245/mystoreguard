"use client"

import { useState } from "react"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { STAFF_ROLES, type StaffRole } from "@/lib/mock-data"
import {
  getNotificationRules,
  NOTIFICATION_EVENT_LABELS,
  setNotificationRule,
  toggleNotificationRole,
  type NotificationEventKey,
  type NotificationRule,
} from "@/lib/notifications-settings-data"

/** Class C — which roles get notified about which store events, in-app and by SMS. */
export function NotificationsSection() {
  const [rules, setRules] = useState<NotificationRule[]>(() => getNotificationRules())

  function refresh() {
    setRules([...getNotificationRules()])
  }

  function handleToggleRole(event: NotificationEventKey, role: StaffRole) {
    toggleNotificationRole(event, role)
    refresh()
  }

  function handleToggleChannel(event: NotificationEventKey, patch: Partial<NotificationRule>) {
    setNotificationRule(event, patch)
    refresh()
  }

  return (
    <SettingsSectionCard
      title="Notifications"
      settingClass="C"
      description="Who hears about what — in-app and by SMS — when something in the store needs attention."
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Roles notified</TableHead>
              <TableHead className="text-center">In-app</TableHead>
              <TableHead className="text-center">SMS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.event}>
                <TableCell className="font-medium">{NOTIFICATION_EVENT_LABELS[rule.event]}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {STAFF_ROLES.map((role) => {
                      const included = rule.roles.includes(role)
                      return (
                        <Badge
                          key={role}
                          variant={included ? "default" : "outline"}
                          className="cursor-pointer select-none"
                          onClick={() => handleToggleRole(rule.event, role)}
                        >
                          {role}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={rule.inApp}
                    onCheckedChange={(checked) => handleToggleChannel(rule.event, { inApp: checked })}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={rule.sms}
                    onCheckedChange={(checked) => handleToggleChannel(rule.event, { sms: checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SettingsSectionCard>
  )
}

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Sent this month",
    value: "412",
    trend: { value: 18, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Delivery rate",
    value: "97%",
    trend: { value: 1, direction: "up" as const, tone: "positive" as const },
  },
]

const MESSAGES = [
  { recipient: "Kwame Mensah", channel: "SMS", preview: "Your order is ready for pickup.", date: "21 Jul, 10:30 am", status: "Delivered" },
  { recipient: "Ama Serwaa", channel: "Email", preview: "Invoice INV-2039 is due on 25 Jul.", date: "20 Jul, 03:15 pm", status: "Delivered" },
  { recipient: "Kofi Boateng", channel: "In-app", preview: "Your loyalty points have been credited.", date: "20 Jul, 11:00 am", status: "Delivered" },
  { recipient: "Yaw Asante", channel: "SMS", preview: "Reminder: invoice INV-2038 is overdue.", date: "19 Jul, 09:00 am", status: "Failed" },
  { recipient: "All staff", channel: "In-app", preview: "New return policy takes effect 1 Aug.", date: "18 Jul, 08:00 am", status: "Delivered" },
]

export function MessagePage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={module.name} subtitle={module.description} search="Search messages..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Messages</CardTitle>
          <CardDescription>Notifications and communication sent to customers and staff.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MESSAGES.map((message) => (
                <TableRow key={message.recipient + message.date}>
                  <TableCell className="font-medium whitespace-nowrap">{message.recipient}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {message.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{message.preview}</TableCell>
                  <TableCell className="text-muted-foreground">{message.date}</TableCell>
                  <TableCell>
                    <StatusBadge label={message.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

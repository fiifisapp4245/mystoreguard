"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, Search } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AUDIT_ACTION_LABELS, getAuditLogStore, type AuditActionType } from "@/lib/audit-log-data"
import { formatDateDisplay } from "@/lib/period-utils"

const ALL = "All"

/** A read-only, immutable record of every setting, price, approval, and correction across the store. */
export function AuditLogScreen() {
  const [entries] = useState(() =>
    [...getAuditLogStore()].sort((a, b) =>
      b.dateISO === a.dateISO ? b.time.localeCompare(a.time) : b.dateISO.localeCompare(a.dateISO)
    )
  )
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [userFilter, setUserFilter] = useState(ALL)
  const [moduleFilter, setModuleFilter] = useState(ALL)
  const [actionFilter, setActionFilter] = useState<typeof ALL | AuditActionType>(ALL)
  const [search, setSearch] = useState("")

  const users = useMemo(() => Array.from(new Set(entries.map((e) => e.user))).sort(), [entries])
  const modules = useMemo(() => Array.from(new Set(entries.map((e) => e.module))).sort(), [entries])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (fromDate && entry.dateISO < fromDate) return false
      if (toDate && entry.dateISO > toDate) return false
      if (userFilter !== ALL && entry.user !== userFilter) return false
      if (moduleFilter !== ALL && entry.module !== moduleFilter) return false
      if (actionFilter !== ALL && entry.action !== actionFilter) return false
      if (
        query &&
        !entry.target.toLowerCase().includes(query) &&
        !(entry.reason ?? "").toLowerCase().includes(query) &&
        !entry.user.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })
  }, [entries, fromDate, toDate, userFilter, moduleFilter, actionFilter, search])

  function handleExport() {
    toast.success("Export started", { description: "Visual only in this prototype." })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        subtitle="An immutable record of every setting, price, approval, and correction across the store."
        action={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            From
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            To
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </label>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All modules</SelectItem>
              {modules.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {mod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as typeof ALL | AuditActionType)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All actions</SelectItem>
              {(Object.keys(AUDIT_ACTION_LABELS) as AuditActionType[]).map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search target, reason, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Before → After</TableHead>
              <TableHead>Reason/note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateDisplay(entry.dateISO)} · {entry.time}
                </TableCell>
                <TableCell className="font-medium">{entry.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.module}</TableCell>
                <TableCell>{AUDIT_ACTION_LABELS[entry.action]}</TableCell>
                <TableCell>
                  {entry.targetHref ? (
                    <Link href={entry.targetHref} className="text-primary underline-offset-4 hover:underline">
                      {entry.target}
                    </Link>
                  ) : (
                    entry.target
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.before && entry.after ? `${entry.before} → ${entry.after}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No audit entries match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">Audit entries cannot be edited or removed.</p>
    </div>
  )
}

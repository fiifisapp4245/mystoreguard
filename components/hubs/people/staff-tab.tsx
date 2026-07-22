"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { AddStaffDialog } from "@/components/hubs/people/add-staff-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { STAFF, initials, type StaffMember } from "@/lib/mock-data"

export function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>(STAFF)
  const [addOpen, setAddOpen] = useState(false)

  function handleAdd(member: StaffMember) {
    setStaff((prev) => [member, ...prev])
    setAddOpen(false)
    toast.success("Staff added", { description: `${member.name} has been invited.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <StatCard label="Staff accounts" value={String(staff.length)} className="sm:w-48" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Roles control what each person can see and do.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add staff
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-col gap-3 py-5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <Badge variant="secondary" className="font-normal">
                    {member.role}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>{member.phone}</span>
                {member.status === "Invited" ? (
                  <span className="italic">Invitation sent</span>
                ) : (
                  <span>Active · {member.lastActive}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddStaffDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </div>
  )
}

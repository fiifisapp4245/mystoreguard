"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STAFF_ROLES, isValidGhanaPhone, type StaffMember, type StaffRole } from "@/lib/mock-data"
import { summarizeRolePermissions } from "@/lib/permissions-data"

interface FormErrors {
  name?: string
  phone?: string
}

export function AddStaffDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (member: StaffMember) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<StaffRole>("Cashier")
  const [errors, setErrors] = useState<FormErrors>({})

  function reset() {
    setName("")
    setPhone("")
    setRole("Cashier")
    setErrors({})
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSave() {
    const nextErrors: FormErrors = {}
    if (!name.trim()) nextErrors.name = "Full name is required."
    if (!phone.trim()) {
      nextErrors.phone = "Phone is required."
    } else if (!isValidGhanaPhone(phone)) {
      nextErrors.phone = "Enter a Ghana number like 0241234567."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onAdd({
      id: `staff-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role,
      status: "Invited",
      lastActive: "—",
    })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>Invite a new staff member.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-name">Full name</Label>
            <Input id="staff-name" value={name} onChange={(event) => setName(event.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input
              id="staff-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="024 111 2222"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
              <SelectTrigger id="staff-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Roles are configured in Settings → Roles & permissions</p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">{role} can:</p>
            <p className="mt-1 text-sm">{summarizeRolePermissions(role)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

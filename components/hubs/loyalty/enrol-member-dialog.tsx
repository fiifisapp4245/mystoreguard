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
import { AREAS, isValidGhanaPhone } from "@/lib/mock-data"
import { enrolMember, findMemberByPhone, type LoyaltyMember } from "@/lib/loyalty-data"

export function EnrolMemberDialog({
  open,
  onOpenChange,
  onEnrolled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnrolled: (member: LoyaltyMember) => void
}) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [area, setArea] = useState<string>("")
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setPhone("")
      setName("")
      setArea("")
    }
  }

  const phoneValid = isValidGhanaPhone(phone)
  const alreadyMember = phoneValid ? findMemberByPhone(phone) : undefined
  const canSave = phoneValid && name.trim().length > 0 && !alreadyMember

  function handleSave() {
    if (!canSave) return
    const member = enrolMember({ phone: phone.trim(), name: name.trim(), area: area || undefined })
    onEnrolled(member)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enrol customer</DialogTitle>
          <DialogDescription>Add a new member to the loyalty programme.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enrol-phone">Phone number</Label>
            <Input
              id="enrol-phone"
              placeholder="024 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone.length > 0 && !phoneValid && (
              <p className="text-xs text-destructive">Enter a valid Ghana phone number.</p>
            )}
            {alreadyMember && <p className="text-xs text-destructive">{alreadyMember.name} is already enrolled with this number.</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enrol-name">Full name</Label>
            <Input id="enrol-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enrol-area">Area (optional)</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-full" id="enrol-area">
                <SelectValue placeholder="Select an area..." />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Enrol customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

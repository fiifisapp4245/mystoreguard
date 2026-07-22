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
import { Textarea } from "@/components/ui/textarea"
import { AREAS, isValidGhanaPhone, type Customer } from "@/lib/mock-data"

interface FormErrors {
  name?: string
  phone?: string
}

export function AddCustomerDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (customer: Customer) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [area, setArea] = useState(AREAS[0])
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  function reset() {
    setName("")
    setPhone("")
    setArea(AREAS[0])
    setEmail("")
    setNotes("")
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
      id: `cus-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      area,
      totalSpend: 0,
      lastPurchase: "Not yet",
      loyaltyTier: "Bronze",
      loyaltyPoints: 0,
      storeCredit: 0,
      creditBalance: 0,
      status: "Active",
    })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>Add a new customer to the directory.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">Full name</Label>
            <Input id="customer-name" value={name} onChange={(event) => setName(event.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="024 123 4567"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-area">Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="customer-area" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-email">Email (optional)</Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-notes">Notes (optional)</Label>
            <Textarea
              id="customer-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Loyalty enrollment happens automatically on first purchase.
          </p>
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

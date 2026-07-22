"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
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
import { PAYMENT_TERMS, SUPPLIER_CATEGORIES, isValidGhanaPhone, type Supplier } from "@/lib/mock-data"

interface FormErrors {
  businessName?: string
  contactPerson?: string
  phone?: string
}

export function AddSupplierDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (supplier: Supplier) => void
}) {
  const [businessName, setBusinessName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[0])
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  function reset() {
    setBusinessName("")
    setContactPerson("")
    setPhone("")
    setCategories([])
    setPaymentTerms(PAYMENT_TERMS[0])
    setEmail("")
    setErrors({})
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function toggleCategory(category: string) {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  function handleSave() {
    const nextErrors: FormErrors = {}
    if (!businessName.trim()) nextErrors.businessName = "Business name is required."
    if (!contactPerson.trim()) nextErrors.contactPerson = "Contact person is required."
    if (!phone.trim()) {
      nextErrors.phone = "Phone is required."
    } else if (!isValidGhanaPhone(phone)) {
      nextErrors.phone = "Enter a Ghana number like 0241234567."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onAdd({
      id: `sup-${Date.now()}`,
      businessName: businessName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      categories,
      paymentTerms,
      lastOrder: "No orders yet",
      openPurchaseOrders: 0,
    })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add supplier</DialogTitle>
          <DialogDescription>Add a new supplier to the directory.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-name">Business name</Label>
            <Input
              id="supplier-name"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
            {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-contact">Contact person</Label>
            <Input
              id="supplier-contact"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
            />
            {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input
              id="supplier-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="030 222 1111"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categories supplied</Label>
            <div className="flex flex-wrap gap-2">
              {SUPPLIER_CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={categories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer font-normal select-none"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-terms">Payment terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger id="supplier-terms" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-email">Email (optional)</Label>
            <Input
              id="supplier-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
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

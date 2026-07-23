"use client"

import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { AddCustomerDialog } from "@/components/hubs/people/add-customer-dialog"
import { CustomerPicker } from "@/components/register/customer-picker"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  APPOINTMENT_SERVICE_TYPES,
  createAppointment,
  isBlockedDate,
  isWithinWorkingHours,
  LARRY_STAFF_MEMBERS,
  STAFF_MEMBERS,
  type AppointmentLocationType,
  type AppointmentServiceType,
} from "@/lib/appointments-data"
import { LARRY_CUSTOMERS } from "@/lib/larry-data"
import { CUSTOMERS, type Customer } from "@/lib/mock-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"

const DEFAULT_DURATION = "60"
const DEFAULT_START_TIME = "09:00"

export function NewAppointmentDialog({
  open,
  onOpenChange,
  isLarry,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLarry: boolean
  onCreated: () => void
}) {
  const customerList = isLarry ? LARRY_CUSTOMERS : CUSTOMERS
  const staffList = isLarry ? LARRY_STAFF_MEMBERS : STAFF_MEMBERS

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  const [serviceType, setServiceType] = useState<AppointmentServiceType>(APPOINTMENT_SERVICE_TYPES[0])
  const [staffId, setStaffId] = useState(staffList[0]?.id ?? "")
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME)
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION)
  const [locationType, setLocationType] = useState<AppointmentLocationType>("At shop")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  function reset() {
    setCustomer(null)
    setCustomerName("")
    setCustomerPhone("")
    setServiceType(APPOINTMENT_SERVICE_TYPES[0])
    setStaffId(staffList[0]?.id ?? "")
    setDateISO(TODAY_ISO)
    setStartTime(DEFAULT_START_TIME)
    setDurationMinutes(DEFAULT_DURATION)
    setLocationType("At shop")
    setAddress("")
    setNotes("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSelectCustomer(selected: Customer | null) {
    setCustomer(selected)
    setCustomerName(selected?.name ?? "")
    setCustomerPhone(selected?.phone ?? "")
  }

  function handleAddCustomer(newCustomer: Customer) {
    setCustomer(newCustomer)
    setCustomerName(newCustomer.name)
    setCustomerPhone(newCustomer.phone)
    setAddCustomerOpen(false)
    toast.success("Customer added", { description: `${newCustomer.name} has been added.` })
  }

  function handleLocationChange(next: string) {
    if (!next) return
    const value = next as AppointmentLocationType
    setLocationType(value)
    if (value === "At customer address" && !address.trim() && customer?.area) {
      setAddress(customer.area)
    }
  }

  const duration = Number(durationMinutes) || 0
  const staffName = staffList.find((s) => s.id === staffId)?.name ?? "This staff member"
  const withinHours = staffId && startTime && duration > 0 ? isWithinWorkingHours(staffId, dateISO, startTime, duration) : true
  const blockedDate = staffId ? isBlockedDate(staffId, dateISO) : undefined

  function handleSubmit() {
    const finalName = (customer?.name ?? customerName).trim()
    const finalPhone = (customer?.phone ?? customerPhone).trim()

    if (!finalName) {
      toast.error("Add a customer name.")
      return
    }
    if (!finalPhone) {
      toast.error("Add a customer phone number.")
      return
    }
    if (!staffId) {
      toast.error("Select a staff member.")
      return
    }
    if (duration <= 0) {
      toast.error("Enter a valid duration.")
      return
    }
    if (locationType === "At customer address" && !address.trim()) {
      toast.error("Add the customer's address.")
      return
    }

    const created = createAppointment(isLarry, {
      customerName: finalName,
      customerPhone: finalPhone,
      serviceType,
      staffId,
      dateISO,
      startTime,
      durationMinutes: duration,
      locationType,
      address: locationType === "At customer address" ? address.trim() : undefined,
      notes: notes.trim() || undefined,
    })

    toast.success("Appointment created", {
      description: `${created.id} — ${finalName}, ${formatDateDisplay(dateISO)} at ${startTime}.`,
    })
    onCreated()
    handleOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
            <DialogDescription>Book a site visit, fitting, or in-shop consultation.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <CustomerPicker
                customer={customer}
                customers={customerList}
                placeholder="Select a customer"
                onSelect={handleSelectCustomer}
                onAddNew={() => setAddCustomerOpen(true)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  aria-label="Customer name"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(event) => {
                    setCustomer(null)
                    setCustomerName(event.target.value)
                  }}
                />
                <Input
                  aria-label="Customer phone"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(event) => {
                    setCustomer(null)
                    setCustomerPhone(event.target.value)
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pick an existing customer above, or just type a name and phone for someone new.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-service">Service type</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as AppointmentServiceType)}>
                  <SelectTrigger id="apt-service" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-staff">Staff member</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger id="apt-staff" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-date">Date</Label>
                <Input id="apt-date" type="date" value={dateISO} onChange={(event) => setDateISO(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-time">Start time</Label>
                <Input id="apt-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-duration">Duration (min)</Label>
                <Input
                  id="apt-duration"
                  type="number"
                  min={0}
                  step={15}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                />
              </div>
            </div>

            {!withinHours && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>Outside {staffName}&apos;s working hours — booking anyway.</span>
              </div>
            )}
            {blockedDate && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {staffName} has a blocked date{blockedDate.note ? ` (${blockedDate.note})` : ""} — booking anyway.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <ToggleGroup
                type="single"
                value={locationType}
                onValueChange={handleLocationChange}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="At shop" className="flex-1">
                  At shop
                </ToggleGroupItem>
                <ToggleGroupItem value="At customer address" className="flex-1">
                  At customer address
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {locationType === "At customer address" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apt-address">Address</Label>
                <Input
                  id="apt-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="e.g. 12 Ringway Estate, East Legon"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="apt-notes">Notes (optional)</Label>
              <Textarea id="apt-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Book appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onAdd={handleAddCustomer} />
    </>
  )
}

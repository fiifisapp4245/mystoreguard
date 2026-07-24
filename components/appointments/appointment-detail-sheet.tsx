"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  isBlockedDate,
  isWithinWorkingHours,
  rescheduleAppointment,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"

type Panel = "none" | "reschedule" | "cancel" | "noshow"

function formatTimeRange(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number)
  const startMinutes = h * 60 + m
  const endMinutes = startMinutes + durationMinutes
  const pad = (n: number) => String(n % 24).padStart(2, "0")
  const endH = Math.floor(endMinutes / 60)
  const endM = endMinutes % 60
  return `${startTime} – ${pad(endH)}:${String(endM).padStart(2, "0")}`
}

export function AppointmentDetailSheet({
  appointment,
  isLarry,
  onOpenChange,
  onChanged,
}: {
  appointment: Appointment | null
  isLarry: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const router = useRouter()

  const [panel, setPanel] = useState<Panel>("none")
  const [rescheduleDate, setRescheduleDate] = useState(TODAY_ISO)
  const [rescheduleTime, setRescheduleTime] = useState("09:00")
  const [cancelReason, setCancelReason] = useState("")
  const [noShowReason, setNoShowReason] = useState("")
  const [prevId, setPrevId] = useState<string | null>(null)

  // Reset each time a different appointment is opened — adjusting state during
  // render rather than in an effect, since Sheet's onOpenChange only fires on
  // user-driven open/close, not when the parent sets `appointment` externally.
  const currentId = appointment?.id ?? null
  if (currentId !== prevId) {
    setPrevId(currentId)
    setPanel("none")
    setRescheduleDate(appointment?.dateISO ?? TODAY_ISO)
    setRescheduleTime(appointment?.startTime ?? "09:00")
    setCancelReason("")
    setNoShowReason("")
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPanel("none")
    onOpenChange(open)
  }

  function handleConfirm() {
    if (!appointment) return
    updateAppointmentStatus(isLarry, appointment.id, "Confirmed")
    toast.success("Appointment confirmed")
    onChanged()
  }

  function handleAttended() {
    if (!appointment) return
    updateAppointmentStatus(isLarry, appointment.id, "Attended")
    toast.success("Marked attended")
    onChanged()
  }

  function handleReminder() {
    toast.success("Reminder sent")
  }

  function handleRescheduleSubmit() {
    if (!appointment) return
    rescheduleAppointment(isLarry, appointment.id, rescheduleDate, rescheduleTime)
    toast.success("Appointment rescheduled", {
      description: `${formatDateDisplay(rescheduleDate)} at ${rescheduleTime}.`,
    })
    setPanel("none")
    onChanged()
  }

  function handleCancelSubmit() {
    if (!appointment) return
    if (!cancelReason.trim()) {
      toast.error("Add a reason for the cancellation.")
      return
    }
    updateAppointmentStatus(isLarry, appointment.id, "Cancelled", { cancelReason: cancelReason.trim() })
    toast.success("Appointment cancelled")
    setPanel("none")
    onChanged()
  }

  function handleNoShowSubmit() {
    if (!appointment) return
    if (!noShowReason.trim()) {
      toast.error("Add a reason for the no-show.")
      return
    }
    updateAppointmentStatus(isLarry, appointment.id, "No-show", { noShowReason: noShowReason.trim() })
    toast.success("Marked no-show")
    setPanel("none")
    onChanged()
  }

  function handleCreateQuotation() {
    if (!appointment) return
    const params = new URLSearchParams({
      fromAppointmentId: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
    })
    router.push(`/estimator/quotations/new?${params.toString()}`)
  }

  const canConfirm = appointment?.status === "Scheduled"
  const canMarkOutcome = appointment?.status === "Scheduled" || appointment?.status === "Confirmed"
  const canReschedule = appointment?.status !== "Attended"
  const canCancel = appointment?.status === "Scheduled" || appointment?.status === "Confirmed"
  const canRemind = appointment?.status === "Scheduled" || appointment?.status === "Confirmed"
  const canCreateQuotation = appointment?.status === "Attended" && !appointment.quotationId

  const rescheduleWithinHours = appointment
    ? isWithinWorkingHours(appointment.staffId, rescheduleDate, rescheduleTime, appointment.durationMinutes)
    : true
  const rescheduleBlocked = appointment ? isBlockedDate(appointment.staffId, rescheduleDate) : undefined

  return (
    <Sheet open={appointment !== null} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        {appointment && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{appointment.customerName}</SheetTitle>
              <SheetDescription>
                {appointment.serviceType} · {formatDateDisplay(appointment.dateISO)} ·{" "}
                {formatTimeRange(appointment.startTime, appointment.durationMinutes)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge label={appointment.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{appointment.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span>{appointment.serviceType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Staff</span>
                  <span>{appointment.staffName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date &amp; time</span>
                  <span className="text-right">
                    {formatDateDisplay(appointment.dateISO)}, {formatTimeRange(appointment.startTime, appointment.durationMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-right">
                    {appointment.locationType === "At shop" ? "At shop" : appointment.address}
                  </span>
                </div>
                {appointment.status === "No-show" && appointment.noShowReason && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">No-show reason</span>
                    <span className="text-right font-medium text-destructive">{appointment.noShowReason}</span>
                  </div>
                )}
                {appointment.status === "Cancelled" && appointment.cancelReason && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cancel reason</span>
                    <span className="text-right font-medium text-destructive">{appointment.cancelReason}</span>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p>{appointment.notes}</p>
                </div>
              )}

              {appointment.status === "Attended" && appointment.quotationId && (
                <p className="text-sm text-muted-foreground">
                  Quotation{" "}
                  <a href={`/estimator/quotations?highlight=${appointment.quotationId}`} className="text-primary hover:underline">
                    {appointment.quotationId}
                  </a>{" "}
                  created from this appointment.
                </p>
              )}

              {panel === "reschedule" && (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Reschedule</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="resch-date">New date</Label>
                      <Input
                        id="resch-date"
                        type="date"
                        value={rescheduleDate}
                        onChange={(event) => setRescheduleDate(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="resch-time">New start time</Label>
                      <Input
                        id="resch-time"
                        type="time"
                        value={rescheduleTime}
                        onChange={(event) => setRescheduleTime(event.target.value)}
                      />
                    </div>
                  </div>
                  {!rescheduleWithinHours && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                      <span>Outside {appointment.staffName}&apos;s working hours — booking anyway.</span>
                    </div>
                  )}
                  {rescheduleBlocked && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {appointment.staffName} has a blocked date{rescheduleBlocked.note ? ` (${rescheduleBlocked.note})` : ""} — booking anyway.
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPanel("none")}>
                      Back
                    </Button>
                    <Button size="sm" onClick={handleRescheduleSubmit}>
                      Confirm reschedule
                    </Button>
                  </div>
                </div>
              )}

              {panel === "cancel" && (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Cancel appointment</p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cancel-reason">Reason</Label>
                    <Textarea
                      id="cancel-reason"
                      rows={2}
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      placeholder="e.g. Customer asked to reschedule to next month"
                    />
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPanel("none")}>
                      Back
                    </Button>
                    <div className="flex flex-col items-end gap-1">
                      {!cancelReason.trim() && <p className="text-xs text-muted-foreground">Needs a reason</p>}
                      <Button variant="destructive" size="sm" onClick={handleCancelSubmit} disabled={!cancelReason.trim()}>
                        Confirm cancellation
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {panel === "noshow" && (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Mark no-show</p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="noshow-reason">Reason</Label>
                    <Textarea
                      id="noshow-reason"
                      rows={2}
                      value={noShowReason}
                      onChange={(event) => setNoShowReason(event.target.value)}
                      placeholder="e.g. Customer did not arrive or call ahead"
                    />
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPanel("none")}>
                      Back
                    </Button>
                    <div className="flex flex-col items-end gap-1">
                      {!noShowReason.trim() && <p className="text-xs text-muted-foreground">Needs a reason</p>}
                      <Button variant="destructive" size="sm" onClick={handleNoShowSubmit} disabled={!noShowReason.trim()}>
                        Confirm no-show
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {panel === "none" && (
              <SheetFooter className="grid grid-cols-2 gap-2">
                {canCreateQuotation && (
                  <Button onClick={handleCreateQuotation} className="col-span-2">
                    Create quotation
                  </Button>
                )}
                {canConfirm && <Button onClick={handleConfirm}>Confirm</Button>}
                {canMarkOutcome && (
                  <Button variant="outline" onClick={handleAttended}>
                    Mark attended
                  </Button>
                )}
                {canMarkOutcome && (
                  <Button variant="outline" onClick={() => setPanel("noshow")}>
                    Mark no-show
                  </Button>
                )}
                {canReschedule && (
                  <Button variant="outline" onClick={() => setPanel("reschedule")}>
                    Reschedule
                  </Button>
                )}
                {canRemind && (
                  <Button variant="outline" onClick={handleReminder}>
                    Send reminder
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outline" onClick={() => setPanel("cancel")}>
                    Cancel appointment
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

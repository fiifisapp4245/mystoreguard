"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AppointmentDetailSheet } from "@/components/appointments/appointment-detail-sheet"
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog"
import { StaffAvailabilityPanel } from "@/components/appointments/staff-availability-panel"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useDemoState } from "@/hooks/use-demo-state"
import {
  getAppointmentsStore,
  getLarryAppointmentsStore,
  LARRY_STAFF_MEMBERS,
  STAFF_MEMBERS,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"
import { cn } from "@/lib/utils"

type ViewMode = "day" | "week" | "list"

function startOfWeekLocal(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDaysLocal(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function dayHeaderLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function blockClasses(status: AppointmentStatus): string {
  switch (status) {
    case "Attended":
      return "border-success/60 bg-success/10 hover:bg-success/15"
    case "No-show":
    case "Cancelled":
      return "border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:bg-muted/70"
    default:
      return "border-primary/40 bg-card hover:bg-accent/60"
  }
}

function AppointmentBlock({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) {
  const struck = appointment.status === "No-show" || appointment.status === "Cancelled"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-md border-l-4 border px-2 py-1.5 text-left text-xs shadow-xs transition-colors",
        blockClasses(appointment.status)
      )}
    >
      <span className={cn("font-medium", struck && "line-through")}>{appointment.customerName}</span>
      <span className="text-muted-foreground">
        {appointment.startTime} · {appointment.serviceType}
      </span>
    </button>
  )
}

export function AppointmentsScreen() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const staffList = isLarry ? LARRY_STAFF_MEMBERS : STAFF_MEMBERS

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    isLarry ? getLarryAppointmentsStore() : getAppointmentsStore()
  )
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setAppointments(isLarry ? getLarryAppointmentsStore() : getAppointmentsStore())
  }

  const [view, setView] = useState<ViewMode>("week")
  const [dayDate, setDayDate] = useState(TODAY_ISO)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)

  function refreshFromStore() {
    setAppointments([...(isLarry ? getLarryAppointmentsStore() : getAppointmentsStore())])
  }

  function handleChanged() {
    refreshFromStore()
    setSelected((prev) => {
      if (!prev) return prev
      const store = isLarry ? getLarryAppointmentsStore() : getAppointmentsStore()
      return store.find((a) => a.id === prev.id) ?? null
    })
  }

  const weekStart = useMemo(() => startOfWeekLocal(TODAY_ISO), [])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i)), [weekStart])

  const stats = useMemo(() => {
    const todays = appointments.filter((a) => a.dateISO === TODAY_ISO && a.status !== "Cancelled")
    const inWeek = appointments.filter((a) => weekDays.includes(a.dateISO))
    const noShowsInWeek = inWeek.filter((a) => a.status === "No-show")
    const converted = appointments.filter((a) => a.quotationId)

    return [
      { label: "Today's appointments", value: String(todays.length), caption: "as of now" },
      { label: "This week", value: String(inWeek.length), caption: "Mon–Sun" },
      { label: "No-shows", value: String(noShowsInWeek.length), caption: "this week" },
      { label: "Converted to sale", value: String(converted.length), caption: "quotation linked" },
    ]
  }, [appointments, weekDays])

  const weekAppointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const day of weekDays) {
      map.set(
        day,
        appointments.filter((a) => a.dateISO === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
      )
    }
    return map
  }, [appointments, weekDays])

  const dayAppointmentsByStaff = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const staff of staffList) {
      map.set(
        staff.id,
        appointments
          .filter((a) => a.dateISO === dayDate && a.staffId === staff.id)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
      )
    }
    return map
  }, [appointments, staffList, dayDate])

  const listAppointments = useMemo(
    () =>
      appointments
        .filter((a) => weekDays.includes(a.dateISO))
        .sort((a, b) =>
          a.dateISO === b.dateISO ? a.startTime.localeCompare(b.startTime) : a.dateISO.localeCompare(b.dateISO)
        ),
    [appointments, weekDays]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Appointments"
        subtitle="Bookings for site visits, fittings, installations, and in-shop consultations."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAvailabilityOpen(true)}>
              <Users />
              Staff availability
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus />
              New appointment
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} variant="outline">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="list">List</ToggleGroupItem>
        </ToggleGroup>

        {view === "day" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDayDate((d) => addDaysLocal(d, -1))}
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium">{dayHeaderLabel(dayDate)}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDayDate((d) => addDaysLocal(d, 1))}
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
            {dayDate !== TODAY_ISO && (
              <Button variant="ghost" size="sm" onClick={() => setDayDate(TODAY_ISO)}>
                Today
              </Button>
            )}
          </div>
        )}
      </div>

      {view === "week" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dayAppointments = weekAppointmentsByDay.get(day) ?? []
            const isToday = day === TODAY_ISO
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-2",
                  isToday && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between px-1">
                  <span className={cn("text-xs font-semibold", isToday && "text-primary")}>
                    {dayHeaderLabel(day)}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">{dayAppointments.length}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {dayAppointments.length === 0 ? (
                    <p className="px-1 text-[11px] text-muted-foreground">No appointments</p>
                  ) : (
                    dayAppointments.map((a) => (
                      <AppointmentBlock key={a.id} appointment={a} onClick={() => setSelected(a)} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === "day" && (
        <div className={cn("grid grid-cols-1 gap-3", staffList.length > 1 && "sm:grid-cols-2")}>
          {staffList.map((staff) => {
            const staffAppointments = dayAppointmentsByStaff.get(staff.id) ?? []
            return (
              <div key={staff.id} className="flex flex-col gap-2 rounded-xl border p-3">
                <p className="text-sm font-semibold">{staff.name}</p>
                <div className="flex flex-col gap-1.5">
                  {staffAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No appointments for this day.</p>
                  ) : (
                    staffAppointments.map((a) => (
                      <AppointmentBlock key={a.id} appointment={a} onClick={() => setSelected(a)} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service type</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listAppointments.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelected(a)}>
                  <TableCell>{formatDateDisplay(a.dateISO)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.startTime}</TableCell>
                  <TableCell className="font-medium">{a.customerName}</TableCell>
                  <TableCell>{a.serviceType}</TableCell>
                  <TableCell className="text-muted-foreground">{a.staffName}</TableCell>
                  <TableCell>
                    <StatusBadge label={a.status} />
                  </TableCell>
                </TableRow>
              ))}
              {listAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No appointments this week.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AppointmentDetailSheet
        appointment={selected}
        isLarry={isLarry}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={handleChanged}
      />

      <NewAppointmentDialog open={newOpen} onOpenChange={setNewOpen} isLarry={isLarry} onCreated={refreshFromStore} />

      <Sheet open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Staff availability</SheetTitle>
            <SheetDescription>Working hours and blocked-out dates per staff member.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
            <StaffAvailabilityPanel isLarry={isLarry} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

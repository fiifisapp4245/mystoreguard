import { TODAY_ISO } from "@/lib/period-utils"

export type AppointmentServiceType = "Site measurement" | "Installation" | "Consultation" | "Fitting" | "Delivery visit"
export const APPOINTMENT_SERVICE_TYPES: AppointmentServiceType[] = [
  "Site measurement", "Installation", "Consultation", "Fitting", "Delivery visit",
]

export type AppointmentStatus = "Scheduled" | "Confirmed" | "Attended" | "No-show" | "Cancelled"
export type AppointmentLocationType = "At shop" | "At customer address"

export interface AppointmentStaffMember {
  id: string
  name: string
}

export const STAFF_MEMBERS: AppointmentStaffMember[] = [
  { id: "staff-1", name: "Kesewaa Adjei" },
  { id: "staff-2", name: "Kwabena Owusu" },
]

export const LARRY_STAFF_MEMBERS: AppointmentStaffMember[] = [
  { id: "larry-staff-1", name: "Larry Ntori" },
  { id: "larry-staff-2", name: "Kwesi Mensah" },
]

export interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  serviceType: AppointmentServiceType
  staffId: string
  staffName: string
  dateISO: string
  startTime: string
  durationMinutes: number
  locationType: AppointmentLocationType
  address?: string
  notes?: string
  status: AppointmentStatus
  noShowReason?: string
  cancelReason?: string
  quotationId?: string
}

export interface StaffWorkingHours {
  staffId: string
  /** 0 = Sunday .. 6 = Saturday */
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface BlockedDate {
  id: string
  staffId: string
  dateISO: string
  note?: string
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

const WEEK_START = startOfWeek(TODAY_ISO)

// ---------------------------------------------------------------------------
// Adwoa's Provisions — sparse. A grocery store barely books appointments.
// ---------------------------------------------------------------------------

export const APPOINTMENTS_SEED: Appointment[] = [
  {
    id: "APT-101",
    customerName: "Efua Mensima",
    customerPhone: "0244112233",
    serviceType: "Consultation",
    staffId: "staff-1",
    staffName: "Kesewaa Adjei",
    dateISO: TODAY_ISO,
    startTime: "11:00",
    durationMinutes: 30,
    locationType: "At shop",
    notes: "Bulk order enquiry for a church event.",
    status: "Scheduled",
  },
]

// ---------------------------------------------------------------------------
// Larry's Curtains & Décor — the real workload for this module.
// ---------------------------------------------------------------------------

export const LARRY_APPOINTMENTS_SEED: Appointment[] = [
  {
    id: "APT-201",
    customerName: "Efe Adjetey",
    customerPhone: "0244556677",
    serviceType: "Site measurement",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 0),
    startTime: "09:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "12 Ringway Estate, East Legon",
    status: "Attended",
    quotationId: "QUO-20260701-001",
    notes: "Measuring 4 windows in the living room and 2 bedrooms.",
  },
  {
    id: "APT-202",
    customerName: "Nii Armah",
    customerPhone: "0201223344",
    serviceType: "Installation",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 0),
    startTime: "13:00",
    durationMinutes: 120,
    locationType: "At customer address",
    address: "9 Trasacco Valley, East Legon",
    status: "Confirmed",
  },
  {
    id: "APT-203",
    customerName: "Adjeley Tetteh",
    customerPhone: "0277889900",
    serviceType: "Consultation",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 1),
    startTime: "10:00",
    durationMinutes: 45,
    locationType: "At shop",
    status: "Confirmed",
  },
  {
    id: "APT-204",
    customerName: "Kofi Sarpong",
    customerPhone: "0244667788",
    serviceType: "Site measurement",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 1),
    startTime: "14:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "Airport Residential Area, House 21B",
    status: "Scheduled",
  },
  {
    id: "APT-205",
    customerName: "Abena Owusu",
    customerPhone: "0209876543",
    serviceType: "Fitting",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 1),
    startTime: "16:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "Cantonments, Close 4",
    status: "Scheduled",
  },
  {
    id: "APT-206",
    customerName: "Yaw Antwi",
    customerPhone: "0245566778",
    serviceType: "Installation",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 2),
    startTime: "09:30",
    durationMinutes: 90,
    locationType: "At customer address",
    address: "Spintex Road, near Palace Mall",
    status: "Scheduled",
  },
  {
    id: "APT-207",
    customerName: "Comfort Asare",
    customerPhone: "0201122556",
    serviceType: "Consultation",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 2),
    startTime: "11:30",
    durationMinutes: 45,
    locationType: "At shop",
    status: "No-show",
    noShowReason: "Customer did not arrive or call ahead.",
  },
  {
    id: "APT-208",
    customerName: "Kwesi Boateng",
    customerPhone: "0277001122",
    serviceType: "Consultation",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 2),
    startTime: "15:00",
    durationMinutes: 30,
    locationType: "At shop",
    status: "Scheduled",
  },
  {
    id: "APT-209",
    customerName: "Linda Quaye",
    customerPhone: "0244998877",
    serviceType: "Site measurement",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 3),
    startTime: "10:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "Dzorwulu, near the roundabout",
    status: "Scheduled",
  },
  {
    id: "APT-210",
    customerName: "Emmanuel Darko",
    customerPhone: "0209001122",
    serviceType: "Fitting",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 3),
    startTime: "13:30",
    durationMinutes: 45,
    locationType: "At customer address",
    address: "Labone, 3rd Close",
    status: "Confirmed",
  },
  {
    id: "APT-211",
    customerName: "Akosua Frimpong",
    customerPhone: "0244112288",
    serviceType: "Installation",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 3),
    startTime: "16:30",
    durationMinutes: 90,
    locationType: "At customer address",
    address: "Roman Ridge, off the main road",
    status: "Scheduled",
  },
  {
    id: "APT-212",
    customerName: "Yaa Asantewaa",
    customerPhone: "0277112233",
    serviceType: "Consultation",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 4),
    startTime: "09:00",
    durationMinutes: 30,
    locationType: "At shop",
    status: "Scheduled",
  },
  {
    id: "APT-213",
    customerName: "Ebo Whyte",
    customerPhone: "0201234567",
    serviceType: "Site measurement",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 4),
    startTime: "11:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "Adjiringanor, near the school",
    status: "Scheduled",
  },
  {
    id: "APT-214",
    customerName: "Naa Dedei",
    customerPhone: "0244887766",
    serviceType: "Fitting",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 4),
    startTime: "14:30",
    durationMinutes: 45,
    locationType: "At customer address",
    address: "Ridge, near the hospital",
    status: "Scheduled",
  },
  {
    id: "APT-215",
    customerName: "Kwame Boadu",
    customerPhone: "0277665544",
    serviceType: "Installation",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 5),
    startTime: "09:00",
    durationMinutes: 120,
    locationType: "At customer address",
    address: "Tema Community 18",
    status: "Scheduled",
  },
  {
    id: "APT-216",
    customerName: "Adjoa Mansa",
    customerPhone: "0209887766",
    serviceType: "Consultation",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 5),
    startTime: "12:00",
    durationMinutes: 30,
    locationType: "At shop",
    status: "Scheduled",
  },
  {
    id: "APT-217",
    customerName: "Kojo Antwi",
    customerPhone: "0244009988",
    serviceType: "Site measurement",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: addDays(WEEK_START, 5),
    startTime: "15:00",
    durationMinutes: 60,
    locationType: "At customer address",
    address: "Achimota, near the mall",
    status: "Scheduled",
  },
  {
    id: "APT-218",
    customerName: "Efe Adjetey",
    customerPhone: "0244556677",
    serviceType: "Fitting",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 6),
    startTime: "10:00",
    durationMinutes: 45,
    locationType: "At customer address",
    address: "12 Ringway Estate, East Legon",
    status: "Scheduled",
    notes: "Follow-up fitting after the site measurement earlier this week.",
  },
  {
    id: "APT-219",
    customerName: "Nana Ama Serwaa",
    customerPhone: "0201998877",
    serviceType: "Consultation",
    staffId: "larry-staff-2",
    staffName: "Kwesi Mensah",
    dateISO: TODAY_ISO,
    startTime: "16:00",
    durationMinutes: 30,
    locationType: "At shop",
    status: "Scheduled",
  },
  {
    id: "APT-220",
    customerName: "Isaac Owusu",
    customerPhone: "0277334455",
    serviceType: "Delivery visit",
    staffId: "larry-staff-1",
    staffName: "Larry Ntori",
    dateISO: addDays(WEEK_START, 6),
    startTime: "13:00",
    durationMinutes: 30,
    locationType: "At customer address",
    address: "Cantonments, Close 9",
    status: "Cancelled",
    cancelReason: "Customer rescheduled to next month.",
  },
]

let appointmentsStore: Appointment[] = APPOINTMENTS_SEED.map((a) => ({ ...a }))
let larryAppointmentsStore: Appointment[] = LARRY_APPOINTMENTS_SEED.map((a) => ({ ...a }))

export function getAppointmentsStore(): Appointment[] {
  return appointmentsStore
}
export function setAppointmentsStore(next: Appointment[]): void {
  appointmentsStore = next
}
export function getLarryAppointmentsStore(): Appointment[] {
  return larryAppointmentsStore
}
export function setLarryAppointmentsStore(next: Appointment[]): void {
  larryAppointmentsStore = next
}

function store(isLarry: boolean) {
  return isLarry
    ? { get: getLarryAppointmentsStore, set: setLarryAppointmentsStore }
    : { get: getAppointmentsStore, set: setAppointmentsStore }
}

function staffList(isLarry: boolean): AppointmentStaffMember[] {
  return isLarry ? LARRY_STAFF_MEMBERS : STAFF_MEMBERS
}

let apptCounter = 220

function nextAppointmentId(): string {
  apptCounter += 1
  return `APT-${apptCounter}`
}

export interface CreateAppointmentInput {
  customerName: string
  customerPhone: string
  serviceType: AppointmentServiceType
  staffId: string
  dateISO: string
  startTime: string
  durationMinutes: number
  locationType: AppointmentLocationType
  address?: string
  notes?: string
}

export function createAppointment(isLarry: boolean, input: CreateAppointmentInput): Appointment {
  const staffName = staffList(isLarry).find((s) => s.id === input.staffId)?.name ?? input.staffId
  const appointment: Appointment = { ...input, id: nextAppointmentId(), staffName, status: "Scheduled" }
  const s = store(isLarry)
  s.set([appointment, ...s.get()])
  return appointment
}

export function updateAppointmentStatus(
  isLarry: boolean,
  id: string,
  status: AppointmentStatus,
  detail?: { noShowReason?: string; cancelReason?: string }
): void {
  const s = store(isLarry)
  s.set(s.get().map((a) => (a.id === id ? { ...a, status, noShowReason: detail?.noShowReason, cancelReason: detail?.cancelReason } : a)))
}

export function rescheduleAppointment(isLarry: boolean, id: string, dateISO: string, startTime: string): void {
  const s = store(isLarry)
  s.set(s.get().map((a) => (a.id === id ? { ...a, dateISO, startTime, status: "Scheduled" } : a)))
}

export function linkQuotationToAppointment(isLarry: boolean, id: string, quotationId: string): void {
  const s = store(isLarry)
  s.set(s.get().map((a) => (a.id === id ? { ...a, quotationId } : a)))
}

// ---------------------------------------------------------------------------
// Staff availability — a warning, not a hard block, when a booking falls
// outside working hours or on a blocked-out date.
// ---------------------------------------------------------------------------

export const WORKING_HOURS: StaffWorkingHours[] = [
  { staffId: "staff-1", daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "08:00", endTime: "18:00" },
  { staffId: "staff-2", daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "08:00", endTime: "18:00" },
  { staffId: "larry-staff-1", daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "08:30", endTime: "17:30" },
  { staffId: "larry-staff-2", daysOfWeek: [2, 3, 4, 5, 6], startTime: "09:00", endTime: "17:00" },
]

export const BLOCKED_DATES: BlockedDate[] = [
  { id: "blk-1", staffId: "larry-staff-1", dateISO: addDays(WEEK_START, 6), note: "Personal day" },
]

export function isWithinWorkingHours(staffId: string, dateISO: string, startTime: string, durationMinutes: number): boolean {
  const hours = WORKING_HOURS.find((h) => h.staffId === staffId)
  if (!hours) return true
  const dayOfWeek = new Date(`${dateISO}T00:00:00`).getDay()
  if (!hours.daysOfWeek.includes(dayOfWeek)) return false
  const [sh, sm] = startTime.split(":").map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = startMinutes + durationMinutes
  const [wsh, wsm] = hours.startTime.split(":").map(Number)
  const [weh, wem] = hours.endTime.split(":").map(Number)
  return startMinutes >= wsh * 60 + wsm && endMinutes <= weh * 60 + wem
}

export function isBlockedDate(staffId: string, dateISO: string): BlockedDate | undefined {
  return BLOCKED_DATES.find((b) => b.staffId === staffId && b.dateISO === dateISO)
}

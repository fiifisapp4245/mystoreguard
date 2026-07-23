/**
 * Message — compose, automate, and review every message sent to customers
 * and staff. Platform-managed SMS credits are the default experience; an
 * SMS top-up posts an expense under Marketing automatically so the P&L
 * includes it (see lib/expenses-data.ts).
 */

import { recordExpense } from "@/lib/expenses-data"
import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"

export type MessageChannel = "SMS" | "WhatsApp"
export type MessageCategory = "Transactional" | "Promotional"
export type MessageType = "Automated" | "Manual"
export type MessageStatus = "Sent" | "Delivered" | "Failed" | "Scheduled" | "Queued"

export const MERGE_FIELDS = ["{customer name}", "{points balance}", "{amount owed}", "{store name}", "{invoice no.}", "{due date}"]

export const CHARS_PER_SEGMENT = 160

export function segmentCount(body: string): number {
  return Math.max(1, Math.ceil(body.length / CHARS_PER_SEGMENT))
}

// ---------------------------------------------------------------------------
// SMS credits
// ---------------------------------------------------------------------------

export const CREDIT_COST_GHS = 0.06
export const LOW_BALANCE_WARNING_THRESHOLD = 200
export const CREDIT_PACKAGES = [500, 1000, 5000, 10000]

export interface CreditTopUp {
  id: string
  dateISO: string
  credits: number
  amountGHS: number
  method: "Momo" | "Bank transfer" | "Card"
}

const CREDIT_TOPUPS_SEED: CreditTopUp[] = [
  { id: "topup-1", dateISO: addDaysISO(TODAY_ISO, -40), credits: 1000, amountGHS: 60, method: "Momo" },
  { id: "topup-2", dateISO: addDaysISO(TODAY_ISO, -10), credits: 500, amountGHS: 30, method: "Momo" },
]

let creditTopUpsStore: CreditTopUp[] = CREDIT_TOPUPS_SEED.map((t) => ({ ...t }))
let creditBalanceStore = 1240

export function getSmsCreditBalance(): number {
  return creditBalanceStore
}

export function getCreditTopUps(): CreditTopUp[] {
  return creditTopUpsStore
}

export function deductCredits(count: number): void {
  creditBalanceStore = Math.max(0, creditBalanceStore - count)
}

/** An SMS top-up creates an expense under Marketing automatically, so the P&L includes it. */
export function topUpCredits(credits: number, method: CreditTopUp["method"], recordedBy: string): CreditTopUp {
  const amountGHS = Math.round(credits * CREDIT_COST_GHS * 100) / 100
  const topUp: CreditTopUp = { id: `topup-${creditTopUpsStore.length + 1}-${Date.now().toString(36)}`, dateISO: TODAY_ISO, credits, amountGHS, method }
  creditTopUpsStore = [topUp, ...creditTopUpsStore]
  creditBalanceStore += credits
  recordExpense({
    dateISO: TODAY_ISO,
    category: "Marketing",
    description: `SMS credit top-up — ${credits} credits`,
    amount: amountGHS,
    paidFrom: method === "Momo" ? "Momo" : method === "Bank transfer" ? "Bank" : "Momo",
    paidTo: "SMS gateway",
    hasReceipt: false,
    recordedBy,
  })
  return topUp
}

// ---------------------------------------------------------------------------
// Quiet hours
// ---------------------------------------------------------------------------

export interface QuietHoursSettings {
  enabled: boolean
  startHour: number
  endHour: number
}

export const DEFAULT_QUIET_HOURS: QuietHoursSettings = { enabled: true, startHour: 20, endHour: 7 }

let quietHoursStore: QuietHoursSettings = { ...DEFAULT_QUIET_HOURS }

export function getQuietHours(): QuietHoursSettings {
  return quietHoursStore
}

export function setQuietHours(next: QuietHoursSettings): void {
  quietHoursStore = next
}

// ---------------------------------------------------------------------------
// SMS gateway — advanced, Prime/Ultra only (bring your own provider)
// ---------------------------------------------------------------------------

export type SmsGatewayProvider = "Hubtel" | "Africa's Talking" | "Twilio" | "Infobip" | "Other"
export const SMS_GATEWAY_PROVIDERS: SmsGatewayProvider[] = ["Hubtel", "Africa's Talking", "Twilio", "Infobip", "Other"]

export interface SmsGatewaySettings {
  useOwnGateway: boolean
  provider: SmsGatewayProvider
  apiKey: string
  apiSecret: string
  senderId: string
}

export const DEFAULT_SMS_GATEWAY_SETTINGS: SmsGatewaySettings = {
  useOwnGateway: false,
  provider: "Hubtel",
  apiKey: "",
  apiSecret: "",
  senderId: "",
}

let smsGatewaySettingsStore: SmsGatewaySettings = { ...DEFAULT_SMS_GATEWAY_SETTINGS }

export function getSmsGatewaySettings(): SmsGatewaySettings {
  return smsGatewaySettingsStore
}

export function setSmsGatewaySettings(next: SmsGatewaySettings): void {
  smsGatewaySettingsStore = next
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface MessageTemplate {
  id: string
  name: string
  body: string
  channel: MessageChannel
  category: MessageCategory
  triggerId?: string
}

export const TEMPLATES_SEED: MessageTemplate[] = [
  { id: "tpl-receipt", name: "Receipt after sale", body: "Thanks for shopping at {store name}! Your receipt total was paid in full. Come again soon.", channel: "SMS", category: "Transactional", triggerId: "trigger-receipt" },
  { id: "tpl-dispatch", name: "Delivery dispatched", body: "Hi {customer name}, your order from {store name} is on its way!", channel: "SMS", category: "Transactional", triggerId: "trigger-dispatch" },
  { id: "tpl-delivered", name: "Delivery completed", body: "Hi {customer name}, your delivery from {store name} has arrived. Enjoy!", channel: "SMS", category: "Transactional", triggerId: "trigger-delivered" },
  { id: "tpl-invoice-due", name: "Invoice due in 3 days", body: "Hi {customer name}, invoice {invoice no.} is due on {due date}. Please settle {amount owed} to avoid delay.", channel: "SMS", category: "Transactional", triggerId: "trigger-invoice-due" },
  { id: "tpl-invoice-overdue", name: "Invoice overdue", body: "Hi {customer name}, invoice {invoice no.} for {amount owed} is now overdue. Please settle as soon as possible.", channel: "SMS", category: "Transactional", triggerId: "trigger-invoice-overdue" },
  { id: "tpl-payment-received", name: "Payment received", body: "Thank you {customer name} — we've received your payment. We appreciate your business!", channel: "SMS", category: "Transactional", triggerId: "trigger-payment-received" },
  { id: "tpl-appointment", name: "Appointment reminder", body: "Hi {customer name}, reminder of your appointment with {store name} tomorrow. See you then!", channel: "SMS", category: "Transactional", triggerId: "trigger-appointment" },
  { id: "tpl-quotation-expiring", name: "Quotation expiring in 3 days", body: "Hi {customer name}, your quotation from {store name} expires soon. Let us know if you'd like to proceed.", channel: "SMS", category: "Transactional", triggerId: "trigger-quotation-expiring" },
  { id: "tpl-points-earned", name: "Points earned", body: "Hi {customer name}, you've earned points on your purchase! Balance: {points balance} points.", channel: "SMS", category: "Transactional", triggerId: "trigger-points-earned" },
  { id: "tpl-lapsed", name: "Lapsed customer", body: "Hi {customer name}, we miss you at {store name}! Come back soon for something special.", channel: "SMS", category: "Promotional", triggerId: "trigger-lapsed" },
  { id: "tpl-low-stock", name: "Low stock alert", body: "Heads up — several products are at or below reorder point at {store name}. Check Inventory.", channel: "SMS", category: "Transactional", triggerId: "trigger-low-stock" },
  { id: "tpl-day-close", name: "Day close summary", body: "Day close summary for {store name}: sales, expenses, and variance are ready to review.", channel: "SMS", category: "Transactional", triggerId: "trigger-day-close" },
  { id: "tpl-promo-weekend", name: "Weekend promo", body: "This weekend only: 15% off at {store name}! Use code SAVE15 in store.", channel: "SMS", category: "Promotional" },
  { id: "tpl-promo-birthday", name: "Birthday offer", body: "Happy birthday {customer name}! Enjoy a special discount at {store name} this month.", channel: "SMS", category: "Promotional" },
]

let templatesStore: MessageTemplate[] = TEMPLATES_SEED.map((t) => ({ ...t }))

export function getTemplatesStore(): MessageTemplate[] {
  return templatesStore
}

export function setTemplatesStore(next: MessageTemplate[]): void {
  templatesStore = next
}

export function saveTemplate(template: MessageTemplate): void {
  const exists = templatesStore.some((t) => t.id === template.id)
  templatesStore = exists ? templatesStore.map((t) => (t.id === template.id ? template : t)) : [template, ...templatesStore]
}

// ---------------------------------------------------------------------------
// Automated triggers
// ---------------------------------------------------------------------------

export interface AutomatedTrigger {
  id: string
  name: string
  templateId: string
  enabled: boolean
  channel: MessageChannel
  isStaffFacing: boolean
  sentThisMonth: number
  costThisMonth: number
}

export const AUTOMATED_TRIGGERS_SEED: AutomatedTrigger[] = [
  { id: "trigger-receipt", name: "Receipt after sale", templateId: "tpl-receipt", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 214, costThisMonth: 12.84 },
  { id: "trigger-dispatch", name: "Delivery dispatched", templateId: "tpl-dispatch", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 38, costThisMonth: 2.28 },
  { id: "trigger-delivered", name: "Delivery completed", templateId: "tpl-delivered", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 35, costThisMonth: 2.1 },
  { id: "trigger-invoice-due", name: "Invoice due in 3 days", templateId: "tpl-invoice-due", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 9, costThisMonth: 0.54 },
  { id: "trigger-invoice-overdue", name: "Invoice overdue", templateId: "tpl-invoice-overdue", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 6, costThisMonth: 0.36 },
  { id: "trigger-payment-received", name: "Payment received (thank you)", templateId: "tpl-payment-received", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 12, costThisMonth: 0.72 },
  { id: "trigger-appointment", name: "Appointment reminder 24h before", templateId: "tpl-appointment", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 18, costThisMonth: 1.08 },
  { id: "trigger-quotation-expiring", name: "Quotation expiring in 3 days", templateId: "tpl-quotation-expiring", enabled: false, channel: "SMS", isStaffFacing: false, sentThisMonth: 0, costThisMonth: 0 },
  { id: "trigger-points-earned", name: "Points earned after purchase", templateId: "tpl-points-earned", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 168, costThisMonth: 10.08 },
  { id: "trigger-lapsed", name: "Lapsed customer after 60 days", templateId: "tpl-lapsed", enabled: true, channel: "SMS", isStaffFacing: false, sentThisMonth: 8, costThisMonth: 0.48 },
  { id: "trigger-low-stock", name: "Low stock alert", templateId: "tpl-low-stock", enabled: true, channel: "SMS", isStaffFacing: true, sentThisMonth: 4, costThisMonth: 0.24 },
  { id: "trigger-day-close", name: "Day close summary (to owner)", templateId: "tpl-day-close", enabled: true, channel: "SMS", isStaffFacing: true, sentThisMonth: 21, costThisMonth: 1.26 },
]

let automatedTriggersStore: AutomatedTrigger[] = AUTOMATED_TRIGGERS_SEED.map((t) => ({ ...t }))

export function getAutomatedTriggersStore(): AutomatedTrigger[] {
  return automatedTriggersStore
}

export function setAutomatedTriggersStore(next: AutomatedTrigger[]): void {
  automatedTriggersStore = next
}

export function toggleTrigger(id: string, enabled: boolean): void {
  automatedTriggersStore = automatedTriggersStore.map((t) => (t.id === id ? { ...t, enabled } : t))
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export interface CampaignRecipient {
  name: string
  phone: string
  status: MessageStatus
}

export interface MessageRecord {
  id: string
  dateISO: string
  timeLabel: string
  recipientName: string
  recipientPhone: string
  channel: MessageChannel
  type: MessageType
  triggerOrCampaign: string
  status: MessageStatus
  segments: number
  cost: number
  failureReason?: string
  campaignRecipients?: CampaignRecipient[]
}

const NAMES = ["Kwame Mensah", "Ama Owusu", "Kofi Agyemang", "Abena Asante", "Yaw Boadi", "Efua Darko", "Kwabena Owusu", "Akosua Frimpong", "Nana Yeboah", "Adjoa Boateng"]

function buildHistorySeed(): MessageRecord[] {
  const records: MessageRecord[] = []
  const triggerCycle = AUTOMATED_TRIGGERS_SEED.filter((t) => t.enabled)

  for (let i = 0; i < 50; i++) {
    const trigger = triggerCycle[i % triggerCycle.length]
    const daysAgo = i % 30
    const failed = i % 17 === 0
    records.push({
      id: `msg-${i + 1}`,
      dateISO: addDaysISO(TODAY_ISO, -daysAgo),
      timeLabel: `${9 + (i % 8)}:${(i % 6) * 10 || "00"} ${i % 2 === 0 ? "am" : "pm"}`,
      recipientName: NAMES[i % NAMES.length],
      recipientPhone: `024${String(1000000 + i * 173).slice(0, 7)}`,
      channel: "SMS",
      type: "Automated",
      triggerOrCampaign: trigger.name,
      status: failed ? "Failed" : "Delivered",
      segments: 1,
      cost: CREDIT_COST_GHS,
      failureReason: failed ? "Invalid number" : undefined,
    })
  }

  // A manual campaign send that expands to individual recipients.
  const campaignRecipients: CampaignRecipient[] = NAMES.slice(0, 6).map((name, i) => ({
    name,
    phone: `020${String(2000000 + i * 211).slice(0, 7)}`,
    status: i === 5 ? "Failed" : "Delivered",
  }))
  records.push({
    id: "msg-campaign-1",
    dateISO: addDaysISO(TODAY_ISO, -4),
    timeLabel: "10:00 am",
    recipientName: `${campaignRecipients.length} recipients`,
    recipientPhone: "—",
    channel: "SMS",
    type: "Manual",
    triggerOrCampaign: "Weekend promo — SAVE15",
    status: "Delivered",
    segments: 1,
    cost: CREDIT_COST_GHS * campaignRecipients.length,
    campaignRecipients,
  })

  // Two more manual, unambiguously failed sends.
  records.push(
    { id: "msg-manual-fail-1", dateISO: addDaysISO(TODAY_ISO, -2), timeLabel: "2:15 pm", recipientName: "Kojo Antwi", recipientPhone: "0244009988", channel: "SMS", type: "Manual", triggerOrCampaign: "Manual message", status: "Failed", segments: 1, cost: 0, failureReason: "Network timeout" },
    { id: "msg-manual-fail-2", dateISO: addDaysISO(TODAY_ISO, -1), timeLabel: "4:40 pm", recipientName: "Linda Quaye", recipientPhone: "0244998877", channel: "SMS", type: "Manual", triggerOrCampaign: "Manual message", status: "Failed", segments: 1, cost: 0, failureReason: "Invalid number" }
  )

  return records
}

let messagesStore: MessageRecord[] = buildHistorySeed()

export function getMessagesStore(): MessageRecord[] {
  return messagesStore
}

export function setMessagesStore(next: MessageRecord[]): void {
  messagesStore = next
}

export function retryMessage(id: string): void {
  messagesStore = messagesStore.map((m) => (m.id === id ? { ...m, status: "Delivered", failureReason: undefined } : m))
}

export interface SendMessageInput {
  recipientName: string
  recipientPhone: string
  channel: MessageChannel
  type: MessageType
  triggerOrCampaign: string
  segments: number
}

export function sendMessage(input: SendMessageInput): MessageRecord {
  const cost = Math.round(CREDIT_COST_GHS * input.segments * 100) / 100
  const record: MessageRecord = {
    id: `msg-new-${messagesStore.length + 1}-${Date.now().toString(36)}`,
    dateISO: TODAY_ISO,
    timeLabel: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    channel: input.channel,
    type: input.type,
    triggerOrCampaign: input.triggerOrCampaign,
    status: "Sent",
    segments: input.segments,
    cost,
  }
  messagesStore = [record, ...messagesStore]
  deductCredits(input.segments)
  return record
}

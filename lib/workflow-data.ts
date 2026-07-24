import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"
import { appendAuditLogEntry } from "@/lib/audit-log-data"
import type { StaffRole } from "@/lib/mock-data"

/**
 * Workflow — tasks the system raises itself from things it already knows
 * (stock hit reorder point, delivery failed, invoice overdue, day closed
 * short), not a generic to-do list. Manual tasks and checklists exist too,
 * but automatic tasks are the substance of this module; Rules is where they
 * are configured, not Settings, because rules ARE the module's content.
 */

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent"
export type TaskStatus = "Open" | "Snoozed" | "Completed" | "Cancelled"
export type TaskSource = "Automatic" | "Manual"
export type DueBucket = "Overdue" | "Today" | "This week" | "Later" | "No due date"

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Normal", "High", "Urgent"]
export const TASK_STATUSES: TaskStatus[] = ["Open", "Snoozed", "Completed", "Cancelled"]

/** Drives which icon a task row shows — assigned by the UI layer, not this data file. */
export type TaskCategory =
  | "stock"
  | "purchase-order"
  | "delivery"
  | "invoice"
  | "credit"
  | "stocktake"
  | "day-close"
  | "transfer"
  | "quotation"
  | "override"
  | "supplier-bill"
  | "loyalty"
  | "expense"
  | "checklist"
  | "manual"

export interface TaskComment {
  id: string
  author: string
  dateISO: string
  time: string
  text: string
}

export interface TaskActivityEntry {
  id: string
  dateISO: string
  time: string
  text: string
}

export interface ChecklistSubItem {
  id: string
  label: string
  done: boolean
  requiresValue?: boolean
  value?: string
  note?: string
}

export interface RelatedRecord {
  label: string
  href: string
}

export interface WorkflowTask {
  id: string
  title: string
  description: string
  category: TaskCategory
  source: TaskSource
  ruleKey?: string
  assigneeRole: StaffRole
  assigneeName: string
  priority: TaskPriority
  status: TaskStatus
  dueDateISO?: string
  createdDateISO: string
  relatedRecord?: RelatedRecord
  comments: TaskComment[]
  activity: TaskActivityEntry[]
  completedDateISO?: string
  completedBy?: string
  completionNote?: string
  snoozedUntilISO?: string
  checklistTemplateId?: string
  subItems?: ChecklistSubItem[]
}

const ASSIGNEE_BY_ROLE: Record<StaffRole, string> = {
  Owner: "Kesewaa Adjei",
  Manager: "Kwabena Owusu",
  Cashier: "Adjoa Boateng",
  Stockkeeper: "Yaw Boadi",
}

let activitySequence = 0

function activity(dateISO: string, time: string, text: string): TaskActivityEntry {
  activitySequence += 1
  return { id: `act-${dateISO}-${activitySequence}`, dateISO, time, text }
}

// ---------------------------------------------------------------------------
// Rules — where automatic tasks are configured.
// ---------------------------------------------------------------------------

export interface WorkflowRule {
  key: string
  label: string
  enabled: boolean
  assigneeRole: StaffRole
  priority: TaskPriority
  dueOffsetLabel: string
  titleTemplate: string
  notifyBySms: boolean
  tasksRaisedThisMonth: number
}

export const WORKFLOW_RULES_SEED: WorkflowRule[] = [
  {
    key: "reorder-point",
    label: "Product reaches reorder point",
    enabled: true,
    assigneeRole: "Stockkeeper",
    priority: "Normal",
    dueOffsetLabel: "2 days",
    titleTemplate: "Reorder {product} — at or below reorder point",
    notifyBySms: false,
    tasksRaisedThisMonth: 11,
  },
  {
    key: "po-overdue",
    label: "Purchase order overdue from supplier",
    enabled: true,
    assigneeRole: "Manager",
    priority: "High",
    dueOffsetLabel: "Immediate",
    titleTemplate: "Chase overdue purchase order {document no.}",
    notifyBySms: false,
    tasksRaisedThisMonth: 4,
  },
  {
    key: "delivery-failed",
    label: "Delivery failed",
    enabled: true,
    assigneeRole: "Manager",
    priority: "High",
    dueOffsetLabel: "Same day",
    titleTemplate: "Follow up failed delivery to {customer}",
    notifyBySms: false,
    tasksRaisedThisMonth: 3,
  },
  {
    key: "delivery-unassigned",
    label: "Delivery unassigned 24h before scheduled date",
    enabled: true,
    assigneeRole: "Manager",
    priority: "Urgent",
    dueOffsetLabel: "Same day",
    titleTemplate: "Assign a rider — {document no.} ships tomorrow",
    notifyBySms: true,
    tasksRaisedThisMonth: 2,
  },
  {
    key: "invoice-overdue",
    label: "Invoice 30 days overdue",
    enabled: true,
    assigneeRole: "Owner",
    priority: "High",
    dueOffsetLabel: "3 days",
    titleTemplate: "Chase overdue invoice {document no.} — {amount}",
    notifyBySms: false,
    tasksRaisedThisMonth: 5,
  },
  {
    key: "credit-sale-overdue",
    label: "Credit sale 30 days overdue",
    enabled: true,
    assigneeRole: "Owner",
    priority: "High",
    dueOffsetLabel: "3 days",
    titleTemplate: "Follow up overdue credit sale — {customer}",
    notifyBySms: false,
    tasksRaisedThisMonth: 5,
  },
  {
    key: "stocktake-variance",
    label: "Stocktake variance over GHS 100",
    enabled: true,
    assigneeRole: "Owner",
    priority: "Normal",
    dueOffsetLabel: "2 days",
    titleTemplate: "Review stocktake variance — {document no.}",
    notifyBySms: false,
    tasksRaisedThisMonth: 1,
  },
  {
    key: "day-close-variance",
    label: "Day closed with variance over GHS 50",
    enabled: true,
    assigneeRole: "Owner",
    priority: "High",
    dueOffsetLabel: "Next day",
    titleTemplate: "Review cash variance — {amount} short",
    notifyBySms: true,
    tasksRaisedThisMonth: 2,
  },
  {
    key: "transfer-discrepancy",
    label: "Transfer discrepancy recorded",
    enabled: true,
    assigneeRole: "Manager",
    priority: "Normal",
    dueOffsetLabel: "2 days",
    titleTemplate: "Investigate transfer discrepancy — {document no.}",
    notifyBySms: false,
    tasksRaisedThisMonth: 2,
  },
  {
    key: "quotation-expiring",
    label: "Quotation expiring in 3 days",
    enabled: true,
    assigneeRole: "Manager",
    priority: "Normal",
    dueOffsetLabel: "Same day",
    titleTemplate: "Follow up quotation {document no.} before it expires",
    notifyBySms: false,
    tasksRaisedThisMonth: 3,
  },
  {
    key: "override-above-20",
    label: "Manager override applied above 20%",
    enabled: true,
    assigneeRole: "Owner",
    priority: "Normal",
    dueOffsetLabel: "Next day",
    titleTemplate: "Review large discount override — {document no.}",
    notifyBySms: false,
    tasksRaisedThisMonth: 3,
  },
  {
    key: "supplier-bill-due",
    label: "Supplier bill due this week",
    enabled: true,
    assigneeRole: "Owner",
    priority: "Normal",
    dueOffsetLabel: "On due date",
    titleTemplate: "Pay supplier bill — {customer} — {amount}",
    notifyBySms: false,
    tasksRaisedThisMonth: 4,
  },
  {
    key: "customer-lapsed",
    label: "Customer lapsed 60 days (Ultra)",
    enabled: true,
    assigneeRole: "Manager",
    priority: "Low",
    dueOffsetLabel: "7 days",
    titleTemplate: "Win back lapsed customers — {customer}",
    notifyBySms: false,
    tasksRaisedThisMonth: 2,
  },
  {
    key: "expense-pending",
    label: "Expense pending approval over 48h",
    enabled: true,
    assigneeRole: "Owner",
    priority: "Normal",
    dueOffsetLabel: "Immediate",
    titleTemplate: "Approve or reject pending expense — {amount}",
    notifyBySms: false,
    tasksRaisedThisMonth: 6,
  },
]

let rulesStore: WorkflowRule[] = WORKFLOW_RULES_SEED.map((r) => ({ ...r }))

export function getWorkflowRules(): WorkflowRule[] {
  return rulesStore
}

export function toggleWorkflowRule(key: string): void {
  rulesStore = rulesStore.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r))
}

export function updateWorkflowRule(key: string, patch: Partial<WorkflowRule>): void {
  rulesStore = rulesStore.map((r) => (r.key === key ? { ...r, ...patch } : r))
}

// ---------------------------------------------------------------------------
// Checklists — reusable routines that instantiate as tasks with sub-items.
// ---------------------------------------------------------------------------

export type ChecklistSchedule = "Daily" | "Weekly" | "Monthly" | "On demand"

export interface ChecklistStepDef {
  id: string
  instruction: string
  note?: string
  requiresValue?: boolean
  linkedHref?: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  steps: ChecklistStepDef[]
  schedule: ChecklistSchedule
  timeOfDay?: string
  assigneeRole: StaffRole
  assigneeName?: string
}

export const CHECKLIST_TEMPLATES_SEED: ChecklistTemplate[] = [
  {
    id: "chk-opening",
    name: "Opening the shop",
    description: "The routine to run before the first customer walks in.",
    schedule: "Daily",
    timeOfDay: "7:30 AM",
    assigneeRole: "Cashier",
    steps: [
      { id: "s1", instruction: "Unlock and disarm the shop" },
      { id: "s2", instruction: "Switch on lights, fridges, and freezers" },
      { id: "s3", instruction: "Count the opening float", requiresValue: true, linkedHref: "/money/day-close" },
      { id: "s4", instruction: "Check overnight deliveries at the door" },
      { id: "s5", instruction: "Wipe counters and sweep the entrance" },
      { id: "s6", instruction: "Confirm the register and card machine are online" },
      { id: "s7", instruction: "Review yesterday's handover notes" },
    ],
  },
  {
    id: "chk-closing",
    name: "Closing the shop",
    description: "End-of-day routine, finishing with the cash count.",
    schedule: "Daily",
    timeOfDay: "8:00 PM",
    assigneeRole: "Cashier",
    steps: [
      { id: "s1", instruction: "Stop taking new customers at the door" },
      { id: "s2", instruction: "Reconcile any held or on-hold sales" },
      { id: "s3", instruction: "Tidy shelves and restock the front counter" },
      { id: "s4", instruction: "Empty and secure the bins" },
      { id: "s5", instruction: "Switch off fridges/freezers not needed overnight" },
      { id: "s6", instruction: "Record cash counted", requiresValue: true, linkedHref: "/money/day-close" },
      { id: "s7", instruction: "Note any variance reason" },
      { id: "s8", instruction: "Lock up and arm the shop" },
    ],
  },
  {
    id: "chk-receiving",
    name: "Receiving a delivery",
    description: "What to check before signing for stock coming in.",
    schedule: "On demand",
    assigneeRole: "Stockkeeper",
    steps: [
      { id: "s1", instruction: "Match the delivery against the purchase order" },
      { id: "s2", instruction: "Check quantities carton by carton", requiresValue: true },
      { id: "s3", instruction: "Inspect for damage or short-dated stock" },
      { id: "s4", instruction: "Record any discrepancy with a reason" },
      { id: "s5", instruction: "Confirm the supplier bill amount matches" },
      { id: "s6", instruction: "Move stock to its shelf or the warehouse" },
    ],
  },
  {
    id: "chk-weekly-stocktake",
    name: "Weekly stocktake",
    description: "A lighter cycle count to catch problems between full counts.",
    schedule: "Weekly",
    timeOfDay: "Sunday, 6:00 PM",
    assigneeRole: "Stockkeeper",
    steps: [
      { id: "s1", instruction: "Pick this week's high-value or fast-moving lines" },
      { id: "s2", instruction: "Count with blind counting on" },
      { id: "s3", instruction: "Enter counts against the system snapshot", requiresValue: true },
      { id: "s4", instruction: "Flag any variance for review" },
      { id: "s5", instruction: "Post the count and note what you'll watch next week" },
    ],
  },
  {
    id: "chk-month-end",
    name: "Month-end review",
    description: "Closing the books on the month before moving into the next one.",
    schedule: "Monthly",
    timeOfDay: "Last day, 6:00 PM",
    assigneeRole: "Owner",
    steps: [
      { id: "s1", instruction: "Review profit & loss for the month" },
      { id: "s2", instruction: "Check expenses are all approved or rejected" },
      { id: "s3", instruction: "Reconcile money owed to you and by you" },
      { id: "s4", instruction: "Review stock valuation for anything unusual" },
      { id: "s5", instruction: "Check for open tasks piling up" },
      { id: "s6", instruction: "Note one thing to improve next month", requiresValue: true },
    ],
  },
]

let checklistTemplatesStore: ChecklistTemplate[] = CHECKLIST_TEMPLATES_SEED.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) }))

export function getChecklistTemplates(): ChecklistTemplate[] {
  return checklistTemplatesStore
}

export function addChecklistTemplate(template: ChecklistTemplate): void {
  checklistTemplatesStore = [...checklistTemplatesStore, template]
}

export function updateChecklistTemplate(id: string, patch: Partial<ChecklistTemplate>): void {
  checklistTemplatesStore = checklistTemplatesStore.map((t) => (t.id === id ? { ...t, ...patch } : t))
}

export interface ChecklistRunRecord {
  id: string
  templateId: string
  dateISO: string
  completed: boolean
}

/** 30 days of run history per template — the closing checklist deliberately sits at 71% so the warning colour shows. */
function buildRunHistory(templateId: string, completionRate: number): ChecklistRunRecord[] {
  const runs: ChecklistRunRecord[] = []
  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    // Deterministic pseudo-pattern: fails roughly every Nth day based on the target rate, not random (keeps SSR/CSR identical).
    const failEvery = Math.max(2, Math.round(1 / (1 - completionRate / 100)))
    const completed = daysAgo % failEvery !== 0
    runs.push({ id: `run-${templateId}-${daysAgo}`, templateId, dateISO: addDaysISO(TODAY_ISO, -daysAgo), completed })
  }
  return runs
}

export const CHECKLIST_RUNS_SEED: ChecklistRunRecord[] = [
  ...buildRunHistory("chk-opening", 93),
  ...buildRunHistory("chk-closing", 71),
  ...buildRunHistory("chk-receiving", 88),
  ...buildRunHistory("chk-weekly-stocktake", 100),
  ...buildRunHistory("chk-month-end", 100),
]

const checklistRunsStore: ChecklistRunRecord[] = [...CHECKLIST_RUNS_SEED]

export function getChecklistRuns(templateId: string): ChecklistRunRecord[] {
  return checklistRunsStore.filter((r) => r.templateId === templateId)
}

export function completionRateFor(templateId: string): number {
  const runs = getChecklistRuns(templateId)
  if (runs.length === 0) return 100
  const completed = runs.filter((r) => r.completed).length
  return Math.round((completed / runs.length) * 100)
}

export function lastRunFor(templateId: string): ChecklistRunRecord | undefined {
  return [...getChecklistRuns(templateId)].sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

function buildTask(input: {
  id: string
  title: string
  description: string
  category: TaskCategory
  source: TaskSource
  ruleKey?: string
  assigneeRole: StaffRole
  priority: TaskPriority
  status?: TaskStatus
  dueDaysFromToday?: number
  createdDaysAgo: number
  relatedRecord?: RelatedRecord
  completedDaysAgo?: number
  completedBy?: string
  completionNote?: string
  checklistTemplateId?: string
  subItems?: ChecklistSubItem[]
}): WorkflowTask {
  const createdDateISO = addDaysISO(TODAY_ISO, -input.createdDaysAgo)
  const dueDateISO = input.dueDaysFromToday !== undefined ? addDaysISO(TODAY_ISO, input.dueDaysFromToday) : undefined
  const status: TaskStatus = input.status ?? (input.completedDaysAgo !== undefined ? "Completed" : "Open")
  const completedDateISO = input.completedDaysAgo !== undefined ? addDaysISO(TODAY_ISO, -input.completedDaysAgo) : undefined

  const activityLog: TaskActivityEntry[] = [
    activity(createdDateISO, "9:00 AM", input.source === "Automatic" ? "Created automatically by a workflow rule" : `Created by ${ASSIGNEE_BY_ROLE.Owner}`),
  ]
  if (completedDateISO) {
    activityLog.push(activity(completedDateISO, "5:00 PM", `Completed by ${input.completedBy ?? ASSIGNEE_BY_ROLE[input.assigneeRole]}`))
  }

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    source: input.source,
    ruleKey: input.ruleKey,
    assigneeRole: input.assigneeRole,
    assigneeName: ASSIGNEE_BY_ROLE[input.assigneeRole],
    priority: input.priority,
    status,
    dueDateISO,
    createdDateISO,
    relatedRecord: input.relatedRecord,
    comments: [],
    activity: activityLog,
    completedDateISO,
    completedBy: input.completedBy,
    completionNote: input.completionNote,
    checklistTemplateId: input.checklistTemplateId,
    subItems: input.subItems,
  }
}

export const WORKFLOW_TASKS_SEED: WorkflowTask[] = [
  // Reorder point (Stockkeeper)
  buildTask({
    id: "task-1",
    title: "Reorder Milo 400g tin — at or below reorder point",
    description: "Milo 400g tin has reached its reorder point (15 cartons). Raise a purchase order to Nestlé's distributor before the shelf runs out.",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "Normal",
    dueDaysFromToday: 2,
    createdDaysAgo: 1,
    relatedRecord: { label: "Milo 400g tin", href: "/inventory/products" },
  }),
  buildTask({
    id: "task-2",
    title: "Reorder Frytol Cooking Oil 5L — at or below reorder point",
    description: "Frytol Cooking Oil 5L has reached its reorder point (25 cartons).",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "Normal",
    dueDaysFromToday: 0,
    createdDaysAgo: 2,
    relatedRecord: { label: "Frytol Cooking Oil 5L", href: "/inventory/products" },
  }),
  buildTask({
    id: "task-3",
    title: "Reorder Key Soap — at or below reorder point",
    description: "Key Soap has reached its reorder point (25 cartons) and is now overdue for a purchase order.",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "High",
    dueDaysFromToday: -2,
    createdDaysAgo: 4,
    relatedRecord: { label: "Key Soap", href: "/inventory/products" },
  }),
  buildTask({
    id: "task-4",
    title: "Reorder Voltic Water 750ml — at or below reorder point",
    description: "Voltic Water 750ml reached its reorder point; a purchase order was raised.",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "Normal",
    createdDaysAgo: 8,
    completedDaysAgo: 3,
    relatedRecord: { label: "Voltic Water 750ml", href: "/inventory/products" },
  }),
  buildTask({
    id: "task-5",
    title: "Reorder Coca-Cola 500ml — at or below reorder point",
    description: "Coca-Cola 500ml has reached its reorder point (30 crates).",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "Low",
    dueDaysFromToday: 6,
    createdDaysAgo: 1,
    relatedRecord: { label: "Coca-Cola 500ml", href: "/inventory/products" },
  }),
  buildTask({
    id: "task-6",
    title: "Reorder Geisha Sardines — at or below reorder point",
    description: "Geisha Sardines has reached its reorder point (20 cartons).",
    category: "stock",
    source: "Automatic",
    ruleKey: "reorder-point",
    assigneeRole: "Stockkeeper",
    priority: "Normal",
    createdDaysAgo: 6,
    completedDaysAgo: 5,
    relatedRecord: { label: "Geisha Sardines", href: "/inventory/products" },
  }),

  // Purchase order overdue (Manager)
  buildTask({
    id: "task-7",
    title: "Chase overdue purchase order PO-1039",
    description: "PO-1039 to the supplier passed its expected delivery date and hasn't been received yet. Call the supplier to confirm dispatch.",
    category: "purchase-order",
    source: "Automatic",
    ruleKey: "po-overdue",
    assigneeRole: "Manager",
    priority: "High",
    dueDaysFromToday: -1,
    createdDaysAgo: 3,
    relatedRecord: { label: "PO-1039", href: "/inventory/purchase-orders" },
  }),
  buildTask({
    id: "task-8",
    title: "Chase overdue purchase order PO-1041",
    description: "PO-1041 is now past its expected date with goods still outstanding.",
    category: "purchase-order",
    source: "Automatic",
    ruleKey: "po-overdue",
    assigneeRole: "Manager",
    priority: "High",
    dueDaysFromToday: 0,
    createdDaysAgo: 1,
    relatedRecord: { label: "PO-1041", href: "/inventory/purchase-orders" },
  }),

  // Delivery failed / unassigned (Manager)
  buildTask({
    id: "task-9",
    title: "Follow up failed delivery to Kwame Mensah",
    description: "DEL-1041 failed — the customer was not available at the gate. Rebook the delivery or arrange collection.",
    category: "delivery",
    source: "Automatic",
    ruleKey: "delivery-failed",
    assigneeRole: "Manager",
    priority: "High",
    dueDaysFromToday: -2,
    createdDaysAgo: 2,
    relatedRecord: { label: "DEL-1041", href: "/deliveries" },
  }),
  buildTask({
    id: "task-10",
    title: "Assign a rider — DEL-1046 ships tomorrow",
    description: "DEL-1046 is scheduled for tomorrow and still has no rider assigned.",
    category: "delivery",
    source: "Automatic",
    ruleKey: "delivery-unassigned",
    assigneeRole: "Manager",
    priority: "Urgent",
    dueDaysFromToday: 0,
    createdDaysAgo: 0,
    relatedRecord: { label: "DEL-1046", href: "/deliveries" },
  }),

  // Invoice overdue (Owner)
  buildTask({
    id: "task-11",
    title: "Chase overdue invoice INV-2038 — GHS 2,057.00",
    description: "INV-2038 is over 30 days overdue with a balance of GHS 2,057.00 outstanding.",
    category: "invoice",
    source: "Automatic",
    ruleKey: "invoice-overdue",
    assigneeRole: "Owner",
    priority: "High",
    dueDaysFromToday: -5,
    createdDaysAgo: 8,
    relatedRecord: { label: "INV-2038", href: "/money/money-owed" },
  }),
  buildTask({
    id: "task-12",
    title: "Chase overdue invoice INV-2040 — GHS 960.00",
    description: "INV-2040 has passed 30 days overdue.",
    category: "invoice",
    source: "Automatic",
    ruleKey: "invoice-overdue",
    assigneeRole: "Owner",
    priority: "High",
    dueDaysFromToday: 2,
    createdDaysAgo: 1,
    relatedRecord: { label: "INV-2040", href: "/money/money-owed" },
  }),
  buildTask({
    id: "task-13",
    title: "Chase overdue invoice INV-2033 — GHS 1,120.00",
    description: "This invoice was chased and settled.",
    category: "invoice",
    source: "Automatic",
    ruleKey: "invoice-overdue",
    assigneeRole: "Owner",
    priority: "High",
    createdDaysAgo: 12,
    completedDaysAgo: 4,
    completionNote: "Customer paid in full by Momo.",
    relatedRecord: { label: "INV-2033", href: "/money/money-owed" },
  }),

  // Credit sale overdue (Owner)
  buildTask({
    id: "task-14",
    title: "Follow up overdue credit sales — 5 customers, GHS 4,280",
    description: "5 customers have credit sales more than 30 days overdue, totalling GHS 4,280.",
    category: "credit",
    source: "Automatic",
    ruleKey: "credit-sale-overdue",
    assigneeRole: "Owner",
    priority: "High",
    dueDaysFromToday: -1,
    createdDaysAgo: 5,
    relatedRecord: { label: "All sales", href: "/sales/all" },
  }),

  // Stocktake variance (Owner)
  buildTask({
    id: "task-15",
    title: "Review stocktake variance — ST-1001",
    description: "ST-1001 posted with variances flagged as Theft (Tema Salt 1kg) and Miscount (Perfumed Rice 5kg), together over GHS 100.",
    category: "stocktake",
    source: "Automatic",
    ruleKey: "stocktake-variance",
    assigneeRole: "Owner",
    priority: "Normal",
    createdDaysAgo: 19,
    completedDaysAgo: 6,
    completionNote: "Reviewed with Yaw Boadi — tightened stockroom access.",
    relatedRecord: { label: "ST-1001", href: "/stock/stocktakes" },
  }),

  // Day close variance (Owner)
  buildTask({
    id: "task-16",
    title: "Review cash variance — GHS 85.00 short",
    description: "Day close on session 5 came in GHS 85.00 short, reason given as an unrecorded expense (okada fare paid from the till).",
    category: "day-close",
    source: "Automatic",
    ruleKey: "day-close-variance",
    assigneeRole: "Owner",
    priority: "High",
    createdDaysAgo: 17,
    completedDaysAgo: 2,
    completionNote: "Confirmed with the cashier and logged the expense retroactively.",
    relatedRecord: { label: "Day close", href: "/money/day-close" },
  }),

  // Transfer discrepancy (Manager)
  buildTask({
    id: "task-17",
    title: "Investigate transfer discrepancy — TRF-0052",
    description: "TRF-0052 arrived with 4 tins damaged in transit — confirm with the courier and adjust stock.",
    category: "transfer",
    source: "Automatic",
    ruleKey: "transfer-discrepancy",
    assigneeRole: "Manager",
    priority: "Normal",
    createdDaysAgo: 9,
    completedDaysAgo: 7,
    relatedRecord: { label: "TRF-0052", href: "/stock/movements" },
  }),

  // Quotation expiring (Manager)
  buildTask({
    id: "task-18",
    title: "Follow up quotation QUO-20260705-003 before it expires",
    description: "This quotation expires in a few days with no response yet from the customer.",
    category: "quotation",
    source: "Automatic",
    ruleKey: "quotation-expiring",
    assigneeRole: "Manager",
    priority: "Normal",
    dueDaysFromToday: 0,
    createdDaysAgo: 1,
    relatedRecord: { label: "QUO-20260705-003", href: "/estimator/quotations" },
  }),

  // Manager override above 20% (Owner)
  buildTask({
    id: "task-19",
    title: "Review large discount override — Sale RCT-5198",
    description: "A 35% discount was approved on RCT-5198, well above the cashier's 10% limit — reason given: damaged/near-expiry stock.",
    category: "override",
    source: "Automatic",
    ruleKey: "override-above-20",
    assigneeRole: "Owner",
    priority: "Normal",
    createdDaysAgo: 5,
    completedDaysAgo: 1,
    relatedRecord: { label: "RCT-5198", href: "/sales/all" },
  }),

  // Supplier bill due this week (Owner)
  buildTask({
    id: "task-20",
    title: "Pay supplier bill — Ghana Water Company — GHS 210.00",
    description: "Bill GWCL-33012 from Ghana Water Company is due this week.",
    category: "supplier-bill",
    source: "Automatic",
    ruleKey: "supplier-bill-due",
    assigneeRole: "Owner",
    priority: "Normal",
    dueDaysFromToday: 6,
    createdDaysAgo: 1,
    relatedRecord: { label: "Ghana Water Company", href: "/money/money-owed" },
  }),

  // Customer lapsed 60 days (Manager)
  buildTask({
    id: "task-21",
    title: "Win back lapsed customers — 8 members, 60+ days",
    description: "8 loyalty members haven't visited in 60 days or more. Consider a win-back message.",
    category: "loyalty",
    source: "Automatic",
    ruleKey: "customer-lapsed",
    assigneeRole: "Manager",
    priority: "Low",
    dueDaysFromToday: 5,
    createdDaysAgo: 2,
    relatedRecord: { label: "Lapsed segment", href: "/loyalty/loyalty-segments" },
  }),

  // Expense pending approval (Owner)
  buildTask({
    id: "task-22",
    title: "Approve or reject pending expense — GHS 250.00",
    description: "\"Shop internet & airtime bundle\" has been pending approval for more than 48 hours.",
    category: "expense",
    source: "Automatic",
    ruleKey: "expense-pending",
    assigneeRole: "Owner",
    priority: "Normal",
    dueDaysFromToday: -3,
    createdDaysAgo: 17,
    relatedRecord: { label: "Expenses", href: "/money/expenses" },
  }),
  buildTask({
    id: "task-23",
    title: "Approve or reject pending expense — GHS 115.00",
    description: "\"Change float top-up shortfall\" is pending approval.",
    category: "expense",
    source: "Automatic",
    ruleKey: "expense-pending",
    assigneeRole: "Owner",
    priority: "Normal",
    dueDaysFromToday: 1,
    createdDaysAgo: 0,
    relatedRecord: { label: "Expenses", href: "/money/expenses" },
  }),

  // Manual tasks (5)
  buildTask({
    id: "task-24",
    title: "Call Kasapreko Distributors about late delivery",
    description: "Their last two purchase orders have arrived late — raise it before renewing terms.",
    category: "manual",
    source: "Manual",
    assigneeRole: "Manager",
    priority: "Normal",
    dueDaysFromToday: 0,
    createdDaysAgo: 2,
  }),
  buildTask({
    id: "task-25",
    title: "Follow up with Ama Serwaa about a payment plan",
    description: "Discuss spreading her outstanding balance over instalments.",
    category: "manual",
    source: "Manual",
    assigneeRole: "Owner",
    priority: "Normal",
    dueDaysFromToday: 3,
    createdDaysAgo: 1,
  }),
  buildTask({
    id: "task-26",
    title: "Repaint the shop signage",
    description: "The signboard outside is fading and due for a repaint before the rainy season.",
    category: "manual",
    source: "Manual",
    assigneeRole: "Owner",
    priority: "Low",
    dueDaysFromToday: 12,
    createdDaysAgo: 3,
  }),
  buildTask({
    id: "task-27",
    title: "Train Efua Mensima on the stocktake procedure",
    description: "She's newly moved to Stockkeeper — walk her through blind counting and posting variances.",
    category: "manual",
    source: "Manual",
    assigneeRole: "Manager",
    priority: "Normal",
    dueDaysFromToday: 4,
    createdDaysAgo: 1,
  }),
  buildTask({
    id: "task-28",
    title: "Review Q3 supplier contracts",
    description: "Check payment terms are still competitive across the top 5 suppliers.",
    category: "manual",
    source: "Manual",
    assigneeRole: "Owner",
    priority: "Low",
    dueDaysFromToday: 14,
    createdDaysAgo: 2,
  }),

  // A running checklist instance — today's opening checklist, partially ticked.
  buildTask({
    id: "task-29",
    title: "Opening the shop — today",
    description: "Today's opening checklist.",
    category: "checklist",
    source: "Automatic",
    assigneeRole: "Cashier",
    priority: "Normal",
    dueDaysFromToday: 0,
    createdDaysAgo: 0,
    checklistTemplateId: "chk-opening",
    subItems: [
      { id: "s1", label: "Unlock and disarm the shop", done: true },
      { id: "s2", label: "Switch on lights, fridges, and freezers", done: true },
      { id: "s3", label: "Count the opening float", done: true, requiresValue: true, value: "GHS 200.00" },
      { id: "s4", label: "Check overnight deliveries at the door", done: false },
      { id: "s5", label: "Wipe counters and sweep the entrance", done: false },
      { id: "s6", label: "Confirm the register and card machine are online", done: false },
      { id: "s7", label: "Review yesterday's handover notes", done: false },
    ],
  }),
  buildTask({
    id: "task-30",
    title: "Closing the shop — last night",
    description: "Last night's closing checklist.",
    category: "checklist",
    source: "Automatic",
    assigneeRole: "Cashier",
    priority: "Normal",
    createdDaysAgo: 1,
    completedDaysAgo: 1,
    checklistTemplateId: "chk-closing",
    subItems: [
      { id: "s1", label: "Stop taking new customers at the door", done: true },
      { id: "s2", label: "Reconcile any held or on-hold sales", done: true },
      { id: "s3", label: "Tidy shelves and restock the front counter", done: true },
      { id: "s4", label: "Empty and secure the bins", done: true },
      { id: "s5", label: "Switch off fridges/freezers not needed overnight", done: true },
      { id: "s6", label: "Record cash counted", done: true, requiresValue: true, value: "GHS 3,050.00" },
      { id: "s7", label: "Note any variance reason", done: true, value: "No variance" },
      { id: "s8", label: "Lock up and arm the shop", done: true },
    ],
  }),
]

let tasksStore: WorkflowTask[] = WORKFLOW_TASKS_SEED.map((t) => ({ ...t, comments: [...t.comments], activity: [...t.activity], subItems: t.subItems?.map((s) => ({ ...s })) }))

export function getTasksStore(): WorkflowTask[] {
  return tasksStore
}

export function getTask(id: string): WorkflowTask | undefined {
  return tasksStore.find((t) => t.id === id)
}

function setTask(id: string, patch: Partial<WorkflowTask>): void {
  tasksStore = tasksStore.map((t) => (t.id === id ? { ...t, ...patch } : t))
}

export function dueBucketFor(task: WorkflowTask, todayISO: string = TODAY_ISO): DueBucket {
  if (!task.dueDateISO) return "No due date"
  if (task.dueDateISO < todayISO) return "Overdue"
  if (task.dueDateISO === todayISO) return "Today"
  const daysAhead = Math.round((new Date(`${task.dueDateISO}T00:00:00Z`).getTime() - new Date(`${todayISO}T00:00:00Z`).getTime()) / 86400000)
  if (daysAhead <= 7) return "This week"
  return "Later"
}

export function tasksForRole(role: StaffRole): WorkflowTask[] {
  return tasksStore.filter((t) => t.assigneeRole === role)
}

export function openTaskCountForRole(role: StaffRole): number {
  return tasksStore.filter((t) => t.assigneeRole === role && (t.status === "Open" || t.status === "Snoozed")).length
}

export function mostUrgentTasksForRole(role: StaffRole, limit = 5): WorkflowTask[] {
  const priorityRank: Record<TaskPriority, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 }
  return tasksStore
    .filter((t) => t.assigneeRole === role && (t.status === "Open" || t.status === "Snoozed"))
    .sort((a, b) => {
      const bucketRank = (t: WorkflowTask) => (dueBucketFor(t) === "Overdue" ? 0 : dueBucketFor(t) === "Today" ? 1 : 2)
      return bucketRank(a) - bucketRank(b) || priorityRank[a.priority] - priorityRank[b.priority]
    })
    .slice(0, limit)
}

function nowTime(): string {
  return "Just now"
}

export function completeTask(id: string, completedBy: string, note?: string): void {
  const task = getTask(id)
  if (!task) return
  const completedDateISO = TODAY_ISO
  setTask(id, {
    status: "Completed",
    completedDateISO,
    completedBy,
    completionNote: note,
    activity: [...task.activity, activity(completedDateISO, nowTime(), `Completed by ${completedBy}${note ? ` — "${note}"` : ""}`)],
  })
  appendAuditLogEntry({
    dateISO: completedDateISO,
    time: nowTime(),
    user: completedBy,
    role: task.assigneeRole,
    module: "Workflow",
    action: "task-completed",
    target: task.title,
    targetHref: "/workflow/my-tasks",
    after: "Completed",
    reason: note,
  })
}

export function reopenTask(id: string): void {
  const task = getTask(id)
  if (!task) return
  setTask(id, {
    status: "Open",
    completedDateISO: undefined,
    completedBy: undefined,
    completionNote: undefined,
    activity: [...task.activity, activity(TODAY_ISO, nowTime(), "Reopened")],
  })
}

export type SnoozeOption = "tomorrow" | "3-days" | "next-week"

const SNOOZE_DAYS: Record<SnoozeOption, number> = { tomorrow: 1, "3-days": 3, "next-week": 7 }

export function snoozeTask(id: string, option: SnoozeOption): void {
  const task = getTask(id)
  if (!task) return
  const snoozedUntilISO = addDaysISO(TODAY_ISO, SNOOZE_DAYS[option])
  setTask(id, {
    status: "Snoozed",
    snoozedUntilISO,
    dueDateISO: snoozedUntilISO,
    activity: [...task.activity, activity(TODAY_ISO, nowTime(), `Snoozed until ${snoozedUntilISO}`)],
  })
}

export function reassignTask(id: string, role: StaffRole, name?: string): void {
  const task = getTask(id)
  if (!task) return
  const assigneeName = name ?? ASSIGNEE_BY_ROLE[role]
  setTask(id, {
    assigneeRole: role,
    assigneeName,
    activity: [...task.activity, activity(TODAY_ISO, nowTime(), `Reassigned to ${assigneeName} (${role})`)],
  })
}

export function changeTaskPriority(id: string, priority: TaskPriority): void {
  const task = getTask(id)
  if (!task) return
  setTask(id, { priority, activity: [...task.activity, activity(TODAY_ISO, nowTime(), `Priority changed to ${priority}`)] })
}

export function changeTaskDueDate(id: string, dueDateISO: string): void {
  const task = getTask(id)
  if (!task) return
  setTask(id, { dueDateISO, activity: [...task.activity, activity(TODAY_ISO, nowTime(), `Due date changed to ${dueDateISO}`)] })
}

export function addTaskComment(id: string, author: string, text: string): void {
  const task = getTask(id)
  if (!task) return
  setTask(id, { comments: [...task.comments, { id: `c-${task.comments.length + 1}-${Date.now().toString(36)}`, author, dateISO: TODAY_ISO, time: nowTime(), text }] })
}

export function toggleSubItem(taskId: string, subItemId: string, value?: string): void {
  const task = getTask(taskId)
  if (!task?.subItems) return
  const subItems = task.subItems.map((s) => (s.id === subItemId ? { ...s, done: !s.done, value: value ?? s.value } : s))
  setTask(taskId, { subItems })
}

export interface NewTaskInput {
  title: string
  description: string
  assigneeRole: StaffRole
  dueDateISO?: string
  priority: TaskPriority
  relatedRecord?: RelatedRecord
}

export function addManualTask(input: NewTaskInput): WorkflowTask {
  const task: WorkflowTask = {
    id: `task-manual-${Date.now().toString(36)}`,
    title: input.title,
    description: input.description,
    category: "manual",
    source: "Manual",
    assigneeRole: input.assigneeRole,
    assigneeName: ASSIGNEE_BY_ROLE[input.assigneeRole],
    priority: input.priority,
    status: "Open",
    dueDateISO: input.dueDateISO,
    createdDateISO: TODAY_ISO,
    relatedRecord: input.relatedRecord,
    comments: [],
    activity: [activity(TODAY_ISO, nowTime(), "Created manually")],
  }
  tasksStore = [task, ...tasksStore]
  return task
}

export function bulkCompleteTask(ids: string[], completedBy: string, note?: string): void {
  ids.forEach((id) => completeTask(id, completedBy, note))
}

export function bulkReassignTasks(ids: string[], role: StaffRole): void {
  ids.forEach((id) => reassignTask(id, role))
}

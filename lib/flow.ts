export interface FlowStep {
  step: number
  title: string
  description: string
  screenshot: string
}

/** The signature "delivery → shelf → sale → receipt" spine — reused across Home and Features. */
export const FLOW_STEPS: FlowStep[] = [
  {
    step: 1,
    title: "Receive stock",
    description:
      "Log every delivery the moment it arrives, split cartons into sellable units, and know exactly what's on your shelf.",
    screenshot: "flow-receive",
  },
  {
    step: 2,
    title: "Sell & invoice",
    description:
      "Ring up daily sales, credit sales, and deposits — and send a proper invoice when a customer needs one.",
    screenshot: "flow-sell",
  },
  {
    step: 3,
    title: "Track your people & money",
    description:
      "See which staff member handled which sale, record every expense, and keep a full audit trail.",
    screenshot: "flow-track",
  },
  {
    step: 4,
    title: "See it all in reports",
    description:
      "Get one clear picture of revenue, profit, and stock — whenever you need it, not just at closing time.",
    screenshot: "flow-reports",
  },
]

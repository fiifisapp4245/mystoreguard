/**
 * Guide — a searchable article index, not a wall of text. Categories are
 * cards; each opens a list of short, plain-language articles.
 */

export interface GuideCategory {
  id: string
  label: string
  description: string
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: "getting-started", label: "Getting started", description: "The first things to set up before you open." },
  { id: "selling", label: "Selling & the register", description: "Ringing up sales, discounts, and returns." },
  { id: "stock", label: "Stock & inventory", description: "Counting, costing, and moving what you sell." },
  { id: "money", label: "Money & reports", description: "Cash, credit, and what the numbers mean." },
  { id: "loyalty", label: "Customers & loyalty", description: "Points, tiers, and keeping customers coming back." },
  { id: "estimator", label: "Quotations & estimator", description: "Pricing jobs before the customer commits." },
  { id: "deliveries", label: "Deliveries", description: "Getting goods into a customer's hands." },
  { id: "settings", label: "Settings & permissions", description: "Configuring the store and who can do what." },
]

export interface GuideArticle {
  id: string
  title: string
  categoryId: string
  popular?: boolean
  body: string[]
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "your-first-week",
    title: "Your first week with MyStoreGuard",
    categoryId: "getting-started",
    body: [
      "Most stores get useful value in the first hour: add your products, set your tax rates, and make your first sale. Everything else — loyalty, estimator, workflow — can wait until the basics are running.",
      "Start with the setup checklist on your Dashboard if you're on a new store. It walks through business profile, at least one location, confirming the Ghana tax defaults, payment methods, products, and staff — in that order, because each one unblocks the next.",
      "Once products and a location exist, open the register and ring up a real sale. Seeing a receipt come out the other end is the fastest way to trust the rest of the system.",
      "After that, the order that matters most is: invite the staff who'll use the register day to day, set their roles so a cashier can't see what an owner sees, and turn on the workflow rules that matter to you — reorder points and overdue invoices catch the most money.",
    ],
  },
  {
    id: "business-profile-letterhead",
    title: "Setting up your business profile and letterhead",
    categoryId: "getting-started",
    body: [
      "Your business profile — name, address, phone, TIN — isn't just contact information. It's what prints at the top of every invoice and quotation you send. A blank or wrong letterhead is one of the fastest ways to look unprofessional to a customer who's deciding whether to pay you.",
      "Set it once in Settings → Business profile. Because the invoice and quotation previews read live from this record, you can confirm it looks right immediately — open a new invoice and check the header before you send anything to a real customer.",
      "The registration number and TIN matter more than they look: a customer's own accountant may ask for them before releasing payment on a larger invoice.",
    ],
  },
  {
    id: "pricing-rules-price-floor",
    title: "Pricing rules and the price floor",
    categoryId: "selling",
    body: [
      "Discounts in this product are decided by rules, not by whoever is on the till — the cashier scans, the rules decide the price. That's deliberate: it's the only way a discount limit means anything.",
      "The price floor is the point past which a discount cannot go, however it's combined with other discounts. Set it as a minimum margin percentage, a fixed markup over cost, or a fixed minimum selling price per product — whichever matches how you actually think about margin.",
      "When a discount would breach the floor, you choose what happens: block it outright, require a manager override, or cap the discount automatically at the floor. Every override is captured with who approved it, why, and when — that record is the point, not the discount itself.",
      "The cashier discount limit is separate from the floor — it's the ceiling a cashier can apply without asking anyone. Set it low enough that anything unusual needs a second pair of eyes.",
    ],
  },
  {
    id: "return-policy",
    title: "Return policy: what it means for your shop",
    categoryId: "settings",
    body: [
      "Your return policy answers five questions before a customer ever asks them: how many days after purchase, in what condition, refunded how, with or without a receipt, and which categories can't come back at all.",
      "It's a Class B setting — it changes from a date you choose, and a return processed last month is judged against the policy that applied then, not today's. That matters if you tighten the rules later; it protects staff from being second-guessed against a rule that didn't exist yet.",
      "Store credit policy lives in the same section, since it's really the same decision: does credit expire, can it be turned back into cash, is it issued automatically when a return is processed, and what's the most a single customer can hold.",
    ],
  },
  {
    id: "recording-a-return",
    title: "Recording a store return",
    categoryId: "selling",
    body: [
      "A return starts from the original sale, not from a blank form — find the receipt, pick the item, and give a reason. That link back to the original sale is what makes the return auditable later.",
      "The refund method follows your return policy: cash, store credit, exchange only, or the customer's choice, depending on what you've set. If a receipt is required by policy and the customer doesn't have one, decide case by case — the system will show you the policy so you're not guessing.",
      "A restocking fee, if you charge one, is calculated automatically from the policy rather than typed in by hand, so it's consistent no matter who's on the till that day.",
    ],
  },
  {
    id: "running-a-stocktake",
    title: "Running a stocktake",
    categoryId: "stock",
    popular: true,
    body: [
      "A stocktake compares what's physically on your shelves against what the system believes you have. The gap between those two numbers is where theft, damage, and recording mistakes hide — a stocktake is the only way to actually see it.",
      "Start one from Stock & Warehouse → Stocktakes. The system takes a snapshot of expected quantities the moment you start, so sales and deliveries that happen mid-count are tracked separately rather than corrupting your count.",
      "Count every line, enter what you actually find, and post it. Any variance needs a reason — miscount, damage, expiry, or theft — because a number without a reason is just a number; the reason is what lets you act on a pattern.",
      "Variances over GHS 100 automatically raise a task for the owner to review in Workflow, so a bad count doesn't just sit quietly in a report nobody opens.",
    ],
  },
  {
    id: "blind-counting-explained",
    title: "Blind counting explained",
    categoryId: "stock",
    body: [
      "Blind counting hides the system's expected quantity from the person doing the count. They write down what they physically see, not what they think they're supposed to see.",
      "Without it, a count tends to quietly drift toward matching the expected number — not through dishonesty, usually just because a number in front of you anchors what you write down. Blind counting removes that anchor.",
      "It costs a little more time, since the comparison only happens after the count is submitted, but it's the difference between a stocktake that finds real problems and one that just rubber-stamps the system's own numbers.",
    ],
  },
  {
    id: "set-aside-for-delivery",
    title: "Set aside for delivery",
    categoryId: "stock",
    body: [
      "\"Set aside\" is stock that's sold but not yet physically gone — reserved for a delivery that hasn't left the shop yet. It still sits on your shelf, but it isn't available to sell to the next customer who walks in.",
      "This is what prevents the awkward situation of selling the same last unit twice: once to the walk-in customer standing in front of you, and once to the delivery a rider is about to collect.",
      "Set-aside stock returns to available stock automatically if a delivery is cancelled, and clears once the rider actually collects it and the delivery moves to \"Out for delivery.\"",
    ],
  },
  {
    id: "moving-weighted-average",
    title: "Moving weighted average explained",
    categoryId: "stock",
    body: [
      "Moving weighted average is how the cost of your stock is calculated when you buy the same product at different prices over time. Every new purchase recalculates a single blended average cost for everything currently on the shelf.",
      "Example: you hold 10 units at GHS 10 each (GHS 100 total). You buy 10 more at GHS 12 each (GHS 120). Your new average cost per unit is GHS 220 ÷ 20 = GHS 11 — not GHS 10, not GHS 12.",
      "This is what the price floor and every margin figure in Reports are built on. It's simple to run day to day and suits general retail with frequent restocking, which is why it's the default — but it's locked in once real transactions exist, because changing it retroactively would rewrite the valuation of stock you've already sold.",
    ],
  },
  {
    id: "day-close-cash-variance",
    title: "Day close and cash variance",
    categoryId: "money",
    popular: true,
    body: [
      "Day close is the one moment every day when physical cash changes hands and gets counted against what the system expects. Skip it regularly and small shortages compound into a real problem nobody can explain months later.",
      "The expected cash figure is never one opaque number — it's built line by line: opening float, cash sales, gift cards sold for cash, credit collections taken in cash, rider COD collected, minus cash expenses paid from the till, cash refunds given, and any cash dropped to the safe during the day.",
      "Count the drawer note by note and coin by coin. Whatever doesn't match gets a required reason — miscount, wrong change given, an unrecorded expense or sale, or theft suspected. A variance over GHS 50 automatically raises a task for the owner.",
      "The value isn't catching every cedi — it's that a pattern of small variances on the same cashier's shifts is something you can only see if you're counting every single day, not just when you suspect a problem.",
    ],
  },
  {
    id: "who-owes-me-who-i-owe",
    title: "Who owes me and who I owe",
    categoryId: "money",
    popular: true,
    body: [
      "Money owed pulls together two things owners actually think in terms of, rather than the underlying documents: who owes you (unpaid invoices and customer credit balances), and who you owe (supplier bills from goods received and other operating costs).",
      "Both sides are aged into the same buckets — current, 1–30 days, 31–60 days, and 60+ days — so you can see at a glance which balances are becoming a real problem rather than just outstanding.",
      "Paying a supplier bill for goods you've already received never creates an expense a second time — it just settles a liability that was already recorded when the goods arrived. This is deliberate: recording it again would double-count against your inventory and quietly corrupt every profit figure in the product.",
    ],
  },
  {
    id: "setting-up-loyalty-program",
    title: "Setting up your loyalty program",
    categoryId: "loyalty",
    body: [
      "A loyalty program has two moving parts: how points are earned and redeemed, and the tiers customers move through based on how much they've spent over time. Both live in Loyalty → Rules & tiers.",
      "Start simple — a straightforward GHS-per-point earn rate and one or two tiers (say, Silver and Gold) based on lifetime spend. You can always add more tiers or change the earn rate later; changes only apply forward from the date you choose, so members already at a tier keep their benefits.",
      "Enrolment happens at the register: a cashier takes the customer's phone number at checkout, and that's it — no separate sign-up screen, no friction that talks a customer out of joining.",
    ],
  },
  {
    id: "how-points-tiers-work",
    title: "How points and tiers work",
    categoryId: "loyalty",
    body: [
      "Points are earned on qualifying spend at the rate you've configured, and redeemed at the register like a partial payment method — capped at a maximum percentage of the sale total, so a customer can't pay for an entire transaction in points alone.",
      "Tiers are based on lifetime spend, not spend in any single period, so a customer who was a big spender two years ago and has since gone quiet keeps their tier until your rules say otherwise.",
      "Each tier can carry its own discount percentage, points multiplier, and free-delivery benefit. A member's tier is recalculated automatically as their lifetime spend crosses each threshold — nobody has to manually promote anyone.",
    ],
  },
  {
    id: "building-estimator-template",
    title: "Building an estimator template",
    categoryId: "estimator",
    body: [
      "A template is a reusable formula: a set of input fields (height, width, and similar measurements) and a computation that turns those measurements into a price. It exists so quoting a curtain or a printing job doesn't mean re-deriving the maths by hand every time.",
      "Define the fields first — what you actually need to measure — then the formula that converts them into yardage or area, and finally the price per unit. Test it with a few real measurements before relying on it with a customer standing in front of you.",
      "Once a template exists, building a quotation is just picking it and entering measurements — the price comes out the other end, consistent every time regardless of who's quoting.",
    ],
  },
  {
    id: "quotation-to-invoice",
    title: "Converting a quotation to an invoice",
    categoryId: "estimator",
    body: [
      "A quotation is a price you send a customer before the sale happens — nothing is owed yet. Once they accept, converting it to an invoice takes one click; nothing about the customer, line items, or pricing needs to be retyped.",
      "The quotation's validity period matters here — a quotation close to expiring is exactly the kind of thing that's easy to forget about, which is why an expiring quotation automatically raises a follow-up task before it lapses.",
      "After conversion, the quotation is marked converted and the new invoice carries the link back to it, so the full history — what was quoted, when, and what it became — stays intact.",
    ],
  },
  {
    id: "scheduling-tracking-delivery",
    title: "Scheduling and tracking a delivery",
    categoryId: "deliveries",
    body: [
      "A delivery is created from an invoice or a register sale marked for delivery, carrying the customer, address, and items across automatically. Assign a rider, a scheduled date, and a window (morning or afternoon).",
      "Status moves forward as the delivery actually happens: Scheduled, Assigned, Out for delivery, then Delivered or Failed. A failed delivery always needs a reason — customer not available, wrong address, refused — because that reason is what tells you whether to rebook or write it off.",
      "If a delivery is still unassigned less than 24 hours before its scheduled date, a task is raised automatically — the failure mode this catches is a delivery quietly falling through the cracks the night before it's due.",
      "Cash-on-delivery amounts collected by the rider reconcile against day close, the same as till cash — a rider holding customer cash overnight is a real liability, not a detail.",
    ],
  },
  {
    id: "roles-and-permissions",
    title: "Roles and permissions",
    categoryId: "settings",
    popular: true,
    body: [
      "Four roles cover almost every store: Owner (everything), Manager (day-to-day operations, but not billing), Cashier (the register and their own sales), and Stockkeeper (inventory and stock, not money or people).",
      "Permissions are set per module as None, View, Edit, or Full, in Settings → Roles & permissions. A cashier who can open Settings can raise their own discount limit — so Settings itself is gated by this same matrix, and a role with no access to Settings sees an empty index there, not a greyed-out one.",
      "Cost prices and margins are hidden from any role without that specific permission — it's the field that leaks most often, so it's off by default for Cashier rather than something you have to remember to turn off.",
      "Use \"Viewing as role\" in the demo controls to see the product exactly as a given role would — it's the fastest way to catch a screen showing something it shouldn't.",
    ],
  },
  {
    id: "sms-credits-consent",
    title: "SMS credits and consent",
    categoryId: "settings",
    body: [
      "Sending a message costs credits, calculated from the number of segments the message takes (160 characters per segment) multiplied by the number of recipients. The cost is always shown before you send, along with the remaining balance afterward — never a surprise after the fact.",
      "Marketing-style sends respect customer consent: anyone who hasn't opted in is automatically excluded, and the excluded count is shown so you know reach was reduced, not silently ignored. A customer who replies STOP is opted out automatically.",
      "Transactional messages — receipts, delivery updates, automated triggers — aren't affected by marketing consent; those are operational, not promotional, and customers expect them as part of the transaction itself.",
    ],
  },
  {
    id: "inviting-staff",
    title: "Inviting staff",
    categoryId: "settings",
    body: [
      "Add a staff member with their name, phone number, and role from People → Staff. They start in \"Invited\" status until they've actually signed in for the first time.",
      "Choose the role carefully before inviting — it's what determines everything they can see and do from their very first login, including whether they can see cost prices, apply discounts, or open Settings at all.",
      "Roles themselves are configured once in Settings → Roles & permissions, not per staff member — change what a Cashier can do in one place, and it applies to every cashier immediately.",
    ],
  },
]

export interface WhatsNewEntry {
  dateISO: string
  text: string
}

export const WHATS_NEW: WhatsNewEntry[] = [
  { dateISO: "2026-07-22", text: "Workflow now raises tasks automatically from things the system already knows — low stock, overdue invoices, failed deliveries, and more." },
  { dateISO: "2026-07-15", text: "Settings rebuilt as a searchable, sectioned page with locked and versioned fields for anything that affects financial history." },
  { dateISO: "2026-07-08", text: "Money hub gained Money owed, Day close, and richer Reports — expenses and stock purchases are now kept strictly separate." },
  { dateISO: "2026-07-01", text: "Message hub added — compose, automated triggers, history, and templates, with cost shown before every send." },
  { dateISO: "2026-06-24", text: "Roles & permissions matrix introduced, with a \"Viewing as role\" control to see the product exactly as each role would." },
]

export interface SupportContact {
  whatsapp: string
  phone: string
  email: string
  hours: string
}

export const SUPPORT_CONTACT: SupportContact = {
  whatsapp: "+233 24 000 9999",
  phone: "0302 000 999",
  email: "support@mystoreguard.com.gh",
  hours: "Monday–Saturday, 8:00 AM–6:00 PM GMT",
}

const ARTICLES_BY_ID = new Map(GUIDE_ARTICLES.map((a) => [a.id, a]))

export function getGuideArticle(id: string): GuideArticle | undefined {
  return ARTICLES_BY_ID.get(id)
}

export function articlesForCategory(categoryId: string): GuideArticle[] {
  return GUIDE_ARTICLES.filter((a) => a.categoryId === categoryId)
}

export function popularArticles(limit = 5): GuideArticle[] {
  return GUIDE_ARTICLES.filter((a) => a.popular).slice(0, limit)
}

export function searchArticles(query: string): GuideArticle[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return GUIDE_ARTICLES.filter((a) => a.title.toLowerCase().includes(q) || a.body.some((p) => p.toLowerCase().includes(q)))
}

import { TODAY_ISO } from "@/lib/period-utils"

export type GiftCardStatus = "Active" | "Fully redeemed" | "Frozen" | "Expired"
export type GiftCardTransactionType = "Issued" | "Redeemed" | "Top-up"

export interface GiftCardTransaction {
  id: string
  dateISO: string
  type: GiftCardTransactionType
  amount: number
  saleReference?: string
  note?: string
}

export interface GiftCard {
  id: string
  issuedTo?: string
  initialValue: number
  balance: number
  status: GiftCardStatus
  issuedDateISO: string
  expiryDateISO: string
  transactions: GiftCardTransaction[]
}

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function seedCard(input: {
  num: number
  issuedTo?: string
  initialValue: number
  balance: number
  status: GiftCardStatus
  issuedDaysAgo: number
  expiryMonths?: number
  redemptions?: { daysAgo: number; amount: number; saleReference: string }[]
}): GiftCard {
  const issuedDateISO = addDays(TODAY_ISO, -input.issuedDaysAgo)
  const expiryDateISO = input.status === "Expired" ? addDays(TODAY_ISO, -5) : addMonths(issuedDateISO, input.expiryMonths ?? 12)
  const transactions: GiftCardTransaction[] = [
    { id: `gct-${input.num}-1`, dateISO: issuedDateISO, type: "Issued", amount: input.initialValue },
  ]
  for (const [i, r] of (input.redemptions ?? []).entries()) {
    transactions.push({
      id: `gct-${input.num}-r${i + 1}`,
      dateISO: addDays(TODAY_ISO, -r.daysAgo),
      type: "Redeemed",
      amount: -r.amount,
      saleReference: r.saleReference,
    })
  }
  return {
    id: `GC-${String(100000 + input.num * 137).slice(0, 6)}`,
    issuedTo: input.issuedTo,
    initialValue: input.initialValue,
    balance: input.balance,
    status: input.status,
    issuedDateISO,
    expiryDateISO,
    transactions,
  }
}

const GIFT_CARDS_SEED: GiftCard[] = [
  seedCard({ num: 1, issuedTo: "Kwame Mensah", initialValue: 200, balance: 120, status: "Active", issuedDaysAgo: 40, redemptions: [{ daysAgo: 10, amount: 80, saleReference: "RCT-3012" }] }),
  seedCard({ num: 2, issuedTo: "Ama Owusu", initialValue: 100, balance: 65, status: "Active", issuedDaysAgo: 20, redemptions: [{ daysAgo: 5, amount: 35, saleReference: "RCT-3040" }] }),
  seedCard({ num: 3, initialValue: 500, balance: 500, status: "Active", issuedDaysAgo: 3 }),
  seedCard({ num: 4, issuedTo: "Efua Darko", initialValue: 50, balance: 20, status: "Active", issuedDaysAgo: 55, redemptions: [{ daysAgo: 30, amount: 30, saleReference: "RCT-2988" }] }),
  seedCard({ num: 5, initialValue: 200, balance: 150, status: "Active", issuedDaysAgo: 12, redemptions: [{ daysAgo: 2, amount: 50, saleReference: "RCT-3055" }] }),
  seedCard({ num: 6, issuedTo: "Yaw Boadi", initialValue: 100, balance: 100, status: "Active", issuedDaysAgo: 8 }),
  seedCard({ num: 7, initialValue: 300, balance: 210, status: "Active", issuedDaysAgo: 25, redemptions: [{ daysAgo: 15, amount: 90, saleReference: "RCT-3001" }] }),
  seedCard({ num: 8, issuedTo: "Abena Asante", initialValue: 50, balance: 5, status: "Active", issuedDaysAgo: 60, redemptions: [{ daysAgo: 40, amount: 25, saleReference: "RCT-2950" }, { daysAgo: 20, amount: 20, saleReference: "RCT-3010" }] }),
  seedCard({ num: 9, issuedTo: "Kofi Agyemang", initialValue: 100, balance: 0, status: "Fully redeemed", issuedDaysAgo: 70, redemptions: [{ daysAgo: 50, amount: 60, saleReference: "RCT-2900" }, { daysAgo: 30, amount: 40, saleReference: "RCT-2970" }] }),
  seedCard({ num: 10, issuedTo: "Adjoa Boateng", initialValue: 200, balance: 150, status: "Frozen", issuedDaysAgo: 45, redemptions: [{ daysAgo: 20, amount: 50, saleReference: "RCT-3005" }] }),
  seedCard({ num: 11, initialValue: 50, balance: 50, status: "Expired", issuedDaysAgo: 400, expiryMonths: 12 }),
  seedCard({ num: 12, issuedTo: "Nana Frimpong", initialValue: 500, balance: 380, status: "Active", issuedDaysAgo: 18, redemptions: [{ daysAgo: 6, amount: 120, saleReference: "RCT-3048" }] }),
]

let giftCardsStore: GiftCard[] = GIFT_CARDS_SEED.map((c) => ({ ...c, transactions: c.transactions.map((t) => ({ ...t })) }))

export function getGiftCardsStore(): GiftCard[] {
  return giftCardsStore
}

export function setGiftCardsStore(next: GiftCard[]): void {
  giftCardsStore = next
}

export function getGiftCard(id: string): GiftCard | undefined {
  return giftCardsStore.find((c) => c.id === id)
}

export function findGiftCardByNumber(cardNumber: string): GiftCard | undefined {
  const trimmed = cardNumber.trim().toUpperCase()
  return giftCardsStore.find((c) => c.id.toUpperCase() === trimmed)
}

let cardCounter = 100

function nextCardNumber(): string {
  cardCounter += 1
  return `GC-${100900 + cardCounter}`
}

export interface IssueGiftCardInput {
  value: number
  cardNumber?: string
  issuedTo?: string
  expiryMonths: number
  note?: string
}

export function issueGiftCard(input: IssueGiftCardInput): GiftCard {
  const card: GiftCard = {
    id: input.cardNumber?.trim() || nextCardNumber(),
    issuedTo: input.issuedTo,
    initialValue: input.value,
    balance: input.value,
    status: "Active",
    issuedDateISO: TODAY_ISO,
    expiryDateISO: addMonths(TODAY_ISO, input.expiryMonths),
    transactions: [{ id: `gct-new-${Date.now().toString(36)}`, dateISO: TODAY_ISO, type: "Issued", amount: input.value, note: input.note }],
  }
  giftCardsStore = [card, ...giftCardsStore]
  return card
}

export function topUpGiftCard(id: string, amount: number): void {
  giftCardsStore = giftCardsStore.map((c) => {
    if (c.id !== id) return c
    const transaction: GiftCardTransaction = { id: `gct-top-${Date.now().toString(36)}`, dateISO: TODAY_ISO, type: "Top-up", amount }
    return { ...c, balance: c.balance + amount, status: c.status === "Fully redeemed" ? "Active" : c.status, transactions: [transaction, ...c.transactions] }
  })
}

export function freezeGiftCard(id: string): void {
  giftCardsStore = giftCardsStore.map((c) => (c.id === id ? { ...c, status: "Frozen" } : c))
}

export function unfreezeGiftCard(id: string): void {
  giftCardsStore = giftCardsStore.map((c) => (c.id === id && c.status === "Frozen" ? { ...c, status: c.balance > 0 ? "Active" : "Fully redeemed" } : c))
}

export function voidGiftCard(id: string, reason: string): void {
  giftCardsStore = giftCardsStore.map((c) => {
    if (c.id !== id) return c
    const transaction: GiftCardTransaction = { id: `gct-void-${Date.now().toString(36)}`, dateISO: TODAY_ISO, type: "Redeemed", amount: -c.balance, note: `Voided — ${reason}` }
    return { ...c, balance: 0, status: "Fully redeemed", transactions: [transaction, ...c.transactions] }
  })
}

/** Register redemption — applies up to the card's balance and reports what's left of the sale (register-side remainder handling). */
export function redeemGiftCard(id: string, requestedAmount: number, saleReference: string): { applied: number; cardRemainingBalance: number } {
  const card = giftCardsStore.find((c) => c.id === id)
  if (!card || card.status !== "Active") return { applied: 0, cardRemainingBalance: card?.balance ?? 0 }
  const applied = Math.min(requestedAmount, card.balance)
  giftCardsStore = giftCardsStore.map((c) => {
    if (c.id !== id) return c
    const nextBalance = c.balance - applied
    const transaction: GiftCardTransaction = { id: `gct-red-${Date.now().toString(36)}`, dateISO: TODAY_ISO, type: "Redeemed", amount: -applied, saleReference }
    return { ...c, balance: nextBalance, status: nextBalance <= 0 ? "Fully redeemed" : c.status, transactions: [transaction, ...c.transactions] }
  })
  return { applied, cardRemainingBalance: card.balance - applied }
}

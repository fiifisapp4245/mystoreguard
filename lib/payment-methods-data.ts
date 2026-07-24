/**
 * Which tenders the register offers, and the account details behind them.
 * Class C — no effect on financial history, just what's available going
 * forward. Cash/Momo/Credit/Deposit/Gift card map onto real register tenders
 * (payment-sheet.tsx filters its tender grid by these); Card, Bank transfer,
 * Cheque, and Store credit are tracked here for completeness even though the
 * register doesn't yet have a dedicated flow for them.
 */

export type TenderMethodKey =
  | "Cash"
  | "Momo"
  | "Card"
  | "Bank transfer"
  | "Cheque"
  | "Gift card"
  | "Store credit"
  | "Credit"
  | "Deposit"

export const TENDER_METHOD_LABELS: Record<TenderMethodKey, string> = {
  Cash: "Cash",
  Momo: "Momo",
  Card: "Card",
  "Bank transfer": "Bank transfer",
  Cheque: "Cheque",
  "Gift card": "Gift card",
  "Store credit": "Store credit",
  Credit: "Credit (pay later)",
  Deposit: "Deposit",
}

export const TENDER_METHOD_KEYS: TenderMethodKey[] = [
  "Cash",
  "Momo",
  "Card",
  "Bank transfer",
  "Cheque",
  "Gift card",
  "Store credit",
  "Credit",
  "Deposit",
]

export type MomoNetwork = "MTN" | "Telecel" | "AirtelTigo"

export interface MomoAccount {
  network: MomoNetwork
  number: string
  registeredName: string
}

export interface BankAccountDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branch: string
}

export interface PaymentMethodsSettings {
  enabledTenders: Record<TenderMethodKey, boolean>
  momoAccounts: MomoAccount[]
  bankAccount: BankAccountDetails
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodsSettings = {
  enabledTenders: {
    Cash: true,
    Momo: true,
    Card: false,
    "Bank transfer": false,
    Cheque: false,
    "Gift card": true,
    "Store credit": true,
    Credit: true,
    Deposit: true,
  },
  momoAccounts: [
    { network: "MTN", number: "024 000 1111", registeredName: "Adwoa's Provisions" },
    { network: "Telecel", number: "020 000 1111", registeredName: "Adwoa's Provisions" },
    { network: "AirtelTigo", number: "027 000 1111", registeredName: "Adwoa's Provisions" },
  ],
  bankAccount: {
    bankName: "GCB Bank",
    accountName: "Adwoa's Provisions",
    accountNumber: "1021456789012",
    branch: "Makola Branch",
  },
}

let paymentMethodsStore: PaymentMethodsSettings = {
  enabledTenders: { ...DEFAULT_PAYMENT_METHODS.enabledTenders },
  momoAccounts: DEFAULT_PAYMENT_METHODS.momoAccounts.map((a) => ({ ...a })),
  bankAccount: { ...DEFAULT_PAYMENT_METHODS.bankAccount },
}

export function getPaymentMethodsSettings(): PaymentMethodsSettings {
  return paymentMethodsStore
}

export function setPaymentMethodsSettings(next: PaymentMethodsSettings): void {
  paymentMethodsStore = next
}

export function toggleTender(key: TenderMethodKey): void {
  paymentMethodsStore = {
    ...paymentMethodsStore,
    enabledTenders: { ...paymentMethodsStore.enabledTenders, [key]: !paymentMethodsStore.enabledTenders[key] },
  }
}

export function isTenderEnabled(key: TenderMethodKey): boolean {
  return paymentMethodsStore.enabledTenders[key]
}

/** At least one Momo number and the bank account are filled in — used by the setup checklist. */
export function isPaymentMethodsComplete(): boolean {
  const s = paymentMethodsStore
  return s.momoAccounts.some((a) => a.number.trim()) && Boolean(s.bankAccount.accountNumber.trim())
}

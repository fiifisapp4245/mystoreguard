export type ReceiptChannel = "Print" | "SMS" | "Ask"

/** Class C — cosmetic and workflow defaults for receipts, invoices, and quotations. Numbering lives in lib/numbering-data.ts (Class B). */
export interface ReceiptsDocumentsSettings {
  receiptHeaderText: string
  receiptFooterText: string
  showLogoOnReceipt: boolean
  printAutomaticallyAfterSale: boolean
  defaultReceiptChannel: ReceiptChannel
  invoiceTermsAndNotesDefault: string
  quotationValidityDays: number
  paymentInstructions: string
}

const DEFAULT_SETTINGS: ReceiptsDocumentsSettings = {
  receiptHeaderText: "Thank you for shopping with us",
  receiptFooterText: "Goods sold in good condition are exchangeable within 14 days with this receipt.",
  showLogoOnReceipt: true,
  printAutomaticallyAfterSale: true,
  defaultReceiptChannel: "Ask",
  invoiceTermsAndNotesDefault: "Payment due within the terms stated above. Late payments may attract a delay in future credit approval.",
  quotationValidityDays: 14,
  paymentInstructions: "Pay by cash, Momo, or bank transfer using the details on this document. Quote the document number as reference.",
}

let settingsStore: ReceiptsDocumentsSettings = { ...DEFAULT_SETTINGS }

export function getReceiptsDocumentsSettings(): ReceiptsDocumentsSettings {
  return settingsStore
}

export function setReceiptsDocumentsSettings(next: ReceiptsDocumentsSettings): void {
  settingsStore = next
}

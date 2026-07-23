import { formatGHS } from "@/lib/mock-data"
import type { InvoiceLineItem, TaxLine } from "@/lib/invoice-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { STORE_INFO } from "@/lib/settings-data"

export function InvoicePreview({
  invoiceNo,
  customerName,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  discount,
  taxLines,
  total,
  note,
  paymentInstructions,
}: {
  invoiceNo: string
  customerName: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  discount: number
  taxLines: TaxLine[]
  total: number
  note: string
  paymentInstructions: string
}) {
  return (
    <div className="mx-auto flex aspect-[1/1.4142] w-full max-w-2xl flex-col gap-6 overflow-y-auto bg-white p-10 text-neutral-900 shadow-lg ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold">{STORE_INFO.name}</p>
          <p className="text-sm text-neutral-500">{STORE_INFO.addressLine}</p>
          <p className="text-sm text-neutral-500">{STORE_INFO.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-neutral-800">INVOICE</p>
          <p className="text-sm text-neutral-500">{invoiceNo}</p>
        </div>
      </div>

      <div className="flex items-start justify-between border-t border-neutral-200 pt-4 text-sm">
        <div>
          <p className="text-xs tracking-wide text-neutral-400 uppercase">Bill to</p>
          <p className="font-medium">{customerName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-neutral-500">
            Issue date <span className="ml-2 font-medium text-neutral-800">{formatDateDisplay(issueDate)}</span>
          </p>
          <p className="text-neutral-500">
            Due date <span className="ml-2 font-medium text-neutral-800">{formatDateDisplay(dueDate)}</span>
          </p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-400 uppercase">
            <th className="py-1.5 font-medium">Item</th>
            <th className="py-1.5 text-right font-medium">Qty</th>
            <th className="py-1.5 text-right font-medium">Unit price</th>
            <th className="py-1.5 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-neutral-400">
                No items added yet
              </td>
            </tr>
          ) : (
            lineItems.map((line, index) => (
              <tr key={index} className="border-b border-neutral-100">
                <td className="py-1.5">{line.name}</td>
                <td className="py-1.5 text-right">{line.quantity}</td>
                <td className="py-1.5 text-right">{formatGHS(line.unitPrice)}</td>
                <td className="py-1.5 text-right">{formatGHS(line.quantity * line.unitPrice)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="ml-auto flex w-56 flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatGHS(subtotal)}</span>
        </div>
        {taxLines.map((line) => (
          <div key={line.label} className="flex justify-between text-neutral-500">
            <span>{line.label}</span>
            <span>{formatGHS(line.amount)}</span>
          </div>
        ))}
        {discount > 0 && (
          <div className="flex justify-between text-neutral-500">
            <span>Discount</span>
            <span>− {formatGHS(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-300 pt-1.5 text-base font-semibold">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        {paymentInstructions && (
          <p>
            <span className="font-medium text-neutral-700">Payment: </span>
            {paymentInstructions}
          </p>
        )}
        {note && (
          <p>
            <span className="font-medium text-neutral-700">Note: </span>
            {note}
          </p>
        )}
      </div>
    </div>
  )
}

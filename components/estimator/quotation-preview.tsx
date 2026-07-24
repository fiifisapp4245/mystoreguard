import { formatGHS } from "@/lib/mock-data"
import type { ComputedLineItem } from "@/lib/estimator-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { getBusinessProfile } from "@/lib/business-profile-data"

export function QuotationPreview({
  quotationNo,
  customerName,
  validUntil,
  lineItems,
  subtotal,
  discount,
  total,
  note,
  terms,
}: {
  quotationNo: string
  customerName: string
  validUntil: string
  lineItems: ComputedLineItem[]
  subtotal: number
  discount: number
  total: number
  note: string
  terms: string
}) {
  // Quotations model curtain/measurement-based trades — this preview always
  // renders Larry's letterhead regardless of the active demo persona,
  // matching the prior hardcoded STORE_PERSONA_LABEL.larry behavior.
  const businessProfile = getBusinessProfile("larry")

  return (
    <div className="mx-auto flex aspect-[1/1.4142] w-full max-w-2xl flex-col gap-6 overflow-y-auto bg-white p-10 text-neutral-900 shadow-lg ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold">{businessProfile.storeName}</p>
          <p className="text-sm text-neutral-500">{businessProfile.addressLine}</p>
          <p className="text-sm text-neutral-500">{businessProfile.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-neutral-800">QUOTATION</p>
          <p className="text-sm text-neutral-500">{quotationNo}</p>
        </div>
      </div>

      <div className="flex items-start justify-between border-t border-neutral-200 pt-4 text-sm">
        <div>
          <p className="text-xs tracking-wide text-neutral-400 uppercase">Prepared for</p>
          <p className="font-medium">{customerName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-neutral-500">
            Valid until <span className="ml-2 font-medium text-neutral-800">{formatDateDisplay(validUntil)}</span>
          </p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-400 uppercase">
            <th className="py-1.5 font-medium">Item</th>
            <th className="py-1.5 text-right font-medium">Qty</th>
            <th className="py-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-neutral-400">
                No items yet
              </td>
            </tr>
          ) : (
            lineItems.map((line, index) => (
              <tr key={index} className="border-b border-neutral-100 align-top">
                <td className="py-1.5">
                  {line.name}
                  {line.computedDetail && <p className="text-xs text-neutral-400">{line.computedDetail}</p>}
                </td>
                <td className="py-1.5 text-right">{line.unitPrice > 0 ? line.quantity : "—"}</td>
                <td className="py-1.5 text-right">{line.unitPrice > 0 ? formatGHS(line.quantity * line.unitPrice) : "—"}</td>
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
        {terms && (
          <p>
            <span className="font-medium text-neutral-700">Terms: </span>
            {terms}
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

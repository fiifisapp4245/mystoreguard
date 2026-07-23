"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/register/cart-panel"
import { TotalsRail } from "@/components/register/totals-rail"
import { PaymentSheet, type CheckoutSummary, type ReceiptInfo } from "@/components/register/payment-sheet"
import { HeldSalesSheet } from "@/components/register/held-sales-sheet"
import { ManagerOverrideDialog } from "@/components/register/manager-override-dialog"
import { useDemoState } from "@/hooks/use-demo-state"
import { DEFAULT_SHOP_LOCATION_ID } from "@/lib/mock-data"
import {
  ALL_PRODUCTS,
  availableAt,
  cartSubtotal,
  deductOnHandForSale,
  findProductByBarcode,
  getProduct,
  INITIAL_HELD_SALES,
  looksLikeBarcode,
  purchaseUnitsAt,
  searchProducts,
  type CartLine,
  type HeldSale,
  type Product,
  type TenderType,
} from "@/lib/pos-data"
import { splitStock } from "@/lib/stock-movements-data"
import {
  addCreditBalanceForSale,
  getMember,
  getProgrammeSettings,
  recordSaleForMember,
  redeemPointsOnBehalf,
  tierForSpend,
  type LoyaltyMember,
} from "@/lib/loyalty-data"
import { findAffiliateByCode, recordReferredSale } from "@/lib/affiliates-data"
import { redeemGiftCard } from "@/lib/gift-cards-data"
import { recordPromoCodeUse, validatePromoCode } from "@/lib/promo-codes-data"
import {
  computeDiscountBreakdown,
  getPricingSettings,
  logOverride,
  priceFloorFor,
  type DiscountLine,
  type DiscountPriorityItem,
} from "@/lib/pricing-engine-data"
import { addSaleRecord, nextReceiptNo } from "@/lib/sales-data"
import { TODAY_ISO } from "@/lib/period-utils"

export function RegisterScreen() {
  const router = useRouter()
  const { state } = useDemoState()
  const isUltra = state.tier === "ultra"

  const [cart, setCart] = useState<CartLine[]>([])
  const [scanValue, setScanValue] = useState("")
  const [scanError, setScanError] = useState<string | null>(null)
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null)
  const [dropdownIndex, setDropdownIndex] = useState(0)
  const [quickKeysOpen, setQuickKeysOpen] = useState(false)

  const [member, setMember] = useState<LoyaltyMember | null>(null)
  const [promoCodeInput, setPromoCodeInput] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [affiliateCodeInput, setAffiliateCodeInput] = useState("")
  const [appliedAffiliate, setAppliedAffiliate] = useState<{ code: string; partnerId: string } | null>(null)
  const [affiliateError, setAffiliateError] = useState<string | null>(null)
  const [tierDiscountDismissed, setTierDiscountDismissed] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideApproved, setOverrideApproved] = useState(false)

  const [heldSales, setHeldSales] = useState<HeldSale[]>(INITIAL_HELD_SALES)
  const [heldSalesOpen, setHeldSalesOpen] = useState(false)

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [tender, setTender] = useState<TenderType>("Cash")

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [splitPromptProduct, setSplitPromptProduct] = useState<Product | null>(null)

  const scanInputRef = useRef<HTMLInputElement>(null)

  const refocusScan = useCallback(() => {
    requestAnimationFrame(() => scanInputRef.current?.focus())
  }, [])

  useEffect(() => {
    refocusScan()
  }, [refocusScan])

  const subtotal = cartSubtotal(cart)

  const pricingSettings = getPricingSettings()
  const programmeSettings = getProgrammeSettings()
  const tierDef = member ? tierForSpend(member.lifetimeSpend, programmeSettings.tiers) : null
  const tierDiscountAmount =
    member && tierDef && tierDef.discountPercent > 0 && !tierDiscountDismissed
      ? Math.round(((subtotal * tierDef.discountPercent) / 100) * 100) / 100
      : 0

  const discountLines: DiscountLine[] = useMemo(
    () =>
      computeDiscountBreakdown(
        {
          subtotal,
          promoCodeDiscount: appliedPromo ? { label: `Promo ${appliedPromo.code}`, amount: appliedPromo.discountAmount } : undefined,
          tierDiscount:
            tierDiscountAmount > 0 && member && tierDef
              ? { label: `${member.tier} member ${tierDef.discountPercent}%`, amount: tierDiscountAmount }
              : undefined,
        },
        pricingSettings
      ),
    [subtotal, appliedPromo, tierDiscountAmount, member, tierDef, pricingSettings]
  )

  const totalDiscount = discountLines.reduce((sum, line) => sum + line.amount, 0)
  const rawTotal = Math.max(0, subtotal - totalDiscount)

  const cartCostTotal = cart.reduce((sum, line) => sum + line.product.costPrice * line.quantity, 0)
  const floor = cart.length > 0 ? priceFloorFor(cartCostTotal, undefined, pricingSettings) : 0
  const breachesFloor = cart.length > 0 && rawTotal < floor

  const total =
    breachesFloor && pricingSettings.priceFloor.behavior === "cap-at-floor" ? floor : rawTotal

  const priceFloorNote = !breachesFloor
    ? undefined
    : pricingSettings.priceFloor.behavior === "block"
      ? `Below the GHS ${floor.toFixed(2)} margin floor — discount blocked.`
      : pricingSettings.priceFloor.behavior === "cap-at-floor"
        ? `Discount capped to protect margin (floor GHS ${floor.toFixed(2)}).`
        : overrideApproved
          ? "Approved by manager override."
          : `Below the GHS ${floor.toFixed(2)} margin floor — manager override required.`

  const chargeDisabled = breachesFloor && pricingSettings.priceFloor.behavior === "block"

  const searchMatches = useMemo(
    () => (scanValue.trim() && !looksLikeBarcode(scanValue) ? searchProducts(scanValue) : []),
    [scanValue]
  )

  const addProduct = useCallback(
    (product: Product) => {
      if (!product.pack.soldByMeasure) {
        const existingQty = cart.find((line) => line.product.id === product.id)?.quantity ?? 0
        const avail = availableAt(product, DEFAULT_SHOP_LOCATION_ID) - existingQty
        if (avail <= 0 && purchaseUnitsAt(product, DEFAULT_SHOP_LOCATION_ID) > 0) {
          setSplitPromptProduct(product)
          return
        }
      }

      setCart((prev) => {
        const existing = prev.find((line) => line.product.id === product.id)
        if (existing) {
          return prev.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
          )
        }
        return [...prev, { product, quantity: 1 }]
      })
      setJustAddedProductId(product.id)
      window.setTimeout(() => {
        setJustAddedProductId((current) => (current === product.id ? null : current))
      }, 1200)
    },
    [cart]
  )

  function handleConfirmSplit() {
    if (!splitPromptProduct) return
    const movement = splitStock(false, DEFAULT_SHOP_LOCATION_ID, splitPromptProduct.id, 1, "Register")
    if (!movement) {
      toast.error("Nothing sealed to split at this location.")
      setSplitPromptProduct(null)
      refocusScan()
      return
    }
    toast.success("Carton split", { description: `${movement.baseUnitsCreated} × ${splitPromptProduct.pack.baseUnit} now available.` })
    const refreshed = getProduct(splitPromptProduct.id)
    setSplitPromptProduct(null)
    if (refreshed) addProduct(refreshed)
    refocusScan()
  }

  const showScanError = useCallback((message: string) => {
    setScanError(message)
    window.setTimeout(() => setScanError((current) => (current === message ? null : current)), 2500)
  }, [])

  const handleScanSubmit = useCallback(() => {
    const raw = scanValue.trim()
    if (!raw) return

    if (looksLikeBarcode(raw)) {
      const product = findProductByBarcode(raw)
      if (product) {
        addProduct(product)
        setScanValue("")
        setScanError(null)
      } else {
        setScanValue("")
        showScanError("Barcode not recognised — search or add item")
      }
    } else {
      const matches = searchProducts(raw)
      const pick = matches[dropdownIndex] ?? matches[0]
      if (pick) {
        addProduct(pick)
        setScanValue("")
        setScanError(null)
        setDropdownIndex(0)
      } else {
        showScanError("No matching product — try another search")
      }
    }
    refocusScan()
  }, [scanValue, dropdownIndex, addProduct, showScanError, refocusScan])

  function handleSimulateScan() {
    const barcoded = ALL_PRODUCTS.filter((p) => p.barcode)
    const product = barcoded[Math.floor(Math.random() * barcoded.length)]
    setScanValue(product.barcode ?? "")
    window.setTimeout(() => {
      addProduct(product)
      setScanValue("")
      refocusScan()
    }, 150)
  }

  function handleIncrement(productId: string) {
    setCart((prev) =>
      prev.map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line))
    )
    refocusScan()
  }

  function handleDecrement(productId: string) {
    setCart((prev) =>
      prev.flatMap((line) => {
        if (line.product.id !== productId) return [line]
        const nextQuantity = line.quantity - 1
        return nextQuantity <= 0 ? [] : [{ ...line, quantity: nextQuantity }]
      })
    )
    refocusScan()
  }

  function handleRemove(productId: string) {
    setCart((prev) => prev.filter((line) => line.product.id !== productId))
    refocusScan()
  }

  function handleQuickKeyAdd(product: Product) {
    addProduct(product)
    refocusScan()
  }

  function handlePickSearchMatch(product: Product) {
    addProduct(product)
    setScanValue("")
    setDropdownIndex(0)
    refocusScan()
  }

  function resetSaleState() {
    setCart([])
    setMember(null)
    setPromoCodeInput("")
    setAppliedPromo(null)
    setPromoError(null)
    setAffiliateCodeInput("")
    setAppliedAffiliate(null)
    setAffiliateError(null)
    setTierDiscountDismissed(false)
    setOverrideApproved(false)
  }

  function handleClearCartRequest() {
    if (cart.length === 0) {
      resetSaleState()
      refocusScan()
      return
    }
    setClearConfirmOpen(true)
  }

  function confirmClearCart() {
    resetSaleState()
    setClearConfirmOpen(false)
    refocusScan()
  }

  function handleHold() {
    if (cart.length === 0) return
    const sale: HeldSale = {
      id: `hold-${cart[0].product.id}-${cart.length}-${Math.random().toString(36).slice(2, 8)}`,
      customerName: member?.name ?? "Walk-in customer",
      heldAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      lines: cart,
    }
    setHeldSales((prev) => [sale, ...prev])
    resetSaleState()
    toast.success("Sale held", {
      description: `${sale.lines.length} item${sale.lines.length === 1 ? "" : "s"} parked for later.`,
    })
    refocusScan()
  }

  function handleResumeHeld(sale: HeldSale) {
    setCart(sale.lines)
    setHeldSales((prev) => prev.filter((s) => s.id !== sale.id))
    setHeldSalesOpen(false)
    toast.success("Sale resumed")
    refocusScan()
  }

  function handleApplyPromoCode() {
    const trimmed = promoCodeInput.trim()
    if (!trimmed) return
    if (pricingSettings.stacking.onePromoCodePerTransaction && appliedPromo) {
      setPromoError("Only one promo code per transaction — remove the current one first.")
      return
    }
    const categories = Array.from(new Set(cart.map((line) => line.product.category)))
    const result = validatePromoCode(trimmed, { subtotal, categories, customerTier: member?.tier })
    if (!result.ok) {
      setPromoError(result.reason)
      return
    }
    setAppliedPromo({ code: result.promo.id, discountAmount: result.discountAmount })
    setPromoError(null)
    setPromoCodeInput("")
  }

  function handleApplyAffiliateCode() {
    const trimmed = affiliateCodeInput.trim()
    if (!trimmed) return
    const partner = findAffiliateByCode(trimmed)
    if (!partner) {
      setAffiliateError("Code not recognised")
      return
    }
    setAppliedAffiliate({ code: partner.code, partnerId: partner.id })
    setAffiliateError(null)
    setAffiliateCodeInput("")
  }

  function handleRemoveDiscountLine(source: DiscountPriorityItem) {
    if (source === "promo-code") setAppliedPromo(null)
    if (source === "tier-discount") setTierDiscountDismissed(true)
  }

  function handleChargeClick() {
    if (chargeDisabled) return
    if (breachesFloor && pricingSettings.priceFloor.behavior === "require-override" && !overrideApproved) {
      setOverrideOpen(true)
      return
    }
    setPaymentOpen(true)
  }

  function handleOverrideApprove(approvingUser: string, reason: string, note: string | undefined) {
    logOverride(approvingUser, reason, note, `Sale below price floor (GHS ${floor.toFixed(2)}) — total GHS ${total.toFixed(2)}`)
    setOverrideApproved(true)
    setOverrideOpen(false)
    setPaymentOpen(true)
  }

  function handleCheckoutComplete(summary: CheckoutSummary): ReceiptInfo {
    for (const line of cart) {
      deductOnHandForSale(line.product.id, line.quantity)
    }

    const receiptNo = nextReceiptNo()
    let pointsEarned: number | undefined
    let newPointsBalance: number | undefined

    if (member) {
      pointsEarned = recordSaleForMember(member.id, total, tender === "Credit", programmeSettings)
      if (tender === "Credit") addCreditBalanceForSale(member.id, total)
      if (summary.pointsRedeemed) redeemPointsOnBehalf(member.id, summary.pointsRedeemed, "Register")
      newPointsBalance = getMember(member.id)?.points
    }

    if (appliedPromo) recordPromoCodeUse(appliedPromo.code)
    if (appliedAffiliate) recordReferredSale(appliedAffiliate.partnerId, receiptNo, total)

    let giftCardRemainingBalance: number | undefined
    if (summary.giftCardId && summary.giftCardAppliedAmount) {
      const result = redeemGiftCard(summary.giftCardId, summary.giftCardAppliedAmount, receiptNo)
      giftCardRemainingBalance = result.cardRemainingBalance
    }

    addSaleRecord({
      id: `sale-${receiptNo}`,
      receiptNo,
      customer: member?.name ?? "Walk-in customer",
      amount: total,
      type: tender,
      date: new Date().toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }),
      dateISO: TODAY_ISO,
      cashier: "Adjoa Boateng",
      status: "Completed",
      lineItems: cart.map((line) => ({ name: line.product.name, quantity: line.quantity, unitPrice: line.product.sellingPrice })),
      pointsEarned,
      newPointsBalance,
      giftCardRemainingBalance,
      discountsApplied: discountLines,
    })

    toast.success("Sale complete", { description: receiptNo })

    return {
      pointsEarned,
      newPointsBalance,
      giftCardRemainingBalance,
      discountsApplied: discountLines,
    }
  }

  function handlePaymentDone() {
    setPaymentOpen(false)
    resetSaleState()
    refocusScan()
  }

  function exitRegister() {
    router.back()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"
      const anyOverlayOpen = clearConfirmOpen || heldSalesOpen || shortcutsOpen || splitPromptProduct !== null || overrideOpen

      if (event.key === "Escape") {
        if (paymentOpen) {
          setPaymentOpen(false)
          refocusScan()
        } else if (heldSalesOpen) {
          setHeldSalesOpen(false)
          refocusScan()
        } else if (shortcutsOpen) {
          setShortcutsOpen(false)
          refocusScan()
        } else if (splitPromptProduct !== null) {
          setSplitPromptProduct(null)
          refocusScan()
        } else if (!clearConfirmOpen && !overrideOpen) {
          exitRegister()
        }
        return
      }

      if (paymentOpen) {
        if (!isTypingTarget && ["1", "2", "3", "4", "5", "6", "7"].includes(event.key)) {
          event.preventDefault()
          const map: Record<string, TenderType> = {
            "1": "Cash",
            "2": "Momo",
            "3": "Credit",
            "4": "Deposit",
            "5": "Split",
            "6": "Gift card",
            "7": "Points",
          }
          setTender(map[event.key])
        }
        return
      }

      if (anyOverlayOpen) return

      if (event.key === "F2") {
        event.preventDefault()
        handleHold()
        return
      }
      if (event.key === "F3") {
        event.preventDefault()
        setHeldSalesOpen(true)
        return
      }
      if (event.key === "?" && !isTypingTarget) {
        setShortcutsOpen(true)
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        if (scanValue.trim()) {
          handleScanSubmit()
        } else if (cart.length > 0) {
          handleChargeClick()
        }
        return
      }

      if (event.key === "ArrowDown" && searchMatches.length > 0) {
        event.preventDefault()
        setDropdownIndex((i) => Math.min(i + 1, searchMatches.length - 1))
        return
      }
      if (event.key === "ArrowUp" && searchMatches.length > 0) {
        event.preventDefault()
        setDropdownIndex((i) => Math.max(i - 1, 0))
        return
      }

      if (!isTypingTarget && event.key.length === 1) {
        scanInputRef.current?.focus()
        setScanValue((prev) => prev + event.key)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scanValue,
    cart,
    searchMatches,
    paymentOpen,
    heldSalesOpen,
    shortcutsOpen,
    clearConfirmOpen,
    splitPromptProduct,
    overrideOpen,
  ])

  return (
    <div className="flex h-svh flex-col">
      <div className="flex h-10 shrink-0 items-center border-b px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={exitRegister}
          aria-label="Exit register"
          className="text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[62%_38%]">
        <CartPanel
          cart={cart}
          scanValue={scanValue}
          onScanChange={(value) => {
            setScanValue(value)
            setDropdownIndex(0)
          }}
          scanInputRef={scanInputRef}
          searchMatches={searchMatches}
          dropdownIndex={dropdownIndex}
          scanError={scanError}
          onSimulateScan={handleSimulateScan}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          onQuickKeyAdd={handleQuickKeyAdd}
          onPickSearchMatch={handlePickSearchMatch}
          justAddedProductId={justAddedProductId}
          quickKeysOpen={quickKeysOpen}
          onToggleQuickKeys={() => setQuickKeysOpen((open) => !open)}
        />

        <TotalsRail
          member={member}
          onAttachMember={setMember}
          onDetachMember={() => setMember(null)}
          subtotal={subtotal}
          discountLines={discountLines}
          onRemoveDiscountLine={handleRemoveDiscountLine}
          total={total}
          priceFloorNote={priceFloorNote}
          promoCodeInput={promoCodeInput}
          onPromoCodeInputChange={setPromoCodeInput}
          onApplyPromoCode={handleApplyPromoCode}
          promoError={promoError}
          isUltra={isUltra}
          affiliateCodeInput={affiliateCodeInput}
          onAffiliateCodeInputChange={setAffiliateCodeInput}
          onApplyAffiliateCode={handleApplyAffiliateCode}
          affiliateError={affiliateError}
          appliedAffiliateCode={appliedAffiliate?.code}
          cartEmpty={cart.length === 0}
          chargeDisabled={chargeDisabled}
          onChargeClick={handleChargeClick}
          onHold={handleHold}
          onClearCart={handleClearCartRequest}
          heldSalesCount={heldSales.length}
          onOpenHeldSales={() => setHeldSalesOpen(true)}
          shortcutsOpen={shortcutsOpen}
          onShortcutsOpenChange={setShortcutsOpen}
        />
      </div>

      <PaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        member={member}
        onAttachMember={setMember}
        tender={tender}
        onTenderChange={setTender}
        onComplete={handleCheckoutComplete}
        onDone={handlePaymentDone}
        onRestoreFocus={refocusScan}
        isUltra={isUltra}
        discountsApplied={discountLines}
      />

      <ManagerOverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        description={`Total GHS ${total.toFixed(2)} falls below the GHS ${floor.toFixed(2)} margin floor.`}
        onApprove={handleOverrideApprove}
      />

      <HeldSalesSheet
        open={heldSalesOpen}
        onOpenChange={setHeldSalesOpen}
        heldSales={heldSales}
        onResume={handleResumeHeld}
        onRestoreFocus={refocusScan}
      />

      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-popover p-5 shadow-lg ring-1 ring-foreground/10">
            <div>
              <p className="font-medium">Clear cart?</p>
              <p className="text-sm text-muted-foreground">
                This removes every scanned item from the current sale.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setClearConfirmOpen(false)
                  refocusScan()
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmClearCart}>
                Clear cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {splitPromptProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-popover p-5 shadow-lg ring-1 ring-foreground/10">
            <div>
              <p className="font-medium">
                No {splitPromptProduct.pack.baseUnit.toLowerCase()}s available — split a {splitPromptProduct.pack.purchaseUnit?.toLowerCase()}?
              </p>
              <p className="text-sm text-muted-foreground">
                {splitPromptProduct.name} has sealed {splitPromptProduct.pack.purchaseUnit?.toLowerCase()}s in stock. Splitting one gives{" "}
                {splitPromptProduct.pack.unitsPerPurchaseUnit} {splitPromptProduct.pack.baseUnit.toLowerCase()}s to sell from.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSplitPromptProduct(null)
                  refocusScan()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSplit}>Split {splitPromptProduct.pack.purchaseUnit}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

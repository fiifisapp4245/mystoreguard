"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/register/cart-panel"
import { TotalsRail } from "@/components/register/totals-rail"
import { PaymentSheet } from "@/components/register/payment-sheet"
import { HeldSalesSheet } from "@/components/register/held-sales-sheet"
import { AddCustomerDialog } from "@/components/hubs/people/add-customer-dialog"
import type { Customer } from "@/lib/mock-data"
import {
  ALL_PRODUCTS,
  cartSubtotal,
  findProductByBarcode,
  INITIAL_HELD_SALES,
  looksLikeBarcode,
  searchProducts,
  type CartLine,
  type HeldSale,
  type Product,
  type TenderType,
} from "@/lib/pos-data"

export function RegisterScreen() {
  const router = useRouter()

  const [cart, setCart] = useState<CartLine[]>([])
  const [scanValue, setScanValue] = useState("")
  const [scanError, setScanError] = useState<string | null>(null)
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null)
  const [dropdownIndex, setDropdownIndex] = useState(0)
  const [quickKeysOpen, setQuickKeysOpen] = useState(false)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)

  const [heldSales, setHeldSales] = useState<HeldSale[]>(INITIAL_HELD_SALES)
  const [heldSalesOpen, setHeldSalesOpen] = useState(false)

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [tender, setTender] = useState<TenderType>("Cash")

  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const scanInputRef = useRef<HTMLInputElement>(null)

  const refocusScan = useCallback(() => {
    requestAnimationFrame(() => scanInputRef.current?.focus())
  }, [])

  useEffect(() => {
    refocusScan()
  }, [refocusScan])

  const subtotal = cartSubtotal(cart)
  const total = Math.max(0, subtotal - discount)

  const searchMatches = useMemo(
    () => (scanValue.trim() && !looksLikeBarcode(scanValue) ? searchProducts(scanValue) : []),
    [scanValue]
  )

  const addProduct = useCallback((product: Product) => {
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
  }, [])

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
    setCustomer(null)
    setDiscount(0)
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
      customerName: customer?.name ?? "Walk-in customer",
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

  function handleCheckoutComplete() {
    setPaymentOpen(false)
    resetSaleState()
    toast.success("Sale complete")
    refocusScan()
  }

  function handleAddCustomer(newCustomer: Customer) {
    setCustomer(newCustomer)
    setAddCustomerOpen(false)
    toast.success("Customer added", { description: `${newCustomer.name} has been added.` })
    refocusScan()
  }

  function exitRegister() {
    router.back()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"
      const anyOverlayOpen =
        addCustomerOpen || clearConfirmOpen || heldSalesOpen || shortcutsOpen || customerPopoverOpen

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
        } else if (!addCustomerOpen && !clearConfirmOpen && !customerPopoverOpen) {
          exitRegister()
        }
        return
      }

      if (paymentOpen) {
        if (!isTypingTarget && ["1", "2", "3", "4", "5"].includes(event.key)) {
          event.preventDefault()
          const map: Record<string, TenderType> = {
            "1": "Cash",
            "2": "Momo",
            "3": "Credit",
            "4": "Deposit",
            "5": "Split",
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
          setPaymentOpen(true)
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
    addCustomerOpen,
    clearConfirmOpen,
    customerPopoverOpen,
    customer,
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
          customer={customer}
          onSelectCustomer={setCustomer}
          onAddCustomer={() => setAddCustomerOpen(true)}
          onCustomerPopoverOpenChange={setCustomerPopoverOpen}
          subtotal={subtotal}
          discount={discount}
          onDiscountChange={setDiscount}
          total={total}
          cartEmpty={cart.length === 0}
          onCharge={() => setPaymentOpen(true)}
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
        customer={customer}
        onAttachCustomer={setCustomer}
        tender={tender}
        onTenderChange={setTender}
        onComplete={handleCheckoutComplete}
        onRestoreFocus={refocusScan}
      />

      <HeldSalesSheet
        open={heldSalesOpen}
        onOpenChange={setHeldSalesOpen}
        heldSales={heldSales}
        onResume={handleResumeHeld}
        onRestoreFocus={refocusScan}
      />

      <AddCustomerDialog
        open={addCustomerOpen}
        onOpenChange={(open) => {
          setAddCustomerOpen(open)
          if (!open) refocusScan()
        }}
        onAdd={handleAddCustomer}
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
    </div>
  )
}

"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatGHS } from "@/lib/mock-data"
import type { Delivery, DeliveryProof, ProofMethod } from "@/lib/deliveries-data"

function SignaturePad({ onChange }: { onChange: (hasSignature: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)

  function getPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    drawingRef.current = true
    const { x, y } = getPos(event)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(event)
    ctx.lineTo(x, y)
    ctx.strokeStyle = "currentColor"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.stroke()
    onChange(true)
  }

  function handlePointerUp() {
    drawingRef.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full touch-none rounded-lg border bg-muted/30 text-foreground"
      />
      <button type="button" onClick={handleClear} className="self-end text-xs text-muted-foreground hover:text-foreground">
        Clear
      </button>
    </div>
  )
}

export function ProofOfDeliveryDialog({
  delivery,
  onOpenChange,
  onSubmit,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
  onSubmit: (proof: DeliveryProof) => void
}) {
  const [receivedBy, setReceivedBy] = useState("")
  const [method, setMethod] = useState<ProofMethod>("Signature")
  const [hasSignature, setHasSignature] = useState(false)
  const [photoFileName, setPhotoFileName] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [cashCollected, setCashCollected] = useState("0")
  const [collectedNote, setCollectedNote] = useState("")
  const [prevDeliveryId, setPrevDeliveryId] = useState<string | null>(null)

  // Reset each time a different delivery is opened — adjusting state during
  // render rather than in an effect, since Dialog's onOpenChange only fires
  // on user-driven open/close, not when the parent sets `delivery` externally.
  if (delivery && delivery.id !== prevDeliveryId) {
    setPrevDeliveryId(delivery.id)
    setReceivedBy(delivery.customer)
    setMethod("Signature")
    setHasSignature(false)
    setPhotoFileName("")
    setCodeInput("")
    setCashCollected(String(delivery.codAmount))
    setCollectedNote("")
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPrevDeliveryId(null)
    onOpenChange(open)
  }

  const proofSatisfied =
    method === "Signature" ? hasSignature : method === "Photo" ? photoFileName !== "" : codeInput.trim() === delivery?.confirmationCode

  function handleSubmit() {
    if (!delivery || !receivedBy.trim() || !proofSatisfied) return
    const collected = Number.parseFloat(cashCollected) || 0
    onSubmit({
      receivedBy: receivedBy.trim(),
      method,
      cashCollected: delivery.isCod ? collected : undefined,
      collectedNote:
        delivery.isCod && collected !== delivery.codAmount ? collectedNote.trim() || undefined : undefined,
      deliveredAt: "Just now",
    })
  }

  return (
    <Dialog open={delivery !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proof of delivery</DialogTitle>
          <DialogDescription>{delivery?.id} · {delivery?.customer}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proof-received-by">Received by</Label>
            <Input id="proof-received-by" value={receivedBy} onChange={(event) => setReceivedBy(event.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Proof method</Label>
            <ToggleGroup type="single" value={method} onValueChange={(v) => v && setMethod(v as ProofMethod)} variant="outline" className="w-full">
              <ToggleGroupItem value="Signature" className="flex-1">Signature</ToggleGroupItem>
              <ToggleGroupItem value="Photo" className="flex-1">Photo</ToggleGroupItem>
              <ToggleGroupItem value="Confirmation code" className="flex-1">Code</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {method === "Signature" && <SignaturePad onChange={setHasSignature} />}

          {method === "Photo" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proof-photo">Photo of delivery</Label>
              <Input
                id="proof-photo"
                type="file"
                accept="image/*"
                onChange={(event) => setPhotoFileName(event.target.files?.[0]?.name ?? "")}
              />
            </div>
          )}

          {method === "Confirmation code" && (
            <div className="flex flex-col gap-1.5">
              <p className="rounded-md bg-muted/60 p-2.5 text-sm">
                Code on this delivery: <span className="font-mono font-semibold">{delivery?.confirmationCode}</span>
              </p>
              <Label htmlFor="proof-code">Code the customer read back</Label>
              <Input id="proof-code" value={codeInput} onChange={(event) => setCodeInput(event.target.value)} maxLength={4} />
            </div>
          )}

          {delivery?.isCod && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proof-cash">Cash collected (GHS)</Label>
                <Input
                  id="proof-cash"
                  type="number"
                  min="0"
                  value={cashCollected}
                  onChange={(event) => setCashCollected(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Expected {formatGHS(delivery.codAmount)}</p>
              </div>
              {Number.parseFloat(cashCollected) !== delivery.codAmount && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proof-collected-note">Note — amount differs from expected</Label>
                  <Textarea id="proof-collected-note" value={collectedNote} onChange={(event) => setCollectedNote(event.target.value)} rows={2} />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!receivedBy.trim() || !proofSatisfied}>
            Mark delivered
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

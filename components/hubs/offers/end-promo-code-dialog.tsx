"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { endPromoCodeNow, type PromoCode } from "@/lib/promo-codes-data"

export function EndPromoCodeDialog({
  promo,
  onOpenChange,
  onEnded,
}: {
  promo: PromoCode | null
  onOpenChange: (open: boolean) => void
  onEnded: () => void
}) {
  function handleEnd() {
    if (!promo) return
    endPromoCodeNow(promo.id)
    toast.success("Promo code ended", { description: `${promo.id} is no longer valid.` })
    onEnded()
  }

  return (
    <Dialog open={promo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {promo && (
          <>
            <DialogHeader>
              <DialogTitle>End {promo.id} now?</DialogTitle>
              <DialogDescription>
                This immediately expires the code — it can no longer be redeemed at the till. Its usage history is kept.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleEnd}>
                End now
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

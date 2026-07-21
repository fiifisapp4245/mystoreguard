import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { whatsappLink } from "@/lib/site-config"
import { cn } from "@/lib/utils"

export function WhatsAppCta({
  number,
  message,
  children,
  size = "lg",
  variant = "default",
  className,
}: {
  number: string
  message?: string
  children: React.ReactNode
  size?: "default" | "lg" | "sm"
  variant?: "default" | "outline"
  className?: string
}) {
  return (
    <Button asChild size={size} variant={variant} className={cn(className)}>
      <a href={whatsappLink(number, message)} target="_blank" rel="noopener noreferrer">
        <MessageCircle />
        {children}
      </a>
    </Button>
  )
}

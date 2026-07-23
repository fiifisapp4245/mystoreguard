"use client"

import { useState } from "react"
import { Plus, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CUSTOMERS, type Customer } from "@/lib/mock-data"

export function CustomerPicker({
  customer,
  onSelect,
  onAddNew,
  onOpenChange,
  customers = CUSTOMERS,
  placeholder = "Walk-in customer",
}: {
  customer: Customer | null
  onSelect: (customer: Customer | null) => void
  onAddNew: () => void
  /** Called whenever the picker popover itself opens/closes, so the register can pause its global scan listener. */
  onOpenChange?: (open: boolean) => void
  /** Defaults to the main customer list — pass a different list (e.g. a different store persona's customers) to search against instead. */
  customers?: Customer[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
            <User className="size-4 text-muted-foreground" />
            <span className="truncate">{customer?.name ?? placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={placeholder}
                  onSelect={() => {
                    onSelect(null)
                    handleOpenChange(false)
                  }}
                >
                  <User className="size-4" />
                  {placeholder}
                </CommandItem>
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      onSelect(c)
                      handleOpenChange(false)
                    }}
                  >
                    <User className="size-4" />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={onAddNew} aria-label="Add new customer">
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

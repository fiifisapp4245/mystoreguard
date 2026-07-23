"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AddCustomerDialog } from "@/components/hubs/people/add-customer-dialog"
import { CustomerDetailSheet } from "@/components/hubs/people/customer-detail-sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LARRY_CUSTOMERS } from "@/lib/larry-data"
import { CUSTOMERS, formatGHS, initials, type Customer } from "@/lib/mock-data"
import { useDemoState } from "@/hooks/use-demo-state"

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "outline",
}

type StatusFilter = "all" | "Active" | "Inactive"
type TierFilter = "all" | "Bronze" | "Silver" | "Gold"

export function CustomersTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"

  const [customers, setCustomers] = useState<Customer[]>(() => (isLarry ? LARRY_CUSTOMERS : CUSTOMERS))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setCustomers(isLarry ? LARRY_CUSTOMERS : CUSTOMERS)
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)

  const stats = useMemo(
    () => [
      { label: "Total customers", value: String(customers.length) },
      { label: "Active", value: String(customers.filter((c) => c.status === "Active").length) },
      { label: "Gold / Silver tier", value: String(customers.filter((c) => c.loyaltyTier !== "Bronze").length) },
    ],
    [customers]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const queryDigits = query.replace(/\s/g, "")

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.phone.replace(/\s/g, "").includes(queryDigits)
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter
      const matchesTier = tierFilter === "all" || customer.loyaltyTier === tierFilter
      return matchesSearch && matchesStatus && matchesTier
    })
  }, [customers, search, statusFilter, tierFilter])

  function handleAdd(customer: Customer) {
    setCustomers((prev) => [customer, ...prev])
    setAddOpen(false)
    toast.success("Customer added", { description: `${customer.name} has been added.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={(value) => setTierFilter(value as TierFilter)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add customer
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Total spend</TableHead>
              <TableHead>Last purchase</TableHead>
              <TableHead>Loyalty tier</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => setSelected(customer)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{initials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium whitespace-nowrap">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                <TableCell className="text-muted-foreground">{customer.area}</TableCell>
                <TableCell>{formatGHS(customer.totalSpend)}</TableCell>
                <TableCell className="text-muted-foreground">{customer.lastPurchase}</TableCell>
                <TableCell>
                  <Badge variant={TIER_BADGE_VARIANT[customer.loyaltyTier]}>{customer.loyaltyTier}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge label={customer.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No customers match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <CustomerDetailSheet customer={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "This month",
    value: "GHS 5,240",
    trend: { value: 6, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Entries",
    value: "23",
    trend: { value: 4, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Largest category",
    value: "Rent",
  },
]

const EXPENSES = [
  {
    description: "Shop rent — July",
    category: "Rent",
    amount: "GHS 2,000.00",
    date: "1 Jul 2026",
    recordedBy: "Kwabena Owusu",
  },
  {
    description: "ECG electricity bill",
    category: "Utilities",
    amount: "GHS 640.00",
    date: "5 Jul 2026",
    recordedBy: "Kwabena Owusu",
  },
  {
    description: "Staff wages — first half",
    category: "Wages",
    amount: "GHS 1,800.00",
    date: "15 Jul 2026",
    recordedBy: "Kwabena Owusu",
  },
  {
    description: "Fuel for delivery trips",
    category: "Transport",
    amount: "GHS 320.00",
    date: "17 Jul 2026",
    recordedBy: "Adjoa Boateng",
  },
  {
    description: "Fridge repair",
    category: "Repairs",
    amount: "GHS 280.00",
    date: "19 Jul 2026",
    recordedBy: "Kwabena Owusu",
  },
  {
    description: "Packaging bags",
    category: "Miscellaneous",
    amount: "GHS 200.00",
    date: "20 Jul 2026",
    recordedBy: "Abena Darko",
  },
]

export function ExpensesPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title={module.name}
        subtitle={module.description}
        search="Search expenses..."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Expenses</CardTitle>
          <CardDescription>
            Every cost recorded against the business this month.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXPENSES.map((expense) => (
                <TableRow key={expense.description}>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.date}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.recordedBy}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

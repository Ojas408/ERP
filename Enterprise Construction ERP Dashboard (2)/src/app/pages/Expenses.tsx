import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Upload, Download, Plus, Edit, Trash2, FileText, Printer } from "lucide-react"

const expenseByCategory = [
  { id: "exp1", name: "Fuel", value: 35, amount: 437500, color: "#3b82f6" },
  { id: "exp2", name: "Salary", value: 30, amount: 375000, color: "#10b981" },
  { id: "exp3", name: "Maintenance", value: 15, amount: 187500, color: "#f59e0b" },
  { id: "exp4", name: "Vendor Payments", value: 12, amount: 150000, color: "#ef4444" },
  { id: "exp5", name: "Site Costs", value: 8, amount: 100000, color: "#8b5cf6" },
]

const monthlyExpenses = [
  { id: "me1", month: "Jan", fuel: 380000, salary: 350000, maintenance: 150000, vendor: 120000, site: 90000 },
  { id: "me2", month: "Feb", fuel: 410000, salary: 360000, maintenance: 165000, vendor: 135000, site: 95000 },
  { id: "me3", month: "Mar", fuel: 425000, salary: 370000, maintenance: 175000, vendor: 145000, site: 98000 },
  { id: "me4", month: "Apr", fuel: 420000, salary: 365000, maintenance: 180000, vendor: 140000, site: 96000 },
  { id: "me5", month: "May", fuel: 437500, salary: 375000, maintenance: 187500, vendor: 150000, site: 100000 },
]

const recentExpenses = [
  { id: "re1", date: "May 24", category: "Fuel", description: "Diesel purchase - 500L", amount: 45000, status: "paid" },
  { id: "re2", date: "May 24", category: "Maintenance", description: "Excavator repair", amount: 28000, status: "paid" },
  { id: "re3", date: "May 23", category: "Vendor Payments", description: "Steel supplier - May batch", amount: 125000, status: "pending" },
  { id: "re4", date: "May 23", category: "Site Costs", description: "Site security & utilities", amount: 15000, status: "paid" },
  { id: "re5", date: "May 22", category: "Salary", description: "Weekly wages - Labor team A", amount: 85000, status: "paid" },
  { id: "re6", date: "May 22", category: "Fuel", description: "Diesel purchase - 450L", amount: 40500, status: "paid" },
  { id: "re7", date: "May 21", category: "Maintenance", description: "Crusher maintenance", amount: 32000, status: "pending" },
]

export default function Expenses() {
  const totalExpenses = expenseByCategory.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Expense Report</h1>
          <p className="text-sm text-muted-foreground">
            Monitor all operational expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Expenses"
          value="₹12.5L"
          subtitle="this month"
          icon={DollarSign}
          colorClass="bg-red-100 dark:bg-red-900/30"
          trend={{ value: 7.2, isPositive: false }}
        />
        <KPICard
          title="Fuel Costs"
          value="₹4.37L"
          subtitle="35% of total"
          icon={TrendingUp}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 4.2, isPositive: false }}
        />
        <KPICard
          title="Salary & Wages"
          value="₹3.75L"
          subtitle="30% of total"
          icon={CreditCard}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Pending Payments"
          value="₹1.57L"
          subtitle="2 invoices due"
          icon={TrendingDown}
          colorClass="bg-yellow-100 dark:bg-yellow-900/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Distribution by category (₹{(totalExpenses / 100000).toFixed(2)}L total)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByCategory.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
            <CardDescription>Historical expense data by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="fuel" stroke="#3b82f6" strokeWidth={2} name="Fuel" />
                <Line type="monotone" dataKey="salary" stroke="#10b981" strokeWidth={2} name="Salary" />
                <Line type="monotone" dataKey="maintenance" stroke="#f59e0b" strokeWidth={2} name="Maintenance" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest expense records and payment status</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs">{expense.date}</TableCell>
                    <TableCell className="text-xs">{expense.category}</TableCell>
                    <TableCell className="text-xs">{expense.description}</TableCell>
                    <TableCell className="text-xs">₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={expense.status === "paid" ? "secondary" : "outline"} className="text-xs">
                        {expense.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

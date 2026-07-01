import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Landmark, TrendingUp, TrendingDown, DollarSign, Upload, Download, FileText, Eye, Edit, Trash2, CheckCircle2, CreditCard } from "lucide-react"
import { useDateRange } from "../contexts/DateRangeContext"
import { fetchAccountsReport } from "../services/api"

const plData = [
  { id: "income1", type: "Income", head: "Product Sales", amount: 1850000 },
  { id: "income2", type: "Income", head: "Service Revenue", amount: 425000 },
  { id: "income3", type: "Income", head: "Other Income", amount: 125000 },
  { id: "expense1", type: "Expense", head: "Raw Material Cost", amount: 845000 },
  { id: "expense2", type: "Expense", head: "Employee Salaries", amount: 625000 },
  { id: "expense3", type: "Expense", head: "Utilities & Rent", amount: 185000 },
  { id: "expense4", type: "Expense", head: "Maintenance", amount: 125000 },
  { id: "expense5", type: "Expense", head: "Marketing & Admin", amount: 95000 },
]

const cashFlowData = [
  { id: "cf1", month: "Dec", inflow: 195, outflow: 178, balance: 417 },
  { id: "cf2", month: "Jan", inflow: 210, outflow: 185, balance: 442 },
  { id: "cf3", month: "Feb", inflow: 198, outflow: 192, balance: 448 },
  { id: "cf4", month: "Mar", inflow: 225, outflow: 205, balance: 468 },
  { id: "cf5", month: "Apr", inflow: 215, outflow: 198, balance: 485 },
  { id: "cf6", month: "May", inflow: 240, outflow: 210, balance: 515 },
]

const gstData = [
  { id: "gst1", month: "January", taxable: 1850000, cgst: 92500, sgst: 92500, igst: 0, total: 185000, status: "Filed" },
  { id: "gst2", month: "February", taxable: 1925000, cgst: 96250, sgst: 96250, igst: 0, total: 192500, status: "Filed" },
  { id: "gst3", month: "March", taxable: 2100000, cgst: 105000, sgst: 105000, igst: 0, total: 210000, status: "Filed" },
  { id: "gst4", month: "April", taxable: 1980000, cgst: 99000, sgst: 99000, igst: 0, total: 198000, status: "Filed" },
  { id: "gst5", month: "May", taxable: 2250000, cgst: 112500, sgst: 112500, igst: 0, total: 225000, status: "Pending" },
]

const receivables = [
  { id: "rec1", party: "ABC Construction Ltd", invoice: "INV-2024-456", amount: "₹3.5L", dueDate: "May 28", daysOverdue: 0, status: "Due" },
  { id: "rec2", party: "XYZ Builders", invoice: "INV-2024-423", amount: "₹2.8L", dueDate: "May 22", daysOverdue: 3, status: "Overdue" },
  { id: "rec3", party: "PQR Developers", invoice: "INV-2024-389", amount: "₹4.2L", dueDate: "Jun 5", daysOverdue: 0, status: "Due" },
]

const payables = [
  { id: "pay1", party: "Supreme Cement Ltd", invoice: "VINV-8945", amount: "₹2.5L", dueDate: "May 28", daysOverdue: 0, status: "Due" },
  { id: "pay2", party: "JSW Steel", invoice: "VINV-8923", amount: "₹3.2L", dueDate: "May 20", daysOverdue: 5, status: "Overdue" },
  { id: "pay3", party: "Bharat Petroleum", invoice: "VINV-8967", amount: "₹1.8L", dueDate: "Jun 2", daysOverdue: 0, status: "Due" },
]

export default function Accounts() {
  const { dateRange } = useDateRange()
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    fetchAccountsReport()
      .then(setReport)
      .catch((error) => console.error("Failed to load accounts report:", error))
  }, [])

  const currentPlData = report?.plData || plData
  const currentCashFlowData = report?.cashFlowData || cashFlowData
  const currentGstData = report?.gstData || gstData
  const currentReceivables = report?.receivables || receivables
  const currentPayables = report?.payables || payables

  const totalIncome = currentPlData.filter((item: any) => item.type === "Income").reduce((sum: number, item: any) => sum + item.amount, 0)
  const totalExpense = currentPlData.filter((item: any) => item.type === "Expense").reduce((sum: number, item: any) => sum + item.amount, 0)
  const netProfit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0"
  const currentBalance = currentCashFlowData.at(-1)?.balance || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Accounts & Finance</h1>
          <p className="text-sm text-muted-foreground">
            Financial statements and account management · {dateRange.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="text-xs h-9">
            <FileText className="h-4 w-4 mr-2" />
            Generate Statement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`₹${(totalIncome / 100000).toFixed(1)}L`}
          subtitle="this period"
          icon={TrendingUp}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Total Expenses"
          value={`₹${(totalExpense / 100000).toFixed(1)}L`}
          subtitle="this period"
          icon={TrendingDown}
          colorClass="bg-red-100 dark:bg-red-900/30"
        />
        <KPICard
          title="Net Profit"
          value={`₹${(netProfit / 100000).toFixed(1)}L`}
          subtitle="profit after expenses"
          icon={DollarSign}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 18.3, isPositive: true }}
        />
        <KPICard
          title="Profit Margin"
          value={`${profitMargin}%`}
          subtitle="profitability ratio"
          icon={Landmark}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 3.2, isPositive: true }}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pl">P&L Summary</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="gst">GST Summary</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Payments</TabsTrigger>
        </TabsList>

        {/* P&L Summary Tab */}
        <TabsContent value="pl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Income and expense breakdown for the period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPlData.filter((item: any) => item.type === "Income").map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Income
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{item.head}</TableCell>
                        <TableCell className="text-xs">₹{item.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell className="text-xs">Total Income</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs">₹{totalIncome.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {currentPlData.filter((item: any) => item.type === "Expense").map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          <Badge variant="destructive" className="text-xs">
                            Expense
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{item.head}</TableCell>
                        <TableCell className="text-xs">₹{item.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell className="text-xs">Total Expenses</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs">₹{totalExpense.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-green-100 dark:bg-green-900/30">
                      <TableCell className="text-xs">Net Profit</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs text-green-800 dark:text-green-400">₹{netProfit.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Monthly cash inflow vs outflow (in ₹L)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={currentCashFlowData}>
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
                  <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} name="Cash Inflow" />
                  <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Cash Outflow" />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Running Balance" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-2xl text-green-600 dark:text-green-400">₹{currentBalance}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST Summary Tab */}
        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
              <CardDescription>Monthly GST collection and filing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Taxable Value</TableHead>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                      <TableHead>IGST</TableHead>
                      <TableHead>Total GST</TableHead>
                      <TableHead>Filing Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {currentGstData.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">{item.month}</TableCell>
                        <TableCell className="text-xs">₹{item.taxable.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">₹{item.cgst.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">₹{item.sgst.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">₹{item.igst.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">₹{item.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === "Filed" ? "default" : "outline"}
                            className={`text-xs ${item.status === "Filed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding Payments Tab */}
        <TabsContent value="outstanding" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receivables</CardTitle>
                <CardDescription>Outstanding payments from clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party Name</TableHead>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentReceivables.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.party}</TableCell>
                          <TableCell className="text-xs">{item.invoice}</TableCell>
                          <TableCell className="text-xs">₹{typeof item.amount === "number" ? item.amount.toLocaleString() : item.amount}</TableCell>
                          <TableCell className="text-xs">{item.dueDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.status === "Overdue" ? "destructive" : "outline"}
                              className={`text-xs ${item.status === "Due" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}`}
                            >
                              {item.status}
                              {item.daysOverdue > 0 && ` (${item.daysOverdue}d)`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-green-700 hover:text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Collect
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

            <Card>
              <CardHeader>
                <CardTitle>Payables</CardTitle>
                <CardDescription>Outstanding payments to vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party Name</TableHead>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPayables.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.party}</TableCell>
                          <TableCell className="text-xs">{item.invoice}</TableCell>
                          <TableCell className="text-xs">₹{typeof item.amount === "number" ? item.amount.toLocaleString() : item.amount}</TableCell>
                          <TableCell className="text-xs">{item.dueDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.status === "Overdue" ? "destructive" : "outline"}
                              className={`text-xs ${item.status === "Due" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}`}
                            >
                              {item.status}
                              {item.daysOverdue > 0 && ` (${item.daysOverdue}d)`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-blue-700 hover:text-blue-700">
                                <CreditCard className="h-3.5 w-3.5 mr-1" />Pay
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

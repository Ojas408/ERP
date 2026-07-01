import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Building, TrendingUp, Clock, CheckCircle, Upload, Download, Eye, Edit, Trash2 } from "lucide-react"

const vendors = [
  { id: "v1", name: "Supreme Cement Ltd", category: "Materials", rating: 4.8, orders: 45, value: "₹22.5L", status: "active", onTime: 96 },
  { id: "v2", name: "JSW Steel", category: "Materials", rating: 4.7, orders: 38, value: "₹18.6L", status: "active", onTime: 94 },
  { id: "v3", name: "Bharat Petroleum", category: "Fuel", rating: 4.9, orders: 52, value: "₹15.2L", status: "active", onTime: 98 },
  { id: "v4", name: "Local Quarry", category: "Raw Materials", rating: 4.5, orders: 62, value: "₹12.8L", status: "active", onTime: 92 },
  { id: "v5", name: "Caterpillar India", category: "Equipment", rating: 4.6, orders: 12, value: "₹8.5L", status: "active", onTime: 95 },
  { id: "v6", name: "Safety First Supplies", category: "Safety Equipment", rating: 4.4, orders: 28, value: "₹3.2L", status: "active", onTime: 90 },
  { id: "v7", name: "Spare Parts Hub", category: "Maintenance", rating: 4.3, orders: 35, value: "₹5.6L", status: "pending", onTime: 88 },
]

const categorySpend = [
  { id: "cs1", name: "Materials", value: 42, amount: 3525, color: "#3b82f6" },
  { id: "cs2", name: "Fuel", value: 28, amount: 2350, color: "#10b981" },
  { id: "cs3", name: "Equipment", value: 18, amount: 1512, color: "#f59e0b" },
  { id: "cs4", name: "Services", value: 12, amount: 1008, color: "#ef4444" },
]

const monthlySpend = [
  { id: "ms1", month: "Jan", spend: 72, orders: 185 },
  { id: "ms2", month: "Feb", spend: 78, orders: 195 },
  { id: "ms3", month: "Mar", spend: 85, orders: 210 },
  { id: "ms4", month: "Apr", spend: 80, orders: 198 },
  { id: "ms5", month: "May", spend: 86, orders: 215 },
]

const paymentStatus = [
  { id: "ps1", vendor: "Supreme Cement Ltd", invoice: "INV-2024-1234", amount: "₹2.5L", dueDate: "May 28", status: "pending" },
  { id: "ps2", vendor: "JSW Steel", invoice: "INV-2024-1235", amount: "₹1.8L", dueDate: "May 25", status: "paid" },
  { id: "ps3", vendor: "Bharat Petroleum", invoice: "INV-2024-1236", amount: "₹1.2L", dueDate: "May 30", status: "pending" },
  { id: "ps4", vendor: "Local Quarry", invoice: "INV-2024-1237", amount: "₹0.95L", dueDate: "May 26", status: "paid" },
  { id: "ps5", vendor: "Caterpillar India", invoice: "INV-2024-1238", amount: "₹3.2L", dueDate: "Jun 2", status: "pending" },
]

const performanceMetrics = [
  { id: "pm1", metric: "On-Time Delivery", value: 94.5 },
  { id: "pm2", metric: "Quality Rating", value: 4.6 },
  { id: "pm3", metric: "Response Time", value: 92.0 },
  { id: "pm4", metric: "Compliance Score", value: 96.8 },
]

export default function VendorManagement() {
  const totalVendors = vendors.length
  const activeVendors = vendors.filter(v => v.status === "active").length
  const totalSpend = categorySpend.reduce((sum, cat) => sum + cat.amount, 0)
  const pendingPayments = paymentStatus.filter(p => p.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Vendor Management</h1>
          <p className="text-sm text-muted-foreground">
            Supplier relationships and procurement tracking
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
            <Building className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vendors"
          value={totalVendors.toString()}
          subtitle={`${activeVendors} active`}
          icon={Building}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Monthly Spend"
          value={`₹${totalSpend / 100}L`}
          subtitle="across all vendors"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 7.5, isPositive: false }}
        />
        <KPICard
          title="Pending Payments"
          value={pendingPayments.toString()}
          subtitle="invoices due"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Avg On-Time"
          value="94.5%"
          subtitle="delivery rate"
          icon={CheckCircle}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 2.3, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
            <CardDescription>Distribution of vendor spending (₹{totalSpend / 100}L total)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySpend}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySpend.map((entry) => (
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
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Procurement volume and order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} name="Spend (₹L)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Complete vendor roster and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="text-xs">{vendor.name}</TableCell>
                    <TableCell className="text-xs">{vendor.category}</TableCell>
                    <TableCell className="text-xs">⭐ {vendor.rating}</TableCell>
                    <TableCell className="text-xs">{vendor.orders}</TableCell>
                    <TableCell className="text-xs">{vendor.value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">{vendor.onTime}%</span>
                        <div className="w-16">
                          <Progress value={vendor.onTime} className="h-1.5" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={vendor.status === "active" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
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

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Pending and recent payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentStatus.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs">{payment.vendor}</TableCell>
                    <TableCell className="text-xs">{payment.invoice}</TableCell>
                    <TableCell className="text-xs">{payment.amount}</TableCell>
                    <TableCell className="text-xs">{payment.dueDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "paid" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {payment.status === "pending" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs ml-1">
                            Pay Now
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
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

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance Metrics</CardTitle>
          <CardDescription>Overall vendor performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl mb-1">{metric.value}{metric.metric.includes("Rating") ? "/5" : "%"}</p>
                <p className="text-xs text-muted-foreground">{metric.metric}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

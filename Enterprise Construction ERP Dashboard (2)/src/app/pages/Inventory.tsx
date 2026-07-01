import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Upload, Download, Eye, Edit, Trash2 } from "lucide-react"

const stockLevels = [
  { id: "sl1", material: "Cement", current: 1200, minimum: 800, maximum: 2000, unit: "Bags", status: "optimal" },
  { id: "sl2", material: "Steel Rods", current: 45, minimum: 50, maximum: 150, unit: "Tons", status: "low" },
  { id: "sl3", material: "Diesel", current: 2500, minimum: 2000, maximum: 5000, unit: "Liters", status: "optimal" },
  { id: "sl4", material: "Aggregates", current: 180, minimum: 100, maximum: 300, unit: "Tons", status: "optimal" },
  { id: "sl5", material: "Sand", current: 65, minimum: 80, maximum: 200, unit: "Tons", status: "low" },
  { id: "sl6", material: "Gravel", current: 120, minimum: 100, maximum: 250, unit: "Tons", status: "optimal" },
]

const stockMovement = [
  { id: "sm1", date: "May 20", inward: 450, outward: 380, balance: 2340 },
  { id: "sm2", date: "May 21", inward: 520, outward: 420, balance: 2440 },
  { id: "sm3", date: "May 22", inward: 380, outward: 450, balance: 2370 },
  { id: "sm4", date: "May 23", inward: 600, outward: 410, balance: 2560 },
  { id: "sm5", date: "May 24", inward: 480, outward: 395, balance: 2645 },
]

const categoryDistribution = [
  { id: "cd1", name: "Raw Materials", value: 42, amount: 1110, color: "#3b82f6" },
  { id: "cd2", name: "Fuel & Lubricants", value: 28, amount: 740, color: "#10b981" },
  { id: "cd3", name: "Spare Parts", value: 18, amount: 475, color: "#f59e0b" },
  { id: "cd4", name: "Safety Equipment", value: 12, amount: 320, color: "#ef4444" },
]

const recentTransactions = [
  { id: "rt1", date: "May 24", type: "Inward", material: "Cement", quantity: 200, unit: "Bags", supplier: "Supreme Cement Ltd", ref: "PO-2024-345" },
  { id: "rt2", date: "May 24", type: "Outward", material: "Diesel", quantity: 500, unit: "Liters", supplier: "Site A", ref: "REQ-789" },
  { id: "rt3", date: "May 23", type: "Inward", material: "Steel Rods", quantity: 15, unit: "Tons", supplier: "JSW Steel", ref: "PO-2024-346" },
  { id: "rt4", date: "May 23", type: "Outward", material: "Aggregates", quantity: 25, unit: "Tons", supplier: "Site B", ref: "REQ-790" },
  { id: "rt5", date: "May 22", type: "Inward", material: "Sand", quantity: 40, unit: "Tons", supplier: "Local Quarry", ref: "PO-2024-347" },
]

export default function Inventory() {
  const totalValue = categoryDistribution.reduce((sum, item) => sum + item.amount, 0)
  const lowStockItems = stockLevels.filter(item => item.status === "low").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Inventory & Materials</h1>
          <p className="text-sm text-muted-foreground">
            Stock management and material tracking
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
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Stock Value"
          value={`₹${totalValue}L`}
          subtitle="current inventory"
          icon={Package}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Stock Items"
          value={stockLevels.length.toString()}
          subtitle="active materials"
          icon={Package}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Low Stock Alert"
          value={lowStockItems.toString()}
          subtitle="items need reorder"
          icon={AlertTriangle}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Stock Turnover"
          value="4.2x"
          subtitle="this month"
          icon={TrendingDown}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 8.5, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Trend</CardTitle>
            <CardDescription>Daily inward and outward movement (in units)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stockMovement}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="inward" stroke="#10b981" strokeWidth={2} name="Inward" />
                <Line type="monotone" dataKey="outward" stroke="#ef4444" strokeWidth={2} name="Outward" />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Stock distribution (₹{totalValue}L total value)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry) => (
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
      </div>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>Material inventory and reorder status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Level</TableHead>
                  <TableHead>Maximum Level</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.material}</TableCell>
                    <TableCell className="text-xs">{item.current.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{item.minimum.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{item.maximum.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{item.unit}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "optimal" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {item.status === "optimal" ? "Optimal" : "Low Stock"}
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
                        {item.status === "low" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs ml-1">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest stock movements and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Supplier/Location</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-xs">{txn.date}</TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "Inward" ? "default" : "outline"} className="text-xs">
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{txn.material}</TableCell>
                    <TableCell className="text-xs">{txn.quantity}</TableCell>
                    <TableCell className="text-xs">{txn.unit}</TableCell>
                    <TableCell className="text-xs">{txn.supplier}</TableCell>
                    <TableCell className="text-xs">{txn.ref}</TableCell>
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
    </div>
  )
}

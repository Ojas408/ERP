import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Factory, TrendingUp, Target, Activity, Upload, Download, Plus, Edit, Trash2, Eye } from "lucide-react"

const dailyProduction = [
  { id: "dp1", date: "May 18", production: 580, target: 500, efficiency: 116 },
  { id: "dp2", date: "May 19", production: 610, target: 500, efficiency: 122 },
  { id: "dp3", date: "May 20", production: 590, target: 500, efficiency: 118 },
  { id: "dp4", date: "May 21", production: 620, target: 500, efficiency: 124 },
  { id: "dp5", date: "May 22", production: 640, target: 500, efficiency: 128 },
  { id: "dp6", date: "May 23", production: 595, target: 500, efficiency: 119 },
  { id: "dp7", date: "May 24", production: 635, target: 500, efficiency: 127 },
]

const productionByMachine = [
  { id: "pm1", machine: "Crusher-1", production: 2840, target: 2500, utilization: 94 },
  { id: "pm2", machine: "Crusher-2", production: 2680, target: 2500, utilization: 89 },
  { id: "pm3", machine: "Screener-1", production: 1920, target: 2000, utilization: 86 },
  { id: "pm4", machine: "Conveyor Belt A", production: 3200, target: 3000, utilization: 97 },
  { id: "pm5", machine: "Loader-1", production: 1650, target: 1500, utilization: 92 },
]

const shiftProduction = [
  { id: "sp1", shift: "Morning (6AM-2PM)", production: 245, percentage: 38.5 },
  { id: "sp2", shift: "Afternoon (2PM-10PM)", production: 268, percentage: 42.2 },
  { id: "sp3", shift: "Night (10PM-6AM)", production: 122, percentage: 19.3 },
]

const productTypes = [
  { id: "pt1", product: "20mm Aggregates", quantity: 185, unit: "Tons", revenue: "₹5.55L" },
  { id: "pt2", product: "40mm Aggregates", quantity: 165, unit: "Tons", revenue: "₹4.95L" },
  { id: "pt3", product: "Crushed Sand", quantity: 142, unit: "Tons", revenue: "₹2.84L" },
  { id: "pt4", product: "Dust", quantity: 98, unit: "Tons", revenue: "₹0.98L" },
  { id: "pt5", product: "Boulder", quantity: 45, unit: "Tons", revenue: "₹1.35L" },
]

export default function Production() {
  const totalProduction = dailyProduction.reduce((sum, item) => sum + item.production, 0)
  const avgEfficiency = Math.round(dailyProduction.reduce((sum, item) => sum + item.efficiency, 0) / dailyProduction.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Production Report</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive production tracking and analysis
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
            Add Entry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Production"
          value="635"
          subtitle="tons produced"
          icon={Factory}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 6.9, isPositive: true }}
        />
        <KPICard
          title="Weekly Total"
          value="4,270"
          subtitle="tons this week"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 12.3, isPositive: true }}
        />
        <KPICard
          title="Target Achievement"
          value="127%"
          subtitle="vs daily target"
          icon={Target}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 27, isPositive: true }}
        />
        <KPICard
          title="Avg Efficiency"
          value={`${avgEfficiency}%`}
          subtitle="this week"
          icon={Activity}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 8.5, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Production Trend</CardTitle>
            <CardDescription>Production vs target (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyProduction}>
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
                <Area type="monotone" dataKey="production" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Actual Production" />
                <Area type="monotone" dataKey="target" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Target" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production by Machine</CardTitle>
            <CardDescription>Equipment-wise output comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionByMachine}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="machine" className="text-xs" angle={-15} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="production" fill="#3b82f6" name="Production" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Shift Production */}
      <Card>
        <CardHeader>
          <CardTitle>Shift-wise Production Analysis</CardTitle>
          <CardDescription>Production distribution across shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shiftProduction.map((shift) => (
              <div key={shift.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">{shift.shift}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs">{shift.production} tons</span>
                    <span className="text-xs text-muted-foreground">{shift.percentage}%</span>
                  </div>
                </div>
                <Progress value={shift.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product-wise Output</CardTitle>
          <CardDescription>Detailed breakdown by product type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTypes.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-xs">{product.product}</TableCell>
                    <TableCell className="text-xs">{product.quantity}</TableCell>
                    <TableCell className="text-xs">{product.unit}</TableCell>
                    <TableCell className="text-xs">{product.revenue}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        Active
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
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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

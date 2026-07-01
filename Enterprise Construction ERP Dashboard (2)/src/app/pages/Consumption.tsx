import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Fuel, Package, Hammer, Mountain, Upload, Download, Plus, Edit, Trash2, FileSpreadsheet } from "lucide-react"

const monthlyConsumption = [
  { id: "m1", month: "Jan", diesel: 11200, cement: 8500, steel: 14200, aggregates: 7200 },
  { id: "m2", month: "Feb", diesel: 11800, cement: 8900, steel: 14800, aggregates: 7500 },
  { id: "m3", month: "Mar", diesel: 12200, cement: 9200, steel: 15200, aggregates: 7800 },
  { id: "m4", month: "Apr", diesel: 12000, cement: 8800, steel: 15000, aggregates: 7600 },
  { id: "m5", month: "May", diesel: 12500, cement: 8900, steel: 15600, aggregates: 7800 },
]

const dailyConsumption = [
  { id: "d1", date: "May 20", diesel: 420, cement: 310, steel: 580, aggregates: 280 },
  { id: "d2", date: "May 21", diesel: 450, cement: 295, steel: 620, aggregates: 260 },
  { id: "d3", date: "May 22", diesel: 410, cement: 320, steel: 590, aggregates: 290 },
  { id: "d4", date: "May 23", diesel: 480, cement: 305, steel: 640, aggregates: 275 },
  { id: "d5", date: "May 24", diesel: 440, cement: 315, steel: 610, aggregates: 285 },
]

const consumptionDetails = [
  { id: "c1", material: "Diesel", consumed: 12500, budgeted: 10000, unit: "Liters", cost: "₹12.5L", status: "over" },
  { id: "c2", material: "Cement", consumed: 8900, budgeted: 9000, unit: "Bags", cost: "₹8.9L", status: "within" },
  { id: "c3", material: "Steel", consumed: 15600, budgeted: 14000, unit: "Tons", cost: "₹15.6L", status: "over" },
  { id: "c4", material: "Aggregates", consumed: 7800, budgeted: 8000, unit: "Tons", cost: "₹7.8L", status: "within" },
  { id: "c5", material: "Sand", consumed: 6200, budgeted: 6500, unit: "Tons", cost: "₹6.2L", status: "within" },
]

export default function Consumption() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Consumption Report</h1>
          <p className="text-sm text-muted-foreground">
            Material and fuel consumption tracking
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
          title="Total Diesel"
          value="12.5K"
          subtitle="liters this month"
          icon={Fuel}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 25, isPositive: false }}
        />
        <KPICard
          title="Cement Consumption"
          value="8,900"
          subtitle="bags this month"
          icon={Package}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 1.1, isPositive: false }}
        />
        <KPICard
          title="Steel Used"
          value="15.6K"
          subtitle="tons this month"
          icon={Hammer}
          colorClass="bg-red-100 dark:bg-red-900/30"
          trend={{ value: 11.4, isPositive: false }}
        />
        <KPICard
          title="Aggregates"
          value="7,800"
          subtitle="tons this month"
          icon={Mountain}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 2.5, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Consumption Trend</CardTitle>
            <CardDescription>Historical consumption data by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyConsumption}>
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
                <Line type="monotone" dataKey="diesel" stroke="#f59e0b" strokeWidth={2} name="Diesel" />
                <Line type="monotone" dataKey="cement" stroke="#3b82f6" strokeWidth={2} name="Cement" />
                <Line type="monotone" dataKey="steel" stroke="#ef4444" strokeWidth={2} name="Steel" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Consumption (Last 5 Days)</CardTitle>
            <CardDescription>Recent daily usage pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyConsumption}>
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
                <Bar dataKey="diesel" fill="#f59e0b" name="Diesel" />
                <Bar dataKey="cement" fill="#3b82f6" name="Cement" />
                <Bar dataKey="steel" fill="#ef4444" name="Steel" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumption vs Budget</CardTitle>
              <CardDescription>Detailed breakdown of material consumption against budgeted amounts</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Consumed</TableHead>
                  <TableHead>Budgeted</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionDetails.map((item) => {
                  const variance = ((item.consumed - item.budgeted) / item.budgeted * 100).toFixed(1)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{item.material}</TableCell>
                      <TableCell className="text-xs">{item.consumed.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.budgeted.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.unit}</TableCell>
                      <TableCell className="text-xs">{item.cost}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "within" ? "secondary" : "destructive"} className="text-xs">
                          {item.status === "within" ? "Within Budget" : "Over Budget"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-xs ${parseFloat(variance) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {parseFloat(variance) > 0 ? "+" : ""}{variance}%
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

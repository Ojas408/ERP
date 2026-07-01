import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Button } from "../components/ui/button"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, Target, BarChart3, Download, Printer, FileText, Mail } from "lucide-react"

const revenueData = [
  { id: "r1", month: "Jan", revenue: 4250000, expenses: 2800000, profit: 1450000 },
  { id: "r2", month: "Feb", revenue: 4580000, expenses: 3050000, profit: 1530000 },
  { id: "r3", month: "Mar", revenue: 4920000, expenses: 3280000, profit: 1640000 },
  { id: "r4", month: "Apr", revenue: 4680000, expenses: 3120000, profit: 1560000 },
  { id: "r5", month: "May", revenue: 5120000, expenses: 3420000, profit: 1700000 },
]

const profitMargins = [
  { id: "pm1", quarter: "Q1 2025", margin: 33.2 },
  { id: "pm2", quarter: "Q2 2025", margin: 34.1 },
  { id: "pm3", quarter: "Q3 2025", margin: 35.8 },
  { id: "pm4", quarter: "Q4 2025", margin: 34.5 },
  { id: "pm5", quarter: "Q1 2026", margin: 36.2 },
]

const revenueBySource = [
  { id: "rs1", name: "Crushed Stone Sales", value: 42, amount: 2150400, color: "#3b82f6" },
  { id: "rs2", name: "Contract Work", value: 28, amount: 1433600, color: "#10b981" },
  { id: "rs3", name: "Equipment Rental", value: 18, amount: 921600, color: "#f59e0b" },
  { id: "rs4", name: "Raw Material Supply", value: 12, amount: 614400, color: "#ef4444" },
]

const performanceMetrics = [
  { id: "perf1", metric: "Production Efficiency", current: 87, target: 85, benchmark: 80 },
  { id: "perf2", metric: "Revenue Growth", current: 9.4, target: 8, benchmark: 6 },
  { id: "perf3", metric: "Profit Margin", current: 33.2, target: 30, benchmark: 28 },
  { id: "perf4", metric: "Customer Satisfaction", current: 92, target: 90, benchmark: 85 },
  { id: "perf5", metric: "On-Time Delivery", current: 94, target: 95, benchmark: 90 },
]

export default function BusinessReport() {
  const totalRevenue = revenueBySource.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Total Business Report</h1>
          <p className="text-sm text-muted-foreground">
            CEO-level analytics and business insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button className="text-xs h-9">
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value="₹51.2L"
          subtitle="this month"
          icon={DollarSign}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 9.4, isPositive: true }}
        />
        <KPICard
          title="Net Profit"
          value="₹17.0L"
          subtitle="33.2% margin"
          icon={TrendingUp}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 8.9, isPositive: true }}
        />
        <KPICard
          title="Revenue Growth"
          value="+9.4%"
          subtitle="vs last month"
          icon={BarChart3}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 2.1, isPositive: true }}
        />
        <KPICard
          title="ROI"
          value="48.6%"
          subtitle="return on investment"
          icon={Target}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 3.8, isPositive: true }}
        />
      </div>

      {/* Revenue and Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Trend</CardTitle>
          <CardDescription>Monthly financial performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => `₹${(value / 100000).toFixed(2)}L`}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
              <Area type="monotone" dataKey="profit" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
            <CardDescription>Distribution of income streams (₹{(totalRevenue / 100000).toFixed(2)}L total)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBySource.map((entry) => (
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
            <CardTitle>Quarterly Profit Margin</CardTitle>
            <CardDescription>Historical profit margin trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitMargins}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quarter" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Line type="monotone" dataKey="margin" stroke="#3b82f6" strokeWidth={3} name="Profit Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Current performance vs targets and industry benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">{metric.metric}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">Benchmark: {metric.benchmark}%</span>
                    <span className="text-muted-foreground">Target: {metric.target}%</span>
                    <span className={metric.current >= metric.target ? "text-green-600" : "text-orange-600"}>
                      Current: {metric.current}%
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-500/30"
                    style={{ width: `${(metric.benchmark / 100) * 100}%` }}
                  />
                  <div
                    className="absolute h-full bg-green-500/40"
                    style={{ width: `${(metric.target / 100) * 100}%` }}
                  />
                  <div
                    className={`absolute h-full ${metric.current >= metric.target ? "bg-green-600" : "bg-orange-500"}`}
                    style={{ width: `${(metric.current / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

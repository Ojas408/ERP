import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts"

const productionData = [
  { id: "day-1", date: "May 1", production: 450, target: 400 },
  { id: "day-2", date: "May 2", production: 380, target: 400 },
  { id: "day-3", date: "May 3", production: 520, target: 400 },
  { id: "day-4", date: "May 4", production: 470, target: 400 },
  { id: "day-5", date: "May 5", production: 550, target: 400 },
  { id: "day-6", date: "May 6", production: 490, target: 400 },
  { id: "day-7", date: "May 7", production: 580, target: 400 },
  { id: "day-8", date: "May 8", production: 510, target: 400 },
  { id: "day-9", date: "May 9", production: 610, target: 400 },
  { id: "day-10", date: "May 10", production: 590, target: 400 },
  { id: "day-11", date: "May 11", production: 620, target: 400 },
  { id: "day-12", date: "May 12", production: 640, target: 400 },
]

const consumptionData = [
  { id: "diesel", category: "Diesel", amount: 12500, budget: 10000 },
  { id: "cement", category: "Cement", amount: 8900, budget: 9000 },
  { id: "steel", category: "Steel", amount: 15600, budget: 14000 },
  { id: "aggregates", category: "Aggregates", amount: 7800, budget: 8000 },
  { id: "sand", category: "Sand", amount: 6200, budget: 6500 },
]

const expenseData = [
  { id: "exp1", name: "Fuel", value: 35, color: "#3b82f6" },
  { id: "exp2", name: "Salary", value: 30, color: "#10b981" },
  { id: "exp3", name: "Maintenance", value: 15, color: "#f59e0b" },
  { id: "exp4", name: "Vendor Payments", value: 12, color: "#ef4444" },
  { id: "exp5", name: "Site Costs", value: 8, color: "#8b5cf6" },
]

const vehicleMovementData = [
  { id: "t-6am", time: "6 AM", incoming: 12, outgoing: 5, waiting: 3 },
  { id: "t-8am", time: "8 AM", incoming: 25, outgoing: 18, waiting: 7 },
  { id: "t-10am", time: "10 AM", incoming: 18, outgoing: 22, waiting: 4 },
  { id: "t-12pm", time: "12 PM", incoming: 15, outgoing: 20, waiting: 5 },
  { id: "t-2pm", time: "2 PM", incoming: 20, outgoing: 16, waiting: 8 },
  { id: "t-4pm", time: "4 PM", incoming: 22, outgoing: 25, waiting: 6 },
  { id: "t-6pm", time: "6 PM", incoming: 10, outgoing: 15, waiting: 2 },
]

const targetAchievementData = [
  { id: "jan", month: "Jan", target: 12000, achieved: 11500 },
  { id: "feb", month: "Feb", target: 12000, achieved: 12800 },
  { id: "mar", month: "Mar", target: 13000, achieved: 13500 },
  { id: "apr", month: "Apr", target: 13000, achieved: 12200 },
  { id: "may", month: "May", target: 14000, achieved: 13800 },
]

const efficiencyData = [
  { id: "eff1", name: "Machine", value: 85, fill: "#3b82f6" },
  { id: "eff2", name: "Vehicle", value: 78, fill: "#10b981" },
  { id: "eff3", name: "Labor", value: 92, fill: "#f59e0b" },
]

export function ProductionTrendChart({ data }: { data?: any[] }) {
  const chartData = data || productionData
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Trend</CardTitle>
        <CardDescription>Daily production vs target (in tons)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} id="production-chart">
          <LineChart data={chartData} id="production-line-chart">
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
            <Line
              type="monotone"
              dataKey="production"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Actual Production"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ConsumptionChart({ data }: { data?: any[] }) {
  const chartData = data || consumptionData
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Consumption</CardTitle>
        <CardDescription>Current vs budgeted consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="amount" fill="#3b82f6" name="Actual" />
            <Bar dataKey="budget" fill="#10b981" name="Budget" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ExpenseBreakdownChart({ data }: { data?: any[] }) {
  const chartData = data || expenseData
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Distribution of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: any) => (
                <Cell key={entry.id || entry.name} fill={entry.color || '#3b82f6'} />
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
  )
}

export function VehicleMovementChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Movement Analytics</CardTitle>
        <CardDescription>Real-time vehicle tracking throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={vehicleMovementData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="incoming"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Incoming"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              stackId="2"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Outgoing"
            />
            <Area
              type="monotone"
              dataKey="waiting"
              stackId="3"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="Waiting"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function TargetAchievementChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Target vs Achievement</CardTitle>
        <CardDescription>Monthly performance comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={targetAchievementData}>
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
            <Bar dataKey="target" fill="#f59e0b" name="Target" />
            <Bar dataKey="achieved" fill="#3b82f6" name="Achieved" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function EfficiencyGauges() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Dashboard</CardTitle>
        <CardDescription>Current efficiency metrics across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {efficiencyData.map((item) => (
            <div key={item.id} className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={150}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={[item]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                    fill={item.fill}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl"
                  >
                    {item.value}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-xs mt-2">{item.name} Efficiency</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

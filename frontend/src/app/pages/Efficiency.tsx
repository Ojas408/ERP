import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { RadialBarChart, RadialBar, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Gauge, TrendingUp, Activity, Zap, Upload, Download, Eye, Edit, Trash2 } from "lucide-react"
import { fetchEfficiencyReport } from "../services/api"

const overallEfficiency = [
  { id: "oe1", category: "Machine", value: 87, fill: "#3b82f6" },
  { id: "oe2", category: "Vehicle", value: 82, fill: "#10b981" },
  { id: "oe3", category: "Labor", value: 91, fill: "#f59e0b" },
]

const weeklyEfficiency = [
  { id: "we1", week: "Week 1", machine: 84, vehicle: 79, labor: 88 },
  { id: "we2", week: "Week 2", machine: 86, vehicle: 80, labor: 89 },
  { id: "we3", week: "Week 3", machine: 85, vehicle: 81, labor: 90 },
  { id: "we4", week: "Week 4", machine: 87, vehicle: 82, labor: 91 },
]

const downtimeAnalysis = [
  { id: "da1", reason: "Scheduled Maintenance", hours: 12, percentage: 35.3 },
  { id: "da2", reason: "Breakdown", hours: 8, percentage: 23.5 },
  { id: "da3", reason: "Material Shortage", hours: 6, percentage: 17.6 },
  { id: "da4", reason: "Power Outage", hours: 4, percentage: 11.8 },
  { id: "da5", reason: "Weather", hours: 4, percentage: 11.8 },
]

const equipmentEfficiency = [
  { id: "eq1", equipment: "Crusher-1", uptime: 94, utilization: 92, efficiency: 87, status: "excellent" },
  { id: "eq2", equipment: "Crusher-2", uptime: 91, utilization: 88, efficiency: 84, status: "good" },
  { id: "eq3", equipment: "Screener-1", uptime: 88, utilization: 85, efficiency: 82, status: "good" },
  { id: "eq4", equipment: "Conveyor Belt A", uptime: 96, utilization: 94, efficiency: 90, status: "excellent" },
  { id: "eq5", equipment: "Loader-1", uptime: 89, utilization: 86, efficiency: 83, status: "good" },
  { id: "eq6", equipment: "Loader-2", uptime: 85, utilization: 81, efficiency: 79, status: "average" },
]

export default function Efficiency() {
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    fetchEfficiencyReport()
      .then(setReport)
      .catch((error) => console.error("Failed to load efficiency report:", error))
  }, [])

  const currentOverallEfficiency = report?.overallEfficiency || overallEfficiency
  const currentWeeklyEfficiency = report?.weeklyEfficiency || weeklyEfficiency
  const currentDowntimeAnalysis = report?.downtimeAnalysis || downtimeAnalysis
  const currentEquipmentEfficiency = report?.equipmentEfficiency || equipmentEfficiency
  const totals = report?.totals || {
    overall: 86.7,
    machine: 87,
    labor: 91,
    downtimeHours: 34,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Efficiency Report</h1>
          <p className="text-sm text-muted-foreground">
            Overall operational efficiency and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Efficiency"
          value={`${totals.overall}%`}
          subtitle="combined average"
          icon={Gauge}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 3.2, isPositive: true }}
        />
        <KPICard
          title="Machine Efficiency"
          value={`${totals.machine}%`}
          subtitle="equipment performance"
          icon={Activity}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 2.1, isPositive: true }}
        />
        <KPICard
          title="Labor Productivity"
          value={`${totals.labor}%`}
          subtitle="workforce efficiency"
          icon={TrendingUp}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 4.5, isPositive: true }}
        />
        <KPICard
          title="Total Downtime"
          value={`${totals.downtimeHours} hrs`}
          subtitle="this month"
          icon={Zap}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Efficiency Gauges */}
      <Card>
        <CardHeader>
          <CardTitle>Current Efficiency Metrics</CardTitle>
          <CardDescription>Real-time performance across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentOverallEfficiency.map((item: any) => (
              <div key={item.id} className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
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
                <p className="text-xs mt-2">{item.category} Efficiency</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Efficiency Trend</CardTitle>
            <CardDescription>Performance trends over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentWeeklyEfficiency}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="machine" stroke="#3b82f6" strokeWidth={2} name="Machine" />
                <Line type="monotone" dataKey="vehicle" stroke="#10b981" strokeWidth={2} name="Vehicle" />
                <Line type="monotone" dataKey="labor" stroke="#f59e0b" strokeWidth={2} name="Labor" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downtime Analysis</CardTitle>
            <CardDescription>Breakdown of operational downtime causes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentDowntimeAnalysis.map((item: any) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{item.reason}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">{item.hours}h</span>
                      <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Efficiency Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Efficiency Details</CardTitle>
          <CardDescription>Individual equipment performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEquipmentEfficiency.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.equipment}</TableCell>
                    <TableCell className="text-xs">{item.uptime}%</TableCell>
                    <TableCell className="text-xs">{item.utilization}%</TableCell>
                    <TableCell className="text-xs">{item.efficiency}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "excellent" ? "default" :
                          item.status === "good" ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-10">{item.efficiency}%</span>
                        <div className="w-20">
                          <Progress value={item.efficiency} className="h-2" />
                        </div>
                      </div>
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
    </div>
  )
}

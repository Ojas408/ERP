import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Target, TrendingUp, Award, CheckCircle, Upload, Download, Eye, Edit, Trash2 } from "lucide-react"

const monthlyTargets = [
  { id: "mt1", month: "January", target: 12000, achieved: 11500, percentage: 95.8 },
  { id: "mt2", month: "February", target: 12000, achieved: 12800, percentage: 106.7 },
  { id: "mt3", month: "March", target: 13000, achieved: 13500, percentage: 103.8 },
  { id: "mt4", month: "April", target: 13000, achieved: 12200, percentage: 93.8 },
  { id: "mt5", month: "May", target: 14000, achieved: 13800, percentage: 98.6 },
]

const departmentTargets = [
  { id: "dt1", department: "Production", target: 14000, achieved: 13800, percentage: 98.6, status: "on-track" },
  { id: "dt2", department: "Sales", target: 50, achieved: 52, percentage: 104, status: "exceeded" },
  { id: "dt3", department: "Quality Control", target: 95, achieved: 97, percentage: 102.1, status: "exceeded" },
  { id: "dt4", department: "Logistics", target: 500, achieved: 485, percentage: 97, status: "on-track" },
  { id: "dt5", department: "Maintenance", target: 90, achieved: 92, percentage: 102.2, status: "exceeded" },
]

const weeklyProgress = [
  { id: "wp1", week: "Week 1", target: 3500, achieved: 3420, daily: 488 },
  { id: "wp2", week: "Week 2", target: 3500, achieved: 3680, daily: 526 },
  { id: "wp3", week: "Week 3", target: 3500, achieved: 3560, daily: 509 },
  { id: "wp4", week: "Week 4", target: 3500, achieved: 3140, daily: 449 },
]

const performanceMetrics = [
  { id: "pm1", metric: "Production Volume", target: "14,000 tons", current: "13,800 tons", achievement: 98.6 },
  { id: "pm2", metric: "Quality Rate", target: "95%", current: "97%", achievement: 102.1 },
  { id: "pm3", metric: "On-time Delivery", target: "90%", current: "94%", achievement: 104.4 },
  { id: "pm4", metric: "Customer Satisfaction", target: "85%", current: "92%", achievement: 108.2 },
  { id: "pm5", metric: "Safety Score", target: "95%", current: "98%", achievement: 103.2 },
]

export default function TargetAchievement() {
  const currentMonth = monthlyTargets[monthlyTargets.length - 1]
  const exceededCount = departmentTargets.filter(d => d.status === "exceeded").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Monthly Target Achievement</h1>
          <p className="text-sm text-muted-foreground">
            Track and analyze performance against targets
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
          title="Monthly Target"
          value="14,000"
          subtitle="tons target"
          icon={Target}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Achievement"
          value="98.6%"
          subtitle="13,800 tons"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 5.0, isPositive: true }}
        />
        <KPICard
          title="Targets Exceeded"
          value={exceededCount.toString()}
          subtitle="of 5 departments"
          icon={Award}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
        <KPICard
          title="On-Track Depts"
          value={(departmentTargets.length - exceededCount).toString()}
          subtitle="departments"
          icon={CheckCircle}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Target vs Achievement</CardTitle>
            <CardDescription>Historical performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTargets}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" angle={-15} textAnchor="end" height={80} />
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

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress Tracking</CardTitle>
            <CardDescription>Week-by-week achievement breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProgress}>
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
                <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Weekly Target" />
                <Line type="monotone" dataKey="achieved" stroke="#3b82f6" strokeWidth={2} name="Achieved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Target Achievement</CardTitle>
          <CardDescription>Performance across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Achievement %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentTargets.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="text-xs">{dept.department}</TableCell>
                    <TableCell className="text-xs">{dept.target.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{dept.achieved.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{dept.percentage}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={dept.status === "exceeded" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {dept.status === "exceeded" ? "Exceeded" : "On Track"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-10">{dept.percentage}%</span>
                        <div className="w-24">
                          <Progress value={Math.min(dept.percentage, 100)} className="h-2" />
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

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
          <CardDescription>Achievement against strategic targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs mb-1">{metric.metric}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Target: {metric.target}</span>
                      <span>Current: {metric.current}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${metric.achievement >= 100 ? "text-green-600" : "text-orange-600"}`}>
                      {metric.achievement}%
                    </p>
                  </div>
                </div>
                <Progress value={Math.min(metric.achievement, 100)} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Target, TrendingUp, Award, CheckCircle, RefreshCw } from "lucide-react"
import { fetchTargetsReport } from "../services/api"

const fallbackMonthly = [
  { id: "none", month: "No data", target: 0, achieved: 0, percentage: 0 },
]

export default function TargetAchievement() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await fetchTargetsReport()
      setReport(data)
    } catch (error) {
      console.error("Failed to load target report:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const monthlyTargets = report?.monthlyTargets?.length ? report.monthlyTargets : fallbackMonthly
  const departmentTargets = report?.departmentTargets || []
  const weeklyProgress = report?.weeklyProgress || []
  const performanceMetrics = report?.performanceMetrics || []

  const currentMonth = monthlyTargets[monthlyTargets.length - 1]
  const exceededCount = departmentTargets.filter((d: any) => d.status === "exceeded").length
  const onTrackCount = departmentTargets.filter((d: any) => d.status === "on-track").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Monthly Target Achievement</h1>
          <p className="text-sm text-muted-foreground">
            Track and analyze performance against targets
          </p>
        </div>
        <Button variant="outline" className="text-xs h-9" onClick={loadReport} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Monthly Target"
          value={currentMonth?.target?.toLocaleString() || "0"}
          subtitle="tons target"
          icon={Target}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Achievement"
          value={`${currentMonth?.percentage?.toFixed?.(1) || currentMonth?.percentage || 0}%`}
          subtitle={`${currentMonth?.achieved?.toLocaleString() || 0} tons`}
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Targets Exceeded"
          value={exceededCount.toString()}
          subtitle={`of ${departmentTargets.length} departments`}
          icon={Award}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
        <KPICard
          title="On-Track Depts"
          value={onTrackCount.toString()}
          subtitle="departments"
          icon={CheckCircle}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

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
              <LineChart data={weeklyProgress.length ? weeklyProgress : [{ week: "N/A", target: 0, achieved: 0 }]}>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentTargets.map((dept: any) => (
                  <TableRow key={dept.id}>
                    <TableCell className="text-xs">{dept.department}</TableCell>
                    <TableCell className="text-xs">{dept.target.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{dept.achieved.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{dept.percentage}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={dept.status === "exceeded" ? "default" : dept.status === "at-risk" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {dept.status === "exceeded" ? "Exceeded" : dept.status === "at-risk" ? "At Risk" : "On Track"}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
          <CardDescription>Achievement against strategic targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric: any) => (
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

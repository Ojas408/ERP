import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Users, UserPlus, TrendingUp, Award, Upload, Download, Eye, Edit, Trash2 } from "lucide-react"

const employees = [
  { id: "e1", name: "Rajesh Kumar", role: "Site Supervisor", department: "Operations", experience: "8 years", performance: 94, status: "active" },
  { id: "e2", name: "Amit Sharma", role: "Machine Operator", department: "Production", experience: "5 years", performance: 89, status: "active" },
  { id: "e3", name: "Suresh Patil", role: "Senior Engineer", department: "Engineering", experience: "12 years", performance: 96, status: "active" },
  { id: "e4", name: "Vikram Singh", role: "Fleet Manager", department: "Logistics", experience: "6 years", performance: 91, status: "active" },
  { id: "e5", name: "Prakash Naik", role: "Electrician", department: "Maintenance", experience: "7 years", performance: 88, status: "active" },
  { id: "e6", name: "Ramesh Yadav", role: "Welder", department: "Maintenance", experience: "4 years", performance: 85, status: "active" },
  { id: "e7", name: "Santosh More", role: "Safety Officer", department: "Safety", experience: "10 years", performance: 97, status: "active" },
  { id: "e8", name: "Ganesh Desai", role: "Accountant", department: "Finance", experience: "6 years", performance: 92, status: "on-leave" },
]

const departmentDistribution = [
  { id: "dd1", name: "Operations", value: 35, count: 52, color: "#3b82f6" },
  { id: "dd2", name: "Production", value: 28, count: 42, color: "#10b981" },
  { id: "dd3", name: "Maintenance", value: 18, count: 27, color: "#f59e0b" },
  { id: "dd4", name: "Logistics", value: 12, count: 18, color: "#ef4444" },
  { id: "dd5", name: "Administration", value: 7, count: 11, color: "#8b5cf6" },
]

const attendanceTrend = [
  { id: "at1", month: "Jan", present: 96.5, absent: 3.5 },
  { id: "at2", month: "Feb", present: 97.2, absent: 2.8 },
  { id: "at3", month: "Mar", present: 96.8, absent: 3.2 },
  { id: "at4", month: "Apr", present: 97.5, absent: 2.5 },
  { id: "at5", month: "May", present: 98.1, absent: 1.9 },
]

const performanceRatings = [
  { id: "pr1", rating: "Excellent (90-100)", count: 42, percentage: 28 },
  { id: "pr2", rating: "Good (80-89)", count: 68, percentage: 45.3 },
  { id: "pr3", rating: "Average (70-79)", count: 35, percentage: 23.3 },
  { id: "pr4", rating: "Below Average (<70)", count: 5, percentage: 3.3 },
]

const recentActivity = [
  { id: "ra1", date: "May 24", employee: "Ramesh Patil", activity: "Joined", department: "Operations" },
  { id: "ra2", date: "May 23", employee: "Suresh Kumar", activity: "Promoted to Senior Operator", department: "Production" },
  { id: "ra3", date: "May 22", employee: "Ganesh Desai", activity: "On Leave", department: "Finance" },
  { id: "ra4", date: "May 20", employee: "Prakash Naik", activity: "Training Completed", department: "Maintenance" },
]

export default function EmployeeManagement() {
  const totalEmployees = departmentDistribution.reduce((sum, dept) => sum + dept.count, 0)
  const activeEmployees = employees.filter(e => e.status === "active").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Employee Management</h1>
          <p className="text-sm text-muted-foreground">
            Workforce management and employee tracking
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
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Employees"
          value={totalEmployees.toString()}
          subtitle="workforce strength"
          icon={Users}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Active Employees"
          value={activeEmployees.toString()}
          subtitle={`${((activeEmployees/employees.length)*100).toFixed(1)}% active`}
          icon={UserPlus}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Avg Attendance"
          value="98.1%"
          subtitle="this month"
          icon={TrendingUp}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 0.6, isPositive: true }}
        />
        <KPICard
          title="Top Performers"
          value="42"
          subtitle="excellent rating"
          icon={Award}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>{totalEmployees} employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentDistribution.map((entry) => (
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
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Monthly attendance performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present %" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Ratings Distribution</CardTitle>
          <CardDescription>Employee performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceRatings.map((rating) => (
              <div key={rating.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">{rating.rating}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs">{rating.count} employees</span>
                    <span className="text-xs text-muted-foreground">{rating.percentage}%</span>
                  </div>
                </div>
                <Progress value={rating.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Complete employee roster and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-xs">{employee.name}</TableCell>
                    <TableCell className="text-xs">{employee.role}</TableCell>
                    <TableCell className="text-xs">{employee.department}</TableCell>
                    <TableCell className="text-xs">{employee.experience}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">{employee.performance}%</span>
                        <div className="w-16">
                          <Progress value={employee.performance} className="h-1.5" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.status === "active" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {employee.status === "active" ? "Active" : "On Leave"}
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest employee updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-xs">{activity.employee}</p>
                  <p className="text-xs text-muted-foreground">{activity.activity} - {activity.department}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

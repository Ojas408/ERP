import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Users, Clock, TrendingUp, UserCheck, Upload, Download, Plus, Edit, Eye, Trash2, FileSpreadsheet } from "lucide-react"

const weeklyAttendance = [
  { id: "wa1", day: "Mon", present: 145, absent: 5, leave: 3, overtime: 12 },
  { id: "wa2", day: "Tue", present: 148, absent: 3, leave: 2, overtime: 15 },
  { id: "wa3", day: "Wed", present: 142, absent: 7, leave: 4, overtime: 10 },
  { id: "wa4", day: "Thu", present: 150, absent: 2, leave: 1, overtime: 18 },
  { id: "wa5", day: "Fri", present: 147, absent: 4, leave: 2, overtime: 14 },
  { id: "wa6", day: "Sat", present: 135, absent: 8, leave: 10, overtime: 8 },
]

const departmentHours = [
  { id: "dh1", department: "Construction", hours: 1240, target: 1200, efficiency: 103 },
  { id: "dh2", department: "Crusher Operations", hours: 980, target: 1000, efficiency: 98 },
  { id: "dh3", department: "Logistics", hours: 765, target: 750, efficiency: 102 },
  { id: "dh4", department: "Maintenance", hours: 580, target: 600, efficiency: 97 },
  { id: "dh5", department: "Administration", hours: 420, target: 400, efficiency: 105 },
]

const employeeAttendance = [
  { id: "ea1", name: "Rajesh Kumar", role: "Site Supervisor", hoursWorked: 52, target: 48, attendance: 100, overtime: 4 },
  { id: "ea2", name: "Amit Sharma", role: "Machine Operator", hoursWorked: 48, target: 48, attendance: 100, overtime: 0 },
  { id: "ea3", name: "Suresh Patil", role: "Construction Worker", hoursWorked: 50, target: 48, attendance: 100, overtime: 2 },
  { id: "ea4", name: "Vikram Singh", role: "Driver", hoursWorked: 54, target: 48, attendance: 100, overtime: 6 },
  { id: "ea5", name: "Prakash Naik", role: "Electrician", hoursWorked: 46, target: 48, attendance: 96, overtime: 0 },
  { id: "ea6", name: "Ramesh Yadav", role: "Welder", hoursWorked: 48, target: 48, attendance: 100, overtime: 0 },
  { id: "ea7", name: "Santosh More", role: "Loader Operator", hoursWorked: 51, target: 48, attendance: 100, overtime: 3 },
]

export default function WorkHours() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Man Work Hour Report</h1>
          <p className="text-sm text-muted-foreground">
            Employee attendance and productivity tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import Attendance
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Employees"
          value="153"
          subtitle="active workforce"
          icon={Users}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Avg Attendance"
          value="96.2%"
          subtitle="this week"
          icon={UserCheck}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 2.1, isPositive: true }}
        />
        <KPICard
          title="Total Hours"
          value="3,985"
          subtitle="this week"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Overtime Hours"
          value="77"
          subtitle="this week"
          icon={TrendingUp}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 12.5, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
            <CardDescription>Daily attendance and overtime tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                <Bar dataKey="leave" fill="#f59e0b" name="Leave" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department-wise Work Hours</CardTitle>
            <CardDescription>Hours worked vs target by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentHours} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="department" type="category" width={120} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" name="Actual Hours" />
                <Bar dataKey="target" fill="#10b981" name="Target Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Work Summary</CardTitle>
              <CardDescription>Individual performance and attendance this week</CardDescription>
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
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeAttendance.map((employee) => {
                  const performance = (employee.hoursWorked / employee.target) * 100
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="text-xs">{employee.name}</TableCell>
                      <TableCell className="text-xs">{employee.role}</TableCell>
                      <TableCell className="text-xs">{employee.hoursWorked}h</TableCell>
                      <TableCell className="text-xs">{employee.target}h</TableCell>
                      <TableCell>
                        <Badge variant={employee.attendance === 100 ? "secondary" : "outline"} className="text-xs">
                          {employee.attendance}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{employee.overtime}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-10">{performance.toFixed(0)}%</span>
                          <div className="w-20">
                            <Progress value={Math.min(performance, 100)} className="h-2" />
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

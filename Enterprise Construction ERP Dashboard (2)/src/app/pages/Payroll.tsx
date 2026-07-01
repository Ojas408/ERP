import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Banknote, Upload, Download, DollarSign, Users, TrendingDown, FileDown, Eye, Edit, Trash2 } from "lucide-react"
import { useDateRange } from "../contexts/DateRangeContext"

const payrollData = [
  { id: "pr1", name: "Rajesh Kumar", department: "Operations", basic: 45000, hra: 13500, pf: 5400, esi: 675, tds: 2000, status: "paid" },
  { id: "pr2", name: "Amit Sharma", department: "Production", basic: 35000, hra: 10500, pf: 4200, esi: 525, tds: 1200, status: "paid" },
  { id: "pr3", name: "Suresh Patil", department: "Engineering", basic: 55000, hra: 16500, pf: 6600, esi: 825, tds: 3500, status: "pending" },
  { id: "pr4", name: "Vikram Singh", department: "Logistics", basic: 40000, hra: 12000, pf: 4800, esi: 600, tds: 1800, status: "paid" },
  { id: "pr5", name: "Prakash Naik", department: "Maintenance", basic: 32000, hra: 9600, pf: 3840, esi: 480, tds: 1000, status: "pending" },
  { id: "pr6", name: "Ramesh Yadav", department: "Maintenance", basic: 28000, hra: 8400, pf: 3360, esi: 420, tds: 800, status: "pending" },
  { id: "pr7", name: "Santosh More", department: "Safety", basic: 48000, hra: 14400, pf: 5760, esi: 720, tds: 2500, status: "paid" },
  { id: "pr8", name: "Ganesh Desai", department: "Finance", basic: 42000, hra: 12600, pf: 5040, esi: 630, tds: 1900, status: "on-hold" },
]

const departmentSalary = [
  { id: "ds1", name: "Operations", value: 32, amount: 585, color: "#3b82f6" },
  { id: "ds2", name: "Production", value: 25, amount: 456, color: "#10b981" },
  { id: "ds3", name: "Engineering", value: 18, amount: 328, color: "#f59e0b" },
  { id: "ds4", name: "Logistics", value: 15, amount: 273, color: "#ef4444" },
  { id: "ds5", name: "Maintenance", value: 10, amount: 182, color: "#8b5cf6" },
]

export default function Payroll() {
  const { dateRange } = useDateRange()

  const calculateNetPayable = (employee: typeof payrollData[0]) => {
    return employee.basic + employee.hra - employee.pf - employee.esi - employee.tds
  }

  const totalSalary = payrollData.reduce((sum, emp) => sum + calculateNetPayable(emp), 0)
  const employeesPaid = payrollData.filter(emp => emp.status === "paid").length
  const pendingDisbursement = payrollData.filter(emp => emp.status === "pending").length
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.pf + emp.esi + emp.tds, 0)

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: { variant: "default" as const, label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      pending: { variant: "outline" as const, label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
      "on-hold": { variant: "destructive" as const, label: "On Hold", className: "" }
    }
    const config = variants[status as keyof typeof variants] || variants.pending
    return <Badge variant={config.variant} className={`text-xs ${config.className}`}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">
            Employee salary processing and disbursement · {dateRange.label}
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
            <DollarSign className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
          <Button className="text-xs h-9">
            <Banknote className="h-4 w-4 mr-2" />
            Export to Bank
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Salary This Month"
          value={`₹${(totalSalary / 100000).toFixed(1)}L`}
          subtitle="gross payroll"
          icon={Banknote}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Employees Paid"
          value={employeesPaid.toString()}
          subtitle={`of ${payrollData.length} employees`}
          icon={Users}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Pending Disbursement"
          value={pendingDisbursement.toString()}
          subtitle="awaiting payment"
          icon={TrendingDown}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
        />
        <KPICard
          title="Total Deductions"
          value={`₹${(totalDeductions / 100000).toFixed(1)}L`}
          subtitle="PF + ESI + TDS"
          icon={DollarSign}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Charts Row */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Breakdown by Department</CardTitle>
          <CardDescription>Distribution of payroll across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentSalary}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentSalary.map((entry) => (
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

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll</CardTitle>
          <CardDescription>Detailed salary breakdown and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>PF Deduction</TableHead>
                  <TableHead>ESI Deduction</TableHead>
                  <TableHead>TDS</TableHead>
                  <TableHead>Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-xs">{employee.name}</TableCell>
                    <TableCell className="text-xs">{employee.department}</TableCell>
                    <TableCell className="text-xs">₹{employee.basic.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{employee.hra.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{employee.pf.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{employee.esi.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{employee.tds.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{calculateNetPayable(employee).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                          <FileDown className="h-3.5 w-3.5 mr-1" />
                          Slip
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

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Banknote, Users, DollarSign, RefreshCw, Download, FileText } from "lucide-react"
import { fetchEmployees } from "../services/api"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function Payroll() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await fetchEmployees()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load employees for payroll:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateHRA = (salary: number) => salary * 0.3
  const calculatePF = (salary: number) => salary * 0.12
  const calculateESI = (salary: number) => salary * 0.015
  const calculateTDS = (salary: number) => (salary > 50000 ? salary * 0.1 : salary * 0.05)
  const calculateNetPayable = (salary: number) => {
    return salary + calculateHRA(salary) - calculatePF(salary) - calculateESI(salary) - calculateTDS(salary)
  }

  const totalSalary = employees.reduce((sum, emp) => sum + calculateNetPayable(emp.salary), 0)
  const totalDeductions = employees.reduce((sum, emp) => sum + calculatePF(emp.salary) + calculateESI(emp.salary) + calculateTDS(emp.salary), 0)
  
  const employeesPaid = employees.filter(e => e.status === "active").length
  const pendingDisbursement = employees.length - employeesPaid

  // Prepare data for pie chart
  const departmentDataMap: Record<string, number> = {}
  employees.forEach(emp => {
    const dept = emp.position || "Unknown"
    departmentDataMap[dept] = (departmentDataMap[dept] || 0) + calculateNetPayable(emp.salary)
  })
  
  const departmentData = Object.keys(departmentDataMap).map(key => ({
    name: key,
    value: departmentDataMap[key]
  }))
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">Employee salary processing and disbursement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadEmployees}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export to Bank
          </Button>
          <Button className="text-xs h-9">
            <DollarSign className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Salary This Month" value={`₹${(totalSalary / 100000).toFixed(1)}L`} subtitle="gross payable" icon={Banknote} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Employees Paid" value={employeesPaid.toString()} subtitle="processed" icon={Users} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Pending Disbursement" value={pendingDisbursement.toString()} subtitle="awaiting transfer" icon={RefreshCw} colorClass="bg-orange-100 dark:bg-orange-900/30" />
        <KPICard title="Total Deductions" value={`₹${(totalDeductions / 100000).toFixed(1)}L`} subtitle="PF + ESI + TDS" icon={DollarSign} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Payroll</CardTitle>
            <CardDescription>Detailed salary breakdown per employee</CardDescription>
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
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="text-xs font-medium">{emp.name}</TableCell>
                      <TableCell className="text-xs">{emp.position}</TableCell>
                      <TableCell className="text-xs">₹{emp.salary.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">₹{calculateHRA(emp.salary).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">₹{(calculatePF(emp.salary) + calculateESI(emp.salary) + calculateTDS(emp.salary)).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-bold">₹{calculateNetPayable(emp.salary).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={emp.status === "active" ? "default" : "outline"} className="text-[10px] h-5">{emp.status === "active" ? "Paid" : "Pending"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
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
            <CardTitle>Salary by Department</CardTitle>
            <CardDescription>Breakdown of total net payable</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

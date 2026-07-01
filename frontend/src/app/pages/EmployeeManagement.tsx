import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Users, UserPlus, TrendingUp, Award, Upload, Download, Eye, Edit, Trash2, RefreshCw, Plus } from "lucide-react"
import { fetchEmployees, createEmployee, deleteRecord, updateRecord } from "../services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    salary: "",
    status: "active",
    joinedDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await fetchEmployees()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEmployee({
        ...newEmployee,
        salary: parseFloat(newEmployee.salary)
      })
      setIsAddOpen(false)
      setNewEmployee({
        name: "",
        position: "",
        salary: "",
        status: "active",
        joinedDate: new Date().toISOString().split('T')[0]
      })
      loadEmployees()
    } catch (error) {
      console.error("Failed to add employee:", error)
    }
  }

  const handleEdit = (employee: any) => {
    setEditingItem({
      ...employee,
      joinedDate: new Date(employee.joinedDate).toISOString().split('T')[0]
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('employees', editingItem.id, {
        ...editingItem,
        salary: parseFloat(editingItem.salary)
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadEmployees()
    } catch (error) {
      console.error("Failed to update employee:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return
    try {
      await deleteRecord('employees', id)
      loadEmployees()
    } catch (error) {
      console.error("Failed to delete employee:", error)
    }
  }

  const safeEmployees = Array.isArray(employees) ? employees : []
  const activeEmployees = safeEmployees.filter(e => e.status === "active").length
  const totalEmployeesCount = safeEmployees.length

  const deptMap = safeEmployees.reduce((acc: any, e) => {
    const dept = e.position || "Staff"
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {})

  const derivedDeptDistribution = Object.entries(deptMap).map(([name, count]: any, index) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    return {
      id: `dept-${index}`,
      name,
      count,
      value: totalEmployeesCount > 0 ? Math.round((count / totalEmployeesCount) * 100) : 0,
      color: colors[index % colors.length]
    }
  })

  const attendanceTrend = [
    { month: "Jan", present: 95, absent: 5 },
    { month: "Feb", present: 97, absent: 3 },
    { month: "Mar", present: 96, absent: 4 },
    { month: "Apr", present: 98, absent: 2 },
    { month: "May", present: 98, absent: 2 },
  ]

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
          <Button variant="outline" className="text-xs h-9" onClick={loadEmployees}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Enter the personal and professional details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="e.g. John Doe" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" placeholder="e.g. Senior Operator" value={newEmployee.position} onChange={e => setNewEmployee({...newEmployee, position: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (₹)</Label>
                    <Input id="salary" type="number" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinedDate">Joined Date</Label>
                    <Input id="joinedDate" type="date" value={newEmployee.joinedDate} onChange={e => setNewEmployee({...newEmployee, joinedDate: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newEmployee.status} onValueChange={v => setNewEmployee({...newEmployee, status: v})}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Employee</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Employees"
          value={totalEmployeesCount.toString()}
          subtitle="workforce strength"
          icon={Users}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Active Employees"
          value={activeEmployees.toString()}
          subtitle={totalEmployeesCount > 0 ? `${((activeEmployees/totalEmployeesCount)*100).toFixed(1)}% active` : "0% active"}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>{totalEmployeesCount} employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={derivedDeptDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {derivedDeptDistribution.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present %" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Roster</CardTitle>
          <CardDescription>Current active and on-leave employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-xs font-medium">{employee.name}</TableCell>
                    <TableCell className="text-xs">{employee.position}</TableCell>
                    <TableCell className="text-xs">₹{(employee.salary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "active" ? "default" : "outline"} className="text-[10px] h-5">
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(employee.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(employee)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(employee.id)}>
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

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update the employee details</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input id="edit-position" value={editingItem.position} onChange={e => setEditingItem({...editingItem, position: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salary (₹)</Label>
                  <Input id="edit-salary" type="number" value={editingItem.salary} onChange={e => setEditingItem({...editingItem, salary: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-joined">Joined Date</Label>
                  <Input id="edit-joined" type="date" value={editingItem.joinedDate} onChange={e => setEditingItem({...editingItem, joinedDate: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Employee</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

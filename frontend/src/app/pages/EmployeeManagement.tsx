import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import {
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Upload,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
} from "lucide-react"
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
import {
  exportToExcel,
  downloadExcelTemplate,
  parseExcelFile,
  printReport,
} from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Sheet / CSV Import state
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [newEmployee, setNewEmployee] = useState({
    employeeCode: "",
    name: "",
    position: "",
    department: "",
    contact: "",
    salary: "",
    status: "active",
    joinedDate: new Date().toISOString().split("T")[0],
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
      toast.error("Failed to load employees list")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEmployee({
        ...newEmployee,
        salary: parseFloat(newEmployee.salary) || 0,
      })
      toast.success("Employee created successfully")
      setIsAddOpen(false)
      setNewEmployee({
        employeeCode: "",
        name: "",
        position: "",
        department: "",
        contact: "",
        salary: "",
        status: "active",
        joinedDate: new Date().toISOString().split("T")[0],
      })
      loadEmployees()
    } catch (error) {
      console.error("Failed to add employee:", error)
      toast.error("Failed to add employee")
    }
  }

  const handleEdit = (employee: any) => {
    setEditingItem({
      ...employee,
      joinedDate: employee.joinedDate
        ? new Date(employee.joinedDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord("employees", editingItem.id, {
        ...editingItem,
        salary: parseFloat(editingItem.salary) || 0,
      })
      toast.success("Employee profile updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadEmployees()
    } catch (error) {
      console.error("Failed to update employee:", error)
      toast.error("Failed to update employee")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return
    try {
      await deleteRecord("employees", id)
      toast.success("Employee removed successfully")
      loadEmployees()
    } catch (error) {
      console.error("Failed to delete employee:", error)
      toast.error("Failed to delete employee")
    }
  }

  // Template Excel / CSV Download
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["employeeCode", "name", "position", "department", "salary", "contact", "status", "joinedDate"],
      "employees_import_template"
    )
    toast.info("Employee import template downloaded")
  }

  // Handle uploaded spreadsheet file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseExcelFile(file)
      if (!parsed || parsed.length === 0) {
        toast.error("The selected file contains no records")
        return
      }
      setImportData(parsed)
      setIsImportOpen(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file")
    } finally {
      e.target.value = ""
    }
  }

  // Row validator for the preview modal
  const validateRecord = (row: any) => {
    const errors: string[] = []
    const name = row.name || row["Employee Name"] || row["Full Name"]
    if (!name || String(name).trim() === "") {
      errors.push("Employee Name is required")
    }
    return errors
  }

  // Confirm and persist imported records
  const handleConfirmImport = async (validData: any[]) => {
    try {
      const recordsToImport = validData
        .map((row: any) => ({
          employeeCode: String(row.employeeCode || row["Employee Code"] || row["Code"] || "").trim(),
          name: String(row.name || row["Employee Name"] || row["Full Name"] || "").trim(),
          position: String(row.position || row["Position"] || row["Designation"] || "Staff").trim(),
          department: String(row.department || row["Department"] || "Operations").trim(),
          contact: String(row.contact || row["Contact"] || row["Phone"] || "").trim(),
          salary: parseFloat(row.salary || row["Salary"] || "0") || 0,
          status: String(row.status || row["Status"] || "active").toLowerCase().includes("leave")
            ? "on-leave"
            : String(row.status || "").toLowerCase().includes("inact")
            ? "inactive"
            : "active",
          joinedDate: row.joinedDate || row["Joined Date"]
            ? new Date(row.joinedDate || row["Joined Date"]).toISOString()
            : new Date().toISOString(),
        }))
        .filter((r) => r.name !== "")

      if (recordsToImport.length === 0) {
        toast.error("No valid employee records with names found to import")
        return
      }

      await createEmployee(recordsToImport)
      toast.success(`Successfully imported ${recordsToImport.length} employees`)
      setIsImportOpen(false)
      loadEmployees()
    } catch (error: any) {
      console.error("Failed to import employees:", error)
      toast.error(error.message || "Failed to import employees")
    }
  }

  // Export filtered roster to CSV / Excel
  const handleExportCSV = () => {
    if (safeEmployees.length === 0) {
      toast.error("No employees to export")
      return
    }
    const dataToExport = filteredEmployees.map((e: any, idx: number) => ({
      "S.No": idx + 1,
      "Employee Code": e.employeeCode || "N/A",
      "Full Name": e.name,
      "Position": e.position,
      "Department": e.department || "Operations",
      "Salary": e.salary || 0,
      "Status": e.status,
      "Contact": e.contact || "N/A",
      "Joined Date": e.joinedDate ? new Date(e.joinedDate).toLocaleDateString() : "N/A",
    }))
    exportToExcel(dataToExport, "employee_roster", "Employees")
    toast.success("Employee roster exported successfully")
  }

  const safeEmployees = Array.isArray(employees) ? employees : []
  const activeEmployees = safeEmployees.filter((e) => e.status === "active").length
  const totalEmployeesCount = safeEmployees.length

  // Unique positions for filtering
  const positions = Array.from(new Set(safeEmployees.map((e) => e.position).filter(Boolean)))

  // Client-side search and filters
  const filteredEmployees = safeEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.position || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.employeeCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.contact || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    const matchesPosition = positionFilter === "all" || employee.position === positionFilter

    return matchesSearch && matchesStatus && matchesPosition
  })

  // Department distribution for chart
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
      color: colors[index % colors.length],
    }
  })

  const attendanceTrend = [
    { month: "Jan", present: 95, absent: 5 },
    { month: "Feb", present: 97, absent: 3 },
    { month: "Mar", present: 96, absent: 4 },
    { month: "Apr", present: 98, absent: 2 },
    { month: "May", present: 98, absent: 2 },
  ]

  const handlePrintReport = () =>
    printReport(
      "Employee Management Roster",
      ["Employee Code", "Employee Name", "Position", "Department", "Salary", "Status"],
      filteredEmployees.map((v: any) => [
        v.employeeCode || "N/A",
        v.name,
        v.position,
        v.department || "Operations",
        v.salary || 0,
        v.status,
      ])
    )

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Employee Management</h1>
          <p className="text-sm text-muted-foreground">
            Workforce roster, recruitment tracking, and attendance analytics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handlePrintReport}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={loadEmployees}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Template Download Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9"
            onClick={handleDownloadTemplate}
            title="Download blank Excel / CSV template for importing employees"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
            Template
          </Button>

          {/* Import CSV / Excel Button */}
          <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer" asChild>
            <label>
              <Upload className="h-4 w-4 mr-1.5 text-blue-600" />
              Import CSV
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </Button>

          {/* Export CSV / Excel Button */}
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>

          {/* Add Employee Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Enter personal and professional staff details for payroll and records
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emp-code">Employee Code / ID</Label>
                    <Input
                      id="emp-code"
                      placeholder="e.g. EMP-1042"
                      value={newEmployee.employeeCode}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, employeeCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. John Doe"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position / Role *</Label>
                    <Input
                      id="position"
                      placeholder="e.g. Senior Site Engineer"
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, position: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g. Operations, Quality, Safety"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, department: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Details</Label>
                    <Input
                      id="contact"
                      placeholder="e.g. +91 98765 43210"
                      value={newEmployee.contact}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, contact: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary ($)</Label>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="e.g. 45000"
                      value={newEmployee.salary}
                      onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinedDate">Joined Date</Label>
                    <Input
                      id="joinedDate"
                      type="date"
                      value={newEmployee.joinedDate}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, joinedDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newEmployee.status}
                      onValueChange={(v) => setNewEmployee({ ...newEmployee, status: v })}
                    >
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
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Employee
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtitle={
            totalEmployeesCount > 0
              ? `${((activeEmployees / totalEmployeesCount) * 100).toFixed(1)}% active`
              : "0% active"
          }
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
          title="Departments"
          value={derivedDeptDistribution.length.toString()}
          subtitle="operational branches"
          icon={Award}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department Distribution</CardTitle>
            <CardDescription className="text-xs">
              {totalEmployeesCount} employees across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={derivedDeptDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={90}
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
            <CardTitle className="text-base font-semibold">Attendance Trend</CardTitle>
            <CardDescription className="text-xs">Monthly attendance performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Present %"
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Absent %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, department, code, contact..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-[160px] text-xs h-9">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((pos: any) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Employee Roster Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base font-semibold">Employee Roster</CardTitle>
            <CardDescription className="text-xs">
              Current active, inactive, and on-leave workforce members
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredEmployees.length} of {safeEmployees.length} Listed
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Position / Role</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Salary</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Joined Date</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      No employees found. Click "Add Employee" or "Import CSV" to register staff.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {employee.employeeCode || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {employee.name}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{employee.position}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {employee.department || "Operations"}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        ${(employee.salary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "active"
                              ? "default"
                              : employee.status === "on-leave"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] h-5 uppercase"
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {employee.joinedDate
                          ? new Date(employee.joinedDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Edit Employee"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Delete Employee"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee professional and payroll records</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Employee Code</Label>
                  <Input
                    id="edit-code"
                    value={editingItem.employeeCode || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, employeeCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position *</Label>
                  <Input
                    id="edit-position"
                    value={editingItem.position}
                    onChange={(e) => setEditingItem({ ...editingItem, position: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editingItem.department || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, department: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Contact Details</Label>
                  <Input
                    id="edit-contact"
                    value={editingItem.contact || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salary ($)</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    value={editingItem.salary}
                    onChange={(e) => setEditingItem({ ...editingItem, salary: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-joined">Joined Date</Label>
                  <Input
                    id="edit-joined"
                    type="date"
                    value={editingItem.joinedDate}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, joinedDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(v) => setEditingItem({ ...editingItem, status: v })}
                  >
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
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Employee
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Sheet / CSV Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={[
          "employeeCode",
          "name",
          "position",
          "department",
          "salary",
          "contact",
          "status",
          "joinedDate",
        ]}
        validationRules={validateRecord}
        onConfirm={handleConfirmImport}
        title="Import Employees Preview"
      />
    </div>
  )
}

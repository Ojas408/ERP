import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { 
  Users, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  Upload, 
  Download, 
  Plus, 
  Printer, 
  RefreshCw, 
  Search, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react"
import { fetchAttendances, createAttendance, fetchEmployees } from "../services/api"
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
import { exportToExcel, downloadExcelTemplate, parseExcelFile, printReport } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function WorkHours() {
  const [attendances, setAttendances] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkMarkOpen, setIsBulkMarkOpen] = useState(false)

  // Single Mark Form State
  const [newAtt, setNewAtt] = useState({
    employeeId: "",
    hoursWorked: "8",
    overtime: "0",
    status: "present",
    date: new Date().toISOString().split('T')[0]
  })

  // Bulk Grid Form States
  const [bulkGridDate, setBulkGridDate] = useState(new Date().toISOString().split('T')[0])
  const [bulkGridData, setBulkGridData] = useState<Record<string, { status: string; hours: string; ot: string }>>({})

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [attData, empData] = await Promise.all([
        fetchAttendances(),
        fetchEmployees()
      ])
      setAttendances(Array.isArray(attData) ? attData : [])
      setEmployees(Array.isArray(empData) ? empData : [])

      // Pre-populate bulk grid states with default 8 hours / present
      const initialGrid: typeof bulkGridData = {}
      empData.forEach((e: any) => {
        initialGrid[e.id] = { status: "present", hours: "8", ot: "0" }
      })
      setBulkGridData(initialGrid)
    } catch (error) {
      console.error("Failed to load attendance:", error)
      toast.error("Failed to load attendance registers")
    } finally {
      setLoading(false)
    }
  }

  // Mark single attendance
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAttendance({
        ...newAtt,
        hoursWorked: parseFloat(newAtt.hoursWorked),
        overtime: parseFloat(newAtt.overtime)
      })
      toast.success("Attendance marked successfully")
      setIsAddOpen(false)
      setNewAtt({
        employeeId: "",
        hoursWorked: "8",
        overtime: "0",
        status: "present",
        date: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      toast.error("Failed to mark attendance")
    }
  }

  // Save bulk check-in grid
  const handleSaveBulkGrid = async () => {
    try {
      const recordsToCreate = Object.entries(bulkGridData).map(([empId, config]) => ({
        employeeId: empId,
        status: config.status,
        hoursWorked: parseFloat(config.hours),
        overtime: parseFloat(config.ot),
        date: new Date(bulkGridDate).toISOString()
      }))

      await createAttendance(recordsToCreate)
      toast.success(`Logged attendance for ${recordsToCreate.length} employees`)
      setIsBulkMarkOpen(false)
      loadData()
    } catch (err) {
      toast.error("Failed to submit daily roster check-in")
    }
  }

  // Export SheetJS Excel
  const handleExportExcel = () => {
    const data = filteredAttendances.map((a, idx) => ({
      "S.No": idx + 1,
      "Date": new Date(a.date).toLocaleDateString(),
      "Employee Name": a.employee?.name || "N/A",
      "Employee Code": a.employee?.employeeCode || "N/A",
      "Department": a.employee?.department || "Operations",
      "Hours Worked": a.hoursWorked,
      "Overtime Hours": a.overtime,
      "Attendance Status": a.status
    }))
    exportToExcel(data, `Attendance_Report_${dateFilter}`, "Attendance Logs")
  }

  // Print PDF report
  const handlePrint = () => {
    const headers = ["Date", "Code", "Employee", "Department", "Hours", "Overtime", "Status"]
    const rows = filteredAttendances.map(a => [
      new Date(a.date).toLocaleDateString(),
      a.employee?.employeeCode || "-",
      a.employee?.name || "N/A",
      a.employee?.department || "-",
      `${a.hoursWorked}h`,
      `${a.overtime}h`,
      a.status.toUpperCase()
    ])
    printReport(`Attendance Registry - Date: ${dateFilter || 'All'}`, headers, rows)
  }

  // Template Download UOM
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["employeeId", "date", "hoursWorked", "overtime", "status"],
      "attendance_import_template"
    )
  }

  // SheetJS Import Trigger
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseExcelFile(file)
      setImportData(parsed)
      setIsImportOpen(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      e.target.value = ""
    }
  }

  const handleConfirmImport = async (validData: any[]) => {
    try {
      const recordsToImport = validData.map(r => ({
        employeeId: String(r.employeeId),
        date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
        hoursWorked: parseFloat(r.hoursWorked) || 8,
        overtime: parseFloat(r.overtime || 0),
        status: String(r.status || "present").toLowerCase()
      }))

      await createAttendance(recordsToImport)
      toast.success(`Imported ${recordsToImport.length} attendance logs successfully`)
      loadData()
    } catch (error) {
      toast.error("Import failed: check ID references and values.")
    }
  }

  // Client side filters
  const filteredAttendances = attendances.filter(a => {
    const matchesSearch = a.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.employee?.employeeCode || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    
    // date filter matches exactly on YYYY-MM-DD
    const aDateStr = new Date(a.date).toISOString().split('T')[0]
    const matchesDate = !dateFilter || aDateStr === dateFilter
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Pagination slice
  const totalPages = Math.ceil(filteredAttendances.length / pageSize)
  const paginatedAttendances = filteredAttendances.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Totals calculations
  const totalHours = filteredAttendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
  const totalOvertime = filteredAttendances.reduce((sum, a) => sum + (a.overtime || 0), 0)
  const presentCount = filteredAttendances.filter(a => a.status === "present").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Daily Attendance Check-In</h1>
          <p className="text-sm text-muted-foreground">Manage man-hours, clock logs, present/absent sheets, and overtime</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Bulk grid checkin */}
          <Dialog open={isBulkMarkOpen} onOpenChange={setIsBulkMarkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs h-9">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Roster Check-In Grid
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Daily Roster Check-In Grid</DialogTitle>
                <DialogDescription>Quick mark attendance for all active employees on site</DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 mb-2 text-xs">
                <Label htmlFor="bulk-date">Check-In Date</Label>
                <Input id="bulk-date" type="date" value={bulkGridDate} onChange={e => setBulkGridDate(e.target.value)} className="w-[180px] h-8" />
              </div>

              <div className="flex-1 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0">
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-24">Hours</TableHead>
                      <TableHead className="w-24">Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map(emp => {
                      const gridConfig = bulkGridData[emp.id] || { status: "present", hours: "8", ot: "0" }
                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="text-xs font-mono">{emp.employeeCode || "N/A"}</TableCell>
                          <TableCell className="text-xs font-semibold">{emp.name}</TableCell>
                          <TableCell>
                            <Select 
                              value={gridConfig.status} 
                              onValueChange={v => setBulkGridData({
                                ...bulkGridData,
                                [emp.id]: { ...gridConfig, status: v, hours: v === 'present' ? '8' : '0' }
                              })}
                            >
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="leave">Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={gridConfig.hours} 
                              disabled={gridConfig.status !== 'present'}
                              onChange={e => setBulkGridData({
                                ...bulkGridData,
                                [emp.id]: { ...gridConfig, hours: e.target.value }
                              })}
                              className="h-7 text-xs" 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={gridConfig.ot} 
                              disabled={gridConfig.status !== 'present'}
                              onChange={e => setBulkGridData({
                                ...bulkGridData,
                                [emp.id]: { ...gridConfig, ot: e.target.value }
                              })}
                              className="h-7 text-xs" 
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="mt-4 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkMarkOpen(false)}>Cancel</Button>
                <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSaveBulkGrid}>
                  Save All logs
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Single mark */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Single Attendance</DialogTitle>
                <DialogDescription>Mark present hours for a single employee record</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="employee">Employee</Label>
                    <Select value={newAtt.employeeId} onValueChange={v => setNewAtt({...newAtt, employeeId: v})}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeCode || "No Code"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hours">Hours Worked</Label>
                    <Input id="hours" type="number" value={newAtt.hoursWorked} onChange={e => setNewAtt({...newAtt, hoursWorked: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="overtime">Overtime Hours</Label>
                    <Input id="overtime" type="number" value={newAtt.overtime} onChange={e => setNewAtt({...newAtt, overtime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newAtt.status} onValueChange={v => setNewAtt({...newAtt, status: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={newAtt.date} onChange={e => setNewAtt({...newAtt, date: e.target.value})} required />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Mark Checked</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Roster" value={employees.length.toString()} subtitle="Staff counts" icon={Users} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Present Count" value={presentCount.toString()} subtitle={`out of ${filteredAttendances.length}`} icon={UserCheck} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Total Hours Logged" value={`${totalHours}h`} subtitle="Tracked man-hours" icon={Clock} colorClass="bg-orange-100 dark:bg-orange-900/30" />
        <KPICard title="Overtime Hours Logged" value={`${totalOvertime}h`} subtitle="Tracked overtime" icon={TrendingUp} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Attendance Log Table */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 gap-4">
          <div>
            <CardTitle>Attendance Sheet</CardTitle>
            <CardDescription>Daily present details, timestamps, and logged overtime summaries</CardDescription>
          </div>
          {/* SheetJS Action panel */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handleDownloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Template
            </Button>
            <label className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-[11px] font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <Upload className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Import Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            </label>
            <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handleExportExcel}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print / PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee or code..."
                className="pl-9 text-xs h-9"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9 text-xs h-9"
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Status Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-xs h-9 w-full border" onClick={() => { setDateFilter(""); setSearchQuery(""); setStatusFilter("all"); setCurrentPage(1); }}>
                Clear Date Filter
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Card/Code</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Hours Logged</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      Loading attendance registers...
                    </TableCell>
                  </TableRow>
                ) : paginatedAttendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      No attendance matching current filters found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttendances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-mono">{item.employee?.employeeCode || "N/A"}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{item.employee?.name || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.hoursWorked} hrs</TableCell>
                      <TableCell className="text-xs text-purple-600 font-medium">+{item.overtime} hrs</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === "present" ? "default" : "outline"} 
                          className={`text-[10px] h-5 uppercase ${
                            item.status === 'present' ? 'bg-green-600 text-white' : item.status === 'absent' ? 'border-destructive text-destructive' : ''
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredAttendances.length} records)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["employeeId", "date", "hoursWorked", "overtime", "status"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.employeeId) errs.push(`Row ${i + 1}: employeeId is required`)
          if (!row.hoursWorked) errs.push(`Row ${i + 1}: hoursWorked is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Attendance Logs Preview"
      />
    </div>
  )
}

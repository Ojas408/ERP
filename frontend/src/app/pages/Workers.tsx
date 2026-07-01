import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  Phone, 
  FileText, 
  Download, 
  Upload, 
  Printer, 
  Paperclip,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { 
  fetchEmployees, 
  createEmployee, 
  deleteRecord, 
  updateRecord, 
  uploadFile, 
  fetchDocuments, 
  deleteDocument,
  fetchRecords 
} from "../services/api"
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

export default function Workers() {
  const [workers, setWorkers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deptFilter, setDeptFilter] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [docsList, setDocsList] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // CRUD Forms State
  const [newWorker, setNewWorker] = useState({
    employeeCode: "",
    name: "",
    position: "Mason",
    department: "",
    designation: "Worker",
    salary: "1500",
    status: "active",
    contact: "",
    joinedDate: new Date().toISOString().split('T')[0]
  })

  const [editingItem, setEditingItem] = useState<any>(null)

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadWorkers()
    loadDepartments()
  }, [])

  const loadWorkers = async () => {
    try {
      setLoading(true)
      const data = await fetchEmployees()
      setWorkers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load workers:", error)
      toast.error("Failed to load workforce register")
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await fetchRecords("masters/departments")
      setDepartments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
    }
  }

  // Manage attachments
  const openDocsModal = async (worker: any) => {
    setSelectedWorker(worker)
    setIsDocsOpen(true)
    try {
      const docs = await fetchDocuments({ employeeId: worker.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to load attachments")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedWorker) return
    try {
      setUploading(true)
      await uploadFile(file, { employeeId: selectedWorker.id })
      toast.success("Document attached successfully")
      // Reload attachments list
      const docs = await fetchDocuments({ employeeId: selectedWorker.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
      e.target.value = "" // Reset picker
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Remove this document?")) return
    try {
      await deleteDocument(docId)
      toast.success("Document removed")
      const docs = await fetchDocuments({ employeeId: selectedWorker.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to delete document")
    }
  }

  // Register worker
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEmployee({
        ...newWorker,
        salary: parseFloat(newWorker.salary)
      })
      toast.success("Worker profile registered successfully")
      setIsAddOpen(false)
      setNewWorker({
        employeeCode: "",
        name: "",
        position: "Mason",
        department: departments[0]?.name || "Operations & Sites",
        designation: "Worker",
        salary: "1500",
        status: "active",
        contact: "",
        joinedDate: new Date().toISOString().split('T')[0]
      })
      loadWorkers()
    } catch (error) {
      toast.error("Failed to add worker profile")
    }
  }

  const handleEdit = (worker: any) => {
    setEditingItem({
      ...worker,
      joinedDate: new Date(worker.joinedDate || Date.now()).toISOString().split('T')[0],
      salary: String(worker.salary)
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
      toast.success("Worker profile updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadWorkers()
    } catch (error) {
      toast.error("Failed to update worker profile")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker profile? This will delete all associated logs.")) return
    try {
      await deleteRecord('employees', id)
      toast.success("Worker profile deleted")
      loadWorkers()
    } catch (error) {
      toast.error("Failed to delete worker")
    }
  }

  // Exports SheetJS Excel
  const handleExportExcel = () => {
    const data = filteredWorkers.map((w, idx) => ({
      "S.No": idx + 1,
      "Employee Code": w.employeeCode || "N/A",
      "Full Name": w.name,
      "Department": w.department || "Operations",
      "Designation": w.designation || "Worker",
      "Skill Category": w.position,
      "Daily Wage Rate": w.salary,
      "Contact Info": w.contact || "N/A",
      "Status": w.status,
      "Joined Date": new Date(w.joinedDate).toLocaleDateString()
    }))
    exportToExcel(data, "Workforce_Registry", "Employees")
  }

  // Print PDF Report
  const handlePrintReport = () => {
    const headers = ["Code", "Name", "Department", "Designation", "Daily Wage", "Contact", "Status"]
    const rows = filteredWorkers.map(w => [
      w.employeeCode || "-",
      w.name,
      w.department || "-",
      w.designation || "-",
      `₹${(w.salary || 0).toLocaleString()}`,
      w.contact || "-",
      w.status
    ])
    printReport("Workforce Master Registry", headers, rows)
  }

  // Profile PDF printout
  const handlePrintProfile = (w: any) => {
    printReport(
      `Employee Dossier - ${w.name}`,
      ["Field", "Value Details"],
      [
        ["Employee ID", w.id],
        ["Employee Code", w.employeeCode || "N/A"],
        ["Full Name", w.name],
        ["Department", w.department || "N/A"],
        ["Designation", w.designation || "N/A"],
        ["Skill Position", w.position],
        ["Daily Wage Rate", `₹${(w.salary || 0).toLocaleString()}`],
        ["Contact No", w.contact || "N/A"],
        ["Employment Status", w.status.toUpperCase()],
        ["Registered Date", new Date(w.createdAt).toLocaleString()]
      ]
    )
  }

  // Template Excel Download
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["employeeCode", "name", "department", "designation", "position", "salary", "status", "contact", "joinedDate"],
      "workforce_import_template"
    )
  }

  // Upload Excel trigger SheetJS parser
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
      // Map properties to backend structure
      const recordsToImport = validData.map(r => ({
        employeeCode: String(r.employeeCode || ""),
        name: String(r.name || ""),
        department: String(r.department || "Operations & Sites"),
        designation: String(r.designation || "Worker"),
        position: String(r.position || "Mason"),
        salary: String(r.salary || "1200"),
        status: String(r.status || "active").toLowerCase(),
        contact: String(r.contact || ""),
        joinedDate: r.joinedDate ? new Date(r.joinedDate).toISOString() : new Date().toISOString()
      }))

      await createEmployee(recordsToImport)
      toast.success(`Imported ${recordsToImport.length} worker profiles successfully`)
      loadWorkers()
    } catch (error) {
      toast.error("Import failed. Double-check headers and connections.")
    }
  }

  // Client side filters
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.employeeCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.position || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter
    const matchesDept = deptFilter === "all" || worker.department === deptFilter
    return matchesSearch && matchesStatus && matchesDept
  })

  // Pagination bounds
  const totalPages = Math.ceil(filteredWorkers.length / pageSize)
  const paginatedWorkers = filteredWorkers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const activeCount = workers.filter(w => w.status === "active").length
  const inactiveCount = workers.filter(w => w.status === "inactive" || w.status === "on-leave").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Workforce Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee codes, department rosters, files, wages, and profiles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadWorkers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Register Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Employee</DialogTitle>
                <DialogDescription>Create a master employee record dossier</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="code">Employee Code / Card No</Label>
                    <Input id="code" placeholder="e.g. EMP-2026-009" value={newWorker.employeeCode} onChange={e => setNewWorker({...newWorker, employeeCode: e.target.value})} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="e.g. Robert Miller" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dept">Department</Label>
                    <Select value={newWorker.department} onValueChange={v => setNewWorker({...newWorker, department: v})}>
                      <SelectTrigger id="dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                        {departments.length === 0 && (
                          <SelectItem value="Operations & Sites">Operations & Sites</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" placeholder="e.g. Operator" value={newWorker.designation} onChange={e => setNewWorker({...newWorker, designation: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skill">Skill Category (Position)</Label>
                    <Select value={newWorker.position} onValueChange={v => setNewWorker({...newWorker, position: v})}>
                      <SelectTrigger id="skill"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                        <SelectItem value="Mason">Mason</SelectItem>
                        <SelectItem value="Operator">Operator</SelectItem>
                        <SelectItem value="Electrician">Electrician</SelectItem>
                        <SelectItem value="Carpenter">Carpenter</SelectItem>
                        <SelectItem value="Labourer">General Labourer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wage">Daily Wage Rate (₹)</Label>
                    <Input id="wage" type="number" placeholder="1500" value={newWorker.salary} onChange={e => setNewWorker({...newWorker, salary: e.target.value})} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="contact">Contact Information</Label>
                    <Input id="contact" placeholder="e.g. +91 98877 66554" value={newWorker.contact} onChange={e => setNewWorker({...newWorker, contact: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="joinedDate">Joined Date</Label>
                    <Input id="joinedDate" type="date" value={newWorker.joinedDate} onChange={e => setNewWorker({...newWorker, joinedDate: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newWorker.status} onValueChange={v => setNewWorker({...newWorker, status: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Register Dossier</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Workforce" value={activeCount.toString()} subtitle="Currently deployed" icon={Users} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Total Roster" value={workers.length.toString()} subtitle="Registered master files" icon={UserPlus} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="On Leave / Idle" value={inactiveCount.toString()} subtitle="Not active" icon={Award} colorClass="bg-red-100 dark:bg-red-900/30" />
        <KPICard title="Staff Average Wage" value="₹1,200" subtitle="Daily wage metric" icon={TrendingUp} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Roster Controls */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 gap-4">
          <div>
            <CardTitle>Workforce Register</CardTitle>
            <CardDescription>Comprehensive employee profiles, contract files, and details</CardDescription>
          </div>
          {/* SheetJS controls */}
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
            <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handlePrintReport}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print / PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code, name, skill..."
                className="pl-9 text-xs h-9"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div>
              <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                  {departments.length === 0 && <SelectItem value="Operations & Sites">Operations & Sites</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Page Size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation (Skill)</TableHead>
                  <TableHead>Daily Wage</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      Loading workforce register...
                    </TableCell>
                  </TableRow>
                ) : paginatedWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      No employees found. Add or import profiles.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWorkers.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-xs font-mono font-medium">{w.employeeCode || "N/A"}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{w.name}</TableCell>
                      <TableCell className="text-xs">{w.department || "Operations & Sites"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{w.designation || "Worker"}</span>
                          <span className="text-[10px] text-muted-foreground">({w.position})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">₹{(w.salary || 1200).toLocaleString()}/day</TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {w.contact || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.status === "active" ? "default" : "outline"} className="text-[10px] h-5 uppercase">
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Attachments" onClick={() => openDocsModal(w)}>
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Print Dossier" onClick={() => handlePrintProfile(w)}>
                            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(w)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(w.id)}>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredWorkers.length} total rows)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee Dossier</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 col-span-2">
                  <Label>Employee Code</Label>
                  <Input value={editingItem.employeeCode || ""} onChange={e => setEditingItem({...editingItem, employeeCode: e.target.value})} required />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Full Name</Label>
                  <Input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Select value={editingItem.department || ""} onValueChange={v => setEditingItem({...editingItem, department: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                      {departments.length === 0 && <SelectItem value="Operations & Sites">Operations & Sites</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Designation</Label>
                  <Input value={editingItem.designation || ""} onChange={e => setEditingItem({...editingItem, designation: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Skill Position</Label>
                  <Select value={editingItem.position} onValueChange={v => setEditingItem({...editingItem, position: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Mason">Mason</SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Electrician">Electrician</SelectItem>
                      <SelectItem value="Carpenter">Carpenter</SelectItem>
                      <SelectItem value="Labourer">General Labourer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Daily Wage (₹)</Label>
                  <Input type="number" value={editingItem.salary} onChange={e => setEditingItem({...editingItem, salary: e.target.value})} required />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Contact Info</Label>
                  <Input value={editingItem.contact || ""} onChange={e => setEditingItem({...editingItem, contact: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Joined Date</Label>
                  <Input type="date" value={editingItem.joinedDate} onChange={e => setEditingItem({...editingItem, joinedDate: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Attachments Dialog */}
      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Paperclip className="h-5 w-5 text-blue-600" />
              Attachments - {selectedWorker?.name}
            </DialogTitle>
            <DialogDescription>Attach contracts, ID copies, or certificates to the profile.</DialogDescription>
          </DialogHeader>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/20 min-h-[150px] text-xs">
            {docsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attachments uploaded. Choose a file below to upload.
              </div>
            ) : (
              docsList.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 rounded bg-card border">
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold truncate">{doc.originalName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(doc.fileSize / 1024).toFixed(1)} KB | Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                      <a href={`http://localhost:5000${doc.filePath}`} target="_blank" rel="noreferrer" title="Download">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Remove" onClick={() => handleDeleteDoc(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 border-t flex flex-col md:flex-row md:justify-between items-center gap-3">
            <label className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 px-4 h-9 text-xs font-semibold cursor-pointer disabled:opacity-50 w-full md:w-auto">
              {uploading ? "Uploading..." : "Upload Document"}
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDocsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["employeeCode", "name", "department", "designation", "position", "salary", "status", "contact", "joinedDate"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.name) errs.push(`Row ${i + 1}: name is required`)
          if (!row.employeeCode) errs.push(`Row ${i + 1}: employeeCode is required`)
          if (!row.salary) errs.push(`Row ${i + 1}: salary is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Employees Preview"
      />
    </div>
  )
}

function resetForm() {
  // handled in initial states
}

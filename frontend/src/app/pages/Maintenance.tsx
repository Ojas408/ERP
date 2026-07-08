import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Wrench, AlertTriangle, Clock, CheckCircle2, Upload, Download, Plus, Eye, Edit, Trash2, RefreshCw, UserCheck, FileSpreadsheet } from "lucide-react"
import { fetchMaintenances, createMaintenance, fetchVehicles, fetchEmployees, deleteRecord, updateRecord } from "../services/api"
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
import { exportToExcel, downloadExcelTemplate, parseExcelFile } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"

export default function Maintenance() {
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newMaint, setNewMaint] = useState({
    vehicleId: "",
    employeeId: "",
    type: "Routine",
    cost: "",
    description: "",
    status: "completed",
    date: new Date().toISOString().split('T')[0]
  })

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [maintData, vehicleData, employeeData] = await Promise.all([
        fetchMaintenances(),
        fetchVehicles(),
        fetchEmployees()
      ])
      setMaintenances(Array.isArray(maintData) ? maintData : [])
      setVehicles(Array.isArray(vehicleData) ? vehicleData : [])
      setEmployees(Array.isArray(employeeData) ? employeeData : [])
    } catch (error) {
      console.error("Failed to load work order data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMaintenance({
        ...newMaint,
        cost: parseFloat(newMaint.cost)
      })
      setIsAddOpen(false)
      setNewMaint({
        vehicleId: "",
        employeeId: "",
        type: "Routine",
        cost: "",
        description: "",
        status: "completed",
        date: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      console.error("Failed to add work order:", error)
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: new Date(item.date).toISOString().split('T')[0]
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('maintenance', editingItem.id, {
        ...editingItem,
        cost: parseFloat(editingItem.cost)
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error("Failed to update work order:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return
    try {
      await deleteRecord('maintenance', id)
      loadData()
    } catch (error) {
      console.error("Failed to delete work order:", error)
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["vehicleId", "employeeId", "type", "cost", "description", "status", "date"],
      "maintenance_import_template"
    )
  }

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    parseExcelFile(file)
      .then((data) => {
        setImportData(data)
        setIsImportOpen(true)
      })
      .catch((err) => {
        console.error("Failed to parse excel file", err)
      })
    e.target.value = ""
  }

  const handleConfirmImport = async (parsedRows: any[]) => {
    try {
      const formatted = parsedRows.map(row => ({
        vehicleId: String(row.vehicleId || ""),
        employeeId: String(row.employeeId || ""),
        type: String(row.type || "Routine"),
        cost: parseFloat(row.cost) || 0,
        description: String(row.description || ""),
        status: String(row.status || "pending"),
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
      
      for (const item of formatted) {
        await createMaintenance(item)
      }
      
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      console.error("Import failed.", err)
    }
  }

  const handleExportExcel = () => {
    const data = safeMaintenances.map(m => ({
      Date: new Date(m.date).toLocaleDateString(),
      Vehicle: m.vehicle?.plateNumber || 'N/A',
      Type: m.type,
      AssignedTo: safeEmployees.find(e => e.id === m.employeeId)?.name || 'Unassigned',
      Cost: m.cost,
      Status: m.status,
      Description: m.description
    }))
    exportToExcel(data, "maintenance_report")
  }

  const safeMaintenances = Array.isArray(maintenances) ? maintenances : []
  const safeVehicles = Array.isArray(vehicles) ? vehicles : []
  const safeEmployees = Array.isArray(employees) ? employees : []

  const totalCost = safeMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0)
  const pendingMaint = safeMaintenances.filter(m => m.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Work Orders</h1>
          <p className="text-sm text-muted-foreground">
            Equipment maintenance and task execution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <label className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-background text-xs font-semibold px-3 h-9 cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
            Import
            <input type="file" onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls,.csv" />
          </label>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Work Order</DialogTitle>
                <DialogDescription>Assign a maintenance or repair task</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Asset / Vehicle</Label>
                    <Select value={newMaint.vehicleId} onValueChange={v => setNewMaint({...newMaint, vehicleId: v})}>
                      <SelectTrigger id="vehicle">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeVehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.plateNumber} - {v.model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee">Assigned To</Label>
                    <Select value={newMaint.employeeId} onValueChange={v => setNewMaint({...newMaint, employeeId: v})}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeEmployees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.name} ({e.position})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newMaint.type} onValueChange={v => setNewMaint({...newMaint, type: v})}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Routine">Routine</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (₹)</Label>
                    <Input id="cost" type="number" value={newMaint.cost} onChange={e => setNewMaint({...newMaint, cost: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newMaint.status} onValueChange={v => setNewMaint({...newMaint, status: v})}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={newMaint.date} onChange={e => setNewMaint({...newMaint, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" value={newMaint.description} onChange={e => setNewMaint({...newMaint, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Work Order</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Work Orders"
          value={safeMaintenances.length.toString()}
          subtitle="records this year"
          icon={Wrench}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Total Cost"
          value={`₹${(totalCost / 1000).toFixed(1)}K`}
          subtitle="spent on tasks"
          icon={AlertTriangle}
          colorClass="bg-red-100 dark:bg-red-900/30"
        />
        <KPICard
          title="Pending Execution"
          value={pendingMaint.toString()}
          subtitle="currently active"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Completed Tasks"
          value={(safeMaintenances.length - pendingMaint).toString()}
          subtitle="service items"
          icon={CheckCircle2}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Order History</CardTitle>
          <CardDescription>Comprehensive service logs for all equipment and tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset / Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeMaintenances.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-medium">{item.vehicle?.plateNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{item.type}</TableCell>
                    <TableCell className="text-xs">{safeEmployees.find(e => e.id === item.employeeId)?.name || 'Unassigned'}</TableCell>
                    <TableCell className="text-xs">₹{(item.cost || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "completed" ? "secondary" : (item.status === "overdue" ? "destructive" : "outline")} className="text-xs">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{item.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
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
            <DialogTitle>Edit Work Order</DialogTitle>
            <DialogDescription>Update the details for this task</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicle">Asset / Vehicle</Label>
                  <Select value={editingItem.vehicleId} onValueChange={v => setEditingItem({...editingItem, vehicleId: v})}>
                    <SelectTrigger id="edit-vehicle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {safeVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.plateNumber} - {v.model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employee">Assigned To</Label>
                  <Select value={editingItem.employeeId || ""} onValueChange={v => setEditingItem({...editingItem, employeeId: v})}>
                    <SelectTrigger id="edit-employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeEmployees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.position})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={editingItem.type} onValueChange={v => setEditingItem({...editingItem, type: v})}>
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Cost (₹)</Label>
                  <Input id="edit-cost" type="number" value={editingItem.cost} onChange={e => setEditingItem({...editingItem, cost: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input id="edit-date" type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Input id="edit-desc" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Work Order</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["vehicleId", "employeeId", "type", "cost", "description", "status", "date"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (isNaN(parseFloat(row.cost))) errs.push(`Row ${i + 1}: cost must be a number`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Work Orders"
      />
    </div>
  )
}

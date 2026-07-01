import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { 
  Truck, 
  Wrench, 
  ShieldAlert, 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  Paperclip, 
  Download, 
  Upload, 
  Printer, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  Fuel,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react"
import { 
  fetchVehicles, 
  createVehicle, 
  deleteRecord, 
  updateRecord,
  fetchRecords,
  createRecord,
  uploadFile,
  fetchDocuments,
  deleteDocument
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
import { exportToExcel, downloadExcelTemplate, parseExcelFile, printReport } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function Equipment() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [siteFilter, setSiteFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // Roster Sub-Dialogs
  const [isTripsOpen, setIsTripsOpen] = useState(false)
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false)
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

  // Sub-lists data
  const [tripsList, setTripsList] = useState<any[]>([])
  const [maintenanceList, setMaintenanceList] = useState<any[]>([])
  const [docsList, setDocsList] = useState<any[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [subLoading, setSubLoading] = useState(false)

  // Sub-Form States
  const [newTrip, setNewTrip] = useState({
    fromLocation: "",
    toLocation: "",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
    distance: "50",
    fuelConsumed: "15"
  })

  const [newMaintenance, setNewMaintenance] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Routine", // Routine, Repair, Breakdown
    cost: "5000",
    description: "",
    status: "completed" // completed, pending
  })

  // Main Forms State
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: "",
    model: "",
    vehicleType: "",
    driver: "",
    siteId: "",
    status: "available",
    lastService: new Date().toISOString().split('T')[0]
  })

  const [editingItem, setEditingItem] = useState<any>(null)

  // SheetJS states
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [vData, tData, sData] = await Promise.all([
        fetchVehicles(),
        fetchRecords("masters/vehicle-types"),
        fetchRecords("sites")
      ])
      setVehicles(Array.isArray(vData) ? vData : [])
      setVehicleTypes(Array.isArray(tData) ? tData : [])
      setSites(Array.isArray(sData) ? sData : [])
    } catch (error) {
      console.error("Failed to load machinery registry:", error)
      toast.error("Failed to load equipment registry")
    } finally {
      setLoading(false)
    }
  }

  // Manage Trips Log
  const openTripsModal = async (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setIsTripsOpen(true)
    await loadTrips(vehicle.id)
  }

  const loadTrips = async (vehicleId: string) => {
    try {
      setSubLoading(true)
      const data = await fetchRecords("vehicle-movements")
      const filtered = Array.isArray(data) ? data.filter(t => t.vehicleId === vehicleId) : []
      setTripsList(filtered)
    } catch (err) {
      toast.error("Failed to load trip movements")
    } finally {
      setSubLoading(false)
    }
  }

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return
    try {
      await createRecord("vehicle-movements", {
        vehicleId: selectedVehicle.id,
        fromLocation: newTrip.fromLocation,
        toLocation: newTrip.toLocation,
        startTime: new Date(newTrip.startTime).toISOString(),
        endTime: newTrip.endTime ? new Date(newTrip.endTime).toISOString() : undefined,
        distance: parseFloat(newTrip.distance) || 0,
        fuelConsumed: parseFloat(newTrip.fuelConsumed) || 0
      })
      toast.success("Trip movement / fuel entry logged")
      setNewTrip({
        fromLocation: "",
        toLocation: "",
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
        distance: "50",
        fuelConsumed: "15"
      })
      loadTrips(selectedVehicle.id)
    } catch (err) {
      toast.error("Failed to log vehicle movement")
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Delete this trip record?")) return
    try {
      await deleteRecord("vehicle-movements", tripId)
      toast.success("Trip record deleted")
      loadTrips(selectedVehicle.id)
    } catch (err) {
      toast.error("Failed to delete trip record")
    }
  }

  // Manage Maintenance Log
  const openMaintenanceModal = async (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setIsMaintenanceOpen(true)
    await loadMaintenance(vehicle.id)
  }

  const loadMaintenance = async (vehicleId: string) => {
    try {
      setSubLoading(true)
      const data = await fetchRecords("maintenance")
      const filtered = Array.isArray(data) ? data.filter(m => m.vehicleId === vehicleId) : []
      setMaintenanceList(filtered)
    } catch (err) {
      toast.error("Failed to load maintenance logs")
    } finally {
      setSubLoading(false)
    }
  }

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return
    try {
      await createRecord("maintenance", {
        vehicleId: selectedVehicle.id,
        date: new Date(newMaintenance.date).toISOString(),
        type: newMaintenance.type,
        cost: parseFloat(newMaintenance.cost) || 0,
        description: newMaintenance.description,
        status: newMaintenance.status
      })
      toast.success("Maintenance entry logged successfully")
      setNewMaintenance({
        date: new Date().toISOString().split('T')[0],
        type: "Routine",
        cost: "5000",
        description: "",
        status: "completed"
      })
      loadMaintenance(selectedVehicle.id)
      loadData() // Refresh main vehicle list to reflect status updates
    } catch (err) {
      toast.error("Failed to log maintenance record")
    }
  }

  const handleDeleteMaintenance = async (maintId: string) => {
    if (!confirm("Delete this maintenance log?")) return
    try {
      await deleteRecord("maintenance", maintId)
      toast.success("Maintenance record deleted")
      loadMaintenance(selectedVehicle.id)
      loadData()
    } catch (err) {
      toast.error("Failed to delete record")
    }
  }

  // Manage Attachments / Documents
  const openDocsModal = async (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setIsDocsOpen(true)
    try {
      const docs = await fetchDocuments({ vehicleId: vehicle.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to load machinery attachments")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedVehicle) return
    try {
      setUploading(true)
      await uploadFile(file, { vehicleId: selectedVehicle.id })
      toast.success("Machinery document uploaded successfully")
      const docs = await fetchDocuments({ vehicleId: selectedVehicle.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Remove this document?")) return
    try {
      await deleteDocument(docId)
      toast.success("Document removed")
      const docs = await fetchDocuments({ vehicleId: selectedVehicle.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to delete document")
    }
  }

  // CRUD Forms handlers
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const plateRegex = /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/i
    if (newVehicle.plateNumber && !plateRegex.test(newVehicle.plateNumber)) {
      toast.error("Invalid Plate Number. Format MUST be MH-12-QE-1234")
      return
    }

    try {
      await createVehicle({
        plateNumber: newVehicle.plateNumber.toUpperCase(),
        model: newVehicle.model,
        vehicleType: newVehicle.vehicleType || undefined,
        driver: newVehicle.driver || undefined,
        siteId: newVehicle.siteId || undefined,
        status: newVehicle.status,
        lastService: newVehicle.lastService ? new Date(newVehicle.lastService).toISOString() : undefined
      })
      toast.success("Equipment registered successfully")
      setIsAddOpen(false)
      setNewVehicle({
        plateNumber: "",
        model: "",
        vehicleType: vehicleTypes[0]?.name || "",
        driver: "",
        siteId: sites[0]?.id || "",
        status: "available",
        lastService: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      toast.error("Failed to register heavy machine")
    }
  }

  const handleEdit = (vehicle: any) => {
    setEditingItem({
      ...vehicle,
      lastService: vehicle.lastService ? new Date(vehicle.lastService).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      siteId: vehicle.siteId || ""
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const plateRegex = /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/i
    if (editingItem.plateNumber && !plateRegex.test(editingItem.plateNumber)) {
      toast.error("Invalid Plate Number. Format MUST be MH-12-QE-1234")
      return
    }

    try {
      await updateRecord('vehicles', editingItem.id, {
        plateNumber: editingItem.plateNumber.toUpperCase(),
        model: editingItem.model,
        vehicleType: editingItem.vehicleType,
        driver: editingItem.driver,
        siteId: editingItem.siteId || undefined,
        status: editingItem.status,
        lastService: new Date(editingItem.lastService).toISOString()
      })
      toast.success("Asset details updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update equipment details")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this machinery from registry?")) return
    try {
      await deleteRecord('vehicles', id)
      toast.success("Asset deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete asset")
    }
  }

  // Excel handlers
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["plateNumber", "model", "vehicleType", "driver", "status", "lastService"],
      "equipment_import_template"
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
        toast.error(err.message || "Failed to parse excel file")
      })
    e.target.value = "" // reset
  }

  const handleConfirmImport = async (parsedRows: any[]) => {
    try {
      const formatted = parsedRows.map(row => ({
        plateNumber: String(row.plateNumber || "").toUpperCase(),
        model: String(row.model || "JCB Excavator"),
        vehicleType: row.vehicleType ? String(row.vehicleType) : undefined,
        driver: row.driver ? String(row.driver) : undefined,
        status: String(row.status || "available").toLowerCase(),
        lastService: row.lastService ? new Date(row.lastService).toISOString() : undefined
      }))
      await createVehicle(formatted)
      toast.success(`Successfully imported ${formatted.length} vehicles`)
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      toast.error("Import failed: check columns format and try again")
    }
  }

  const handleExportExcel = () => {
    exportToExcel(vehicles, "heavy_assets_ledger")
  }

  const handlePrint = () => {
    printReport("heavy-machinery-table", "HEAVY ASSETS & EQUIPMENT REGISTRY")
  }

  // Client side sorting & pagination
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.driver || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    const matchesType = typeFilter === "all" || v.vehicleType === typeFilter
    const matchesSite = siteFilter === "all" || v.siteId === siteFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesSite
  })

  // Pagination bounds
  const totalPages = Math.ceil(filteredVehicles.length / pageSize)
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Status counts
  const availableCount = vehicles.filter(v => v.status === "available").length
  const activeCount = vehicles.filter(v => v.status === "in-use" || v.status === "active").length
  const maintCount = vehicles.filter(v => v.status === "maintenance").length

  return (
    <div className="space-y-6">
      {/* Page Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Heavy Assets Registry</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage heavy machinery, vehicle log sheets, trip sheets, and maintenance schedules</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <label className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-background text-xs font-semibold px-3 h-9 cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
            Import Excel
            <input type="file" onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls,.csv" />
          </label>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            Export Excel
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Machinery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register Heavy Equipment</DialogTitle>
                <DialogDescription>Add a new vehicle or site machinery to the fleet</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="plate">Plate Number / Asset Tag *</Label>
                    <Input id="plate" placeholder="e.g. MH-12-QE-1234" value={newVehicle.plateNumber} onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="type">Vehicle / Machine Type</Label>
                    <Select value={newVehicle.vehicleType} onValueChange={v => setNewVehicle({...newVehicle, vehicleType: v})}>
                      <SelectTrigger id="type"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                        {vehicleTypes.length === 0 && <SelectItem value="Excavator">Excavator</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="model">Machine Model Name</Label>
                    <Input id="model" placeholder="e.g. JCB 3DX" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="driver">Assigned Operator / Driver</Label>
                    <Input id="driver" placeholder="e.g. Rajesh Kumar" value={newVehicle.driver} onChange={e => setNewVehicle({...newVehicle, driver: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="site">Current Site Project</Label>
                    <Select value={newVehicle.siteId} onValueChange={v => setNewVehicle({...newVehicle, siteId: v})}>
                      <SelectTrigger id="site"><SelectValue placeholder="Select Site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Operational Status</Label>
                    <Select value={newVehicle.status} onValueChange={v => setNewVehicle({...newVehicle, status: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available (Idle)</SelectItem>
                        <SelectItem value="in-use">In Use (Active)</SelectItem>
                        <SelectItem value="maintenance">Breakdown / Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastService">Last Serviced Date</Label>
                    <Input id="lastService" type="date" value={newVehicle.lastService} onChange={e => setNewVehicle({...newVehicle, lastService: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Register Machine</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Machinery" value={vehicles.length.toString()} subtitle="registered items" icon={Truck} colorClass="bg-blue-50 dark:bg-blue-900/10 text-blue-600" />
        <KPICard title="Available (Idle)" value={availableCount.toString()} subtitle="ready to assign" icon={Activity} colorClass="bg-green-50 dark:bg-green-900/10 text-green-600" />
        <KPICard title="In Use (Active)" value={activeCount.toString()} subtitle="dispatched to projects" icon={Truck} colorClass="bg-purple-50 dark:bg-purple-900/10 text-purple-600" />
        <KPICard title="Breakdown / Maint" value={maintCount.toString()} subtitle="requires attention" icon={Wrench} colorClass="bg-orange-50 dark:bg-orange-900/10 text-orange-600" />
      </div>

      {/* Interactive Filters Panel */}
      <Card className="p-4 bg-muted/20 border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Plate, Model or Driver name..."
              className="pl-9 text-xs h-9 bg-background border-slate-300"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Machinery Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={v => { setSiteFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Assigned Site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Ledger Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Heavy Assets Registry</CardTitle>
          <CardDescription>Click action buttons to attach files, view trip sheets, breakdown cards, or modify asset settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto" id="heavy-machinery-table">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Plate Number</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Model Name</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Category Type</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Assigned Driver</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Current Project Site</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Last Serviced</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Status</TableHead>
                  <TableHead className="w-48 text-right font-bold text-slate-700 dark:text-slate-200 print:hidden">Rosters & Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      Loading heavy equipment registry...
                    </TableCell>
                  </TableRow>
                ) : paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      No assets found matching filters. Import Excel list to populate roster.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map((v) => {
                    const lastServiced = v.lastService ? new Date(v.lastService).toLocaleDateString() : 'N/A';
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{v.plateNumber}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">{v.model}</TableCell>
                        <TableCell className="text-xs">{v.vehicleType || "Unassigned"}</TableCell>
                        <TableCell className="text-xs font-medium">{v.driver || "No Operator Assigned"}</TableCell>
                        <TableCell className="text-xs">{v.site?.name || "Yard / Idle"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lastServiced}</TableCell>
                        <TableCell>
                          <Badge variant={v.status === "available" ? "secondary" : v.status === "in-use" || v.status === "active" ? "default" : "destructive"} className="text-[10px] h-5 uppercase">
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right print:hidden">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Trip Sheets & Fuel Logs" onClick={() => openTripsModal(v)}>
                              <Fuel className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Maintenance breakdown log" onClick={() => openMaintenanceModal(v)}>
                              <Wrench className="h-3.5 w-3.5 text-orange-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Attachments / Paperwork" onClick={() => openDocsModal(v)}>
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit Machinery" onClick={() => handleEdit(v)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Deregister" onClick={() => handleDelete(v.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredVehicles.length} total machines)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-300"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-300"
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

      {/* Edit Assets Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Machinery Dossier</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 col-span-2">
                  <Label>Plate Number *</Label>
                  <Input value={editingItem.plateNumber} onChange={e => setEditingItem({...editingItem, plateNumber: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Machinery Type</Label>
                  <Select value={editingItem.vehicleType || ""} onValueChange={v => setEditingItem({...editingItem, vehicleType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Model Name</Label>
                  <Input value={editingItem.model} onChange={e => setEditingItem({...editingItem, model: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Assigned Operator</Label>
                  <Input value={editingItem.driver || ""} onChange={e => setEditingItem({...editingItem, driver: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Assigned Site</Label>
                  <Select value={editingItem.siteId} onValueChange={v => setEditingItem({...editingItem, siteId: v})}>
                    <SelectTrigger><SelectValue placeholder="Idle / Yard" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Idle / Yard</SelectItem>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available (Idle)</SelectItem>
                      <SelectItem value="in-use">In Use (Active)</SelectItem>
                      <SelectItem value="maintenance">Breakdown / Maint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Last Serviced</Label>
                  <Input type="date" value={editingItem.lastService} onChange={e => setEditingItem({...editingItem, lastService: e.target.value})} />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Trips & Fuel logs Dialog */}
      <Dialog open={isTripsOpen} onOpenChange={setIsTripsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              Trip Log Sheets & Fuel Consumed - {selectedVehicle?.plateNumber}
            </DialogTitle>
            <DialogDescription>Log operational site movements, travel distances, and fuel consumed per machine trip</DialogDescription>
          </DialogHeader>

          {/* Form to add a trip */}
          <form onSubmit={handleAddTrip} className="grid grid-cols-3 gap-2.5 p-3 rounded-lg border bg-muted/10 text-xs my-2">
            <div className="space-y-1">
              <Label>From Location</Label>
              <Input placeholder="e.g. Weighbridge" value={newTrip.fromLocation} onChange={e => setNewTrip({...newTrip, fromLocation: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>To Location</Label>
              <Input placeholder="e.g. Gate 4 Pit" value={newTrip.toLocation} onChange={e => setNewTrip({...newTrip, toLocation: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>Start Date/Time</Label>
              <Input type="datetime-local" value={newTrip.startTime} onChange={e => setNewTrip({...newTrip, startTime: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>End Date/Time</Label>
              <Input type="datetime-local" value={newTrip.endTime} onChange={e => setNewTrip({...newTrip, endTime: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label>Distance Traveled (KM)</Label>
              <Input type="number" placeholder="50" value={newTrip.distance} onChange={e => setNewTrip({...newTrip, distance: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>Fuel Consumed (Liters)</Label>
              <Input type="number" placeholder="15" value={newTrip.fuelConsumed} onChange={e => setNewTrip({...newTrip, fuelConsumed: e.target.value})} required />
            </div>
            <div className="col-span-3 flex justify-end pt-1">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-[11px]">Log Trip & Fuel</Button>
            </div>
          </form>

          {/* Trip list table */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="py-2 text-[11px] font-bold">Route</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Started</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Duration</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Distance</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Fuel (Avg)</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">Loading sheets...</TableCell></TableRow>
                ) : tripsList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">No trip logs captured for this vehicle.</TableCell></TableRow>
                ) : (
                  tripsList.map((t) => {
                    const start = new Date(t.startTime)
                    const end = t.endTime ? new Date(t.endTime) : null
                    const diffMs = end ? end.getTime() - start.getTime() : 0
                    const durationHours = diffMs > 0 ? (diffMs / 3600000).toFixed(1) + " hrs" : "In Progress"
                    const mileage = t.distance && t.fuelConsumed ? (t.distance / t.fuelConsumed).toFixed(1) + " km/L" : "-"

                    return (
                      <TableRow key={t.id} className="text-xs">
                        <TableCell className="font-semibold py-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />
                            {t.fromLocation} → {t.toLocation}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">{start.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</TableCell>
                        <TableCell className="py-2 font-medium">{durationHours}</TableCell>
                        <TableCell className="py-2 font-semibold">{t.distance} KM</TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-col text-[10px]">
                            <span className="font-semibold">{t.fuelConsumed} Liters</span>
                            <span className="text-muted-foreground">({mileage})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteTrip(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTripsOpen(false)}>Close Log Sheet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance breakdown logs Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              Maintenance & Breakdown Logs - {selectedVehicle?.plateNumber}
            </DialogTitle>
            <DialogDescription>Record machine breakdowns, replacement parts cost, and servicing schedules</DialogDescription>
          </DialogHeader>

          {/* Form to add maintenance */}
          <form onSubmit={handleAddMaintenance} className="grid grid-cols-4 gap-2 p-3 rounded-lg border bg-muted/10 text-xs my-2">
            <div className="space-y-1">
              <Label>Service Date</Label>
              <Input type="date" value={newMaintenance.date} onChange={e => setNewMaintenance({...newMaintenance, date: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>Service Type</Label>
              <Select value={newMaintenance.type} onValueChange={v => setNewMaintenance({...newMaintenance, type: v})}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine Service</SelectItem>
                  <SelectItem value="Repair">General Repair</SelectItem>
                  <SelectItem value="Breakdown">Site Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Servicing Cost (₹)</Label>
              <Input type="number" placeholder="5000" value={newMaintenance.cost} onChange={e => setNewMaintenance({...newMaintenance, cost: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <Label>Work Status</Label>
              <Select value={newMaintenance.status} onValueChange={v => setNewMaintenance({...newMaintenance, status: v})}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed / Settled</SelectItem>
                  <SelectItem value="pending">Pending Mechanics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 space-y-1">
              <Label>Work Order / Description Details</Label>
              <Input placeholder="e.g. Excavator hydraulic fluid seal replacement, diesel filter change" value={newMaintenance.description} onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})} required />
            </div>
            <div className="col-span-4 flex justify-end pt-1">
              <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 h-8 text-[11px]">Log Service Entry</Button>
            </div>
          </form>

          {/* Maintenance list */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="py-2 text-[11px] font-bold">Service Date</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Type</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Repair description</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Cost</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold">Status</TableHead>
                  <TableHead className="py-2 text-[11px] font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">Loading logs...</TableCell></TableRow>
                ) : maintenanceList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">No maintenance / breakdown logs filed.</TableCell></TableRow>
                ) : (
                  maintenanceList.map((m) => (
                    <TableRow key={m.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{new Date(m.date).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2 font-semibold text-slate-800">{m.type}</TableCell>
                      <TableCell className="py-2 max-w-[200px] truncate text-muted-foreground" title={m.description}>{m.description || "-"}</TableCell>
                      <TableCell className="py-2 font-bold text-slate-900">₹{(m.cost || 0).toLocaleString()}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={m.status === "completed" ? "secondary" : "destructive"} className="text-[10px] h-4">
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteMaintenance(m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMaintenanceOpen(false)}>Close Roster</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Machinery Attachments Dialog */}
      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Paperclip className="h-5 w-5 text-blue-600" />
              Attachments - {selectedVehicle?.plateNumber}
            </DialogTitle>
            <DialogDescription>Attach registration papers, RTO fitness slips, pollution certificates, or insurance bills</DialogDescription>
          </DialogHeader>

          {/* Attachments List */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/20 min-h-[150px] text-xs">
            {docsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attachments uploaded. Choose a file below to upload.
              </div>
            ) : (
              docsList.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-card border border-slate-200">
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold truncate">{doc.originalName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {(doc.fileSize / 1024).toFixed(1)} KB | {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                      <a href={`http://localhost:5000${doc.filePath}`} target="_blank" rel="noreferrer" title="Download file">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Remove" onClick={() => handleDeleteDoc(doc.id)}>
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
        headers={["plateNumber", "model", "vehicleType", "driver", "status", "lastService"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.plateNumber) errs.push(`Row ${i + 1}: plateNumber is required`)
          const plateRegex = /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/i
          if (row.plateNumber && !plateRegex.test(row.plateNumber)) {
            errs.push(`Row ${i + 1}: plateNumber '${row.plateNumber}' has invalid format. Use MH-12-QE-1234`)
          }
          if (!row.model) errs.push(`Row ${i + 1}: model name is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Machinery Fleet Preview"
      />
    </div>
  )
}

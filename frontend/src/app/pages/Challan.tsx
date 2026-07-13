import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  Upload,
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  Printer, 
  Paperclip, 
  Truck, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Check,
  Send,
  MapPin
} from "lucide-react"
import { 
  fetchChallans, 
  createChallan, 
  fetchVehicles, 
  deleteRecord, 
  updateRecord,
  fetchRecords,
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

export default function Challan() {
  const [challans, setChallans] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<"delivery" | "traffic">("delivery")

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [siteFilter, setSiteFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [selectedChallan, setSelectedChallan] = useState<any>(null)
  const [isTrafficAddOpen, setIsTrafficAddOpen] = useState(false)

  // Sub-list States
  const [docsList, setDocsList] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Invoice ref for printing
  const invoicePrintRef = useRef<HTMLDivElement>(null)

  // CRUD Forms State
  const [newChallan, setNewChallan] = useState({
    challanNumber: "",
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    material: "Sand",
    quantity: "15", // e.g. tons
    destination: "", // site name or siteId
    status: "draft" // draft, approved, dispatched, delivered
  })

  const [editingItem, setEditingItem] = useState<any>(null)
  const [trafficChallans, setTrafficChallans] = useState<any[]>([
    {
      id: "tc-1",
      challanNumber: "TRF-2026-0001",
      date: new Date().toISOString().split("T")[0],
      vehicleId: "",
      vehiclePlateNumber: "UP16 AB 4582",
    violationType: "Overspeeding",
      location: "Noida Sector 128",
      fineAmount: 2000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "unpaid",
      remarks: "Awaiting driver confirmation",
    },
  ])
  const [trafficFilter, setTrafficFilter] = useState("all")
  const [newTrafficChallan, setNewTrafficChallan] = useState({
    challanNumber: `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    vehicleId: "",
    vehiclePlateNumber: "",
    violationType: "No Parking",
    location: "",
    fineAmount: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "unpaid",
    remarks: "",
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
      console.log("[Challan] Loading data...")
      const [challanData, vehicleData, siteData] = await Promise.all([
        fetchChallans(),
        fetchVehicles(),
        fetchRecords("sites")
      ])
      console.log("[Challan] Data loaded:", { challanCount: challanData?.length, vehicleCount: vehicleData?.length, siteCount: siteData?.length })
      setChallans(Array.isArray(challanData) ? challanData : [])
      setVehicles(Array.isArray(vehicleData) ? vehicleData : [])
      setSites(Array.isArray(siteData) ? siteData : [])

      // Generate a default unique challan code for add form
      setNewChallan(prev => ({
        ...prev,
        challanNumber: `CHL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      }))
    } catch (error) {
      console.error("Failed to load delivery challans:", error)
      toast.error("Failed to load delivery challans ledger")
    } finally {
      setLoading(false)
    }
  }

  // Manage attachments
  const openDocsModal = async (chl: any) => {
    setSelectedChallan(chl)
    setIsDocsOpen(true)
    try {
      const docs = await fetchDocuments({ challanId: chl.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to load attachments")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChallan) return
    try {
      setUploading(true)
      await uploadFile(file, { challanId: selectedChallan.id })
      toast.success("Document attached successfully")
      const docs = await fetchDocuments({ challanId: selectedChallan.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Delete this weighbridge slip / receipt document?")) return
    try {
      await deleteDocument(docId)
      toast.success("Document removed")
      const docs = await fetchDocuments({ challanId: selectedChallan.id })
      setDocsList(docs)
    } catch (err) {
      toast.error("Failed to delete document")
    }
  }

  // Add Challan
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createChallan({
        ...newChallan,
        quantity: parseFloat(newChallan.quantity) || 0
      })
      toast.success("Delivery Challan logged successfully")
      setIsAddOpen(false)
      setNewChallan({
        challanNumber: `CHL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        material: "Sand",
        quantity: "15",
        destination: "",
        status: "draft"
      })
      loadData()
    } catch (error) {
      toast.error("Failed to log delivery challan")
    }
  }

  // Edit challan
  const handleEdit = (chl: any) => {
    setEditingItem({
      ...chl,
      date: chl.date ? new Date(chl.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      quantity: String(chl.quantity || 0),
      vehicleId: chl.vehicleId || "",
      destination: chl.destination || "",
      material: chl.material || "Sand",
      status: chl.status || "draft"
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('challans', editingItem.id, {
        challanNumber: editingItem.challanNumber,
        date: editingItem.date,
        vehicleId: editingItem.vehicleId,
        material: editingItem.material,
        quantity: parseFloat(editingItem.quantity) || 0,
        destination: editingItem.destination,
        status: editingItem.status
      })
      toast.success("Challan updated successfully")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update challan")
    }
  }

  // Delete challan
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challan record?")) return
    try {
      await deleteRecord('challans', id)
      toast.success("Challan deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete challan")
    }
  }

  // Workflow Status Change helper
  const handleTransitionStatus = async (chl: any, nextStatus: string) => {
    try {
      await updateRecord('challans', chl.id, {
        ...chl,
        status: nextStatus
      })
      toast.success(`Challan marked as ${nextStatus.toUpperCase()}`)
      loadData()
    } catch (err) {
      toast.error("Failed to update status workflow")
    }
  }

  // Print single challan invoice receipt
  const openInvoiceModal = (chl: any) => {
    setSelectedChallan(chl)
    setIsInvoiceOpen(true)
  }

  const handlePrintInvoice = () => {
    if (!selectedChallan) return
    const printContent = invoicePrintRef.current?.innerHTML
    if (!printContent) return

    const originalContent = document.body.innerHTML
    
    // Set up dynamic styles for receipt print
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Delivery Challan Invoice - ${selectedChallan.challanNumber}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
              .challan-header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              .challan-title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
              .meta-grid { display: grid; grid-cols-2; display: flex; justify-content: space-between; gap: 50px; margin-bottom: 40px; }
              .meta-block { flex: 1; }
              .meta-block h3 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
              .meta-block p { font-size: 14px; line-height: 1.6; margin: 4px 0; }
              .tbl { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
              .tbl th, .tbl td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
              .tbl th { bg-color: #f8fafc; font-weight: bold; }
              .status-badge { font-weight: bold; text-transform: uppercase; font-size: 12px; }
              .signature-row { display: flex; justify-content: space-between; margin-top: 100px; }
              .sig-block { border-top: 1px solid #94a3b8; width: 200px; text-align: center; font-size: 12px; padding-top: 8px; font-weight: bold; color: #475569; }
            </style>
          </head>
          <body onload="window.print();window.close();">
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  // Excel Handlers
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["challanNumber", "date", "vehiclePlateNumber", "material", "quantity", "destination", "status"],
      "delivery_challan_import_template"
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
    e.target.value = ""
  }

  const handleConfirmImport = async (parsedRows: any[]) => {
    try {
      const formatted = parsedRows.map(row => {
        // Find vehicle ID from plate number
        const vehicle = vehicles.find(v => v.plateNumber.toLowerCase() === String(row.vehiclePlateNumber || "").toLowerCase())
        if (!vehicle) {
          throw new Error(`Vehicle plate number '${row.vehiclePlateNumber}' not found in registry`)
        }
        return {
          challanNumber: String(row.challanNumber || `CHL-${Date.now()}`),
          date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
          vehicleId: vehicle.id,
          material: String(row.material || "Sand"),
          quantity: parseFloat(row.quantity) || 0,
          destination: String(row.destination || ""),
          status: String(row.status || "draft").toLowerCase()
        }
      })
      for (const challan of formatted) {
        await createChallan(challan)
      }
      toast.success(`Successfully imported ${formatted.length} delivery challans`)
      setIsImportOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Import failed. Please check plate numbers and columns format.")
    }
  }

  const handleExportExcel = () => {
    const data = challans.map(c => ({
      challanNumber: c.challanNumber,
      date: new Date(c.date).toLocaleDateString(),
      vehiclePlate: c.vehicle?.plateNumber || "N/A",
      material: c.material,
      quantity: c.quantity,
      destination: c.destination,
      status: c.status
    }))
    exportToExcel(data, "delivery_challans_summary")
  }

  const handlePrintRoster = () => {
    const rows = filteredChallans.map(c => [
      c.challanNumber,
      new Date(c.date).toLocaleDateString(),
      c.vehicle?.plateNumber || "N/A",
      c.material,
      c.quantity,
      c.destination,
      c.status,
    ])
    printReport("Delivery Challans Log Ledger", ["Challan No.", "Date", "Vehicle", "Material", "Quantity", "Destination", "Status"], rows)
  }

  const handleAddTrafficChallan = (e: React.FormEvent) => {
    e.preventDefault()
    const vehicle = vehicles.find(v => v.id === newTrafficChallan.vehicleId)
    const record = {
      ...newTrafficChallan,
      id: `tc-${Date.now()}`,
      vehiclePlateNumber: vehicle?.plateNumber || newTrafficChallan.vehiclePlateNumber,
      fineAmount: parseFloat(newTrafficChallan.fineAmount) || 0,
    }
    setTrafficChallans(prev => [record, ...prev])
    setIsTrafficAddOpen(false)
    setNewTrafficChallan({
      challanNumber: `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      vehicleId: "",
      vehiclePlateNumber: "",
      violationType: "No Parking",
      location: "",
      fineAmount: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "unpaid",
      remarks: "",
    })
    toast.success("Traffic challan recorded")
  }

  const handleTrafficStatus = (id: string, status: string) => {
    setTrafficChallans(prev => prev.map(row => row.id === id ? { ...row, status } : row))
    toast.success(`Traffic challan marked ${status}`)
  }

  const handleDeleteTraffic = (id: string) => {
    if (!confirm("Delete this traffic challan record?")) return
    setTrafficChallans(prev => prev.filter(row => row.id !== id))
    toast.success("Traffic challan deleted")
  }

  const handleExportTrafficExcel = () => {
    exportToExcel(
      trafficChallans.map(row => ({
        challanNumber: row.challanNumber,
        date: row.date,
        vehiclePlateNumber: row.vehiclePlateNumber,
        violationType: row.violationType,
        location: row.location,
        fineAmount: row.fineAmount,
        dueDate: row.dueDate,
        status: row.status,
        remarks: row.remarks,
      })),
      "vehicle_traffic_challans"
    )
  }

  // Filters calculation
  const filteredChallans = challans.filter(c => {
    const plate = c.vehicle?.plateNumber || ""
    const mat = c.material || ""
    const dest = c.destination || ""
    const refNo = c.challanNumber || ""
    const matchesSearch = 
      plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refNo.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesSite = siteFilter === "all" || c.destination === siteFilter

    return matchesSearch && matchesStatus && matchesSite
  })

  // Pagination
  const totalPages = Math.ceil(filteredChallans.length / pageSize)
  const paginatedChallans = filteredChallans.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // KPI widgets
  const draftCount = challans.filter(c => c.status === "draft" || c.status === "pending").length
  const approvedCount = challans.filter(c => c.status === "approved").length
  const transitCount = challans.filter(c => c.status === "dispatched").length
  const deliveredCount = challans.filter(c => c.status === "delivered").length
  const filteredTrafficChallans = trafficChallans.filter(row => trafficFilter === "all" || row.status === trafficFilter)
  const unpaidTrafficCount = trafficChallans.filter(row => row.status === "unpaid").length
  const paidTrafficCount = trafficChallans.filter(row => row.status === "paid").length
  const contestedTrafficCount = trafficChallans.filter(row => row.status === "contested").length
  const totalTrafficFine = trafficChallans.reduce((sum, row) => sum + (Number(row.fineAmount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Challan Management</h1>
          <p className="text-sm text-muted-foreground font-medium">Manage delivery challans separately from vehicle traffic challans and fines</p>
        </div>
        {activeSection === "delivery" && (
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
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handlePrintRoster}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Issue Challan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Issue New Delivery Challan</DialogTitle>
                <DialogDescription>Record dispatch details of raw construction materials, weights, and driver assignments</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="chlNo">Challan Number *</Label>
                    <Input id="chlNo" value={newChallan.challanNumber} onChange={e => setNewChallan({...newChallan, challanNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date">Dispatch Date</Label>
                    <Input id="date" type="date" value={newChallan.date} onChange={e => setNewChallan({...newChallan, date: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vehicle">Assigned Vehicle Plate *</Label>
                    <Select value={newChallan.vehicleId} onValueChange={v => setNewChallan({...newChallan, vehicleId: v})} required>
                      <SelectTrigger id="vehicle"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} ({v.model})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="material">Delivery Material Type</Label>
                    <Select value={newChallan.material} onValueChange={v => setNewChallan({...newChallan, material: v})}>
                      <SelectTrigger id="material"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sand">Sand / Fine Sand</SelectItem>
                        <SelectItem value="Aggregate">Aggregate 10mm/20mm</SelectItem>
                        <SelectItem value="Cement">Cement Bags</SelectItem>
                        <SelectItem value="Steel">Reinforcement Steel</SelectItem>
                        <SelectItem value="Concrete">Ready Mix Concrete (RMC)</SelectItem>
                        <SelectItem value="Soil">Soil / Murrum</SelectItem>
                        <SelectItem value="Fly Ash">Fly Ash / Bricks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty">Quantity / Weight (Tons/Bags)</Label>
                    <Input id="qty" type="number" placeholder="15" value={newChallan.quantity} onChange={e => setNewChallan({...newChallan, quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="destination">Destination Project Site *</Label>
                    <Select value={newChallan.destination} onValueChange={v => setNewChallan({...newChallan, destination: v})} required>
                      <SelectTrigger id="destination"><SelectValue placeholder="Select Site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="status">Challan Status</Label>
                    <Select value={newChallan.status} onValueChange={v => setNewChallan({...newChallan, status: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Preparing)</SelectItem>
                        <SelectItem value="approved">Approved (Approved to Load)</SelectItem>
                        <SelectItem value="dispatched">Dispatched (In Transit)</SelectItem>
                        <SelectItem value="delivered">Delivered (Received at Site)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Issue Dispatch Slip</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border bg-muted/20 p-1 w-fit">
        <Button
          variant={activeSection === "delivery" ? "default" : "ghost"}
          className="h-9 text-xs"
          onClick={() => setActiveSection("delivery")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Delivery Challans
        </Button>
        <Button
          variant={activeSection === "traffic" ? "default" : "ghost"}
          className="h-9 text-xs"
          onClick={() => setActiveSection("traffic")}
        >
          <Truck className="h-4 w-4 mr-2" />
          Traffic Challans
        </Button>
      </div>

      {activeSection === "delivery" ? (
      <>
      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Draft / Pending" value={draftCount.toString()} subtitle="awaiting approval" icon={Clock} colorClass="bg-slate-50 text-slate-500" />
        <KPICard title="Approved to Load" value={approvedCount.toString()} subtitle="authorized records" icon={Check} colorClass="bg-blue-50 text-blue-600" />
        <KPICard title="In Transit (Dispatched)" value={transitCount.toString()} subtitle="fleet on route" icon={Truck} colorClass="bg-orange-50 text-orange-600 text-purple-600" />
        <KPICard title="Delivered at Site" value={deliveredCount.toString()} subtitle="completed transactions" icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
      </div>

      {/* Search & Filters */}
      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Challan No., Plate, or Material..."
              className="pl-9 text-xs h-9 bg-background border-slate-300"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Status Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft / Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={v => { setSiteFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Destination Site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Destinations</SelectItem>
                {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Ledger Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Delivery Challan Roster</CardTitle>
          <CardDescription>Verify raw materials dispatch logs. Click printer icons for print-formatted official invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto" id="challan-list-table">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Challan No.</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Date</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Vehicle Assigned</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Material Type</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Quantity (Tons)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Destination Site</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Status State</TableHead>
                  <TableHead className="w-56 text-right font-bold text-slate-700 dark:text-slate-200 print:hidden">Workflow Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">Loading logs...</TableCell></TableRow>
                ) : paginatedChallans.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">No delivery challans recorded. Create or upload spreadsheet.</TableCell></TableRow>
                ) : (
                  paginatedChallans.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">{c.challanNumber}</TableCell>
                      <TableCell className="text-xs">{new Date(c.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-semibold font-mono">{c.vehicle?.plateNumber || "N/A"}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">{c.material}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">{c.quantity} tons</TableCell>
                      <TableCell className="text-xs">{c.destination}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            c.status === "delivered" ? "secondary" : 
                            c.status === "dispatched" ? "default" :
                            c.status === "approved" ? "outline" : "outline"
                          } 
                          className={`text-[10px] h-5 uppercase font-bold ${
                            c.status === "delivered" ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                            c.status === "dispatched" ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" :
                            c.status === "approved" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <div className="flex gap-1 justify-end items-center">
                          {/* Workflow status buttons */}
                          {c.status === "draft" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-blue-200 hover:bg-blue-50 text-blue-600" onClick={() => handleTransitionStatus(c, "approved")}>
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          )}
                          {c.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-orange-200 hover:bg-orange-50 text-orange-600" onClick={() => handleTransitionStatus(c, "dispatched")}>
                              <Send className="h-3 w-3 mr-1" /> Dispatch
                            </Button>
                          )}
                          {c.status === "dispatched" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-green-200 hover:bg-green-50 text-green-600" onClick={() => handleTransitionStatus(c, "delivered")}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Delivered
                            </Button>
                          )}

                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Print Challan Invoice" onClick={() => openInvoiceModal(c)}>
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Weighbridge slips attachments" onClick={() => openDocsModal(c)}>
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(c)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredChallans.length} total slips)
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
      </>
      ) : (
      <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Vehicle Traffic Challans</h2>
          <p className="text-sm text-muted-foreground">Track police/RTO fines, due dates, payment status, and vehicle responsibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleExportTrafficExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            Export Traffic
          </Button>
          <Dialog open={isTrafficAddOpen} onOpenChange={setIsTrafficAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Traffic Challan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Vehicle Traffic Challan</DialogTitle>
                <DialogDescription>Record fines issued against company vehicles.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTrafficChallan} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <Label>Traffic Challan Number *</Label>
                    <Input value={newTrafficChallan.challanNumber} onChange={e => setNewTrafficChallan({...newTrafficChallan, challanNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Issue Date</Label>
                    <Input type="date" value={newTrafficChallan.date} onChange={e => setNewTrafficChallan({...newTrafficChallan, date: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Due Date</Label>
                    <Input type="date" value={newTrafficChallan.dueDate} onChange={e => setNewTrafficChallan({...newTrafficChallan, dueDate: e.target.value})} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Vehicle</Label>
                    <Select value={newTrafficChallan.vehicleId} onValueChange={v => {
                      const vehicle = vehicles.find(item => item.id === v)
                      setNewTrafficChallan({...newTrafficChallan, vehicleId: v, vehiclePlateNumber: vehicle?.plateNumber || ""})
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} ({v.model})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Vehicle Plate Number *</Label>
                    <Input value={newTrafficChallan.vehiclePlateNumber} onChange={e => setNewTrafficChallan({...newTrafficChallan, vehiclePlateNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Violation Type</Label>
                    <Select value={newTrafficChallan.violationType} onValueChange={v => setNewTrafficChallan({...newTrafficChallan, violationType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No Parking">No Parking</SelectItem>
                        <SelectItem value="Overspeeding">Overspeeding</SelectItem>
                        <SelectItem value="Signal Jump">Signal Jump</SelectItem>
                        <SelectItem value="Overloading Traffic Fine">Overloading (Traffic Fine)</SelectItem>
                        <SelectItem value="Document Missing">Document Missing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Fine Amount</Label>
                    <Input type="number" value={newTrafficChallan.fineAmount} onChange={e => setNewTrafficChallan({...newTrafficChallan, fineAmount: e.target.value})} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Location</Label>
                    <Input value={newTrafficChallan.location} onChange={e => setNewTrafficChallan({...newTrafficChallan, location: e.target.value})} placeholder="e.g. Noida Sector 128" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Remarks</Label>
                    <Input value={newTrafficChallan.remarks} onChange={e => setNewTrafficChallan({...newTrafficChallan, remarks: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsTrafficAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Traffic Challan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Unpaid Challans" value={unpaidTrafficCount.toString()} subtitle="needs payment" icon={Clock} colorClass="bg-red-50 text-red-600" />
        <KPICard title="Paid Challans" value={paidTrafficCount.toString()} subtitle="closed fines" icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
        <KPICard title="Contested" value={contestedTrafficCount.toString()} subtitle="under review" icon={FileText} colorClass="bg-amber-50 text-amber-600" />
        <KPICard title="Total Fine Amount" value={`₹${totalTrafficFine.toLocaleString("en-IN")}`} subtitle="all traffic fines" icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
      </div>

      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by plate, challan no., violation, or location..."
              className="pl-9 text-xs h-9 bg-background border-slate-300"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={trafficFilter} onValueChange={setTrafficFilter}>
            <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Status Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Traffic Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="contested">Contested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Traffic Challan Register</CardTitle>
          <CardDescription>Vehicle fine ledger with due dates and payment workflow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead>Challan No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrafficChallans.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">No traffic challans recorded.</TableCell></TableRow>
                ) : (
                  filteredTrafficChallans
                    .filter(row => {
                      const q = searchQuery.toLowerCase()
                      return !q || [row.challanNumber, row.vehiclePlateNumber, row.violationType, row.location].some(value => String(value || "").toLowerCase().includes(q))
                    })
                    .map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs font-semibold font-mono text-blue-600">{row.challanNumber}</TableCell>
                        <TableCell className="text-xs">{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs font-semibold font-mono">{row.vehiclePlateNumber}</TableCell>
                        <TableCell className="text-xs">{row.violationType}</TableCell>
                        <TableCell className="text-xs">{row.location || "N/A"}</TableCell>
                        <TableCell className="text-xs font-semibold">₹{Number(row.fineAmount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] h-5 uppercase font-bold ${
                            row.status === "paid" ? "bg-green-100 text-green-800 border-green-200" :
                            row.status === "contested" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-red-100 text-red-800 border-red-200"
                          }`}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {row.status !== "paid" && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-green-700" onClick={() => handleTrafficStatus(row.id, "paid")}>
                                Paid
                              </Button>
                            )}
                            {row.status !== "contested" && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-amber-700" onClick={() => handleTrafficStatus(row.id, "contested")}>
                                Contest
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteTraffic(row.id)}>
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
      </>
      )}

      {/* Edit Challan Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Delivery Challan Details</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 col-span-2">
                  <Label>Challan Number *</Label>
                  <Input value={editingItem.challanNumber} onChange={e => setEditingItem({...editingItem, challanNumber: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Dispatch Date</Label>
                  <Input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Vehicle Assigned</Label>
                  <Select value={editingItem.vehicleId} onValueChange={v => setEditingItem({...editingItem, vehicleId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} ({v.model})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Material Type</Label>
                  <Select value={editingItem.material} onValueChange={v => setEditingItem({...editingItem, material: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sand">Sand / Fine Sand</SelectItem>
                      <SelectItem value="Aggregate">Aggregate 10mm/20mm</SelectItem>
                      <SelectItem value="Cement">Cement Bags</SelectItem>
                      <SelectItem value="Steel">Reinforcement Steel</SelectItem>
                      <SelectItem value="Concrete">Ready Mix Concrete (RMC)</SelectItem>
                      <SelectItem value="Soil">Soil / Murrum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity (Tons)</Label>
                  <Input type="number" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} required />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Destination Project Site</Label>
                  <Select value={editingItem.destination} onValueChange={v => setEditingItem({...editingItem, destination: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Preparing)</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="dispatched">Dispatched (In Transit)</SelectItem>
                      <SelectItem value="delivered">Delivered (Received)</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Attachments / Slips Dialog */}
      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Paperclip className="h-5 w-5 text-blue-600" />
              Challan Attachments - {selectedChallan?.challanNumber}
            </DialogTitle>
            <DialogDescription>Attach weighbridge receipts, signed physical challan copies, or site supervisor notes</DialogDescription>
          </DialogHeader>

          {/* Docs list */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/20 min-h-[150px] text-xs">
            {docsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files attached. Upload a file below.
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
                      <a href={`http://localhost:5000${doc.filePath}`} target="_blank" rel="noreferrer" title="Download slip">
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
              {uploading ? "Uploading..." : "Upload Weighbridge Slip"}
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDocsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice view Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="print:hidden">
            <DialogTitle>Official Delivery Challan Invoice</DialogTitle>
            <DialogDescription>Preview and print formatted official raw materials dispatch slip</DialogDescription>
          </DialogHeader>

          {/* Printable Invoice Container */}
          <div className="flex-1 overflow-y-auto border p-6 rounded bg-card" ref={invoicePrintRef}>
            {selectedChallan && (
              <div className="space-y-6 text-slate-800">
                <div className="challan-header flex justify-between border-b pb-4">
                  <div>
                    <h2 className="challan-title text-xl font-bold text-blue-900 uppercase">Material Delivery Challan</h2>
                    <p className="text-xs text-muted-foreground mt-1">Construction ERP Logistics System</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-slate-500 uppercase">Challan Ref Number</p>
                    <p className="font-mono text-sm font-bold text-blue-600">{selectedChallan.challanNumber}</p>
                  </div>
                </div>

                <div className="meta-grid grid grid-cols-2 gap-4 text-xs">
                  <div className="meta-block">
                    <h3 className="font-bold border-b pb-1 text-slate-400 uppercase text-[10px] mb-2">Logistics Details</h3>
                    <p><strong>Dispatch Date:</strong> {new Date(selectedChallan.date).toLocaleDateString()}</p>
                    <p><strong>Vehicle Plate:</strong> {selectedChallan.vehicle?.plateNumber || "N/A"}</p>
                    <p><strong>Machine Model:</strong> {selectedChallan.vehicle?.model || "N/A"}</p>
                  </div>
                  <div className="meta-block">
                    <h3 className="font-bold border-b pb-1 text-slate-400 uppercase text-[10px] mb-2">Delivery Destination</h3>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      <strong>Project Site:</strong> {selectedChallan.destination}
                    </p>
                    <p><strong>Operational Status:</strong> 
                      <span className="ml-1 uppercase font-bold text-blue-600">{selectedChallan.status}</span>
                    </p>
                  </div>
                </div>

                <table className="tbl w-full border text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 border font-bold text-left">Description / Material Item</th>
                      <th className="p-2 border font-bold text-right">Quantity (Tons/Bags)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border font-medium">{selectedChallan.material}</td>
                      <td className="p-2 border text-right font-mono font-semibold">{selectedChallan.quantity} tons</td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[11px] text-muted-foreground border p-3 rounded bg-muted/20">
                  <p><strong>Terms:</strong> This document serves as legal proof of material dispatch from storage yards. The receiving site engineer must sign off on material quality, bags count, or weighbridge slip validation upon delivery.</p>
                </div>

                <div className="signature-row flex justify-between pt-12 text-[10px]">
                  <div className="sig-block border-t pt-1 w-36 text-center font-bold text-slate-500">
                    Store Keeper Sign
                  </div>
                  <div className="sig-block border-t pt-1 w-36 text-center font-bold text-slate-500">
                    Driver / Operator Sign
                  </div>
                  <div className="sig-block border-t pt-1 w-36 text-center font-bold text-slate-500">
                    Site Engineer Sign
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 border-t print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInvoiceOpen(false)}>Close Preview</Button>
            <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" /> Print Challan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["challanNumber", "date", "vehiclePlateNumber", "material", "quantity", "destination", "status"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.challanNumber) errs.push(`Row ${i + 1}: challanNumber is required`)
          if (!row.vehiclePlateNumber) errs.push(`Row ${i + 1}: vehiclePlateNumber is required`)
          if (!row.material) errs.push(`Row ${i + 1}: material is required`)
          if (!row.quantity) errs.push(`Row ${i + 1}: quantity is required`)
          if (!row.destination) errs.push(`Row ${i + 1}: destination site name is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Material Challans Preview"
      />
    </div>
  )
}

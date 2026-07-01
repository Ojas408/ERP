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
  Package, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  ArrowDownLeft,
  ChevronLeft, 
  ChevronRight
} from "lucide-react"
import { 
  fetchMaterialInwards, 
  createMaterialInward, 
  fetchSites, 
  deleteRecord, 
  updateRecord 
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
import { toast } from "sonner"

export default function MaterialInward() {
  const [inwards, setInwards] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [siteFilter, setSiteFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form States
  const [newInward, setNewInward] = useState({
    inwardNumber: "",
    date: new Date().toISOString().slice(0, 16), // datetime-local format YYYY-MM-DDTHH:MM
    materialName: "Cement",
    quantity: "",
    unit: "bags",
    supplierName: "",
    vehicleNumber: "",
    challanNumber: "",
    siteId: "",
    receivedBy: "",
    remarks: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inwardData, siteData] = await Promise.all([
        fetchMaterialInwards(),
        fetchSites()
      ])
      setInwards(Array.isArray(inwardData) ? inwardData : [])
      setSites(Array.isArray(siteData) ? siteData : [])

      // Auto-generate invoice/inward code
      setNewInward(prev => ({
        ...prev,
        inwardNumber: `INW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      }))
    } catch (error) {
      console.error("Failed to load material inward records:", error)
      toast.error("Failed to load material inward records")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMaterialInward({
        ...newInward,
        quantity: parseFloat(newInward.quantity) || 0,
        date: new Date(newInward.date).toISOString()
      })
      toast.success("Material Inward logged successfully")
      setIsAddOpen(false)
      setNewInward({
        inwardNumber: `INW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().slice(0, 16),
        materialName: "Cement",
        quantity: "",
        unit: "bags",
        supplierName: "",
        vehicleNumber: "",
        challanNumber: "",
        siteId: "",
        receivedBy: "",
        remarks: ""
      })
      loadData()
    } catch (error) {
      toast.error("Failed to log material inward")
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: item.date ? new Date(item.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      quantity: String(item.quantity || 0),
      siteId: item.siteId || "",
      remarks: item.remarks || ""
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('material-inward', editingItem.id, {
        ...editingItem,
        quantity: parseFloat(editingItem.quantity) || 0,
        date: new Date(editingItem.date).toISOString()
      })
      toast.success("Material inward record updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update record")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material inward log?")) return
    try {
      await deleteRecord('material-inward', id)
      toast.success("Inward record deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete record")
    }
  }

  // Filter calculations
  const filteredInwards = inwards.filter(item => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (item.inwardNumber || "").toLowerCase().includes(searchLower) ||
      (item.materialName || "").toLowerCase().includes(searchLower) ||
      (item.supplierName || "").toLowerCase().includes(searchLower) ||
      (item.challanNumber || "").toLowerCase().includes(searchLower)
    
    const matchesSite = siteFilter === "all" || item.siteId === siteFilter

    return matchesSearch && matchesSite
  })

  // Pagination
  const totalPages = Math.ceil(filteredInwards.length / pageSize)
  const paginatedInwards = filteredInwards.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // KPIs
  const totalReceipts = inwards.length
  const totalQuantityCement = inwards.filter(i => i.materialName === "Cement").reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalQuantitySand = inwards.filter(i => i.materialName === "Sand").reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalQuantitySteel = inwards.filter(i => i.materialName === "Steel").reduce((sum, i) => sum + (i.quantity || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Material Inward Register</h1>
          <p className="text-sm text-muted-foreground font-medium">Record and track materials received at different project sites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Record Material Inward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Material Inward Entry</DialogTitle>
                <DialogDescription>Enter details of materials received from supplier at site</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="inwNo">Inward Reference Number *</Label>
                    <Input id="inwNo" value={newInward.inwardNumber} onChange={e => setNewInward({...newInward, inwardNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwDate">Date & Time *</Label>
                    <Input id="inwDate" type="datetime-local" value={newInward.date} onChange={e => setNewInward({...newInward, date: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwSite">Receiving Site *</Label>
                    <Select value={newInward.siteId} onValueChange={v => setNewInward({...newInward, siteId: v})} required>
                      <SelectTrigger id="inwSite"><SelectValue placeholder="Select Site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwMaterial">Material *</Label>
                    <Select value={newInward.materialName} onValueChange={v => setNewInward({...newInward, materialName: v})}>
                      <SelectTrigger id="inwMaterial"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cement">Cement Bags</SelectItem>
                        <SelectItem value="Sand">Sand</SelectItem>
                        <SelectItem value="Aggregate">Aggregate</SelectItem>
                        <SelectItem value="Steel">Reinforcement Steel</SelectItem>
                        <SelectItem value="RMC">Ready Mix Concrete (RMC)</SelectItem>
                        <SelectItem value="Bricks">Bricks / Fly Ash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwQty">Quantity *</Label>
                    <Input id="inwQty" type="number" placeholder="100" value={newInward.quantity} onChange={e => setNewInward({...newInward, quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwUnit">Unit *</Label>
                    <Select value={newInward.unit} onValueChange={v => setNewInward({...newInward, unit: v})}>
                      <SelectTrigger id="inwUnit"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="cum">Cu.M.</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwSupplier">Supplier Name *</Label>
                    <Input id="inwSupplier" placeholder="Supreme Cement Group" value={newInward.supplierName} onChange={e => setNewInward({...newInward, supplierName: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwVehicle">Vehicle Number</Label>
                    <Input id="inwVehicle" placeholder="WA-04-AX-5555" value={newInward.vehicleNumber} onChange={e => setNewInward({...newInward, vehicleNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwChallan">Supplier Challan No.</Label>
                    <Input id="inwChallan" placeholder="CH-99321" value={newInward.challanNumber} onChange={e => setNewInward({...newInward, challanNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inwReceived">Received By</Label>
                    <Input id="inwReceived" placeholder="John Doe" value={newInward.receivedBy} onChange={e => setNewInward({...newInward, receivedBy: e.target.value})} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="inwRemarks">Remarks / Notes</Label>
                    <Input id="inwRemarks" placeholder="Weighed, found correct. Storage in Warehouse A." value={newInward.remarks} onChange={e => setNewInward({...newInward, remarks: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Log Material Entry</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Receipts" value={totalReceipts.toString()} subtitle="total inward logs" icon={Package} colorClass="bg-slate-50 text-slate-500" />
        <KPICard title="Cement Inward" value={totalQuantityCement.toLocaleString()} subtitle="bags received" icon={ArrowDownLeft} colorClass="bg-blue-50 text-blue-600" />
        <KPICard title="Sand Inward" value={totalQuantitySand.toLocaleString()} subtitle="tons received" icon={ArrowDownLeft} colorClass="bg-amber-50 text-amber-600" />
        <KPICard title="Steel Inward" value={totalQuantitySteel.toLocaleString()} subtitle="kg received" icon={ArrowDownLeft} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Inward No, material, supplier, or challan..."
              className="pl-9 text-xs h-9 bg-background border-slate-300"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={siteFilter} onValueChange={v => { setSiteFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Destination Site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Material Inward Logs</CardTitle>
          <CardDescription>View, audit, and log raw material receipts at project sites.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Inward Ref</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Date & Time</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Site</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Material</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Quantity</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Supplier</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Vehicle No.</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Remarks</TableHead>
                  <TableHead className="w-24 text-right font-bold text-slate-700 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">Loading records...</TableCell></TableRow>
                ) : paginatedInwards.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">No material inward records logged.</TableCell></TableRow>
                ) : (
                  paginatedInwards.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">{item.inwardNumber}</TableCell>
                      <TableCell className="text-xs">{new Date(item.date).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-medium">{item.site?.name || "N/A"}</TableCell>
                      <TableCell className="text-xs font-medium">{item.materialName}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-xs">{item.supplierName}</TableCell>
                      <TableCell className="text-xs font-mono">{item.vehicleNumber || "N/A"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={item.remarks}>{item.remarks || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
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
                Showing page {currentPage} of {totalPages} ({filteredInwards.length} total entries)
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
            <DialogTitle>Edit Material Inward Details</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Inward Reference Number *</Label>
                  <Input value={editingItem.inwardNumber} onChange={e => setEditingItem({...editingItem, inwardNumber: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Date & Time *</Label>
                  <Input type="datetime-local" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Site *</Label>
                  <Select value={editingItem.siteId} onValueChange={v => setEditingItem({...editingItem, siteId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Material *</Label>
                  <Select value={editingItem.materialName} onValueChange={v => setEditingItem({...editingItem, materialName: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cement">Cement Bags</SelectItem>
                      <SelectItem value="Sand">Sand</SelectItem>
                      <SelectItem value="Aggregate">Aggregate</SelectItem>
                      <SelectItem value="Steel">Reinforcement Steel</SelectItem>
                      <SelectItem value="RMC">Ready Mix Concrete (RMC)</SelectItem>
                      <SelectItem value="Bricks">Bricks / Fly Ash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity *</Label>
                  <Input type="number" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Unit *</Label>
                  <Select value={editingItem.unit} onValueChange={v => setEditingItem({...editingItem, unit: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="cum">Cu.M.</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Supplier Name *</Label>
                  <Input value={editingItem.supplierName} onChange={e => setEditingItem({...editingItem, supplierName: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Vehicle Number</Label>
                  <Input value={editingItem.vehicleNumber || ""} onChange={e => setEditingItem({...editingItem, vehicleNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Supplier Challan No.</Label>
                  <Input value={editingItem.challanNumber || ""} onChange={e => setEditingItem({...editingItem, challanNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Received By</Label>
                  <Input value={editingItem.receivedBy || ""} onChange={e => setEditingItem({...editingItem, receivedBy: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Remarks / Notes</Label>
                  <Input value={editingItem.remarks || ""} onChange={e => setEditingItem({...editingItem, remarks: e.target.value})} />
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
    </div>
  )
}

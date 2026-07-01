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
  Recycle, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { 
  fetchScraps, 
  createScrap, 
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

export default function ScrapManagement() {
  const [scraps, setScraps] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form States
  const [newScrap, setNewScrap] = useState({
    date: new Date().toISOString().split('T')[0],
    materialType: "Steel Rebar",
    quantity: "",
    unit: "tons",
    siteId: "",
    saleStatus: "stored",
    saleValue: "",
    buyerName: "",
    remarks: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [scrapData, siteData] = await Promise.all([
        fetchScraps(),
        fetchSites()
      ])
      setScraps(Array.isArray(scrapData) ? scrapData : [])
      setSites(Array.isArray(siteData) ? siteData : [])
    } catch (error) {
      console.error("Failed to load scrap data:", error)
      toast.error("Failed to load scrap records")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createScrap({
        ...newScrap,
        quantity: parseFloat(newScrap.quantity) || 0,
        saleValue: newScrap.saleValue ? parseFloat(newScrap.saleValue) : null
      })
      toast.success("Scrap record added successfully")
      setIsAddOpen(false)
      setNewScrap({
        date: new Date().toISOString().split('T')[0],
        materialType: "Steel Rebar",
        quantity: "",
        unit: "tons",
        siteId: "",
        saleStatus: "stored",
        saleValue: "",
        buyerName: "",
        remarks: ""
      })
      loadData()
    } catch (error) {
      toast.error("Failed to add scrap record")
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      quantity: String(item.quantity || 0),
      saleValue: item.saleValue ? String(item.saleValue) : "",
      siteId: item.siteId || "",
      remarks: item.remarks || "",
      buyerName: item.buyerName || ""
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('scrap', editingItem.id, {
        ...editingItem,
        quantity: parseFloat(editingItem.quantity) || 0,
        saleValue: editingItem.saleValue ? parseFloat(editingItem.saleValue) : null
      })
      toast.success("Scrap record updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update scrap record")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scrap entry?")) return
    try {
      await deleteRecord('scrap', id)
      toast.success("Scrap record deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete scrap record")
    }
  }

  // Filter calculations
  const filteredScraps = scraps.filter(item => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (item.materialType || "").toLowerCase().includes(searchLower) ||
      (item.buyerName || "").toLowerCase().includes(searchLower) ||
      (item.remarks || "").toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === "all" || item.saleStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredScraps.length / pageSize)
  const paginatedScraps = filteredScraps.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // KPIs
  const totalQuantitySteel = scraps.filter(s => s.materialType === "Steel Rebar" && s.unit === "tons").reduce((sum, s) => sum + (s.quantity || 0), 0)
  const totalQuantitySteelKg = scraps.filter(s => s.materialType === "Steel Rebar" && s.unit === "kg").reduce((sum, s) => sum + (s.quantity || 0), 0)
  const totalSteelTons = totalQuantitySteel + (totalQuantitySteelKg / 1000)

  const scrapSalesRevenue = scraps.filter(s => s.saleStatus === "sold").reduce((sum, s) => sum + (s.saleValue || 0), 0)
  const storedScrapCount = scraps.filter(s => s.saleStatus === "stored").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Scrap & Waste Management</h1>
          <p className="text-sm text-muted-foreground font-medium">Track generated site waste/scrap, stored inventory, and scrap sales revenue</p>
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
                Log Scrap/Waste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Scrap / Waste Entry</DialogTitle>
                <DialogDescription>Record generated scrap metal or site waste details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="scDate">Date *</Label>
                    <Input id="scDate" type="date" value={newScrap.date} onChange={e => setNewScrap({...newScrap, date: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scSite">Source Site *</Label>
                    <Select value={newScrap.siteId} onValueChange={v => setNewScrap({...newScrap, siteId: v})} required>
                      <SelectTrigger id="scSite"><SelectValue placeholder="Select Site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scMaterial">Scrap Type *</Label>
                    <Select value={newScrap.materialType} onValueChange={v => setNewScrap({...newScrap, materialType: v})}>
                      <SelectTrigger id="scMaterial"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Steel Rebar">Steel Rebar Scrap</SelectItem>
                        <SelectItem value="Concrete Waste">Concrete Waste</SelectItem>
                        <SelectItem value="Wood/Ply">Plywood & Timber Scrap</SelectItem>
                        <SelectItem value="Copper/Electrical">Copper & Wiring Scrap</SelectItem>
                        <SelectItem value="Cement Bags">Empty Cement Bags</SelectItem>
                        <SelectItem value="Plastic/Pipes">PVC & Plastic Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scQty">Quantity *</Label>
                    <Input id="scQty" type="number" placeholder="5" value={newScrap.quantity} onChange={e => setNewScrap({...newScrap, quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scUnit">Unit *</Label>
                    <Select value={newScrap.unit} onValueChange={v => setNewScrap({...newScrap, unit: v})}>
                      <SelectTrigger id="scUnit"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="units">Units / Bags count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scStatus">Sale Status *</Label>
                    <Select value={newScrap.saleStatus} onValueChange={v => setNewScrap({...newScrap, saleStatus: v})}>
                      <SelectTrigger id="scStatus"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stored">Stored in Yard</SelectItem>
                        <SelectItem value="sold">Sold to Vendor</SelectItem>
                        <SelectItem value="disposed">Disposed / Dumped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newScrap.saleStatus === "sold" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="scVal">Sale Value (₹) *</Label>
                        <Input id="scVal" type="number" placeholder="45000" value={newScrap.saleValue} onChange={e => setNewScrap({...newScrap, saleValue: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="scBuyer">Buyer / Vendor Name *</Label>
                        <Input id="scBuyer" placeholder="Apex Recyclers" value={newScrap.buyerName} onChange={e => setNewScrap({...newScrap, buyerName: e.target.value})} required />
                      </div>
                    </>
                  )}
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="scRemarks">Remarks / Notes</Label>
                    <Input id="scRemarks" placeholder="Generated from beams cutting at Tower A." value={newScrap.remarks} onChange={e => setNewScrap({...newScrap, remarks: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Log Scrap Record</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Steel Scrap Generated" value={`${totalSteelTons.toFixed(2)} tons`} subtitle="total logged steel waste" icon={Recycle} colorClass="bg-slate-50 text-slate-500" />
        <KPICard title="Scrap Sales Revenue" value={`₹${scrapSalesRevenue.toLocaleString()}`} subtitle="total cash generated" icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600" />
        <KPICard title="Stored Scrap Lots" value={storedScrapCount.toString()} subtitle="awaiting sale / dispatch" icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by scrap type, buyer, remarks..."
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
                <SelectItem value="stored">Stored in Yard</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="disposed">Disposed / Dumped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Scrap Register</CardTitle>
          <CardDescription>Track scrap inventory and sales. Click edit to record sales value for stored scrap.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Date</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Source Site</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Scrap Type</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Quantity</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Sales Value (₹)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Buyer Name</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Remarks</TableHead>
                  <TableHead className="w-24 text-right font-bold text-slate-700 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">Loading records...</TableCell></TableRow>
                ) : paginatedScraps.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">No scrap records logged.</TableCell></TableRow>
                ) : (
                  paginatedScraps.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-medium">{item.site?.name || "N/A"}</TableCell>
                      <TableCell className="text-xs font-semibold">{item.materialType}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">{item.quantity} {item.unit}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.saleStatus === "sold" ? "secondary" : "outline"}
                          className={`text-[10px] uppercase font-bold ${
                            item.saleStatus === "sold" ? "bg-green-100 text-green-800 border-green-200" :
                            item.saleStatus === "disposed" ? "bg-slate-100 text-slate-800 border-slate-200" :
                            "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          {item.saleStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {item.saleValue ? `₹${item.saleValue.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{item.buyerName || "-"}</TableCell>
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
                Showing page {currentPage} of {totalPages} ({filteredScraps.length} total entries)
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
            <DialogTitle>Edit Scrap Details</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Source Site *</Label>
                  <Select value={editingItem.siteId} onValueChange={v => setEditingItem({...editingItem, siteId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Scrap Type *</Label>
                  <Select value={editingItem.materialType} onValueChange={v => setEditingItem({...editingItem, materialType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Steel Rebar">Steel Rebar Scrap</SelectItem>
                      <SelectItem value="Concrete Waste">Concrete Waste</SelectItem>
                      <SelectItem value="Wood/Ply">Plywood & Timber Scrap</SelectItem>
                      <SelectItem value="Copper/Electrical">Copper & Wiring Scrap</SelectItem>
                      <SelectItem value="Cement Bags">Empty Cement Bags</SelectItem>
                      <SelectItem value="Plastic/Pipes">PVC & Plastic Waste</SelectItem>
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
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Sale Status *</Label>
                  <Select value={editingItem.saleStatus} onValueChange={v => setEditingItem({...editingItem, saleStatus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stored">Stored in Yard</SelectItem>
                      <SelectItem value="sold">Sold to Vendor</SelectItem>
                      <SelectItem value="disposed">Disposed / Dumped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingItem.saleStatus === "sold" && (
                  <>
                    <div className="space-y-1">
                      <Label>Sale Value (₹) *</Label>
                      <Input type="number" value={editingItem.saleValue} onChange={e => setEditingItem({...editingItem, saleValue: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Buyer / Vendor Name *</Label>
                      <Input value={editingItem.buyerName} onChange={e => setEditingItem({...editingItem, buyerName: e.target.value})} required />
                    </div>
                  </>
                )}
                <div className="space-y-1 col-span-2">
                  <Label>Remarks / Notes</Label>
                  <Input value={editingItem.remarks} onChange={e => setEditingItem({...editingItem, remarks: e.target.value})} />
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

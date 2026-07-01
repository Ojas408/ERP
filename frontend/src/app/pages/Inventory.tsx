import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Upload, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  ArrowRightLeft
} from "lucide-react"
import { 
  fetchInventory, 
  createInventoryItem, 
  deleteRecord, 
  updateRecord, 
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

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [filterLowStock, setFilterLowStock] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Form State
  const [newItem, setNewItem] = useState({
    itemName: "",
    quantity: "",
    unit: "pcs",
    minThreshold: "10",
    price: "",
    category: ""
  })
  
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // Stock Adjustment Form State
  const [adjustment, setAdjustment] = useState({
    itemId: "",
    type: "in", // in, out, transfer
    quantity: "",
    notes: ""
  })

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadInventory()
    loadMasters()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const data = await fetchInventory()
      setInventory(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load inventory:", error)
      toast.error("Failed to load inventory logs")
    } finally {
      setLoading(false)
    }
  }

  const loadMasters = async () => {
    try {
      const [cats, units] = await Promise.all([
        fetchRecords("masters/material-categories"),
        fetchRecords("masters/uoms")
      ])
      setCategories(Array.isArray(cats) ? cats : [])
      setUoms(Array.isArray(units) ? units : [])
      
      if (cats.length > 0) {
        setNewItem(prev => ({ ...prev, category: cats[0].name }))
      }
      if (units.length > 0) {
        setNewItem(prev => ({ ...prev, unit: units[0].code }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createInventoryItem({
        ...newItem,
        quantity: parseFloat(newItem.quantity),
        minThreshold: parseFloat(newItem.minThreshold),
        price: parseFloat(newItem.price || "0")
      })
      toast.success("Inventory item added successfully")
      setIsAddOpen(false)
      setNewItem({
        itemName: "",
        quantity: "",
        unit: uoms[0]?.code || "pcs",
        minThreshold: "10",
        price: "",
        category: categories[0]?.name || "General"
      })
      loadInventory()
    } catch (error) {
      toast.error("Failed to create inventory item")
    }
  }

  // Edit Item
  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      quantity: String(item.quantity),
      minThreshold: String(item.minThreshold),
      price: String(item.price || "0")
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('inventory', editingItem.id, {
        ...editingItem,
        quantity: parseFloat(editingItem.quantity),
        minThreshold: parseFloat(editingItem.minThreshold),
        price: parseFloat(editingItem.price || "0")
      })
      toast.success("Inventory record updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadInventory()
    } catch (error) {
      toast.error("Failed to update inventory record")
    }
  }

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return
    try {
      await deleteRecord('inventory', id)
      toast.success("Inventory item deleted")
      loadInventory()
    } catch (error) {
      toast.error("Failed to delete inventory record")
    }
  }

  // Quick Stock Adjustment In/Out/Transfer
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetItem = inventory.find(i => i.id === adjustment.itemId)
    if (!targetItem) return

    const qtyVal = parseFloat(adjustment.quantity)
    let newQty = targetItem.quantity

    if (adjustment.type === "in") {
      newQty += qtyVal
    } else if (adjustment.type === "out") {
      if (targetItem.quantity < qtyVal) {
        toast.error("Insufficient stock quantity")
        return
      }
      newQty -= qtyVal
    }

    try {
      await updateRecord('inventory', targetItem.id, {
        ...targetItem,
        quantity: newQty
      })
      toast.success("Stock adjustment successfully saved")
      setIsAdjustOpen(false)
      setAdjustment({ itemId: "", type: "in", quantity: "", notes: "" })
      loadInventory()
    } catch (err) {
      toast.error("Failed to adjust inventory stock")
    }
  }

  // Export SheetJS Excel
  const handleExportExcel = () => {
    const data = filteredInventory.map((item, idx) => ({
      "S.No": idx + 1,
      "Material Name": item.itemName,
      "Category": item.category || "General",
      "Quantity": item.quantity || 0,
      "Unit": item.unit,
      "Min Threshold": item.minThreshold || 0,
      "Price (Unit)": item.price || 0,
      "Total Value": (item.price || 0) * (item.quantity || 0)
    }))
    exportToExcel(data, "Inventory_Ledger", "Inventory")
  }

  // Print PDF report
  const handlePrintReport = () => {
    const headers = ["Material Name", "Category", "Quantity", "Unit", "Min Threshold", "Unit Price", "Value"]
    const rows = filteredInventory.map(item => [
      item.itemName,
      item.category || "-",
      String(item.quantity),
      item.unit,
      String(item.minThreshold),
      `₹${(item.price || 0).toLocaleString()}`,
      `₹${((item.price || 0) * (item.quantity || 0)).toLocaleString()}`
    ])
    printReport("Inventory & Stock Valuation Report", headers, rows)
  }

  // Template Download UOM
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["itemName", "category", "quantity", "unit", "minThreshold", "price"],
      "inventory_import_template"
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
        itemName: String(r.itemName),
        category: String(r.category || "General"),
        quantity: String(r.quantity || "0"),
        unit: String(r.unit || "pcs"),
        minThreshold: String(r.minThreshold || "10"),
        price: String(r.price || "0")
      }))

      await createInventoryItem(recordsToImport)
      toast.success(`Imported ${recordsToImport.length} inventory items successfully`)
      loadInventory()
    } catch (error) {
      toast.error("Import failed: check columns and format")
    }
  }

  // Client side filters
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLowStock = !filterLowStock || item.quantity < item.minThreshold

    return matchesSearch && matchesCategory && matchesLowStock
  })

  // Pagination slice
  const totalPages = Math.ceil(filteredInventory.length / pageSize)
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Calculations
  const totalItemsCount = inventory.length
  const lowStockCount = inventory.filter(item => item.quantity < item.minThreshold).length
  const totalValuation = inventory.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)

  return (
    <div className="space-y-6">
      {lowStockCount > 0 && (
        <div className="bg-red-500 text-white p-3.5 rounded-md flex items-center justify-between shadow-sm text-xs font-semibold">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
            <span>Warning: {lowStockCount} inventory material{lowStockCount > 1 ? 's are' : ' is'} below minimum threshold triggers. Please raise Purchase Orders.</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Inventory & Materials</h1>
          <p className="text-sm text-muted-foreground">Manage storage logs, stock balances, consumption transfers, and templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadInventory}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Quick Adjustment dialog */}
          <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs h-9">
                <ArrowRightLeft className="h-4 w-4 mr-2 text-blue-600" />
                Stock Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock Transaction Log</DialogTitle>
                <DialogDescription>Record a quick stock adjustment (Inward check-in or Outward release)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdjustmentSubmit} className="space-y-4 py-2 text-xs">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="adj-item">Select Material</Label>
                    <Select value={adjustment.itemId} onValueChange={v => setAdjustment({...adjustment, itemId: v})}>
                      <SelectTrigger id="adj-item"><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>
                        {inventory.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.itemName} (Available: {item.quantity} {item.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adj-type">Transaction Type</Label>
                    <Select value={adjustment.type} onValueChange={v => setAdjustment({...adjustment, type: v})}>
                      <SelectTrigger id="adj-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Stock In (Inward / Purchase)</SelectItem>
                        <SelectItem value="out">Stock Out (Outward / Disposal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adj-qty">Transaction Quantity</Label>
                    <Input id="adj-qty" type="number" placeholder="100" value={adjustment.quantity} onChange={e => setAdjustment({...adjustment, quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adj-notes">Notes / References</Label>
                    <Input id="adj-notes" placeholder="e.g. Received from Supplier Supreme Cement" value={adjustment.notes} onChange={e => setAdjustment({...adjustment, notes: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                  <Button type="submit">Log Transaction</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Material Master</DialogTitle>
                <DialogDescription>Register a new material item type in the stores</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="name">Material Name</Label>
                    <Input id="name" placeholder="e.g. Portland Cement (Grade 43)" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                        {categories.length === 0 && <SelectItem value="Cement & Concrete">Cement & Concrete</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="unit">Unit of Measure (UOM)</Label>
                    <Select value={newItem.unit} onValueChange={v => setNewItem({...newItem, unit: v})}>
                      <SelectTrigger id="unit"><SelectValue placeholder="Select UOM" /></SelectTrigger>
                      <SelectContent>
                        {uoms.map(u => (
                          <SelectItem key={u.id} value={u.code}>{u.name} ({u.code})</SelectItem>
                        ))}
                        {uoms.length === 0 && <SelectItem value="pcs">Pieces (pcs)</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty">Initial Quantity</Label>
                    <Input id="qty" type="number" placeholder="1000" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="min">Minimum Threshold</Label>
                    <Input id="min" type="number" placeholder="100" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: e.target.value})} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="price">Price Per Unit (₹)</Label>
                    <Input id="price" type="number" placeholder="420" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Material</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Materials" value={totalItemsCount.toString()} subtitle="Unique catalogs" icon={Package} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Low Stock Alerts" value={lowStockCount.toString()} subtitle="Restocking required" icon={AlertTriangle} colorClass="bg-red-100 dark:bg-red-900/30" />
        <KPICard title="Total Stock Value" value={`₹${totalValuation.toLocaleString()}`} subtitle="Valuation sum" icon={DollarSign} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Category Indices" value={categories.length.toString()} subtitle="Master groups" icon={TrendingUp} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Materials Table Card */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 gap-4">
          <div>
            <CardTitle>Materials Inventory Ledger</CardTitle>
            <CardDescription>Monitor stock balances, unit pricing values, and low stock thresholds</CardDescription>
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
            <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handlePrintReport}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print / PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search material name..."
                className="pl-9 text-xs h-9"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Category Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  {categories.length === 0 && <SelectItem value="Cement & Concrete">Cement & Concrete</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                variant={filterLowStock ? "destructive" : "outline"}
                className="text-xs h-9 w-full"
                onClick={() => { setFilterLowStock(!filterLowStock); setCurrentPage(1); }}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                {filterLowStock ? "Filtering Low Stock" : "Show Low Stock Alerts"}
              </Button>
            </div>
            <div>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Page Size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Available Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Min. Threshold</TableHead>
                  <TableHead>Price Per Unit</TableHead>
                  <TableHead>Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                      Loading stores inventory...
                    </TableCell>
                  </TableRow>
                ) : paginatedInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                      No materials found matching search or alert filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInventory.map((item) => {
                    const isLow = item.quantity < item.minThreshold
                    return (
                      <TableRow key={item.id} className={isLow ? "bg-red-50/20 dark:bg-red-950/5" : ""}>
                        <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{item.itemName}</TableCell>
                        <TableCell className="text-xs">{item.category || "General"}</TableCell>
                        <TableCell className={`text-xs font-bold ${isLow ? 'text-destructive font-bold' : ''}`}>{item.quantity}</TableCell>
                        <TableCell className="text-xs font-mono">
                          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900">{item.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.minThreshold}</TableCell>
                        <TableCell className="text-xs">₹{(item.price || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-semibold">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="text-[9px] h-5 py-0 uppercase">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] h-5 py-0 uppercase bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">Optimal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
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
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredInventory.length} materials)
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

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Material Record</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Material Name</Label>
                  <Input value={editingItem.itemName} onChange={e => setEditingItem({...editingItem, itemName: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={editingItem.category || ""} onValueChange={v => setEditingItem({...editingItem, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                      {categories.length === 0 && <SelectItem value="Cement & Concrete">Cement & Concrete</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Unit of Measure</Label>
                  <Select value={editingItem.unit || ""} onValueChange={v => setEditingItem({...editingItem, unit: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {uoms.map(u => (
                        <SelectItem key={u.id} value={u.code}>{u.name} ({u.code})</SelectItem>
                      ))}
                      {uoms.length === 0 && <SelectItem value="pcs">Pieces (pcs)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Available Stock Quantity</Label>
                  <Input type="number" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Minimum Alert Threshold</Label>
                  <Input type="number" value={editingItem.minThreshold} onChange={e => setEditingItem({...editingItem, minThreshold: e.target.value})} required />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Price Per Unit (₹)</Label>
                  <Input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} required />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Record</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["itemName", "category", "quantity", "unit", "minThreshold", "price"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.itemName) errs.push(`Row ${i + 1}: itemName is required`)
          if (!row.quantity) errs.push(`Row ${i + 1}: quantity is required`)
          if (!row.price) errs.push(`Row ${i + 1}: price is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Materials Preview"
      />
    </div>
  )
}

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Factory, TrendingUp, Target, Activity, Upload, Download, Plus, Edit, Trash2, Eye, RefreshCw, FileSpreadsheet, Settings2 } from "lucide-react"
import { fetchProductions, createProduction, fetchSites, fetchRmcGrades, deleteRecord, updateRecord, fetchCustomColumns } from "../services/api"
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
import { ManageColumnsModal } from "../components/ManageColumnsModal"

export default function Production() {
  const [productions, setProductions] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [rmcGrades, setRmcGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newProd, setNewProd] = useState({
    siteId: "",
    date: new Date().toISOString().slice(0, 16),
    amount: "",
    unit: "cum",
    grade: "",
    productionType: "Transit Mixture",
    notes: "",
    quality: "",
    towerName: "",
    isRejected: false,
    rejectionReason: "",
    customData: {} as Record<string, any>
  })

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [customCols, setCustomCols] = useState<any[]>([])
  const [isManageColsOpen, setIsManageColsOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [prodData, siteData, gradeData, colsData] = await Promise.all([
        fetchProductions(),
        fetchSites(),
        fetchRmcGrades(),
        fetchCustomColumns("Production")
      ])
      setProductions(Array.isArray(prodData) ? prodData : [])
      setSites(Array.isArray(siteData) ? siteData : [])
      setRmcGrades(Array.isArray(gradeData) ? gradeData : [])
      setCustomCols(Array.isArray(colsData) ? colsData : [])
    } catch (error) {
      console.error("Failed to load production data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduction({
        ...newProd,
        amount: parseFloat(newProd.amount) || 0,
        quality: newProd.grade || newProd.quality,
        date: new Date(newProd.date).toISOString()
      })
      setIsAddOpen(false)
      setNewProd({
        siteId: "",
        date: new Date().toISOString().slice(0, 16),
        amount: "",
        unit: "cum",
        grade: "",
        productionType: "Transit Mixture",
        notes: "",
        quality: "",
        towerName: "",
        isRejected: false,
        rejectionReason: ""
      })
      loadData()
    } catch (error) {
      console.error("Failed to add production:", error)
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: item.date ? new Date(item.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      amount: String(item.amount || 0),
      grade: item.grade || item.quality || "",
      productionType: item.productionType || "",
      quality: item.quality || "",
      towerName: item.towerName || "",
      isRejected: item.isRejected || false,
      rejectionReason: item.rejectionReason || "",
      customData: item.customData || {}
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('production', editingItem.id, {
        siteId: editingItem.siteId,
        date: new Date(editingItem.date).toISOString(),
        amount: parseFloat(editingItem.amount) || 0,
        unit: editingItem.unit,
        notes: editingItem.notes,
        quality: editingItem.grade || editingItem.quality,
        grade: editingItem.grade,
        productionType: editingItem.productionType,
        towerName: editingItem.towerName,
        isRejected: editingItem.isRejected,
        rejectionReason: editingItem.rejectionReason,
        customData: editingItem.customData
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error("Failed to update production:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return
    try {
      await deleteRecord('production', id)
      loadData()
    } catch (error) {
      console.error("Failed to delete production:", error)
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["date", "siteId", "amount", "unit", "grade", "productionType", "towerName", "notes", "isRejected", "rejectionReason", ...customCols.map(c => c.key)],
      "production_import_template"
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
        siteId: String(row.siteId || ""),
        date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
        amount: parseFloat(row.amount) || 0,
        unit: String(row.unit || "cum"),
        grade: String(row.grade || ""),
        quality: String(row.grade || ""),
        productionType: String(row.productionType || "Transit Mixture"),
        towerName: String(row.towerName || ""),
        notes: String(row.notes || ""),
        isRejected: String(row.isRejected || "false").toLowerCase() === "true",
        rejectionReason: String(row.rejectionReason || ""),
        customData: customCols.reduce((acc: any, col: any) => ({ ...acc, [col.key]: row[col.key] }), {})
      }))
      
      for (const item of formatted) {
        await createProduction(item)
      }
      
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      console.error("Import failed.", err)
    }
  }

  const handleExportExcel = () => {
    const data = safeProductions.map(p => ({
      date: new Date(p.date).toLocaleString(),
      site: p.site?.name || 'N/A',
      building: p.towerName || "-",
      type: p.productionType || "General",
      quantity: p.amount || 0,
      unit: p.unit,
      grade: p.grade || p.quality || "-",
      status: p.isRejected ? "Rejected" : ((p.amount || 0) >= 500 ? "Target Met" : "Below Target"),
      rejectionReason: p.rejectionReason || "",
      notes: p.notes || "",
      ...(p.customData || {})
    }))
    exportToExcel(data, "production_report")
  }

  // Defensive calculations
  const safeProductions = Array.isArray(productions) ? productions : []
  const safeSites = Array.isArray(sites) ? sites : []

  const chartData = safeProductions.map(p => ({
    date: new Date(p.date).toLocaleDateString(),
    production: p.amount || 0,
    target: 500
  })).reverse()

  const productionByMachine = safeSites.map(site => ({
    name: site.name,
    production: safeProductions.filter(p => p.siteId === site.id).reduce((acc, p) => acc + (p.amount || 0), 0)
  }))

  const shiftProduction = [
    { name: 'Day Shift', value: safeProductions.length * 0.6 },
    { name: 'Night Shift', value: safeProductions.length * 0.4 },
  ]

  const productTypes = Array.from(new Set(safeProductions.map(p => p.unit))).map((unit, idx) => ({
    id: idx,
    product: unit,
    quantity: safeProductions.filter(p => p.unit === unit).reduce((acc, p) => acc + (p.amount || 0), 0),
    unit: unit,
    revenue: "₹" + (safeProductions.filter(p => p.unit === unit).reduce((acc, p) => acc + (p.amount || 0), 0) * 1200).toLocaleString()
  }))

  const avgProduction = safeProductions.length > 0 
    ? safeProductions.reduce((acc, p) => acc + (p.amount || 0), 0) / safeProductions.length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Production Report</h1>
          <p className="text-sm text-muted-foreground">
            Daily production monitoring and target tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={() => setIsManageColsOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Columns
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
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Production Entry</DialogTitle>
                <DialogDescription>Record daily output for a specific site</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="site">Production Site</Label>
                    <Select value={newProd.siteId} onValueChange={v => setNewProd({...newProd, siteId: v})}>
                      <SelectTrigger id="site">
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeSites.map(site => (
                          <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date & Time *</Label>
                    <Input id="date" type="datetime-local" value={newProd.date} onChange={e => setNewProd({...newProd, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prodType">Production Type</Label>
                    <Select value={newProd.productionType} onValueChange={v => setNewProd({...newProd, productionType: v})}>
                      <SelectTrigger id="prodType"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transit Mixture">Transit Mixture</SelectItem>
                        <SelectItem value="Slabs">Slabs</SelectItem>
                        <SelectItem value="Column">Column</SelectItem>
                        <SelectItem value="Foundation">Foundation</SelectItem>
                        <SelectItem value="Beam">Beam</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Quantity ({newProd.unit}) *</Label>
                    <Input id="amount" type="number" placeholder="0.00" value={newProd.amount} onChange={e => setNewProd({...newProd, amount: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newProd.unit} onValueChange={v => setNewProd({...newProd, unit: v})}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cum">Cu.M (cum)</SelectItem>
                        <SelectItem value="sqm">Sq.M (slabs)</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">RMC Grade *</Label>
                    <Select value={newProd.grade} onValueChange={v => setNewProd({...newProd, grade: v})}>
                      <SelectTrigger id="grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {rmcGrades.map(g => (
                          <SelectItem key={g.id} value={g.grade}>{g.grade} {g.description ? `- ${g.description}` : ''}</SelectItem>
                        ))}
                        <SelectItem value="M20">M20</SelectItem>
                        <SelectItem value="M25">M25</SelectItem>
                        <SelectItem value="M30">M30</SelectItem>
                        <SelectItem value="M35">M35</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tower">Site / Building Name</Label>
                    <Input id="tower" placeholder="Tower B, Slab 3, Block A" value={newProd.towerName} onChange={e => setNewProd({...newProd, towerName: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2 flex items-center gap-2 pt-2">
                    <input
                      id="isRejected"
                      type="checkbox"
                      checked={newProd.isRejected}
                      onChange={e => setNewProd({...newProd, isRejected: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="isRejected" className="font-semibold text-red-600">Mark entry as REJECTED</Label>
                  </div>
                  {newProd.isRejected && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="rejectionReason" className="text-red-500 font-medium">Rejection Reason *</Label>
                      <Input id="rejectionReason" placeholder="Failed slump test / dimensions mismatch" value={newProd.rejectionReason} onChange={e => setNewProd({...newProd, rejectionReason: e.target.value})} required />
                    </div>
                  )}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notes / Remarks</Label>
                    <Input id="notes" placeholder="Casting completed successfully." value={newProd.notes} onChange={e => setNewProd({...newProd, notes: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Entry</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Avg Production"
          value={avgProduction.toFixed(1)}
          subtitle="tons per day"
          icon={Factory}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 4.2, isPositive: true }}
        />
        <KPICard
          title="Monthly Trend"
          value="+12%"
          subtitle="vs last month"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Site Performance"
          value="94%"
          subtitle="avg efficiency"
          icon={Target}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
        <KPICard
          title="System Health"
          value="Optimal"
          subtitle="all sites online"
          icon={Activity}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Production Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production Trend</CardTitle>
            <CardDescription>Daily production vs 500 tons target</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" className="text-[10px]" />
                <YAxis className="text-[10px]" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="production" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={2} name="Actual" />
                <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Target" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Site Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Site-wise Output</CardTitle>
            <CardDescription>Total production by location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionByMachine} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" className="text-[10px]" width={100} />
                <Tooltip />
                <Bar dataKey="production" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Output" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Details */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Breakdown</CardTitle>
            <CardDescription>Day vs Night shift performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              {shiftProduction.map((shift, i) => (
                <div key={shift.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{shift.name}</span>
                    <span className="text-muted-foreground">{Math.round((shift.value / (safeProductions.length || 1)) * 100)}%</span>
                  </div>
                  <Progress value={(shift.value / (safeProductions.length || 1)) * 100} className={i === 0 ? "bg-blue-100" : "bg-orange-100"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Details Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product-wise Output</CardTitle>
            <CardDescription>Detailed breakdown by product type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTypes.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-xs font-medium">{product.product}</TableCell>
                      <TableCell className="text-xs">{product.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{product.unit}</TableCell>
                      <TableCell className="text-xs">{product.revenue}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Production Log</CardTitle>
          <CardDescription>Latest daily production entries from all sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Grade</TableHead>
                  {customCols.map(c => (
                    <TableHead key={c.id}>{c.name}</TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeProductions.map((item) => (
                  <TableRow key={item.id} className={item.isRejected ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                    <TableCell className="text-xs">{new Date(item.date).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium">{item.site?.name || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{item.towerName || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[9px]">{item.productionType || "General"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{(item.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono">{item.unit}</TableCell>
                    <TableCell className="text-xs font-medium">{item.grade || item.quality || "-"}</TableCell>
                    {customCols.map(c => (
                      <TableCell key={c.id} className="text-xs">{item.customData?.[c.key] || "-"}</TableCell>
                    ))}
                    <TableCell>
                      {item.isRejected ? (
                        <Badge variant="destructive" className="text-[9px] h-5 uppercase font-bold" title={item.rejectionReason}>
                          Rejected: {item.rejectionReason}
                        </Badge>
                      ) : (
                        <Badge variant={(item.amount || 0) >= 500 ? "secondary" : "outline"} className="text-[9px] h-5">
                          {(item.amount || 0) >= 500 ? "Target Met" : "Below Target"}
                        </Badge>
                      )}
                    </TableCell>
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
            <DialogTitle>Edit Production Entry</DialogTitle>
            <DialogDescription>Update production data for this entry</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-site">Production Site</Label>
                  <Select value={editingItem.siteId} onValueChange={v => setEditingItem({...editingItem, siteId: v})}>
                    <SelectTrigger id="edit-site">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {safeSites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date & Time *</Label>
                  <Input id="edit-date" type="datetime-local" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Quantity *</Label>
                  <Input id="edit-amount" type="number" value={editingItem.amount} onChange={e => setEditingItem({...editingItem, amount: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prodType">Production Type</Label>
                  <Select value={editingItem.productionType || "Transit Mixture"} onValueChange={v => setEditingItem({...editingItem, productionType: v})}>
                    <SelectTrigger id="edit-prodType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transit Mixture">Transit Mixture</SelectItem>
                      <SelectItem value="Slabs">Slabs</SelectItem>
                      <SelectItem value="Column">Column</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Beam">Beam</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Select value={editingItem.unit} onValueChange={v => setEditingItem({...editingItem, unit: v})}>
                    <SelectTrigger id="edit-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cum">Cu.M (cum)</SelectItem>
                      <SelectItem value="sqm">Sq.M (slabs)</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-grade">RMC Grade</Label>
                  <Select value={editingItem.grade || ""} onValueChange={v => setEditingItem({...editingItem, grade: v})}>
                    <SelectTrigger id="edit-grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {rmcGrades.map(g => (
                        <SelectItem key={g.id} value={g.grade}>{g.grade}</SelectItem>
                      ))}
                      <SelectItem value="M20">M20</SelectItem>
                      <SelectItem value="M25">M25</SelectItem>
                      <SelectItem value="M30">M30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tower">Site / Building Name</Label>
                  <Input id="edit-tower" value={editingItem.towerName} onChange={e => setEditingItem({...editingItem, towerName: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2 flex items-center gap-2 pt-2">
                  <input
                    id="edit-isRejected"
                    type="checkbox"
                    checked={editingItem.isRejected}
                    onChange={e => setEditingItem({...editingItem, isRejected: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="edit-isRejected" className="font-semibold text-red-600">Mark entry as REJECTED</Label>
                </div>
                {editingItem.isRejected && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-rejectionReason" className="text-red-500 font-medium">Rejection Reason *</Label>
                    <Input id="edit-rejectionReason" value={editingItem.rejectionReason} onChange={e => setEditingItem({...editingItem, rejectionReason: e.target.value})} required />
                  </div>
                )}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-notes">Notes / Remarks</Label>
                  <Input id="edit-notes" value={editingItem.notes || ""} onChange={e => setEditingItem({...editingItem, notes: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Entry</Button>
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
        headers={["date", "siteId", "amount", "unit", "grade", "productionType", "towerName", "notes", "isRejected", "rejectionReason"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.amount || isNaN(parseFloat(row.amount))) errs.push(`Row ${i + 1}: amount must be a number`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Production Records"
      />
      <ManageColumnsModal
        isOpen={isManageColsOpen}
        onClose={() => setIsManageColsOpen(false)}
        entityName="Production"
        onColumnsChange={loadData}
      />
    </div>
  )
}

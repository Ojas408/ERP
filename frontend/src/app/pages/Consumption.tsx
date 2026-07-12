import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Fuel, Package, Hammer, Mountain, Plus, Edit, Trash2, RefreshCw, Download, Upload, FileSpreadsheet , Settings2 } from "lucide-react"
import { fetchConsumptions, createConsumption, fetchSites, deleteRecord, updateRecord , fetchCustomColumns } from "../services/api"
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

export default function Consumption() {
  const [consumptions, setConsumptions] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newCons, setNewCons] = useState({
    material: "Diesel",
    amount: "",
    unit: "Liters",
    siteId: "",
    date: new Date().toISOString().split('T')[0],
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
      const [consData, siteData, colsData] = await Promise.all([
        fetchConsumptions(),
        fetchSites(),
        fetchCustomColumns("Consumption")
      ])
      setConsumptions(Array.isArray(consData) ? consData : [])
      setSites(Array.isArray(siteData) ? siteData : [])
      setCustomCols(Array.isArray(colsData) ? colsData : [])
    } catch (error) {
      console.error("Failed to load consumption data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createConsumption({
        ...newCons,
        amount: parseFloat(newCons.amount) || 0
      })
      setIsAddOpen(false)
      setNewCons({
        material: "Diesel",
        amount: "",
        unit: "Liters",
        siteId: "",
        date: new Date().toISOString().split('T')[0],
        isRejected: false,
        rejectionReason: ""
      })
      loadData()
    } catch (error) {
      console.error("Failed to add consumption:", error)
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: new Date(item.date).toISOString().split('T')[0],
      amount: String(item.amount || 0),
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
      await updateRecord('consumption', editingItem.id, {
        ...editingItem,
        amount: parseFloat(editingItem.amount) || 0
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error("Failed to update consumption:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteRecord('consumption', id)
      loadData()
    } catch (error) {
      console.error("Failed to delete consumption:", error)
    }
  }

  const getMaterialTotal = (material: string) => {
    return consumptions
      .filter(c => c.material.toLowerCase() === material.toLowerCase())
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["date", "material", "amount", "unit", "siteId", "isRejected", "rejectionReason"],
      "consumption_import_template"
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
        date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
        material: String(row.material || "Diesel"),
        amount: parseFloat(row.amount) || 0,
        unit: String(row.unit || "Liters"),
        siteId: String(row.siteId || ""),
        isRejected: String(row.isRejected || "false").toLowerCase() === "true",
        rejectionReason: String(row.rejectionReason || ""),
      customData: customCols.reduce((acc: any, col: any) => ({ ...acc, [col.key]: row[col.key] }), {})
      }))
      
      // Loop to create each one
      for (const item of formatted) {
        await createConsumption(item)
      }
      
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      console.error("Import failed.", err)
    }
  }

  const handleExportExcel = () => {
    const data = consumptions.map(c => ({
      date: new Date(c.date).toLocaleDateString(),
      material: c.material,
      amount: c.amount,
      unit: c.unit,
      site: c.site?.name || 'N/A',
      status: c.isRejected ? "Wasted / Rejected" : "Consumed",
      rejectionReason: c.rejectionReason || ""
    }))
    exportToExcel(data, "consumption_report")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Consumption Report</h1>
          <p className="text-sm text-muted-foreground">Material and fuel consumption tracking</p>
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
              <Button className="text-xs h-9"><Plus className="h-4 w-4 mr-2" />Add Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Consumption Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select value={newCons.material} onValueChange={v => setNewCons({...newCons, material: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="Cement">Cement</SelectItem>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Aggregates">Aggregates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Amount</Label><Input type="number" value={newCons.amount} onChange={e => setNewCons({...newCons, amount: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Unit</Label><Input value={newCons.unit} onChange={e => setNewCons({...newCons, unit: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={newCons.date} onChange={e => setNewCons({...newCons, date: e.target.value})} required /></div>
                  <div className="space-y-2 col-span-2">
                    <Label>Site</Label>
                    <Select value={newCons.siteId} onValueChange={v => setNewCons({...newCons, siteId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2 flex items-center gap-2 pt-2">
                    <input
                      id="cons-isRejected"
                      type="checkbox"
                      checked={newCons.isRejected}
                      onChange={e => setNewCons({...newCons, isRejected: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="cons-isRejected" className="font-semibold text-red-600">Mark consumption as WASTED / REJECTED</Label>
                  </div>
                  {newCons.isRejected && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cons-rejectionReason" className="text-red-500 font-medium">Rejection / Waste Reason *</Label>
                      <Input id="cons-rejectionReason" placeholder="Spillage / Expired cement / Damaged steel" value={newCons.rejectionReason} onChange={e => setNewCons({...newCons, rejectionReason: e.target.value})} required />
                    </div>
                  )}
                </div>
                <DialogFooter><Button type="submit">Add Entry</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Diesel" value={getMaterialTotal("Diesel").toLocaleString()} subtitle="liters" icon={Fuel} colorClass="bg-orange-100 dark:bg-orange-900/30" />
        <KPICard title="Cement Used" value={getMaterialTotal("Cement").toLocaleString()} subtitle="bags" icon={Package} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Steel Used" value={getMaterialTotal("Steel").toLocaleString()} subtitle="tons" icon={Hammer} colorClass="bg-red-100 dark:bg-red-900/30" />
        <KPICard title="Aggregates" value={getMaterialTotal("Aggregates").toLocaleString()} subtitle="tons" icon={Mountain} colorClass="bg-green-100 dark:bg-green-900/30" />
      </div>

      <Card>
        <CardHeader><CardTitle>Consumption Records</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Site</TableHead>
                  {customCols.map(c => (
                    <TableHead key={c.id}>{c.name}</TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptions.map((item) => (
                  <TableRow key={item.id} className={item.isRejected ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                    <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-medium">{item.material}</TableCell>
                    <TableCell className="text-xs">{(item.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{item.unit}</TableCell>
                    <TableCell className="text-xs">{item.site?.name || 'N/A'}</TableCell>
                    {customCols.map(c => (
                      <TableCell key={c.id} className="text-xs">{item.customData?.[c.key] || "-"}</TableCell>
                    ))}
                    <TableCell>
                      {item.isRejected ? (
                        <Badge variant="destructive" className="text-[9px] h-5 uppercase font-bold" title={item.rejectionReason}>
                          Wasted / Rejected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5 bg-green-50 text-green-700 border-green-200">
                          Consumed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Edit Consumption</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={editingItem.material} onValueChange={v => setEditingItem({...editingItem, material: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Cement">Cement</SelectItem>
                      <SelectItem value="Steel">Steel</SelectItem>
                      <SelectItem value="Aggregates">Aggregates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Amount</Label><Input type="number" value={editingItem.amount} onChange={e => setEditingItem({...editingItem, amount: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Unit</Label><Input value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required /></div>
                <div className="space-y-2 col-span-2">
                  <Label>Site</Label>
                  <Select value={editingItem.siteId} onValueChange={v => setEditingItem({...editingItem, siteId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2 flex items-center gap-2 pt-2">
                  <input
                    id="edit-cons-isRejected"
                    type="checkbox"
                    checked={editingItem.isRejected}
                    onChange={e => setEditingItem({...editingItem, isRejected: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="edit-cons-isRejected" className="font-semibold text-red-600">Mark consumption as WASTED / REJECTED</Label>
                </div>
                {editingItem.isRejected && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-cons-rejectionReason" className="text-red-500 font-medium">Rejection / Waste Reason *</Label>
                    <Input id="edit-cons-rejectionReason" value={editingItem.rejectionReason} onChange={e => setEditingItem({...editingItem, rejectionReason: e.target.value})} required />
                  </div>
                )}
              </div>
              <DialogFooter><Button type="submit">Update Entry</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["date", "material", "amount", "unit", "siteId", "isRejected", "rejectionReason"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.material) errs.push(`Row ${i + 1}: material is required`)
          if (!row.amount || isNaN(parseFloat(row.amount))) errs.push(`Row ${i + 1}: amount must be a number`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Consumption Records"
      />
    </div>
  )
}

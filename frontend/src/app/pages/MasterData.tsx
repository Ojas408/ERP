import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  Building2, 
  MapPin, 
  Tags, 
  Truck, 
  Banknote, 
  Scale, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download, 
  Upload, 
  Search, 
  Eye, 
  Printer 
} from "lucide-react"
import { fetchRecords, createRecord, updateRecord, deleteRecord } from "../services/api"
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

// Type definition for a master tab config
interface MasterTabConfig {
  id: string
  label: string
  icon: any
  endpoint: string
  headers: string[]
  templateHeaders: string[]
  validationRules: (row: any, index: number) => string[]
}

export default function MasterData() {
  const [activeTab, setActiveTab] = useState("sites")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // CRUD states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Form input states
  const [formName, setFormName] = useState("")
  const [formLocation, setFormLocation] = useState("") // for site
  const [formStatus, setFormStatus] = useState("active") // for site
  const [formCode, setFormCode] = useState("") // for UOM

  // Bulk Import states
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Configure master lookup settings
  const tabConfigs: Record<string, MasterTabConfig> = {
    sites: {
      id: "sites",
      label: "Project Sites",
      icon: MapPin,
      endpoint: "sites",
      headers: ["name", "location", "status"],
      templateHeaders: ["name", "location", "status"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        if (!row.location) errs.push(`Row ${i + 1}: Location is required`)
        return errs
      }
    },
    departments: {
      id: "departments",
      label: "Departments",
      icon: Building2,
      endpoint: "masters/departments",
      headers: ["name"],
      templateHeaders: ["name"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        return errs
      }
    },
    "material-categories": {
      id: "material-categories",
      label: "Material Categories",
      icon: Tags,
      endpoint: "masters/material-categories",
      headers: ["name"],
      templateHeaders: ["name"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        return errs
      }
    },
    "vehicle-types": {
      id: "vehicle-types",
      label: "Vehicle Types",
      icon: Truck,
      endpoint: "masters/vehicle-types",
      headers: ["name"],
      templateHeaders: ["name"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        return errs
      }
    },
    "expense-categories": {
      id: "expense-categories",
      label: "Expense Categories",
      icon: Banknote,
      endpoint: "masters/expense-categories",
      headers: ["name"],
      templateHeaders: ["name"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        return errs
      }
    },
    uoms: {
      id: "uoms",
      label: "Units of Measure (UOM)",
      icon: Scale,
      endpoint: "masters/uoms",
      headers: ["name", "code"],
      templateHeaders: ["name", "code"],
      validationRules: (row: any, i: number) => {
        const errs: string[] = []
        if (!row.name) errs.push(`Row ${i + 1}: Name is required`)
        if (!row.code) errs.push(`Row ${i + 1}: UOM Code (e.g. kg, ton) is required`)
        return errs
      }
    }
  }

  const currentTab = tabConfigs[activeTab]

  useEffect(() => {
    loadItems()
  }, [activeTab])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await fetchRecords(currentTab.endpoint)
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(`Failed to load ${activeTab}:`, error)
      toast.error(`Failed to load ${currentTab.label}`)
    } finally {
      setLoading(false)
    }
  }

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = { name: formName }
      if (activeTab === "sites") {
        payload.location = formLocation
        payload.status = formStatus
      } else if (activeTab === "uoms") {
        payload.code = formCode
      }

      await createRecord(currentTab.endpoint, payload)
      toast.success(`${currentTab.label} added successfully`)
      setIsAddOpen(false)
      resetForm()
      loadItems()
    } catch (error) {
      console.error(error)
      toast.error(`Failed to add record`)
    }
  }

  // Edit Item
  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setFormName(item.name)
    if (activeTab === "sites") {
      setFormLocation(item.location || "")
      setFormStatus(item.status || "active")
    } else if (activeTab === "uoms") {
      setFormCode(item.code || "")
    }
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    try {
      const payload: any = { name: formName }
      if (activeTab === "sites") {
        payload.location = formLocation
        payload.status = formStatus
      } else if (activeTab === "uoms") {
        payload.code = formCode
      }

      await updateRecord(currentTab.endpoint, selectedItem.id, payload)
      toast.success(`${currentTab.label} updated successfully`)
      setIsEditOpen(false)
      setSelectedItem(null)
      resetForm()
      loadItems()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update record")
    }
  }

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this master reference?")) return
    try {
      await deleteRecord(currentTab.endpoint, id)
      toast.success(`${currentTab.label} deleted successfully`)
      loadItems()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete record")
    }
  }

  // View Details
  const handleView = (item: any) => {
    setSelectedItem(item)
    setIsViewOpen(true)
  }

  const resetForm = () => {
    setFormName("")
    setFormLocation("")
    setFormStatus("active")
    setFormCode("")
  }

  // Export SheetJS Excel
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map((item, index) => {
      const base: any = { "S.No": index + 1, Name: item.name }
      if (activeTab === "sites") {
        base.Location = item.location
        base.Status = item.status
      } else if (activeTab === "uoms") {
        base.Code = item.code
      }
      return base
    })
    exportToExcel(dataToExport, `${activeTab}_register`, currentTab.label)
  }

  // Print Report PDF
  const handlePrint = () => {
    const headers = activeTab === "sites" 
      ? ["S.No", "Name", "Location", "Status"] 
      : activeTab === "uoms" 
      ? ["S.No", "Name", "Code"] 
      : ["S.No", "Name"]

    const rows = filteredItems.map((item, index) => {
      const base = [String(index + 1), item.name]
      if (activeTab === "sites") {
        base.push(item.location, item.status)
      } else if (activeTab === "uoms") {
        base.push(item.code)
      }
      return base
    })

    printReport(`${currentTab.label} Master Registry`, headers, rows)
  }

  // Template Download
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(currentTab.templateHeaders, `${activeTab}_import_template`)
  }

  // SheetJS Excel/CSV Import File Picker Trigger
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsedData = await parseExcelFile(file)
      if (parsedData.length === 0) {
        toast.error("The spreadsheet file contains no rows.")
        return
      }
      setImportData(parsedData)
      setIsImportOpen(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      e.target.value = "" // clear file input
    }
  }

  // Confirm sheet import
  const handleConfirmImport = async (validData: any[]) => {
    try {
      // Map keys properly for endpoints (Prisma schemas map name/location/code/status)
      // Standardize input fields
      const itemsToCreate = validData.map(row => {
        const item: any = {}
        // standard name field
        item.name = row.name || row.Name || row["Department Name"] || row["Category Name"] || ""
        if (activeTab === "sites") {
          item.location = row.location || row.Location || ""
          item.status = row.status || row.Status || "active"
        } else if (activeTab === "uoms") {
          item.code = row.code || row.Code || ""
        }
        return item
      })

      await createRecord(currentTab.endpoint, itemsToCreate)
      toast.success(`Imported ${itemsToCreate.length} master items successfully`)
      loadItems()
    } catch (error) {
      console.error(error)
      toast.error("Import failed: check server console logs")
    }
  }

  // Search filter
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Master Data Configuration</h1>
          <p className="text-sm text-muted-foreground">Setup and manage lookup indices for sites, roles, departments, units, and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadItems}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Lookup Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Entry to {currentTab.label}</DialogTitle>
                <DialogDescription>Create a new configuration index value</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="formName">Entry Name / Label</Label>
                    <Input id="formName" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Masonry Group" required />
                  </div>
                  {activeTab === "sites" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="formLocation">Location</Label>
                        <Input id="formLocation" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. Seattle, WA" required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="formStatus">Status</Label>
                        <Select value={formStatus} onValueChange={setFormStatus}>
                          <SelectTrigger id="formStatus"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {activeTab === "uoms" && (
                    <div className="space-y-1">
                      <Label htmlFor="formCode">UOM Standard Code</Label>
                      <Input id="formCode" value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="e.g. ltr, kg" required />
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Reference</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lookup Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Current Category Items" value={items.length.toString()} subtitle={`Registered in ${currentTab.label}`} icon={currentTab.icon} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Total Sites Assigned" value="4 active" subtitle="Across all operations" icon={MapPin} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Configuration Status" value="Locked" subtitle="Encrypted Multi-Tenant DB bounds" icon={Scale} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Tabs list of master categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted rounded-lg w-full">
          {Object.values(tabConfigs).map(tab => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs py-2 flex items-center gap-1.5 justify-center">
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-4">
            <div>
              <CardTitle>{currentTab.label} Reference Roster</CardTitle>
              <CardDescription>Setup reference lookups for validation lists and select inputs in operational modules</CardDescription>
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
              <Button variant="outline" size="sm" className="text-[11px] h-8" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print / PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search filter bar */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentTab.label}...`}
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Reference Name</TableHead>
                    {activeTab === "sites" && (
                      <>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {activeTab === "uoms" && <TableHead>UOM Code</TableHead>}
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === "sites" ? 5 : activeTab === "uoms" ? 4 : 3} className="text-center py-6 text-muted-foreground text-xs">
                        Loading references...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === "sites" ? 5 : activeTab === "uoms" ? 4 : 3} className="text-center py-6 text-muted-foreground text-xs">
                        No reference entries found. Add or import entries to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{item.name}</TableCell>
                        {activeTab === "sites" && (
                          <>
                            <TableCell className="text-xs">{item.location}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === "active" ? "default" : "outline"} className="text-[10px] py-0.5 h-5 uppercase">
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === "uoms" && (
                          <TableCell className="text-xs font-mono font-medium">
                            <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900">{item.code}</Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleView(item)}>
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
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
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reference Entry</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Entry Name / Label</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} required />
                </div>
                {activeTab === "sites" && (
                  <>
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <Select value={formStatus} onValueChange={setFormStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {activeTab === "uoms" && (
                  <div className="space-y-1">
                    <Label>UOM Standard Code</Label>
                    <Input value={formCode} onChange={e => setFormCode(e.target.value)} required />
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reference Item Details</DialogTitle>
            <DialogDescription>Raw system records for database audits</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-y-3 border rounded-lg p-4 bg-muted/40">
                <div className="font-semibold text-muted-foreground">Item ID:</div>
                <div className="font-mono">{selectedItem.id}</div>
                <div className="font-semibold text-muted-foreground">Tenant ID:</div>
                <div className="font-mono">{selectedItem.tenantId || "Default isolation"}</div>
                <div className="font-semibold text-muted-foreground">Name:</div>
                <div className="font-semibold">{selectedItem.name}</div>
                {activeTab === "sites" && (
                  <>
                    <div className="font-semibold text-muted-foreground">Location:</div>
                    <div>{selectedItem.location}</div>
                    <div className="font-semibold text-muted-foreground">Status:</div>
                    <div>
                      <Badge variant="outline" className="uppercase">{selectedItem.status}</Badge>
                    </div>
                  </>
                )}
                {activeTab === "uoms" && (
                  <>
                    <div className="font-semibold text-muted-foreground">UOM Code:</div>
                    <div className="font-mono">{selectedItem.code}</div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" size="sm" onClick={() => setIsViewOpen(false)}>Close View</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Preview Modal SheetJS */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={currentTab.templateHeaders}
        validationRules={currentTab.validationRules}
        onConfirm={handleConfirmImport}
        title={`Import ${currentTab.label} Preview`}
      />
    </div>
  )
}

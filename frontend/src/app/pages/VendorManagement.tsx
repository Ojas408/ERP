import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import {
  Building,
  TrendingUp,
  Clock,
  CheckCircle,
  Upload,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  UsersRound,
} from "lucide-react"
import { fetchVendors, createVendor, deleteRecord, updateRecord } from "../services/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  exportToExcel,
  downloadExcelTemplate,
  parseExcelFile,
  printReport,
} from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function VendorManagement() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Sheet / CSV Import state
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "",
    contact: "",
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setLoading(true)
      const data = await fetchVendors()
      setVendors(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load vendors:", error)
      toast.error("Failed to load vendors list")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVendor(newVendor)
      toast.success("Vendor added successfully")
      setIsAddOpen(false)
      setNewVendor({ name: "", category: "", contact: "" })
      loadVendors()
    } catch (error) {
      console.error("Failed to add vendor:", error)
      toast.error("Failed to add vendor")
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord("vendors", editingItem.id, editingItem)
      toast.success("Vendor updated successfully")
      setIsEditOpen(false)
      setEditingItem(null)
      loadVendors()
    } catch (error) {
      console.error("Failed to update vendor:", error)
      toast.error("Failed to update vendor")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return
    try {
      await deleteRecord("vendors", id)
      toast.success("Vendor removed successfully")
      loadVendors()
    } catch (error) {
      console.error("Failed to delete vendor:", error)
      toast.error("Failed to delete vendor")
    }
  }

  // Download CSV / Excel Template
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(["name", "category", "contact"], "vendors_import_template")
    toast.info("Vendor import template downloaded")
  }

  // Parse uploaded CSV / Excel file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseExcelFile(file)
      if (!parsed || parsed.length === 0) {
        toast.error("The selected file contains no records")
        return
      }
      setImportData(parsed)
      setIsImportOpen(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file")
    } finally {
      e.target.value = ""
    }
  }

  // Confirm and persist imported vendor records
  const handleConfirmImport = async (validData: any[]) => {
    try {
      const recordsToImport = validData
        .map((row: any) => ({
          name: String(row.name || row["Vendor Name"] || row["vendor_name"] || "").trim(),
          category:
            String(row.category || row["Category"] || row["Type"] || "").trim() ||
            "General Supplier",
          contact: String(
            row.contact || row["Contact"] || row["Phone"] || row["Contact Number"] || ""
          ).trim(),
        }))
        .filter((r) => r.name !== "")

      if (recordsToImport.length === 0) {
        toast.error("No valid vendor records with names found to import")
        return
      }

      await createVendor(recordsToImport)
      toast.success(`Successfully imported ${recordsToImport.length} vendors`)
      setIsImportOpen(false)
      loadVendors()
    } catch (error: any) {
      console.error("Import failed:", error)
      toast.error(error.message || "Failed to import vendors")
    }
  }

  // Record validator for the preview modal
  const validateRecord = (row: any) => {
    const errors: string[] = []
    const name = row.name || row["Vendor Name"] || row["vendor_name"]
    if (!name || String(name).trim() === "") {
      errors.push("Vendor Name is required")
    }
    return errors
  }

  // Export vendors to CSV / Excel
  const handleExportCSV = () => {
    if (safeVendors.length === 0) {
      toast.error("No vendors to export")
      return
    }
    const dataToExport = filteredVendors.map((v: any, index: number) => ({
      "S.No": index + 1,
      "Vendor Name": v.name,
      "Category": v.category || "General Supplier",
      "Contact": v.contact || "N/A",
    }))
    exportToExcel(dataToExport, "vendors_list", "Vendors")
    toast.success("Vendors exported successfully")
  }

  const safeVendors = Array.isArray(vendors) ? vendors : []

  // Unique categories for filtering
  const categories = Array.from(
    new Set(safeVendors.map((v) => v.category).filter(Boolean))
  )

  // Filtered vendors based on search and category
  const filteredVendors = safeVendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.contact || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === "all" || vendor.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const handlePrintReport = () =>
    printReport(
      "Vendor Management Directory",
      ["Vendor Name", "Category", "Contact"],
      filteredVendors.map((v: any) => [v.name, v.category || "N/A", v.contact || "N/A"])
    )

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Vendor Management</h1>
          <p className="text-sm text-muted-foreground">
            Supplier directory, procurement tracking, and vendor onboarding
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handlePrintReport}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={loadVendors}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9"
            onClick={handleDownloadTemplate}
            title="Download blank Excel / CSV template with headers"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
            Template
          </Button>

          {/* Import CSV / Excel Button */}
          <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer" asChild>
            <label>
              <Upload className="h-4 w-4 mr-1.5 text-blue-600" />
              Import CSV
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </Button>

          {/* Export CSV / Excel Button */}
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>

          {/* Add Vendor Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Register a new raw material supplier or equipment service provider
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-name">Vendor Name *</Label>
                    <Input
                      id="vendor-name"
                      placeholder="e.g. UltraTech Cement Supplies"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-category">Category / Trade</Label>
                    <Input
                      id="vendor-category"
                      placeholder="e.g. Cement, Steel, Heavy Machinery"
                      value={newVendor.category}
                      onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-contact">Contact Details</Label>
                    <Input
                      id="vendor-contact"
                      placeholder="e.g. +91 98765 43210 or sales@vendor.com"
                      value={newVendor.contact}
                      onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Vendor
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vendors"
          value={safeVendors.length.toString()}
          subtitle="registered suppliers"
          icon={Building}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Active Suppliers"
          value={safeVendors.length.toString()}
          subtitle="with procurement logs"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Categories"
          value={categories.length.toString()}
          subtitle="trade sectors"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Reliability Score"
          value="98.5%"
          subtitle="on-time deliveries"
          icon={CheckCircle}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name, category, or phone..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <span className="text-xs text-muted-foreground hidden sm:inline">Filter by:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] text-xs h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base font-semibold">Vendor Directory</CardTitle>
            <CardDescription className="text-xs">
              List of approved suppliers, equipment rentals, and subcontractors
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredVendors.length} of {safeVendors.length} Listed
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vendor Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Contact Details</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                      Loading vendors...
                    </TableCell>
                  </TableRow>
                ) : filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                      No vendors found. Click "Add Vendor" or "Import CSV" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {vendor.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px] uppercase font-normal">
                          {vendor.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {vendor.contact || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Edit Vendor"
                            onClick={() => handleEdit(vendor)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Delete Vendor"
                            onClick={() => handleDelete(vendor.id)}
                          >
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

      {/* Edit Vendor Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Modify vendor contact information and category</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Vendor Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editingItem.category || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Contact Details</Label>
                  <Input
                    id="edit-contact"
                    value={editingItem.contact || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Vendor
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Sheet / CSV Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["name", "category", "contact"]}
        validationRules={validateRecord}
        onConfirm={handleConfirmImport}
        title="Import Vendors Preview"
      />
    </div>
  )
}

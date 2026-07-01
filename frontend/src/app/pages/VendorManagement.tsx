import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Building, TrendingUp, Clock, CheckCircle, Upload, Download, Edit, Trash2, RefreshCw, Plus } from "lucide-react"
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

export default function VendorManagement() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "",
    contact: ""
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
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVendor(newVendor)
      setIsAddOpen(false)
      setNewVendor({ name: "", category: "", contact: "" })
      loadVendors()
    } catch (error) {
      console.error("Failed to add vendor:", error)
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
      await updateRecord('vendors', editingItem.id, editingItem)
      setIsEditOpen(false)
      setEditingItem(null)
      loadVendors()
    } catch (error) {
      console.error("Failed to update vendor:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteRecord('vendors', id)
      loadVendors()
    } catch (error) {
      console.error("Failed to delete vendor:", error)
    }
  }

  const safeVendors = Array.isArray(vendors) ? vendors : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Vendor Management</h1>
          <p className="text-sm text-muted-foreground">Supplier relationships and procurement tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadVendors}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9"><Building className="h-4 w-4 mr-2" />Add Vendor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>Register a new supplier or service provider</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2"><Label>Vendor Name</Label><Input placeholder="e.g. Acme Constructions" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g. Raw Materials" value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Contact</Label><Input placeholder="e.g. +91 98765 43210" value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} required /></div>
                </div>
                <DialogFooter><Button type="submit">Add Vendor</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Vendors" value={safeVendors.length.toString()} icon={Building} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Active" value={safeVendors.length.toString()} icon={TrendingUp} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Pending" value="5" icon={Clock} colorClass="bg-orange-100 dark:bg-orange-900/30" />
        <KPICard title="Reliability" value="94.5%" icon={CheckCircle} colorClass="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      <Card>
        <CardHeader><CardTitle>Vendor Directory</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="text-xs font-medium">{vendor.name}</TableCell>
                    <TableCell className="text-xs">{vendor.category}</TableCell>
                    <TableCell className="text-xs">{vendor.contact}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(vendor)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(vendor.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2"><Label>Vendor Name</Label><Input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Category</Label><Input value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Contact</Label><Input value={editingItem.contact} onChange={e => setEditingItem({...editingItem, contact: e.target.value})} required /></div>
              </div>
              <DialogFooter><Button type="submit">Update Vendor</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

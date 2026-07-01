import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"
import { ShoppingCart, Upload, Download, Eye, CheckCircle, XCircle, RefreshCw, Plus, Edit, Trash2 } from "lucide-react"
import { fetchPurchaseOrders, createPurchaseOrder, fetchVendors, deleteRecord, updateRecord } from "../services/api"

export default function PurchaseOrder() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [newPO, setNewPO] = useState({
    orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    vendorId: "",
    material: "",
    quantity: "",
    unit: "Bags",
    totalAmount: "",
    status: "pending",
    items: "",
    expectedDate: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [poData, vendorData] = await Promise.all([
        fetchPurchaseOrders(),
        fetchVendors()
      ])
      setPurchaseOrders(Array.isArray(poData) ? poData : [])
      setVendors(Array.isArray(vendorData) ? vendorData : [])
    } catch (error) {
      console.error("Failed to load PO data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPurchaseOrder({
        ...newPO,
        totalAmount: parseFloat(newPO.totalAmount),
        expectedDate: newPO.expectedDate ? new Date(newPO.expectedDate).toISOString() : undefined
      })
      setIsAddOpen(false)
      setNewPO({
        orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorId: "",
        material: "",
        quantity: "",
        unit: "Bags",
        totalAmount: "",
        status: "pending",
        items: "",
        expectedDate: ""
      })
      loadData()
    } catch (error) {
      console.error("Failed to create PO:", error)
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
      await updateRecord('purchase-orders', editingItem.id, {
        ...editingItem,
        totalAmount: parseFloat(editingItem.totalAmount)
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error("Failed to update PO:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteRecord('purchase-orders', id)
      loadData()
    } catch (error) {
      console.error("Failed to delete PO:", error)
    }
  }

  const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : []
  const totalValue = safePOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0)

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "outline",
      approved: "secondary",
      rejected: "destructive",
      received: "default"
    }
    return <Badge variant={(variants[status as keyof typeof variants] || "outline") as any} className="text-xs">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage procurement and vendor orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9"><ShoppingCart className="h-4 w-4 mr-2" />Create PO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Fill in the details to create a new purchase order</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePO} className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Vendor *</Label>
                    <Select value={newPO.vendorId} onValueChange={(v) => setNewPO({...newPO, vendorId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Order #</Label><Input value={newPO.orderNumber} readOnly /></div>
                    <div className="grid gap-2"><Label>Amount (₹)</Label><Input type="number" value={newPO.totalAmount} onChange={e => setNewPO({...newPO, totalAmount: e.target.value})} required /></div>
                  </div>
                  <div className="grid gap-2"><Label>Items / Description</Label><Textarea value={newPO.items || ''} onChange={e => setNewPO({...newPO, items: e.target.value})} rows={3} /></div>
                  <div className="grid gap-2"><Label>Expected Date</Label><Input type="date" value={newPO.expectedDate || ''} onChange={e => setNewPO({...newPO, expectedDate: e.target.value})} /></div>
                </div>
                <DialogFooter><Button type="submit">Create PO</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total POs" value={safePOs.length.toString()} icon={ShoppingCart} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Pending" value={safePOs.filter(po => po.status === "pending").length.toString()} icon={CheckCircle} colorClass="bg-amber-100 dark:bg-amber-900/30" />
        <KPICard title="Total Value" value={`₹${(totalValue / 100000).toFixed(1)}L`} icon={Download} colorClass="bg-purple-100 dark:bg-purple-900/30" />
        <KPICard title="Vendors" value={vendors.length.toString()} icon={RefreshCw} colorClass="bg-green-100 dark:bg-green-900/30" />
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safePOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="text-xs font-medium">{po.orderNumber}</TableCell>
                    <TableCell className="text-xs">{new Date(po.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{po.vendor?.name || 'N/A'}</TableCell>
                    <TableCell className="text-xs">₹{(po.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate" title={po.items}>{po.items ? (po.items.length > 30 ? po.items.substring(0, 30) + '...' : po.items) : 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(po)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(po.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Edit Purchase Order</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Status</Label>
                  <Select value={editingItem.status} onValueChange={(v) => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Amount (₹)</Label><Input type="number" value={editingItem.totalAmount} onChange={e => setEditingItem({...editingItem, totalAmount: e.target.value})} required /></div>
              </div>
              <DialogFooter><Button type="submit">Update PO</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
